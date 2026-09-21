import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import {
  contestFromExternalResult,
  getSuggestedContests,
  PoliceContest,
  searchLocalPoliceContests,
} from "@/lib/contest-catalog";
import { buildCatalogSyllabus, detectSyllabusSubjects } from "@/lib/contest-syllabus";
import { haptic } from "@/lib/haptics";
import { SUBJECTS } from "@/lib/study-data";
import { useStudy } from "@/lib/study-store";
import { trpc } from "@/lib/trpc";

const SUGGESTED = getSuggestedContests(8);

export default function OnboardingScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 650;
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [contest, setContest] = useState<PoliceContest | null>(null);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [programText, setProgramText] = useState("");
  const [examDate, setExamDate] = useState("");
  const { setProfile, setContestTitle, setContestSyllabus, setExamDate: saveExamDate } = useStudy();

  const localResults = useMemo(() => searchLocalPoliceContests(query), [query]);
  const { mutate: searchContests, data: externalSearchData, isPending: isSearching } =
    trpc.contests.search.useMutation();
  const externalResults = useMemo(
    () => (externalSearchData?.results ?? []).map(contestFromExternalResult),
    [externalSearchData],
  );
  const visibleResults = query.trim().length >= 2
    ? externalResults.length
      ? externalResults
      : localResults
    : [];

  useEffect(() => {
    if (query.trim().length < 3) return;
    const timeout = setTimeout(() => searchContests({ query }), 700);
    return () => clearTimeout(timeout);
  }, [query, searchContests]);

  const selectContest = (selected: PoliceContest) => {
    haptic.selection();
    const detected =
      selected.isExternal && externalSearchData?.syllabus.subjectIds.length
        ? externalSearchData.syllabus.subjectIds
        : selected.subjectIds;
    setContest(selected);
    setSubjectIds(detected.length ? detected : selected.subjectIds);
    setStep(3);
  };

  const toggleSubject = (id: string) => {
    haptic.selection();
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  };

  const complete = () => {
    if (!contest) return;
    const manualSubjects = programText.trim() ? detectSyllabusSubjects(programText) : [];
    const finalSubjects = manualSubjects.length
      ? [...new Set([...subjectIds, ...manualSubjects])]
      : subjectIds.length
        ? subjectIds
        : contest.subjectIds;
    setProfile(name.trim() || "Candidato", contest.id, finalSubjects);
    setContestTitle(contest.title);
    saveExamDate(examDate.trim() || undefined);
    setContestSyllabus(
      buildCatalogSyllabus(
        contest.title,
        finalSubjects,
        contest.isExternal
          ? externalSearchData?.syllabus.sourceUrls ?? []
          : contest.sourceUrl
            ? [contest.sourceUrl]
            : [],
        programText,
      ),
    );
    router.replace("/leveling-intro" as never);
  };

  const progress = ((step + 1) / 4) * 100;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <Text style={styles.stepLabel}>Passo {step + 1} de 4</Text>
          <ProgressBar value={progress} color="#1F8A3A" />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 0 — Nome */}
          {step === 0 && (
            <View style={styles.block}>
              <DuoduoMascot size={compact ? 72 : 96} />
              <Text style={styles.title}>Bem-vindo ao Dino</Text>
              <Text style={styles.body}>
                Preparação tática para polícias, guardas municipais e Forças Armadas. Como posso te chamar?
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome ou apelido"
                placeholderTextColor="#8A9A8E"
                style={styles.input}
                autoFocus
              />
            </View>
          )}

          {/* STEP 1 — Concurso */}
          {step === 1 && (
            <View style={styles.block}>
              <DuoduoMascot size={64} />
              <Text style={styles.title}>Qual concurso você quer passar?</Text>
              <Text style={styles.body}>
                Busque PM, PC, PF, PRF, Guarda Municipal, Exército, Marinha ou FAB.
                O Dino sugere matérias; no passo seguinte você marca ou desmarca o que for estudar de verdade.
              </Text>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color="#5A7160" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Ex: PMESP, Guarda Municipal, ESA, PF Agente..."
                  placeholderTextColor="#8A9A8E"
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {isSearching ? <ActivityIndicator size="small" color="#1F8A3A" /> : null}
              </View>

              {query.trim().length < 2 && (
                <>
                  <Text style={styles.sectionLabel}>Sugestões para começar</Text>
                  {SUGGESTED.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectContest(item)}
                      style={({ pressed }) => [styles.contestRow, pressed && styles.pressed]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contestTitle}>{item.title}</Text>
                        <Text style={styles.contestMeta}>
                          {item.organization} · {item.state}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={22} color="#809087" />
                    </Pressable>
                  ))}
                </>
              )}

              {query.trim().length >= 2 && (
                <>
                  <Text style={styles.sectionLabel}>
                    {visibleResults.length
                      ? "Resultados"
                      : isSearching
                        ? "Buscando na web..."
                        : "Nada encontrado — tente outro termo"}
                  </Text>
                  <FlatList
                    data={visibleResults}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => selectContest(item)}
                        style={({ pressed }) => [styles.contestRow, pressed && styles.pressed]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contestTitle}>{item.title}</Text>
                          <Text style={styles.contestMeta}>
                            {item.isExternal ? "Fonte web · confirme matérias depois" : item.organization}
                            {item.dateLabel ? ` · ${item.dateLabel}` : ""}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color="#809087" />
                      </Pressable>
                    )}
                  />
                </>
              )}
            </View>
          )}

          {/* STEP 2 — reforço de busca se ainda não escolheu (atalho) */}
          {step === 2 && (
            <View style={styles.block}>
              <Text style={styles.title}>Confirme o concurso</Text>
              <Text style={styles.body}>
                Selecione um resultado abaixo ou volte e refine a busca.
              </Text>
              {(visibleResults.length ? visibleResults : SUGGESTED).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => selectContest(item)}
                  style={({ pressed }) => [styles.contestRow, pressed && styles.pressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contestTitle}>{item.title}</Text>
                    <Text style={styles.contestMeta}>{item.organization}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color="#809087" />
                </Pressable>
              ))}
            </View>
          )}

          {/* STEP 3 — Matérias + data */}
          {step === 3 && contest && (
            <View style={styles.block}>
              <Text style={styles.title}>Monte sua grade de estudo</Text>
              <Text style={styles.body}>
                Sugestão inicial para{" "}
                <Text style={styles.bold}>{contest.title}</Text>. Cada edital é diferente: ative só
                as matérias do seu edital. O Dino não fica preso a um único órgão (ex.: só PF).
              </Text>

              <Text style={styles.sectionLabel}>Matérias</Text>
              <View style={styles.chips}>
                {SUBJECTS.map((subject) => {
                  const active = subjectIds.includes(subject.id);
                  return (
                    <Pressable
                      key={subject.id}
                      onPress={() => toggleSubject(subject.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {subject.shortTitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Data da prova (opcional)</Text>
              <TextInput
                value={examDate}
                onChangeText={setExamDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#8A9A8E"
                style={styles.input}
              />

              <Text style={styles.sectionLabel}>Trecho do edital (opcional)</Text>
              <TextInput
                value={programText}
                onChangeText={setProgramText}
                placeholder="Cole aqui o conteúdo programático para refinarmos as matérias"
                placeholderTextColor="#8A9A8E"
                style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
                multiline
              />
              <Text style={styles.hint}>
                O catálogo é só um atalho. A liberdade é sua: ajuste matérias quando o edital mudar
                ou for diferente do modelo. Assim o app continua leve e útil para qualquer carreira
                da área.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.dock}>
          {step === 0 && (
            <PrimaryButton
              label="Continuar"
              onPress={() => {
                haptic.light();
                setStep(1);
              }}
            />
          )}
          {step === 1 && (
            <PrimaryButton
              label="Ver sugestões e continuar"
              onPress={() => {
                haptic.light();
                if (visibleResults[0]) selectContest(visibleResults[0]);
                else setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <PrimaryButton label="Voltar à busca" onPress={() => setStep(1)} variant="secondary" />
          )}
          {step === 3 && (
            <PrimaryButton
              label="Ir para o nivelamento"
              onPress={complete}
              disabled={!contest || subjectIds.length === 0}
            />
          )}
          {step > 0 && step < 3 && (
            <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} style={styles.back}>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { gap: 8, marginBottom: 12, paddingTop: 4 },
  stepLabel: { color: "#5A7160", fontSize: 12, fontWeight: "800" },
  block: { paddingTop: 8 },
  title: {
    color: "#102A43",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 12,
    lineHeight: 32,
  },
  body: { color: "#5A7160", fontSize: 15, lineHeight: 22, marginTop: 10 },
  bold: { fontWeight: "900", color: "#102A43" },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#DDE8DF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#243B53",
    backgroundColor: "#FFFFFF",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#DDE8DF",
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#243B53" },
  sectionLabel: {
    color: "#1A4D28",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  contestRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E1EAE2",
    marginBottom: 8,
  },
  contestTitle: { color: "#102A43", fontSize: 15, fontWeight: "900" },
  contestMeta: { color: "#6B7F70", fontSize: 12, marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F1",
    borderWidth: 1,
    borderColor: "#D8E4D6",
  },
  chipActive: { backgroundColor: "#E3F6DB", borderColor: "#1F8A3A" },
  chipText: { color: "#5A7160", fontSize: 13, fontWeight: "800" },
  chipTextActive: { color: "#1A5C2A" },
  hint: { color: "#7A8B7E", fontSize: 12, lineHeight: 17, marginTop: 12 },
  dock: { gap: 6, paddingTop: 8, paddingBottom: 4 },
  back: { alignItems: "center", paddingVertical: 10 },
  backText: { color: "#5A7160", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
