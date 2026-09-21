import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { createAudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { useState } from "react";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { ScreenContainer } from "@/components/screen-container";
import { getContest } from "@/lib/study-data";
import { haptic } from "@/lib/haptics";
import { isCustomSoundDurationAllowed, SoundPreset } from "@/lib/sound-rules";
import { useStudy } from "@/lib/study-store";
import { serializeStudySnapshot } from "@/lib/study-sync";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const soundPresets: { id: SoundPreset; title: string; detail: string; icon: "volume-up" | "volume-down" | "volume-off" | "music-note" }[] = [
  { id: "dino", title: "Dino", detail: "Sinais de acerto e revisão", icon: "volume-up" },
  { id: "discreet", title: "Discreto", detail: "Mesmos sinais com volume menor", icon: "volume-down" },
  { id: "silent", title: "Sem som", detail: "Apenas feedback visual e tátil", icon: "volume-off" },
  { id: "custom", title: "Meu som", detail: "Arquivo próprio de 1 a 2 segundos", icon: "music-note" },
];

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getAudioDuration(uri: string) {
  const player = createAudioPlayer({ uri });
  try {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (Number.isFinite(player.duration) && player.duration > 0) return player.duration;
      await wait(100);
    }
    return 0;
  } finally {
    player.remove();
  }
}

