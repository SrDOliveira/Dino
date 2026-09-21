import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CommunityPost, DirectMessage, DirectThread } from "@/lib/community-types";
import { isAllowedPostText, sanitizePostText } from "@/lib/league-safety";

const STORAGE_KEY = "dino-community-v1";

type CommunityState = {
  posts: CommunityPost[];
  threads: DirectThread[];
  messages: DirectMessage[];
};

const SEED_POSTS: CommunityPost[] = [
  {
    id: "p1",
    authorId: "camila",
    authorName: "Camila R.",
    body: "Ofensiva de 12 dias! Hoje foquei em Direito Constitucional. Quem mais está na luta?",
    createdAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
    likeCount: 8,
    likedByMe: false,
    reportCount: 0,
  },
  {
    id: "p2",
    authorId: "rafa",
    authorName: "Rafa M.",
    body: "Dica: revisem o art. 5º em voz alta. A banca adora pegadinha de literalidade.",
    createdAt: new Date(Date.now() - 3600_000 * 20).toISOString(),
    likeCount: 14,
    likedByMe: true,
    reportCount: 0,
  },
  {
    id: "p3",
    authorId: "luiza",
    authorName: "Luiza P.",
    body: "Simulado de hoje: 72%. Ainda não é o corte, mas a mentoria do Dino apontou meus temas fracos.",
    createdAt: new Date(Date.now() - 3600_000 * 40).toISOString(),
    likeCount: 6,
    likedByMe: false,
    reportCount: 0,
  },
];

const SEED_THREADS: DirectThread[] = [
  {
    id: "t1",
    peerId: "camila",
    peerName: "Camila R.",
    lastMessage: "Bora manter a ofensiva juntos?",
    lastAt: new Date(Date.now() - 1800_000).toISOString(),
    unread: 1,
  },
  {
    id: "t2",
    peerId: "rafa",
    peerName: "Rafa M.",
    lastMessage: "Te mandei o tema que caí ontem",
    lastAt: new Date(Date.now() - 86400_000).toISOString(),
    unread: 0,
  },
];

const SEED_MESSAGES: DirectMessage[] = [
  {
    id: "m1",
    threadId: "t1",
    senderId: "camila",
    body: "E aí, como foi o estudo de hoje?",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    isMine: false,
  },
  {
    id: "m2",
    threadId: "t1",
    senderId: "me",
    body: "Fechei a lição de constitucional. E você?",
    createdAt: new Date(Date.now() - 3000_000).toISOString(),
    isMine: true,
  },
  {
    id: "m3",
    threadId: "t1",
    senderId: "camila",
    body: "Bora manter a ofensiva juntos?",
    createdAt: new Date(Date.now() - 1800_000).toISOString(),
    isMine: false,
  },
  {
    id: "m4",
    threadId: "t2",
    senderId: "rafa",
    body: "Te mandei o tema que caí ontem",
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    isMine: false,
  },
];

const defaultState: CommunityState = {
  posts: SEED_POSTS,
  threads: SEED_THREADS,
  messages: SEED_MESSAGES,
};

type CommunityContextValue = {
  posts: CommunityPost[];
  threads: DirectThread[];
  isHydrated: boolean;
  createPost: (input: { authorName: string; body: string; imageUri?: string }) => { ok: true } | { ok: false; error: string };
  toggleLike: (postId: string) => void;
  reportPost: (postId: string) => void;
  getMessages: (threadId: string) => DirectMessage[];
  sendDirect: (threadId: string, body: string) => { ok: true } | { ok: false; error: string };
  markThreadRead: (threadId: string) => void;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommunityState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as CommunityState;
          setState({
            posts: parsed.posts?.length ? parsed.posts : defaultState.posts,
            threads: parsed.threads?.length ? parsed.threads : defaultState.threads,
            messages: parsed.messages?.length ? parsed.messages : defaultState.messages,
          });
        } catch {
          // keep seed
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, isHydrated]);

  const createPost = useCallback(
    (input: { authorName: string; body: string; imageUri?: string }) => {
      const body = sanitizePostText(input.body);
      if (!isAllowedPostText(body) && !input.imageUri) {
        return { ok: false as const, error: "Texto inválido ou fora das regras da comunidade." };
      }
      if (body && !isAllowedPostText(body)) {
        return { ok: false as const, error: "Esta mensagem não segue as regras da comunidade." };
      }
      const post: CommunityPost = {
        id: `local-${Date.now()}`,
        authorId: "me",
        authorName: input.authorName || "Você",
        body: body || (input.imageUri ? "📷 Registro de estudo" : ""),
        imageUri: input.imageUri,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        likedByMe: false,
        reportCount: 0,
      };
      setState((current) => ({ ...current, posts: [post, ...current.posts] }));
      return { ok: true as const };
    },
    [],
  );

  const toggleLike = useCallback((postId: string) => {
    setState((current) => ({
      ...current,
      posts: current.posts.map((post) => {
        if (post.id !== postId) return post;
        const likedByMe = !post.likedByMe;
        return {
          ...post,
          likedByMe,
          likeCount: Math.max(0, post.likeCount + (likedByMe ? 1 : -1)),
        };
      }),
    }));
  }, []);

  const reportPost = useCallback((postId: string) => {
    setState((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId ? { ...post, reportCount: post.reportCount + 1 } : post,
      ),
    }));
  }, []);

  const getMessages = useCallback(
    (threadId: string) =>
      state.messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.messages],
  );

  const sendDirect = useCallback((threadId: string, body: string) => {
    const clean = sanitizePostText(body);
    if (!isAllowedPostText(clean)) {
      return { ok: false as const, error: "Mensagem inválida ou fora das regras." };
    }
    const msg: DirectMessage = {
      id: `dm-${Date.now()}`,
      threadId,
      senderId: "me",
      body: clean,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setState((current) => ({
      ...current,
      messages: [...current.messages, msg],
      threads: current.threads.map((t) =>
        t.id === threadId ? { ...t, lastMessage: clean, lastAt: msg.createdAt, unread: 0 } : t,
      ),
    }));
    return { ok: true as const };
  }, []);

  const markThreadRead = useCallback((threadId: string) => {
    setState((current) => ({
      ...current,
      threads: current.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      posts: state.posts,
      threads: state.threads,
      isHydrated,
      createPost,
      toggleLike,
      reportPost,
      getMessages,
      sendDirect,
      markThreadRead,
    }),
    [
      state.posts,
      state.threads,
      isHydrated,
      createPost,
      toggleLike,
      reportPost,
      getMessages,
      sendDirect,
      markThreadRead,
    ],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}
