import { COOKIE_NAME } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { isAllowedLeagueText, sanitizeLeagueText } from "../lib/league-safety";
import { buildPoliceContestQuery, normalizeExternalSearchResults } from "./contest-search";
import { buildTheorySearchQuery, generateTheoryFromSources, resolveTheoryArea } from "./theory-generation";
import { detectSyllabusSubjects } from "../lib/contest-syllabus";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  contests: router({
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(3).max(120) }))
      .mutation(async ({ input }) => {
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A busca externa ainda não está configurada." });
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: buildPoliceContestQuery(input.query), num: 8, gl: "br", hl: "pt-br" }),
        });
        if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: "Não foi possível consultar fontes externas agora." });
        const data = await response.json() as { organic?: Array<{ title?: string; link?: string; snippet?: string }> };
        const results = normalizeExternalSearchResults(data.organic);
        return { query: input.query, results, syllabus: { subjectIds: detectSyllabusSubjects(results.map((result) => `${result.title} ${result.snippet}`).join(" ")), sourceUrls: results.map((result) => result.url) } };
      }),
  }),

  theory: router({
    /** Meta de sincronização (app decide se precisa baixar conteúdos novos) */
    syncMeta: publicProcedure.query(async () => {
      return {
        version: 1,
        totalActiveArticles: 0,
        lastUpdatedAt: new Date().toISOString(),
      };
    }),

    /**
     * Busca artigo na base do servidor (conteúdo que você subiu via Python)
     * ou retorna null se ainda não existir.
     */
    get: publicProcedure
      .input(z.object({
        subjectId: z.string().trim().min(2).max(80),
        topic: z.string().trim().min(2).max(160),
      }))
      .query(async ({ input }) => {
        // Placeholder: quando o DB estiver conectado e populado via Python,
        // retorna o artigo. Por enquanto null → app tenta biblioteca local / IA.
        return null as null | {
          id: string;
          subjectId: string;
          topic: string;
          title: string;
          tacticalFocus: string;
          sections: Array<{ heading: string; body: string }>;
          keyTakeaways: string[];
          references: Array<{ title: string; url: string; sourceTier?: string; accessedAt?: string }>;
          reviewStatus: "oficial" | "gerado_com_fontes" | "revisado_editorialmente";
          readingMinutes?: number;
          updatedAt: string;
        };
      }),

    /**
     * Upsert em lote — pensado para o seu script Python / Streamlit.
     * Protegido: use com token de admin no futuro.
     */
    upsertBatch: publicProcedure
      .input(z.object({
        articles: z.array(z.object({
          externalId: z.string().min(2).max(160),
          subjectId: z.string().min(2).max(80),
          topic: z.string().min(2).max(160),
          title: z.string().min(2).max(255),
          tacticalFocus: z.string().min(2),
          sections: z.array(z.object({ heading: z.string(), body: z.string() })).min(1).max(12),
          keyTakeaways: z.array(z.string()).min(1).max(10),
          references: z.array(z.object({
            title: z.string(),
            url: z.string().url(),
            sourceTier: z.string().optional(),
            accessedAt: z.string().optional(),
          })).default([]),
          reviewStatus: z.enum(["oficial", "gerado_com_fontes", "revisado_editorialmente"]).default("revisado_editorialmente"),
          readingMinutes: z.number().int().min(1).max(120).optional(),
        })).min(1).max(100),
      }))
      .mutation(async ({ input }) => {
        // Estrutura pronta: aqui faremos o insert/update no MySQL.
        // Por enquanto confirma o contrato da API para o Python.
        return {
          received: input.articles.length,
          upserted: input.articles.length,
          message: "Contrato de upload de teoria pronto. Conecte o DB para persistir.",
        };
      }),

    /**
     * Geração híbrida:
     * 1) (futuro) tenta base do servidor
     * 2) busca fontes + IA
     * 3) devolve artigo estruturado (app salva localmente)
     */
    generate: publicProcedure
      .input(z.object({
        subjectId: z.string().trim().min(2).max(80),
        topic: z.string().trim().min(2).max(160),
        contestTitle: z.string().trim().max(160).optional(),
      }))
      .mutation(async ({ input }) => {
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "A busca de fontes ainda não está configurada.",
          });
        }
        const area = resolveTheoryArea(input.subjectId, input.topic);
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            q: buildTheorySearchQuery(area, input.topic, input.contestTitle),
            num: 8,
            gl: "br",
            hl: "pt-br",
          }),
        });
        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "Não foi possível consultar fontes confiáveis agora.",
          });
        }
        const data = await response.json() as {
          organic?: Array<{ title?: string; link?: string; snippet?: string }>;
        };
        try {
          return await generateTheoryFromSources({
            ...input,
            area,
            sources: normalizeExternalSearchResults(data.organic),
          });
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "O conteúdo não pôde ser estruturado agora. Tente novamente mais tarde.",
          });
        }
      }),
  }),
  sync: router({
    load: protectedProcedure.query(async ({ ctx }) => {
      const snapshot = await db.getStudySnapshot(ctx.user.id);
      return snapshot ? { payload: snapshot.payload, updatedAt: snapshot.updatedAt } : null;
    }),
    save: protectedProcedure.input(z.object({ payload: z.string().min(2).max(1_500_000) })).mutation(async ({ ctx, input }) => {
      const saved = await db.upsertStudySnapshot(ctx.user.id, input.payload);
      if (!saved) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A sincronização ainda não está disponível." });
      return { savedAt: new Date().toISOString() };
    }),
  }),
  league: router({
    list: protectedProcedure.query(async ({ ctx }) => (await db.listLeagueMessagesForUser(ctx.user.id)).reverse()),
    sendText: protectedProcedure.input(z.object({ body: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const body = sanitizeLeagueText(input.body);
      if (!isAllowedLeagueText(body)) throw new TRPCError({ code: "BAD_REQUEST", message: "Esta mensagem não segue as regras de convivência da Liga." });
      await db.createLeagueMessage({ userId: ctx.user.id, authorName: ctx.user.name?.slice(0, 120) || "Candidato", kind: "text", body });
      return { sent: true };
    }),
    sendAudio: protectedProcedure.input(z.object({ base64: z.string().min(20).max(1_400_000), mimeType: z.enum(["audio/m4a", "audio/mp4", "audio/webm", "audio/wav"]).default("audio/m4a") })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.length > 1_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "O áudio da Liga deve ter até 1 MB." });
      const { url } = await storagePut(`league/${ctx.user.id}/voice-message`, bytes, input.mimeType);
      await db.createLeagueMessage({ userId: ctx.user.id, authorName: ctx.user.name?.slice(0, 120) || "Candidato", kind: "audio", audioUrl: url });
      return { sent: true };
    }),
    block: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode bloquear a própria conta." });
      await db.blockLeagueUser(ctx.user.id, input.userId);
      return { blocked: true };
    }),
    report: protectedProcedure.input(z.object({ messageId: z.number().int().positive(), reason: z.enum(["offense", "spam", "unsafe", "other"]) })).mutation(async ({ ctx, input }) => {
      await db.createLeagueReport({ reporterUserId: ctx.user.id, messageId: input.messageId, reason: input.reason });
      await notifyOwner({ title: "Denúncia na Liga Dino", content: `Uma mensagem da Liga foi denunciada como “${input.reason}” e aguarda revisão.` }).catch(() => false);
      return { reported: true };
    }),
  }),

  // ============================================================
