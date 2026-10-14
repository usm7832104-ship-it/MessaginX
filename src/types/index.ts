export interface UserBanInfo {
  isBanned: boolean;
  banType: 'temporary' | 'permanent';
  banReason: string;
  bannedAt: string;
  banExpiresAt?: string; // ISO string for temporary bans
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  bio: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  createdAt: string;
  passwordHash?: string;
  role?: 'admin' | 'member';
  banInfo?: UserBanInfo;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
  groupIcon?: string;
  createdBy: string;
  updatedAt: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string;
  };
  unreadCounts?: Record<string, number>;
}

export type MessageType = 'text' | 'image' | 'voice' | 'file';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  voiceDuration?: number;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  readBy: string[]; // array of userIds
  createdAt: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  type: 'text' | 'image';
  content: string; // text string or image dataUrl
  caption?: string;
  backgroundColor?: string;
  viewers: string[]; // array of userIds
  createdAt: string;
  expiresAt: string; // ISO string 24h later
}

export interface ReactionItem {
  emoji: string;
  count: number;
  users: string[];
}

export interface GlobalAnnouncement {
  id: string;
  text: string;
  severity: 'info' | 'warning' | 'alert';
  active: boolean;
  createdAt: string;
  author: string;
}

export interface GlobalSettings {
  themeId: string;
  announcement?: GlobalAnnouncement;
  maintenanceMode?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  adminName: string;
  target?: string;
  details: string;
  timestamp: string;
}
