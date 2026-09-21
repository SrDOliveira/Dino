import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { PROCESSING_STAGE_LABEL } from "@/lib/content-models";
import { haptic } from "@/lib/haptics";
import { canAddPdf } from "@/lib/material-rules";
import { useStudy } from "@/lib/study-store";
import { useSubscription } from "@/lib/subscription-store";
import { canUploadPdf } from "@/lib/subscription";
import { getApiBaseUrl } from "@/constants/oauth";

function formatFileSize(bytes?: number) {
  if (!bytes) return "Tamanho não informado";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MaterialsScreen() {
  const { state, addMaterial, setMaterialAnalysis, setMaterialProcessing } = useStudy();
  const { subscription } = useSubscription();
  const [isPicking, setIsPicking] = useState(false);
  const selectPdf = async () => {
    if (!canUploadPdf(subscription)) {
      router.push({ pathname: "/paywall" as never, params: { reason: "pdf_upload" } } as never);
      return;
    }
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!canAddPdf(asset.size)) {
        Alert.alert("PDF acima do limite", "Escolha um PDF de até 50 MB para adicioná-lo à biblioteca.");
        return;
      }
      const id = `${Date.now()}-${asset.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      let persistentUri = asset.uri;
      if (Platform.OS !== "web" && FileSystem.documentDirectory) {
        const directory = `${FileSystem.documentDirectory}dino-materials/`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        persistentUri = `${directory}${id}`;
        await FileSystem.copyAsync({ from: asset.uri, to: persistentUri });
      }
      addMaterial({ id, name: asset.name, uri: persistentUri, size: asset.size, addedAt: new Date().toISOString() });
      const completed = await analyzeMaterial({ id, name: asset.name, uri: persistentUri });
      if (completed) haptic.success();
    } catch {
      haptic.error();
      Alert.alert("Não foi possível adicionar o PDF", "Tente selecionar o arquivo novamente.");
    } finally { setIsPicking(false); }
  };

  const analyzeMaterial = async (material: { id: string; name: string; uri: string }) => {
    let lastProgress = 0;
    try {
      setMaterialProcessing(material.id, "reading", 18);
      lastProgress = 18;
      const file = new File(material.uri);
      setMaterialProcessing(material.id, "structuring", 48);
      lastProgress = 48;
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) throw new Error("Não encontramos o servidor do Dino neste dispositivo. Confirme que o app está aberto pelo Expo Go e tente novamente.");
      const response = await expoFetch(`${apiBaseUrl}/api/material-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/pdf", "X-Material-Id": material.id, "X-Material-Name": material.name },
        body: file as unknown as BodyInit,
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(failure?.message ?? `O servidor recusou o PDF (código ${response.status}).`);
      }
      const result = await response.json() as { storageUrl: string; analysis: NonNullable<(typeof state.materials)[number]["analysis"]> };
      setMaterialProcessing(material.id, "study-plan", 82);
      setMaterialAnalysis(material.id, result.storageUrl, result.analysis);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mantenha o app aberto e tente novamente.";
      setMaterialProcessing(material.id, "error", lastProgress, message);
      Alert.alert("Análise não concluída", `${message} O PDF segue na sua biblioteca.`);
      return false;
    }
  };

  const retryMaterial = async (material: { id: string; name: string; uri: string }) => {
    setIsPicking(true);
    try {
      const completed = await analyzeMaterial(material);
      if (completed) haptic.success();
    } finally {
      setIsPicking(false);
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={25} color="#31513A" /></Pressable><Text style={styles.headerTitle}>Meus materiais</Text><View style={styles.headerSpacer} /></View>
    <FlatList style={styles.listContainer} data={state.materials} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
      ListHeaderComponent={<><View style={styles.hero}><View style={styles.heroIcon}><MaterialIcons name="picture-as-pdf" size={30} color="#D4554B" /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>Sua biblioteca de estudo</Text><Text style={styles.heroText}>Adicione editais, leis e apostilas de até 50 MB para organizar sua preparação.</Text></View></View><View style={styles.notice}><MaterialIcons name="info-outline" size={19} color="#3676AB" /><Text style={styles.noticeText}>Ao enviar um PDF, mantenha o app aberto durante a análise. A IA cria um rascunho com referências para revisão editorial; materiais extensos podem levar alguns minutos.</Text></View><Text style={styles.sectionTitle}>{state.materials.length ? "Materiais em análise" : "Nenhum material adicionado"}</Text></>}
      ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="folder-open" size={40} color="#9AAF9E" /><Text style={styles.emptyTitle}>Comece pela sua base</Text><Text style={styles.emptyText}>Selecione um PDF de edital, lei ou apostila de até 50 MB para deixá-lo na sua biblioteca.</Text></View>}
      renderItem={({ item, index }) => <View style={styles.fileRow}><View style={styles.fileIcon}><MaterialIcons name={item.stage === "ready" ? "auto-awesome" : item.stage === "error" ? "error-outline" : "picture-as-pdf"} size={24} color={item.stage === "ready" ? "#2563EB" : item.stage === "error" ? "#D4554B" : "#D4554B"} /></View><View style={styles.fileCopy}><View style={styles.fileTop}><Text style={styles.fileName} numberOfLines={1}>{item.name}</Text><Text style={[styles.fileStage, item.stage === "ready" && styles.fileStageReady]}>{PROCESSING_STAGE_LABEL[item.stage]}</Text></View><Text style={styles.fileInfo}>{formatFileSize(item.size)} · posição {index + 1} na biblioteca</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${item.progress}%` }]} /></View><Text style={styles.progressText}>{item.progress}% · {item.stage === "ready" ? "teoria e ideias de questões aguardando revisão" : item.stage === "error" ? "o PDF foi recebido; a leitura não concluiu" : "mantenha o Dino aberto durante esta etapa"}</Text>{item.stage === "error" && <Text style={styles.failureText}>{item.note ?? "A análise não concluiu agora. Tente novamente mais tarde."}</Text>}{item.stage === "error" && <Pressable disabled={isPicking} onPress={() => retryMaterial(item)} style={({ pressed }) => [styles.retryButton, (pressed || isPicking) && styles.retryButtonPressed]}><MaterialIcons name="refresh" size={16} color="#FFFFFF" /><Text style={styles.retryText}>{isPicking ? "Tentando novamente…" : "Tentar novamente"}</Text></Pressable>}{item.analysis && <View style={styles.analysis}><Text style={styles.analysisTitle}>Rascunho de teoria</Text><Text style={styles.analysisSummary}>{item.analysis.summary}</Text><Text style={styles.analysisReference}>Referência: {item.analysis.reference}</Text></View>}</View></View>}
      ListFooterComponent={<View style={styles.footer}><PrimaryButton label={isPicking ? "Analisando material…" : "Adicionar e analisar PDF"} onPress={selectPdf} disabled={isPicking} />{isPicking && <ActivityIndicator color="#39B54A" style={styles.loader} />}<Text style={styles.footerNote}>O PDF é enviado com sua ação para leitura por IA e fica disponível para revisão editorial. Mantenha o app aberto até concluir.</Text></View>} />
    <StudyNavBar />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { height: 51, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { color: "#102A43", fontSize: 17, fontWeight: "900" }, headerSpacer: { width: 25 }, listContainer: { flex: 1 }, content: { paddingTop: 15, paddingBottom: 18, flexGrow: 1 }, hero: { flexDirection: "row", gap: 12, backgroundColor: "#FFFFFF", padding: 16, borderRadius: 19, borderWidth: 1, borderColor: "#E1EAE2" }, heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#FCECEA", alignItems: "center", justifyContent: "center" }, heroCopy: { flex: 1 }, heroTitle: { color: "#102A43", fontSize: 16, fontWeight: "900" }, heroText: { color: "#667085", fontSize: 13, lineHeight: 18, marginTop: 4 }, notice: { flexDirection: "row", gap: 8, backgroundColor: "#EAF3FA", padding: 13, borderRadius: 15, marginTop: 13 }, noticeText: { flex: 1, color: "#466177", fontSize: 12, lineHeight: 18 }, sectionTitle: { color: "#102A43", fontSize: 16, fontWeight: "900", marginTop: 25, marginBottom: 10 }, empty: { alignItems: "center", backgroundColor: "#F1F6F1", borderRadius: 18, padding: 25, marginTop: 1 }, emptyTitle: { color: "#31513A", fontSize: 15, fontWeight: "900", marginTop: 10 }, emptyText: { color: "#667085", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 }, fileRow: { flexDirection: "row", alignItems: "flex-start", gap: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1EAE2", padding: 13, borderRadius: 15, marginBottom: 8 }, fileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FCECEA", alignItems: "center", justifyContent: "center" }, fileCopy: { flex: 1 }, fileTop: { flexDirection: "row", gap: 7, alignItems: "center" }, fileName: { flex: 1, color: "#243B53", fontSize: 14, fontWeight: "800" }, fileStage: { color: "#A06D00", fontSize: 10, fontWeight: "800", backgroundColor: "#FFF7DF", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 3 }, fileStageReady: { color: "#1F7A32", backgroundColor: "#E7F8E3" }, fileInfo: { color: "#7A8B7E", fontSize: 11, marginTop: 5 }, progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#E5EEE5", overflow: "hidden", marginTop: 9 }, progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#39B54A" }, progressText: { color: "#667085", fontSize: 10, marginTop: 4 }, failureText: { color: "#805C11", fontSize: 10, lineHeight: 14, backgroundColor: "#FFF6DF", borderRadius: 9, padding: 8, marginTop: 8 }, retryButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 9, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#2C7D3E" }, retryButtonPressed: { opacity: 0.68 }, retryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, analysis: { marginTop: 11, borderRadius: 12, padding: 11, backgroundColor: "#EFF8EE" }, analysisTitle: { color: "#1F7A32", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 }, analysisSummary: { color: "#31513A", fontSize: 12, lineHeight: 18, marginTop: 4 }, analysisReference: { color: "#587062", fontSize: 10, lineHeight: 15, marginTop: 7 }, footer: { marginTop: "auto", paddingTop: 22 }, loader: { marginTop: 12 }, footerNote: { color: "#667085", fontSize: 11, textAlign: "center", lineHeight: 16, marginTop: 10 },
});