export default function ProfileScreen() {
  const { state, resetDemo, setSoundPreference } = useStudy();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const saveSnapshot = trpc.sync.save.useMutation();
  const [isImportingSound, setIsImportingSound] = useState(false);
  const contest = getContest(state.contestId);
  const syncProgress = async () => {
    if (!isAuthenticated) { await startOAuthLogin(); return; }
    try { await saveSnapshot.mutateAsync({ payload: serializeStudySnapshot(state) }); Alert.alert("Progresso sincronizado", "Seu progresso foi salvo na conta conectada. PDFs e sons próprios continuam somente neste dispositivo."); } catch (error) { Alert.alert("Não foi possível sincronizar", error instanceof Error ? error.message : "Tente novamente mais tarde."); }
  };
  const importCustomSound = async () => {
    try {
      setIsImportingSound(true);
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const audioLike = asset.mimeType?.startsWith("audio/") || /\.(mp3|m4a|wav|aac|ogg)$/i.test(asset.name);
      if (!audioLike) { Alert.alert("Formato não aceito", "Escolha um arquivo de áudio, como MP3, M4A, WAV, AAC ou OGG."); return; }
      const durationSeconds = await getAudioDuration(asset.uri);
      if (!isCustomSoundDurationAllowed(durationSeconds)) { Alert.alert("Duração inválida", "Seu som precisa ter entre 1 e 2 segundos para manter o ritmo das questões."); return; }
      const extension = asset.name.split(".").pop() || "m4a";
      const target = Platform.OS === "web" ? asset.uri : new File(Paths.document, `dino-feedback-${Date.now()}.${extension}`);
      if (Platform.OS !== "web") new File(asset.uri).copy(target as File);
      const uri = typeof target === "string" ? target : target.uri;
      setSoundPreference({ preset: "custom", customSound: { uri, name: asset.name, durationSeconds } });
      haptic.success();
    } catch {
      Alert.alert("Não foi possível importar", "Tente outro arquivo de áudio de 1 a 2 segundos.");
    } finally {
      setIsImportingSound(false);
    }
  };
  return <ScreenContainer className="px-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.identity}><View style={styles.avatar}><DuoduoMascot size={64} /></View><View style={styles.identityText}><Text style={styles.name}>{state.name || "Candidato"}</Text><Text style={styles.contest}>{contest.title}</Text></View></View>
    <View style={styles.achievementRow}><View style={styles.achievement}><MaterialIcons name="local-fire-department" size={22} color="#E76F51" /><Text style={styles.achievementValue}>{state.streak}</Text><Text style={styles.achievementLabel}>ofensiva</Text></View><View style={styles.achievement}><MaterialIcons name="bolt" size={22} color="#D99100" /><Text style={styles.achievementValue}>{state.xp}</Text><Text style={styles.achievementLabel}>XP total</Text></View><View style={styles.achievement}><MaterialIcons name="menu-book" size={21} color="#2563EB" /><Text style={styles.achievementValue}>{state.completedLessonIds.length}</Text><Text style={styles.achievementLabel}>lições</Text></View></View>
    <Text style={styles.sectionTitle}>Conta e sincronização</Text><View style={styles.accountCard}><View style={styles.accountHeader}><MaterialIcons name={isAuthenticated ? "cloud-done" : "account-circle"} size={25} color="#2A743A" /><View style={styles.accountCopy}><Text style={styles.accountTitle}>{authLoading ? "Verificando conta..." : isAuthenticated ? user?.name ?? "Conta conectada" : "Estude em mais de um dispositivo"}</Text><Text style={styles.accountText}>{isAuthenticated ? "Progresso pronto para sincronizar com segurança." : "Entre ou crie sua conta usando Google no portal seguro."}</Text></View></View><Pressable disabled={authLoading || saveSnapshot.isPending} onPress={syncProgress} style={({ pressed }) => [styles.googleButton, (pressed || authLoading || saveSnapshot.isPending) && styles.pressed]}><MaterialIcons name={isAuthenticated ? "sync" : "login"} size={20} color="#FFFFFF" /><Text style={styles.googleButtonText}>{saveSnapshot.isPending ? "Sincronizando..." : isAuthenticated ? "Sincronizar meu progresso" : "Continuar com Google"}</Text></Pressable>{isAuthenticated ? <Pressable onPress={logout} style={styles.logoutButton}><Text style={styles.logoutText}>Sair da conta</Text></Pressable> : null}</View>
    <Text style={styles.sectionTitle}>Minha preparação</Text>
    <Pressable onPress={() => { haptic.light(); router.push("/materials" as any); }} style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}><View style={[styles.menuIcon, { backgroundColor: "#EAF3FA" }]}><MaterialIcons name="folder" size={23} color="#2563EB" /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>Meus materiais</Text><Text style={styles.menuSubtitle}>{state.materials.length ? `${state.materials.length} PDF${state.materials.length > 1 ? "s" : ""} na biblioteca` : "Adicione PDFs para organizar sua base"}</Text></View><MaterialIcons name="chevron-right" size={24} color="#8A9B8D" /></Pressable>
    <Pressable onPress={() => { haptic.light(); router.push("/admin" as any); }} style={({ pressed }) => [styles.menuCard, styles.editorialCard, pressed && styles.pressed]}><View style={[styles.menuIcon, { backgroundColor: "#FFF0DD" }]}><MaterialIcons name="edit-note" size={23} color="#C77700" /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>Gestão editorial local</Text><Text style={styles.menuSubtitle}>{state.editorialQuestions.length ? `${state.editorialQuestions.length} questão(ões) em produção` : "Cadastre e publique questões para a trilha"}</Text></View><MaterialIcons name="chevron-right" size={24} color="#8A9B8D" /></Pressable>
    <View style={styles.info}><MaterialIcons name="auto-awesome" size={20} color="#8A6800" /><Text style={styles.infoText}>Na próxima etapa, seus materiais poderão gerar microlições e questões com referências ao conteúdo enviado.</Text></View>
    <Text style={styles.sectionTitle}>Configuração</Text>
    <View style={styles.settings}><View style={styles.settingRow}><MaterialIcons name="flag" size={21} color="#667085" /><Text style={styles.settingLabel}>Objetivo atual</Text><Text style={styles.settingValue}>{contest.title.includes("Rodovi") ? "PRF" : contest.title.includes("Federal") ? "PF" : contest.title.includes("Civil") ? "PC" : contest.title.includes("Guarda") ? "Guarda" : contest.title.includes("Exército") || contest.title.includes("Exercito") ? "EB" : contest.title.includes("Marinha") ? "MB" : contest.title.includes("Aérea") || contest.title.includes("FAB") ? "FAB" : contest.title.includes("Penal") ? "PP" : contest.title.includes("Militar") || contest.title.includes("PM") ? "PM" : "Concurso"}</Text></View><View style={styles.soundBlock}><Text style={styles.soundTitle}>Sons de resposta</Text><Text style={styles.soundHint}>Escolha um padrão ou use um arquivo seu entre 1 e 2 segundos.</Text>{soundPresets.map((preset) => { const selected = state.soundPreference.preset === preset.id; return <Pressable key={preset.id} onPress={() => { if (preset.id === "custom" && !state.soundPreference.customSound) { importCustomSound(); return; } setSoundPreference({ ...state.soundPreference, preset: preset.id }); haptic.selection(); }} style={({ pressed }) => [styles.soundOption, selected && styles.soundOptionSelected, pressed && styles.pressed]}><MaterialIcons name={preset.icon} size={20} color={selected ? "#1F7A32" : "#667085"} /><View style={styles.soundCopy}><Text style={[styles.soundOptionTitle, selected && styles.soundOptionTitleSelected]}>{preset.title}</Text><Text style={styles.soundOptionDetail}>{preset.id === "custom" && state.soundPreference.customSound ? `${state.soundPreference.customSound.name} · ${state.soundPreference.customSound.durationSeconds.toFixed(1)} s` : preset.detail}</Text></View>{selected && <MaterialIcons name="check-circle" size={20} color="#2BA348" />}</Pressable>; })}<Pressable onPress={importCustomSound} disabled={isImportingSound} style={({ pressed }) => [styles.importButton, pressed && styles.pressed, isImportingSound && styles.disabled]}><MaterialIcons name="upload-file" size={20} color="#19733A" /><Text style={styles.importText}>{isImportingSound ? "Validando som..." : state.soundPreference.customSound ? "Trocar meu som" : "Inserir meu som"}</Text></Pressable></View><Pressable onPress={() => { resetDemo(); router.replace("/onboarding" as any); }} style={({ pressed }) => [styles.settingRow, styles.settingRowLast, pressed && styles.pressed]}><MaterialIcons name="restart-alt" size={21} color="#C45B52" /><Text style={[styles.settingLabel, { color: "#B84B42" }]}>Reiniciar demonstração</Text><MaterialIcons name="chevron-right" size={22} color="#C45B52" /></Pressable></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 21, paddingBottom: 24 }, identity: { flexDirection: "row", alignItems: "center", gap: 13 }, avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: "#E5F6E1", alignItems: "center", justifyContent: "center" }, identityText: { flex: 1 }, name: { color: "#102A43", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }, contest: { color: "#667085", fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: "600" }, achievementRow: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E1EAE2", paddingVertical: 15, marginTop: 22 }, achievement: { flex: 1, alignItems: "center", gap: 3 }, achievementValue: { color: "#102A43", fontSize: 18, fontWeight: "900" }, achievementLabel: { color: "#667085", fontSize: 11, fontWeight: "700" }, sectionTitle: { color: "#102A43", fontSize: 17, fontWeight: "900", marginTop: 26, marginBottom: 11 }, accountCard: { backgroundColor: "#F1F9EF", borderRadius: 17, borderWidth: 1, borderColor: "#CDE6CB", padding: 14 }, accountHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, accountCopy: { flex: 1 }, accountTitle: { color: "#245431", fontSize: 14, fontWeight: "900" }, accountText: { color: "#597460", fontSize: 11, lineHeight: 16, marginTop: 2 }, googleButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, backgroundColor: "#2E7E3D", marginTop: 13 }, googleButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, logoutButton: { alignSelf: "center", paddingTop: 10 }, logoutText: { color: "#52705A", fontSize: 12, fontWeight: "900" }, menuCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1EAE2" }, editorialCard: { marginTop: 10 }, menuIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, menuCopy: { flex: 1 }, menuTitle: { color: "#243B53", fontSize: 15, fontWeight: "900" }, menuSubtitle: { color: "#667085", fontSize: 12, lineHeight: 17, marginTop: 3 }, info: { flexDirection: "row", gap: 9, padding: 14, marginTop: 14, backgroundColor: "#FFF7DF", borderRadius: 15 }, infoText: { flex: 1, color: "#715300", fontSize: 12, lineHeight: 18 }, settings: { backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#E1EAE2", overflow: "hidden" }, settingRow: { minHeight: 57, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#E8EEE9" }, settingRowLast: { borderBottomWidth: 0 }, settingLabel: { flex: 1, color: "#405A4A", fontSize: 14, fontWeight: "700" }, settingValue: { color: "#667085", fontSize: 13, fontWeight: "800" }, soundBlock: { borderBottomWidth: 1, borderBottomColor: "#E8EEE9", padding: 14 }, soundTitle: { color: "#405A4A", fontSize: 14, fontWeight: "900" }, soundHint: { color: "#7A8B7E", fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 10 }, soundOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E1EBE1", marginTop: 7 }, soundOptionSelected: { backgroundColor: "#EAF8EE", borderColor: "#76CD83" }, soundCopy: { flex: 1 }, soundOptionTitle: { color: "#405A4A", fontSize: 13, fontWeight: "900" }, soundOptionTitleSelected: { color: "#1F7A32" }, soundOptionDetail: { color: "#7A8B7E", fontSize: 11, lineHeight: 15, marginTop: 1 }, importButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, marginTop: 10, borderRadius: 12, paddingVertical: 11, backgroundColor: "#E8F6E5" }, importText: { color: "#19733A", fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
