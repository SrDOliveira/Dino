import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { useCommunity } from "@/lib/community-store";
import { useStudy } from "@/lib/study-store";
import { isAllowedCommunityImage } from "@/lib/league-safety";
import { haptic } from "@/lib/haptics";
import type { CommunityPost, DirectThread } from "@/lib/community-types";

type Tab = "feed" | "chats";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export default function CommunityScreen() {
  const { state } = useStudy();
  const { posts, threads, createPost, toggleLike, reportPost } = useCommunity();
  const [tab, setTab] = useState<Tab>("feed");
  const [draft, setDraft] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [posting, setPosting] = useState(false);

  const displayName = state.name || "Candidato";

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const check = isAllowedCommunityImage({
        size: asset.size,
        mimeType: asset.mimeType,
      });
      if (!check.ok) {
        Alert.alert("Foto não permitida", check.reason);
        return;
      }
      setImageUri(asset.uri);
      haptic.selection();
    } catch {
      Alert.alert("Não foi possível abrir a foto", "Tente novamente.");
    }
  };

  const publish = () => {
    if (!draft.trim() && !imageUri) return;
    setPosting(true);
    const result = createPost({
      authorName: displayName,
      body: draft,
      imageUri,
    });
    setPosting(false);
    if (!result.ok) {
      Alert.alert("Não foi possível publicar", result.error);
      return;
    }
    setDraft("");
    setImageUri(undefined);
    haptic.success();
  };

  const onReport = (post: CommunityPost) => {
    Alert.alert(
      "Denunciar publicação",
      "Reportar este post por conteúdo ofensivo ou impróprio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Denunciar",
          style: "destructive",
          onPress: () => {
            reportPost(post.id);
            haptic.light();
            Alert.alert("Denúncia registrada", "Nossa moderação vai analisar este conteúdo.");
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer className="px-0">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Comunidade</Text>
            <Text style={styles.subtitle}>Troque ideias e rotina de estudos com outros candidatos</Text>
          </View>
          <DuoduoMascot size={48} />
        </View>
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("feed")}
            style={[styles.tab, tab === "feed" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "feed" && styles.tabTextActive]}>Mural</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("chats")}
            style={[styles.tab, tab === "chats" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "chats" && styles.tabTextActive]}>Conversas</Text>
          </Pressable>
        </View>
      </View>

      {tab === "feed" ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.composer}>
              <Text style={styles.composerLabel}>Compartilhe sua rotina</Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Como foi o estudo de hoje?"
                placeholderTextColor="#8A9A8E"
                style={styles.input}
                multiline
                maxLength={800}
              />
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <Pressable onPress={() => setImageUri(undefined)} style={styles.removePhoto}>
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.composerActions}>
                <Pressable onPress={pickImage} style={styles.photoBtn}>
                  <MaterialIcons name="photo-camera" size={20} color="#2E7F3D" />
                  <Text style={styles.photoBtnText}>Foto</Text>
                </Pressable>
                <PrimaryButton
                  label={posting ? "Publicando…" : "Publicar"}
                  onPress={publish}
                  disabled={posting || (!draft.trim() && !imageUri)}
                  style={{ flex: 1, minHeight: 44 }}
                />
              </View>
              <Text style={styles.rules}>
                Fotos impróprias ou ofensas não são permitidas. Denúncias vão para moderação.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => {
                toggleLike(item.id);
                haptic.selection();
              }}
              onReport={() => onReport(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Ainda não há publicações. Seja o primeiro!</Text>
          }
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.chatsHint}>
              Conversas privadas para combinar estudos e tirar dúvidas com respeito.
            </Text>
          }
          renderItem={({ item }) => (
            <ThreadRow
              thread={item}
              onPress={() =>
                router.push({
                  pathname: "/community-chat" as never,
                  params: { threadId: item.id, peerName: item.peerName },
                } as never)
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma conversa ainda.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

function PostCard({
  post,
  onLike,
  onReport,
}: {
  post: CommunityPost;
  onLike: () => void;
  onReport: () => void;
}) {
  return (
    <View style={styles.post}>
      <View style={styles.postTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{post.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{post.authorName}</Text>
          <Text style={styles.when}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Pressable onPress={onReport} hitSlop={8}>
          <MaterialIcons name="flag" size={18} color="#9AA89E" />
        </Pressable>
      </View>
      {post.body ? <Text style={styles.postBody}>{post.body}</Text> : null}
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
      ) : null}
      <View style={styles.postActions}>
        <Pressable onPress={onLike} style={styles.likeBtn}>
          <MaterialIcons
            name={post.likedByMe ? "favorite" : "favorite-border"}
            size={20}
            color={post.likedByMe ? "#C6534B" : "#5A7160"}
          />
          <Text style={styles.likeText}>{post.likeCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ThreadRow({ thread, onPress }: { thread: DirectThread; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.thread, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>{thread.peerName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.threadTop}>
          <Text style={styles.threadName}>{thread.peerName}</Text>
          <Text style={styles.when}>{timeAgo(thread.lastAt)}</Text>
        </View>
        <Text style={styles.threadPreview} numberOfLines={1}>
          {thread.lastMessage}
        </Text>
      </View>
      {thread.unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{thread.unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "#102A43", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "#5A7160", fontSize: 13, lineHeight: 18, marginTop: 4 },
  tabs: {
    flexDirection: "row",
    marginTop: 14,
    backgroundColor: "#E8F0E6",
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#5A7160", fontSize: 14, fontWeight: "800" },
  tabTextActive: { color: "#1F7A32" },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  composer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D8E4D6",
    marginBottom: 14,
    marginTop: 6,
  },
  composerLabel: { color: "#1A4D28", fontSize: 13, fontWeight: "900", marginBottom: 8 },
  input: {
    minHeight: 72,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#DDE8DF",
    borderRadius: 12,
    padding: 12,
    color: "#243B53",
    fontSize: 14,
    textAlignVertical: "top",
  },
  previewWrap: { marginTop: 10, position: "relative" },
  preview: { width: "100%", height: 160, borderRadius: 12 },
  removePhoto: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    padding: 4,
  },
  composerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EAF6E8",
  },
  photoBtnText: { color: "#2E7F3D", fontSize: 13, fontWeight: "800" },
  rules: { color: "#7A8B7E", fontSize: 11, lineHeight: 15, marginTop: 10 },
  post: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E1EAE2",
    marginBottom: 10,
  },
  postTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D8EFCE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#1F5E32", fontSize: 16, fontWeight: "900" },
  author: { color: "#1A3A24", fontSize: 14, fontWeight: "900" },
  when: { color: "#8A9B8D", fontSize: 11, marginTop: 1 },
  postBody: { color: "#334F3C", fontSize: 14, lineHeight: 21, marginTop: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 12, marginTop: 12 },
  postActions: { flexDirection: "row", marginTop: 10 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  likeText: { color: "#5A7160", fontSize: 13, fontWeight: "800" },
  chatsHint: { color: "#5A7160", fontSize: 13, lineHeight: 19, marginBottom: 12, marginTop: 4 },
  thread: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E1EAE2",
    marginBottom: 8,
  },
  threadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  threadName: { color: "#1A3A24", fontSize: 15, fontWeight: "900" },
  threadPreview: { color: "#5A7160", fontSize: 13, marginTop: 3 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1F8A3A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  empty: { color: "#7A8B7E", textAlign: "center", marginTop: 24, fontSize: 14 },
  pressed: { opacity: 0.75 },
});
