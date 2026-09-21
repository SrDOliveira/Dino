import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { getContest, getSubject, LESSONS } from "@/lib/study-data";
import { useStudy } from "@/lib/study-store";
import { trpc } from "@/lib/trpc";
import type { TheoryArticle } from "@/lib/content-models";

const REVIEW_LABEL = {
  oficial: "Fonte oficial",
  gerado_com_fontes: "Baseado em fontes confiáveis",
  revisado_editorialmente: "Revisado editorialmente",
} as const;

export default function TheoryScreen() {
  const { subjectId, topic } = useLocalSearchParams<{ subjectId?: string; topic?: string }>();
  const { state, saveTheoryOffline, removeTheoryOffline, upsertTheoryArticle } = useStudy();
  const subject = getSubject(subjectId ?? "portugues");
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const article = useMemo(
    () =>
      state.theoryLibrary.find(
        (item) =>
          item.subjectId === subjectId &&
          item.topic.toLocaleLowerCase() === (topic ?? "").toLocaleLowerCase(),
      ),
    [state.theoryLibrary, subjectId, topic],
  );

  const relatedLesson = useMemo(
    () =>
      LESSONS.find(
        (lesson) =>
          lesson.subjectId === subjectId &&
          lesson.topic.toLocaleLowerCase() === (topic ?? "").toLocaleLowerCase(),
      ),
    [subjectId, topic],
  );

  const isOffline = article ? state.offlineTheoryIds.includes(article.id) : false;

  // Busca rápida entre temas da biblioteca local + disciplinas selecionadas
  const searchResults = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (q.length < 2) return [];
    const fromLibrary = state.theoryLibrary
      .filter(
        (a) =>
          a.topic.toLocaleLowerCase().includes(q) ||
          a.title.toLocaleLowerCase().includes(q) ||
          a.subjectId.toLocaleLowerCase().includes(q),
      )
      .slice(0, 8)
      .map((a) => ({
        subjectId: a.subjectId,
        topic: a.topic,
        title: a.title,
        source: "biblioteca" as const,
      }));

    const fromLessons = LESSONS.filter(
      (l) =>
        state.selectedSubjectIds.includes(l.subjectId) &&
        (l.topic.toLocaleLowerCase().includes(q) || l.title.toLocaleLowerCase().includes(q)),
    )
      .slice(0, 6)
      .map((l) => ({
        subjectId: l.subjectId,
        topic: l.topic,
        title: l.title,
        source: "trilha" as const,
      }));

    // Dedup by subjectId+topic
    const seen = new Set<string>();
    const combined = [...fromLibrary, ...fromLessons].filter((item) => {
      const key = `${item.subjectId}::${item.topic}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return combined.slice(0, 10);
  }, [search, state.theoryLibrary, state.selectedSubjectIds]);

  const generation = trpc.theory.generate.useMutation({
    onSuccess: (result) => {
      setLoadError(null);
      if (result.status === "ready" && result.article) {
        upsertTheoryArticle(result.article);
      }
    },
    onError: () => {
      setLoadError(
        "Não foi possível gerar o conteúdo agora. Use a biblioteca local ou tente novamente em instantes.",
      );
    },
  });

  const requestedAutomatically = useRef(false);
  const requestTheory = useCallback(() => {
    setLoadError(null);
    generation.mutate({
      subjectId: subjectId ?? "",
      topic: topic ?? "",
      contestTitle: getContest(state.contestId).title,
    });
  }, [generation, state.contestId, subjectId, topic]);

  // Fluxo híbrido:
  // 1) Biblioteca local (já resolvida no useMemo do article)
  // 2) Base do servidor (conteúdo que você subiu via Python) — theory.get
  // 3) Geração com IA + fontes (theory.generate) → salva local
  const serverGet = trpc.theory.get.useQuery(
    { subjectId: subjectId ?? "", topic: topic ?? "" },
    {
      enabled: Boolean(!article && subjectId && topic),
      retry: 0,
      staleTime: 60_000,
    },
  );

  useEffect(() => {
    if (serverGet.data && !article) {
      const remote = serverGet.data;
      upsertTheoryArticle({
        id: remote.id,
        areaId: remote.subjectId,
        subjectId: remote.subjectId,
        topic: remote.topic,
        title: remote.title,
        tacticalFocus: remote.tacticalFocus,
        sections: remote.sections,
        keyTakeaways: remote.keyTakeaways,
        references: remote.references.map((r) => ({
          title: r.title,
          url: r.url,
          sourceTier: (r.sourceTier as "primaria" | "secundaria" | undefined) ?? "secundaria",
          accessedAt: r.accessedAt ?? new Date().toISOString().slice(0, 10),
        })),
        reviewStatus: remote.reviewStatus,
        readingMinutes: remote.readingMinutes,
        summary: remote.tacticalFocus,
        updatedAt: remote.updatedAt.slice(0, 10),
      });
    }
  }, [serverGet.data, article, upsertTheoryArticle]);

  useEffect(() => {
    if (
      !article &&
      subjectId &&
      topic &&
      !requestedAutomatically.current &&
      !serverGet.isLoading &&
      !serverGet.data
    ) {
      requestedAutomatically.current = true;
      requestTheory();
    }
  }, [article, requestTheory, subjectId, topic, serverGet.isLoading, serverGet.data]);

  const openTopic = (sid: string, t: string) => {
    setSearch("");
    router.push({ pathname: "/theory" as never, params: { subjectId: sid, topic: t } } as never);
  };

  // ========== ESTADO: carregando / sem artigo ==========
  if (!article) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={25} color="#31513A" />
          </Pressable>
          <Text style={styles.topBarTitle}>Conteúdo de estudo</Text>
          <View style={{ width: 25 }} />
        </View>

        {/* Busca rápida sempre disponível */}
        <SearchBox value={search} onChange={setSearch} />
        {searchResults.length > 0 && (
          <SearchResults results={searchResults} onSelect={openTopic} />
        )}

        <View style={styles.emptyWrap}>
          <DuoduoMascot size={64} />
          {generation.isPending ? (
            <>
              <ActivityIndicator size="large" color="#2E7F3D" style={{ marginTop: 18 }} />
              <Text style={styles.emptyTitle}>Preparando o conteúdo completo</Text>
              <Text style={styles.emptyBody}>
                O Dino está organizando a teoria deste tema com base em fontes confiáveis para o seu
                concurso.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>
                {loadError ? "Conteúdo temporariamente indisponível" : "Conteúdo em preparação"}
              </Text>
              <Text style={styles.emptyBody}>
                {loadError ??
                  "Este tema ainda não está na biblioteca local. Você pode tentar gerar agora ou estudar pela trilha de lições."}
              </Text>
              <View style={{ gap: 10, width: "100%", marginTop: 18 }}>
                <PrimaryButton label="Tentar carregar conteúdo" onPress={requestTheory} />
                {relatedLesson && (
                  <PrimaryButton
                    label="Estudar pela lição da trilha"
                    variant="secondary"
                    onPress={() =>
                      router.push({ pathname: "/lesson" as never, params: { id: relatedLesson.id } } as never)
                    }
                  />
                )}
              </View>
            </>
          )}
        </View>
        <StudyNavBar />
      </ScreenContainer>
    );
  }

  // ========== ESTADO: artigo disponível ==========
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={25} color="#31513A" />
        </Pressable>
        <View style={styles.statusChip}>
          <MaterialIcons
            name={article.reviewStatus === "oficial" ? "verified" : "fact-check"}
            size={14}
            color={article.reviewStatus === "oficial" ? "#1D7B36" : "#895D00"}
          />
          <Text
            style={[
              styles.statusText,
              article.reviewStatus === "oficial" && styles.statusOfficialText,
            ]}
          >
            {REVIEW_LABEL[article.reviewStatus]}
          </Text>
        </View>
        <Pressable
          onPress={() => (isOffline ? removeTheoryOffline(article.id) : saveTheoryOffline(article.id))}
          hitSlop={10}
        >
          <MaterialIcons
            name={isOffline ? "bookmark" : "bookmark-border"}
            size={24}
            color="#2E7F3D"
          />
        </Pressable>
      </View>

      <SearchBox value={search} onChange={setSearch} />
      {searchResults.length > 0 && (
        <SearchResults results={searchResults} onSelect={openTopic} />
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mascotRow}>
          <DuoduoMascot size={48} />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Estude com atenção. Este conteúdo foi organizado para cobrir o que a banca costuma cobrar.
            </Text>
          </View>
        </View>

        <Text style={styles.subjectLabel}>
          {(subject?.shortTitle ?? "Conhecimento tático").toUpperCase()}
        </Text>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>FOCO TÁTICO</Text>
          <Text style={styles.focusText}>{article.tacticalFocus}</Text>
          {article.readingMinutes ? (
            <Text style={styles.readingTime}>Tempo de estudo estimado: {article.readingMinutes} min</Text>
          ) : null}
        </View>

        {article.sections.map((section, index) => (
          <View key={`${section.heading}-${index}`} style={styles.section}>
            <Text style={styles.moduleLabel}>
              MÓDULO {index + 1} DE {article.sections.length}
            </Text>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.takeawayCard}>
          <Text style={styles.takeawayTitle}>PONTOS PARA FIXAR</Text>
          {article.keyTakeaways.map((item) => (
            <View key={item} style={styles.takeaway}>
              <MaterialIcons name="check-circle" size={17} color="#2E9745" />
              <Text style={styles.takeawayText}>{item}</Text>
            </View>
          ))}
        </View>

        {article.references?.length > 0 && (
          <View style={styles.referenceCard}>
            <View style={styles.referenceHeader}>
              <MaterialIcons name="source" size={20} color="#2B6090" />
              <View style={{ flex: 1 }}>
                <Text style={styles.referenceTitle}>Fontes e material de apoio</Text>
                <Text style={styles.referenceSubtitle}>
                  Consulte a origem para aprofundar quando quiser.
                </Text>
              </View>
            </View>
            {article.references.map((reference) => (
              <Pressable
                key={reference.url}
                onPress={() =>
                  WebBrowser.openBrowserAsync(reference.url, {
                    toolbarColor: "#1F5E32",
                    controlsColor: "#FFFFFF",
                    readerMode: true,
                  }).catch(() => undefined)
                }
                style={({ pressed }) => [styles.referenceRow, pressed && styles.pressed]}
              >
                <View style={styles.referenceIcon}>
                  <MaterialIcons name="open-in-new" size={17} color="#2A6C9C" />
                </View>
                <View style={styles.referenceCopy}>
                  <Text style={styles.referenceName}>{reference.title}</Text>
                  <Text style={styles.referenceUrl} numberOfLines={1}>
                    {reference.url.replace(/^https?:\/\//, "")}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#7B8D81" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.dock}>
        {relatedLesson ? (
          <PrimaryButton
            label="Praticar com questões deste tema"
            onPress={() =>
              router.push({ pathname: "/lesson" as never, params: { id: relatedLesson.id } } as never)
            }
          />
        ) : (
          <PrimaryButton
            label="Voltar ao mapa tático"
            onPress={() => router.replace("/(tabs)")}
          />
        )}
        <StudyNavBar />
      </View>
    </ScreenContainer>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.searchBox}>
      <MaterialIcons name="search" size={20} color="#5A7160" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Buscar tema ou disciplina..."
        placeholderTextColor="#8A9A8E"
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} hitSlop={8}>
          <MaterialIcons name="close" size={18} color="#7A8B7E" />
        </Pressable>
      )}
    </View>
  );
}

function SearchResults({
  results,
  onSelect,
}: {
  results: Array<{ subjectId: string; topic: string; title: string; source: string }>;
  onSelect: (subjectId: string, topic: string) => void;
}) {
  return (
    <View style={styles.searchResults}>
      {results.map((item) => (
        <Pressable
          key={`${item.subjectId}-${item.topic}`}
          onPress={() => onSelect(item.subjectId, item.topic)}
          style={({ pressed }) => [styles.searchRow, pressed && styles.pressed]}
        >
          <MaterialIcons name="menu-book" size={18} color="#2E7F3D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.searchTopic} numberOfLines={1}>
              {item.topic}
            </Text>
            <Text style={styles.searchMeta} numberOfLines={1}>
              {getSubject(item.subjectId)?.shortTitle ?? item.subjectId} · {item.source}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color="#8A9A8E" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    marginBottom: 10,
  },
  topBarTitle: { color: "#1A3A24", fontSize: 16, fontWeight: "900" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F3F7F1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { color: "#895D00", fontSize: 11, fontWeight: "800" },
  statusOfficialText: { color: "#1D7B36" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F6F1",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D8E4D6",
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: "#1A2E22", fontSize: 15, fontWeight: "600", padding: 0 },
  searchResults: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E4D6",
    marginBottom: 10,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3EE",
  },
  searchTopic: { color: "#1A2E22", fontSize: 14, fontWeight: "800" },
  searchMeta: { color: "#6B7F70", fontSize: 11, marginTop: 2 },

  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  mascotRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  speechBubble: {
    flex: 1,
    backgroundColor: "#E8F6E4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#C5E6BC",
  },
  speechText: { color: "#1A4D28", fontSize: 13, fontWeight: "700", lineHeight: 18 },

  subjectLabel: { color: "#2E7F3D", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  title: {
    color: "#102A43",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 6,
  },
  focusCard: {
    backgroundColor: "#F0F7FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#D0E4F5",
  },
  focusLabel: { color: "#2B6090", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  focusText: { color: "#1A3A55", fontSize: 15, lineHeight: 22, fontWeight: "700", marginTop: 4 },
  readingTime: { color: "#5A7A90", fontSize: 12, fontWeight: "700", marginTop: 8 },

  section: { marginTop: 22 },
  moduleLabel: { color: "#6B7F70", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  sectionHeading: { color: "#102A43", fontSize: 18, fontWeight: "900", marginTop: 4 },
  sectionBody: { color: "#3A4F40", fontSize: 16, lineHeight: 26, marginTop: 8 },

  takeawayCard: {
    backgroundColor: "#F3FAF1",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#CDE8C8",
  },
  takeawayTitle: { color: "#1A5C2A", fontSize: 12, fontWeight: "900", letterSpacing: 0.6, marginBottom: 10 },
  takeaway: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  takeawayText: { flex: 1, color: "#2A4D30", fontSize: 14, lineHeight: 20, fontWeight: "600" },

  referenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#D8E4D6",
  },
  referenceHeader: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start" },
  referenceTitle: { color: "#1A3A55", fontSize: 14, fontWeight: "900" },
  referenceSubtitle: { color: "#5A7A90", fontSize: 12, marginTop: 2 },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF3EE",
  },
  referenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F1F8",
    alignItems: "center",
    justifyContent: "center",
  },
  referenceCopy: { flex: 1 },
  referenceName: { color: "#1A2E22", fontSize: 13, fontWeight: "800" },
  referenceUrl: { color: "#6B7F70", fontSize: 11, marginTop: 2 },

  dock: { gap: 9, paddingTop: 10, paddingBottom: 2, backgroundColor: "#FFFFFF" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  emptyTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  emptyBody: {
    color: "#5A7160",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  pressed: { opacity: 0.7 },
});
