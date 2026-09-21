import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const studySnapshots = mysqlTable("studySnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  payload: text("payload").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudySnapshot = typeof studySnapshots.$inferSelect;

export const leagueMessages = mysqlTable("leagueMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  authorName: varchar("authorName", { length: 120 }).notNull(),
  kind: mysqlEnum("kind", ["text", "audio"]).notNull(),
  body: text("body"),
  audioUrl: text("audioUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeagueMessage = typeof leagueMessages.$inferSelect;

export const leagueBlocks = mysqlTable("leagueBlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  blockedUserId: int("blockedUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const leagueReports = mysqlTable("leagueReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterUserId: int("reporterUserId").notNull(),
  messageId: int("messageId").notNull(),
  reason: mysqlEnum("reason", ["offense", "spam", "unsafe", "other"]).notNull(),
  status: mysqlEnum("status", ["open", "reviewed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// MOTOR DE QUESTÕES
// Tabelas preparadas para alimentação externa (Streamlit / Python)
// O app consome via tRPC sem precisar de novo APK
// ============================================================

export const questionBanks = mysqlTable("questionBanks", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador estável (ex: "pmsp-2024", "pf-agente-constitucional") */
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  contestTags: text("contestTags"), // JSON array de tags de concurso
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuestionBank = typeof questionBanks.$inferSelect;

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  /** ID externo estável vindo do seu script (para upsert) */
  externalId: varchar("externalId", { length: 120 }).notNull().unique(),
  bankId: int("bankId").notNull(),
  subjectId: varchar("subjectId", { length: 80 }).notNull(),
  topic: varchar("topic", { length: 180 }).notNull(),
  stem: text("stem").notNull(),
  /** JSON array de alternativas */
  alternatives: text("alternatives").notNull(),
  correctIndex: int("correctIndex").notNull(),
  explanation: text("explanation"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  source: varchar("source", { length: 255 }),
  examiner: varchar("examiner", { length: 120 }),
  year: int("year"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/** Controle de versão do banco de questões (para o app saber se precisa sincronizar) */
export const questionSyncMeta = mysqlTable("questionSyncMeta", {
  id: int("id").autoincrement().primaryKey(),
  /** Sempre 1 – linha única de controle */
  singleton: int("singleton").default(1).notNull().unique(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  totalActiveQuestions: int("totalActiveQuestions").default(0).notNull(),
  version: int("version").default(1).notNull(),
});

export type QuestionSyncMeta = typeof questionSyncMeta.$inferSelect;

// ============================================================
// MOTOR DE TEORIA (híbrido)
// Você sobe conteúdos via Python → app consome sem novo APK
// IA gera sob demanda quando não existir na base
// ============================================================

export const theoryArticles = mysqlTable("theoryArticles", {
  id: int("id").autoincrement().primaryKey(),
  /** ID estável externo (slug) para upsert via Python */
  externalId: varchar("externalId", { length: 160 }).notNull().unique(),
  subjectId: varchar("subjectId", { length: 80 }).notNull(),
  topic: varchar("topic", { length: 180 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  tacticalFocus: text("tacticalFocus").notNull(),
  /** JSON: sections [{heading, body}] */
  sectionsJson: text("sectionsJson").notNull(),
  /** JSON: string[] */
  keyTakeawaysJson: text("keyTakeawaysJson").notNull(),
  /** JSON: references [{title, url, sourceTier?, accessedAt?}] */
  referencesJson: text("referencesJson").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["oficial", "gerado_com_fontes", "revisado_editorialmente"]).default("gerado_com_fontes").notNull(),
  readingMinutes: int("readingMinutes").default(8),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TheoryArticleRow = typeof theoryArticles.$inferSelect;
export type InsertTheoryArticleRow = typeof theoryArticles.$inferInsert;

export const theorySyncMeta = mysqlTable("theorySyncMeta", {
  id: int("id").autoincrement().primaryKey(),
  singleton: int("singleton").default(1).notNull().unique(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  totalActiveArticles: int("totalActiveArticles").default(0).notNull(),
  version: int("version").default(1).notNull(),
});

export type TheorySyncMeta = typeof theorySyncMeta.$inferSelect;