// MOTOR DE QUESTÕES
// Endpoints preparados para sincronização remota.
// Você sobe questões via Streamlit/Python → app consome sem novo APK.
// ============================================================
  questions: router({
    /** Versão do banco de questões (app decide se precisa sincronizar) */
    syncMeta: publicProcedure.query(async () => {
      return {
        version: 1,
        totalActiveQuestions: 0,
        lastUpdatedAt: new Date().toISOString(),
      };
    }),

    /** Lista questões ativas (paginação + filtros) */
    list: publicProcedure
      .input(
        z.object({
          subjectId: z.string().optional(),
          topic: z.string().optional(),
          bankSlug: z.string().optional(),
          limit: z.number().min(1).max(100).default(30),
          cursor: z.number().optional(),
        }),
      )
      .query(async ({ input }) => {
        return {
          items: [] as Array<{
            id: number;
            externalId: string;
            subjectId: string;
            topic: string;
            stem: string;
            alternatives: string[];
            correctIndex: number;
            explanation: string | null;
            difficulty: "easy" | "medium" | "hard";
            source: string | null;
            examiner: string | null;
            year: number | null;
          }>,
          nextCursor: null as number | null,
        };
      }),

    /**
     * Upsert em lote — pensado para script Python / Streamlit.
     * Mesma lógica do motor de teoria: você trata fora, sobe aqui, app consome sem novo APK.
     */
    upsertBatch: publicProcedure
      .input(z.object({
        bankSlug: z.string().min(2).max(120).default("geral"),
        bankTitle: z.string().min(2).max(255).optional(),
        questions: z.array(z.object({
          externalId: z.string().min(2).max(120),
          subjectId: z.string().min(2).max(80),
          topic: z.string().min(2).max(180),
          stem: z.string().min(5),
          alternatives: z.array(z.string().min(1)).min(2).max(6),
          correctIndex: z.number().int().min(0).max(5),
          explanation: z.string().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
          source: z.string().max(255).optional(),
          examiner: z.string().max(120).optional(),
          year: z.number().int().min(1990).max(2100).optional(),
        })).min(1).max(200),
      }))
      .mutation(async ({ input }) => {
        return {
          bankSlug: input.bankSlug,
          received: input.questions.length,
          upserted: input.questions.length,
          message: "Contrato de upload de questões pronto. Conecte o DB para persistir.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
