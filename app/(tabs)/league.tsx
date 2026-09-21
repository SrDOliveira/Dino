import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState, RecordingPresets } from "expo-audio";
import { File } from "expo-file-system";

import { ScreenContainer } from "@/components/screen-container";
import { getLocalPoliceContest } from "@/lib/contest-catalog";
import { getApiBaseUrl, startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useStudy } from "@/lib/study-store";
import { trpc } from "@/lib/trpc";

const DEMO_RANKING = [{ name: "Ana R.", score: 1280 }, { name: "Rafael M.", score: 1140 }, { name: "Você", score: 0 }];

export default function LeagueScreen() {
  const { state } = useStudy();
  const { isAuthenticated, loading } = useAuth();
  const contest = getLocalPoliceContest(state.contestId);
  const [text, setText] = useState("");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const messages = trpc.league.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 8000 });
  const sendText = trpc.league.sendText.useMutation({ onSuccess: () => { setText(""); messages.refetch(); } });
  const sendAudio = trpc.league.sendAudio.useMutation({ onSuccess: () => messages.refetch() });
  const blockUser = trpc.league.block.useMutation({ onSuccess: () => messages.refetch() });
  const reportMessage = trpc.league.report.useMutation();
  const lastSimulation = state.simulations[0];
  const ownScore = state.xp + state.tacticalPoints;

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => undefined); }, []);
  const signIn = () => startOAuthLogin();
  const submitText = async () => { if (!text.trim()) return; try { await sendText.mutateAsync({ body: text }); } catch (error) { Alert.alert("Mensagem não enviada", error instanceof Error ? error.message : "Tente novamente."); } };
  const toggleRecording = async () => {
    try {
      if (recorderState.isRecording) { await recorder.stop(); const uri = recorder.uri; if (!uri) return; const base64 = await new File(uri).base64(); await sendAudio.mutateAsync({ base64, mimeType: "audio/m4a" }); return; }
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { Alert.alert("Microfone necessário", "Autorize o microfone para enviar uma mensagem de voz."); return; }
      await recorder.prepareToRecordAsync(); recorder.record();
    } catch { Alert.alert("Áudio não enviado", "Tente gravar uma mensagem mais curta."); }
  };
  const playAudio = (url?: string) => { if (!url) return; const player = createAudioPlayer(`${getApiBaseUrl()}${url}`); player.play(); setTimeout(() => player.remove(), 30_000); };
  const report = (messageId: number) => Alert.alert("Denunciar mensagem", "A equipe receberá um aviso para revisar o conteúdo.", [
    { text: "Cancelar", style: "cancel" },
    { text: "Ofensa", onPress: () => reportMessage.mutate({ messageId, reason: "offense" }) },
    { text: "Spam ou risco", onPress: () => reportMessage.mutate({ messageId, reason: "unsafe" }) },
  ]);
  const block = (userId: number, name: string) => Alert.alert(`Bloquear ${name}?`, "As mensagens dessa pessoa deixarão de aparecer para você.", [
    { text: "Cancelar", style: "cancel" },
    { text: "Bloquear", style: "destructive", onPress: () => blockUser.mutate({ userId }) },
  ]);

  return <ScreenContainer className="px-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><View style={styles.heroIcon}><MaterialIcons name="groups" size={31} color="#A87000" /></View><View style={styles.heroCopy}><Text style={styles.eyebrow}>LIGA DINO</Text><Text style={styles.title}>Você não estuda sozinho</Text><Text style={styles.subtitle}>{state.contestTitle ?? contest.title} · avance junto com outros candidatos.</Text></View></View>
    <View style={styles.rankCard}><View style={styles.rankHeader}><Text style={styles.sectionTitle}>Ranking da semana</Text><Text style={styles.rankMeta}>demonstração local</Text></View>{DEMO_RANKING.map((item, index) => <View key={item.name} style={styles.rankRow}><Text style={styles.position}>{index + 1}º</Text><Text style={styles.rankName}>{item.name}</Text><Text style={styles.rankScore}>{item.name === "Você" ? ownScore : item.score} PT</Text></View>)}</View>
    <Pressable onPress={() => router.push("/simulation" as never)} style={({ pressed }) => [styles.simCard, pressed && styles.pressed]}><View><Text style={styles.simEyebrow}>SIMULADO TÁTICO</Text><Text style={styles.simTitle}>{lastSimulation ? "Melhorar meu resultado" : "Iniciar agora"}</Text><Text style={styles.simText}>{lastSimulation ? `Último: ${lastSimulation.accuracy}% de acerto` : "10 questões com correção e corte estimado"}</Text></View><MaterialIcons name="play-circle-fill" size={42} color="#FFFFFF" /></Pressable>
    <View style={styles.chatHead}><View><Text style={styles.sectionTitle}>Mural da tropa</Text><Text style={styles.chatHint}>Texto e áudios curtos. Respeito é obrigatório.</Text></View><MaterialIcons name="verified-user" size={22} color="#2B7A3A" /></View>
    {!isAuthenticated && !loading ? <Pressable onPress={signIn} style={styles.loginCard}><MaterialIcons name="login" size={22} color="#286B9A" /><View style={styles.loginCopy}><Text style={styles.loginTitle}>Entre para participar da Liga</Text><Text style={styles.loginText}>Use sua conta Google no portal seguro para enviar mensagens e manter seu histórico.</Text></View></Pressable> : null}
    {isAuthenticated ? <><View style={styles.rules}><MaterialIcons name="gpp-good" size={18} color="#8B6500" /><Text style={styles.rulesText}>Sem ofensas, dados pessoais, links estranhos ou conteúdo inadequado. Você pode denunciar ou bloquear qualquer mensagem.</Text></View><View style={styles.messageList}>{messages.isLoading ? <Text style={styles.muted}>Carregando a conversa...</Text> : messages.data?.length ? messages.data.map((message) => <View key={message.id} style={styles.message}><View style={styles.messageTop}><Text style={styles.author}>{message.authorName}</Text><View style={styles.messageActions}><Text style={styles.when}>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text><Pressable onPress={() => report(message.id)} hitSlop={8}><MaterialIcons name="flag" size={16} color="#A56B00" /></Pressable><Pressable onPress={() => block(message.userId, message.authorName)} hitSlop={8}><MaterialIcons name="block" size={16} color="#B4453F" /></Pressable></View></View>{message.kind === "audio" ? <Pressable onPress={() => playAudio(message.audioUrl ?? undefined)} style={styles.audioBubble}><MaterialIcons name="play-arrow" size={20} color="#FFFFFF" /><Text style={styles.audioText}>Mensagem de voz</Text></Pressable> : <Text style={styles.messageText}>{message.body}</Text>}</View>) : <Text style={styles.muted}>Seja o primeiro a incentivar a tropa.</Text>}</View><View style={styles.composer}><TextInput value={text} onChangeText={setText} placeholder="Escreva algo respeitoso..." placeholderTextColor="#96A59A" style={styles.composerInput} multiline maxLength={500} /><Pressable onPress={submitText} disabled={sendText.isPending || !text.trim()} style={({ pressed }) => [styles.sendButton, (!text.trim() || sendText.isPending || pressed) && styles.sendDisabled]}><MaterialIcons name="send" size={21} color="#FFFFFF" /></Pressable></View><Pressable onPress={toggleRecording} disabled={sendAudio.isPending} style={({ pressed }) => [styles.audioButton, recorderState.isRecording && styles.audioRecording, (pressed || sendAudio.isPending) && styles.pressed]}><MaterialIcons name={recorderState.isRecording ? "stop" : "mic"} size={20} color={recorderState.isRecording ? "#FFFFFF" : "#9A6300"} /><Text style={[styles.audioButtonText, recorderState.isRecording && styles.audioButtonTextRecording]}>{recorderState.isRecording ? "Parar e enviar áudio" : "Gravar áudio curto"}</Text></Pressable></> : null}
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 21, paddingBottom: 28 }, hero: { flexDirection: "row", alignItems: "center", gap: 13 }, heroIcon: { width: 59, height: 59, borderRadius: 19, backgroundColor: "#FFF2CB", alignItems: "center", justifyContent: "center" }, heroCopy: { flex: 1 }, eyebrow: { color: "#A36A00", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: "#102A43", fontSize: 24, fontWeight: "900", marginTop: 3 }, subtitle: { color: "#667085", fontSize: 12, lineHeight: 17, marginTop: 4 }, rankCard: { marginTop: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1EAE2", borderRadius: 18, padding: 14 }, rankHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, sectionTitle: { color: "#102A43", fontSize: 16, fontWeight: "900" }, rankMeta: { color: "#8A9B8D", fontSize: 9, fontWeight: "800" }, rankRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#EEF2EE" }, position: { color: "#A56B00", fontSize: 12, width: 25, fontWeight: "900" }, rankName: { color: "#31513A", flex: 1, fontSize: 13, fontWeight: "800" }, rankScore: { color: "#2B7A3A", fontSize: 12, fontWeight: "900" }, simCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 15, borderRadius: 19, padding: 16, backgroundColor: "#246333" }, simEyebrow: { color: "#CDE7C9", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, simTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 3 }, simText: { color: "#D7ECD4", fontSize: 11, marginTop: 5 }, chatHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25 }, chatHint: { color: "#6D7E72", fontSize: 11, marginTop: 2 }, loginCard: { flexDirection: "row", gap: 10, backgroundColor: "#EAF3FA", borderRadius: 15, padding: 13, marginTop: 11 }, loginCopy: { flex: 1 }, loginTitle: { color: "#28506F", fontSize: 13, fontWeight: "900" }, loginText: { color: "#54738A", fontSize: 11, lineHeight: 16, marginTop: 3 }, rules: { flexDirection: "row", gap: 7, alignItems: "flex-start", borderRadius: 13, padding: 11, marginTop: 11, backgroundColor: "#FFF7E1" }, rulesText: { flex: 1, color: "#795B15", fontSize: 10, lineHeight: 15 }, messageList: { gap: 8, marginTop: 12 }, message: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3ECE4", borderRadius: 14, padding: 11 }, messageTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, messageActions: { flexDirection: "row", gap: 8, alignItems: "center" }, author: { color: "#2D5937", fontSize: 12, fontWeight: "900" }, when: { color: "#8A9B8D", fontSize: 10 }, messageText: { color: "#405A4A", fontSize: 13, lineHeight: 19, marginTop: 5 }, audioBubble: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", backgroundColor: "#2E8240", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, marginTop: 6 }, audioText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, muted: { color: "#718078", fontSize: 12, paddingVertical: 12, textAlign: "center" }, composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 12 }, composerInput: { flex: 1, minHeight: 46, maxHeight: 96, backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#DDE8DF", paddingHorizontal: 12, paddingVertical: 11, color: "#243B53", fontSize: 13 }, sendButton: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", backgroundColor: "#2E8240" }, sendDisabled: { opacity: 0.5 }, audioButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 9, backgroundColor: "#FFF2CD", borderRadius: 13, paddingVertical: 11 }, audioRecording: { backgroundColor: "#C6534B" }, audioButtonText: { color: "#9A6300", fontSize: 12, fontWeight: "900" }, audioButtonTextRecording: { color: "#FFFFFF" }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] } });
