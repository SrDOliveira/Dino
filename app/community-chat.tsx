import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useCommunity } from "@/lib/community-store";
import { haptic } from "@/lib/haptics";

export default function CommunityChatScreen() {
  const { threadId, peerName } = useLocalSearchParams<{ threadId?: string; peerName?: string }>();
  const { getMessages, sendDirect, markThreadRead } = useCommunity();
  const [text, setText] = useState("");
  const messages = threadId ? getMessages(threadId) : [];

  useEffect(() => {
    if (threadId) markThreadRead(threadId);
  }, [threadId, markThreadRead]);

  const send = () => {
    if (!threadId || !text.trim()) return;
    const result = sendDirect(threadId, text);
    if (!result.ok) {
      Alert.alert("Mensagem bloqueada", result.error);
      return;
    }
    setText("");
    haptic.light();
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-0">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#31513A" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.name}>{peerName || "Conversa"}</Text>
          <Text style={styles.hint}>Chat privado · regras de respeito</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.isMine ? styles.bubbleMine : styles.bubblePeer]}>
              <Text style={[styles.bubbleText, item.isMine && styles.bubbleTextMine]}>{item.body}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Envie a primeira mensagem.</Text>}
        />

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mensagem..."
            placeholderTextColor="#8A9A8E"
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            style={[styles.send, !text.trim() && styles.sendDisabled]}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E9E3",
  },
  headerCopy: { flex: 1 },
  name: { color: "#102A43", fontSize: 17, fontWeight: "900" },
  hint: { color: "#6B7F70", fontSize: 11, marginTop: 2 },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#1F8A3A",
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E4D6",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: "#243B53", fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#FFFFFF" },
  empty: { color: "#7A8B7E", textAlign: "center", marginTop: 40 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E9E3",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#DDE8DF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#243B53",
    fontSize: 14,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1F8A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },
});
