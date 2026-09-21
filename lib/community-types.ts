/** Tipos da comunidade Dino — feed + chat privado */

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  /** URI local ou URL remota da foto (opcional) */
  imageUri?: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  reportCount: number;
};

export type DirectThread = {
  id: string;
  peerId: string;
  peerName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export type DirectMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  isMine: boolean;
};
