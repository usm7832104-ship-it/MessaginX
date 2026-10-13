import {
  db,
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType,
  serverTimestamp
} from './firebase';
import { UserProfile, Chat, ChatMessage, StatusStory } from '../types';

export const MAX_MEMBERS_CAP = 15;

// Sample initial cohort members to jumpstart the experience if room is new
const DEFAULT_PRESET_MEMBERS: Omit<UserProfile, 'createdAt' | 'lastSeen'>[] = [
  {
    uid: 'member-sarah-chen',
    displayName: 'Sarah Chen',
    username: 'sarah_c',
    email: 'sarah.chen@pulse.chat',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    bio: 'Product Designer ✦ Exploring tactile glass UI and spatial audio.',
    status: 'online'
  },
  {
    uid: 'member-alex-rivera',
    displayName: 'Alex Rivera',
    username: 'alex_r',
    email: 'alex.rivera@pulse.chat',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    bio: 'Systems architect. Real-time protocols & reactive state engines.',
    status: 'online'
  },
  {
    uid: 'member-elena-rostova',
    displayName: 'Elena Rostova',
    username: 'elena_r',
    email: 'elena.rostova@pulse.chat',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    bio: 'Creative Director. Coffee, typography, and midnight prototypes.',
    status: 'away'
  },
  {
    uid: 'member-liam-vance',
    displayName: 'Liam Vance',
    username: 'liam_v',
    email: 'liam.vance@pulse.chat',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    bio: 'Frontend craftsman. Motion, glassmorphism, and micro-delights.',
    status: 'offline'
  }
];

/**
 * Seed initial sample members and welcome community chat if database is empty
 */
export async function seedInitialCommunityIfEmpty() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      const now = new Date().toISOString();
      for (const m of DEFAULT_PRESET_MEMBERS) {
        await setDoc(doc(db, 'users', m.uid), {
          ...m,
          createdAt: now,
          lastSeen: now
        });
      }

      // Create a global Community Group Chat
      const communityChatRef = doc(collection(db, 'chats'));
      const participantIds = DEFAULT_PRESET_MEMBERS.map(m => m.uid);
      await setDoc(communityChatRef, {
        id: communityChatRef.id,
        type: 'group',
        name: 'Pulse Core 15',
        groupIcon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
        participantIds,
        createdBy: 'member-sarah-chen',
        updatedAt: now,
        lastMessage: {
          text: 'Welcome to the exclusive 15-member workspace! Real-time messaging is live.',
          senderId: 'member-sarah-chen',
          senderName: 'Sarah Chen',
          timestamp: now
        }
      });

      // Add starter message
      const msgRef = doc(collection(db, `chats/${communityChatRef.id}/messages`));
      await setDoc(msgRef, {
        id: msgRef.id,
        chatId: communityChatRef.id,
        senderId: 'member-sarah-chen',
        senderName: 'Sarah Chen',
        senderPhoto: DEFAULT_PRESET_MEMBERS[0].photoURL,
        content: 'Welcome to the exclusive 15-member workspace! Feel free to share voice notes, reactions, and 24h status stories ✨',
        type: 'text',
        reactions: { '🎉': ['member-alex-rivera', 'member-elena-rostova'] },
        readBy: participantIds,
        createdAt: now
      });
    }
  } catch (err) {
    console.warn('Seeding check note:', err);
  }
}

/**
 * Get all current registered users
 */
export async function getRegisteredUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
    return [];
  }
}

/**
 * Subscribe to all registered users (for 15-member directory & presence updates)
 */
export function subscribeToUsers(callback: (users: UserProfile[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const users = snap.docs.map(d => d.data() as UserProfile);
      callback(users);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  );
}

/**
 * Ensure user profile exists or create if cap is not exceeded
 */
export async function registerOrUpdateUserProfile(
  userProfile: Partial<UserProfile> & { uid: string; email?: string }
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', userProfile.uid);
    const existingSnap = await getDoc(userDocRef);

    const now = new Date().toISOString();

    if (existingSnap.exists()) {
      // Existing user: update presence & fields
      const existingData = existingSnap.data() as UserProfile;
      const updated: UserProfile = {
        ...existingData,
        ...userProfile,
        displayName: userProfile.displayName || existingData.displayName || 'Member',
        username: userProfile.username || existingData.username || `user_${userProfile.uid.slice(0, 5)}`,
        status: 'online',
        lastSeen: now
      };
      await setDoc(userDocRef, updated, { merge: true });
      return { success: true, user: updated };
    }

    // New user registration: check member capacity
    const allUsers = await getRegisteredUsers();
    if (allUsers.length >= MAX_MEMBERS_CAP) {
      return {
        success: false,
        error: `Workspace registration is locked: Maximum capacity of ${MAX_MEMBERS_CAP} members reached.`
      };
    }

    const newUser: UserProfile = {
      uid: userProfile.uid,
      email: userProfile.email || `${userProfile.username || 'user'}@pulse.chat`,
      displayName: userProfile.displayName || 'Pulse Member',
      username: userProfile.username || `member_${allUsers.length + 1}`,
      photoURL: userProfile.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${userProfile.uid}`,
      bio: userProfile.bio || 'Available on PulseChat.',
      status: 'online',
      lastSeen: now,
      createdAt: now
    };

    await setDoc(userDocRef, newUser);

    // Also automatically add user to the Core 15 community group if it exists
    try {
      const chatsSnap = await getDocs(query(collection(db, 'chats'), where('type', '==', 'group')));
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data() as Chat;
        if (!chatData.participantIds.includes(newUser.uid)) {
          await updateDoc(chatDoc.ref, {
            participantIds: [...chatData.participantIds, newUser.uid]
          });
        }
      }
    } catch {
      // Ignore non-critical auto-add failures
    }

    return { success: true, user: newUser };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}`);
    return { success: false, error: 'Failed to save profile.' };
  }
}

/**
 * Set user online/offline status
 */
export async function setUserStatus(userId: string, status: 'online' | 'offline' | 'away') {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      status,
      lastSeen: new Date().toISOString()
    });
  } catch {
    // Ignore presence errors on disconnect
  }
}

/**
 * Subscribe to all chats the user is a participant in
 */
export function subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void) {
  const chatsQuery = query(
    collection(db, 'chats'),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(
    chatsQuery,
    (snap) => {
      const chats = snap.docs.map(d => ({ ...d.data(), id: d.id } as Chat));
      // Sort in-memory by updatedAt descending
      chats.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      callback(chats);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    }
  );
}

/**
 * Find or create a direct 1-on-1 chat
 */
export async function getOrCreateDirectChat(currentUserId: string, targetUserId: string): Promise<string> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'chats'),
        where('type', '==', 'direct'),
        where('participantIds', 'array-contains', currentUserId)
      )
    );

    const existingChat = snap.docs.find(d => {
      const data = d.data() as Chat;
      return data.participantIds.includes(targetUserId);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create new direct chat
    const now = new Date().toISOString();
    const newChatRef = doc(collection(db, 'chats'));
    const newChat: Chat = {
      id: newChatRef.id,
      type: 'direct',
      participantIds: [currentUserId, targetUserId],
      createdBy: currentUserId,
      updatedAt: now
    };

    await setDoc(newChatRef, newChat);
    return newChatRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'chats');
    throw err;
  }
}

/**
 * Create a new group chat
 */
export async function createGroupChat(
  creatorId: string,
  name: string,
  participantIds: string[],
  groupIcon?: string
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const allParticipants = Array.from(new Set([creatorId, ...participantIds]));
    const chatRef = doc(collection(db, 'chats'));

    const newChat: Chat = {
      id: chatRef.id,
      type: 'group',
      name,
      groupIcon: groupIcon || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      participantIds: allParticipants,
      createdBy: creatorId,
      updatedAt: now,
      lastMessage: {
        text: `Group "${name}" created`,
        senderId: creatorId,
        senderName: 'System',
        timestamp: now
      }
    };

    await setDoc(chatRef, newChat);

    // Initial system message
    const msgRef = doc(collection(db, `chats/${chatRef.id}/messages`));
    await setDoc(msgRef, {
      id: msgRef.id,
      chatId: chatRef.id,
      senderId: creatorId,
      senderName: 'System',
      content: `Group "${name}" created with ${allParticipants.length} members.`,
      type: 'text',
      reactions: {},
      readBy: [creatorId],
      createdAt: now
    });

    return chatRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'chats');
    throw err;
  }
}

/**
 * Subscribe to messages in a chat
 */
export function subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  const messagesQuery = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    messagesQuery,
    (snap) => {
      const messages = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
      callback(messages);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `chats/${chatId}/messages`);
    }
  );
}

/**
 * Send a new chat message
 */
export async function sendMessage(
  chatId: string,
  sender: UserProfile,
  message: {
    content: string;
    type: 'text' | 'image' | 'voice' | 'file';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: string;
    voiceDuration?: number;
  }
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const msgRef = doc(collection(db, `chats/${chatId}/messages`));

    const chatMsg: ChatMessage = {
      id: msgRef.id,
      chatId,
      senderId: sender.uid,
      senderName: sender.displayName,
      senderPhoto: sender.photoURL,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      voiceDuration: message.voiceDuration,
      reactions: {},
      readBy: [sender.uid],
      createdAt: now
    };

    await setDoc(msgRef, chatMsg);

    // Update parent chat's last message snippet
    let previewText = message.content;
    if (message.type === 'image') previewText = '📷 Photo';
    if (message.type === 'voice') previewText = '🎤 Voice note';
    if (message.type === 'file') previewText = `📎 ${message.fileName || 'File'}`;

    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: now,
      lastMessage: {
        text: previewText,
        senderId: sender.uid,
        senderName: sender.displayName,
        timestamp: now
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `chats/${chatId}/messages`);
    throw err;
  }
}

/**
 * Mark messages in a chat as read by current user
 */
export async function markMessagesAsRead(chatId: string, userId: string, messages: ChatMessage[]) {
  try {
    const unread = messages.filter(m => m.senderId !== userId && !m.readBy?.includes(userId));
    for (const msg of unread) {
      const msgRef = doc(db, `chats/${chatId}/messages`, msg.id);
      await updateDoc(msgRef, {
        readBy: [...(msg.readBy || []), userId]
      });
    }
  } catch {
    // Non-critical read receipts
  }
}

/**
 * Toggle emoji reaction on a message
 */
export async function toggleMessageReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string
) {
  try {
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const msg = snap.data() as ChatMessage;
    const reactions = { ...(msg.reactions || {}) };
    const currentUsers = reactions[emoji] || [];

    if (currentUsers.includes(userId)) {
      // Remove reaction
      const filtered = currentUsers.filter(id => id !== userId);
      if (filtered.length > 0) {
        reactions[emoji] = filtered;
      } else {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...currentUsers, userId];
    }

    await updateDoc(msgRef, { reactions });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

/**
 * Subscribe to 24-hour Status Stories
 */
export function subscribeToStatuses(callback: (statuses: StatusStory[]) => void) {
  const now = new Date().toISOString();
  return onSnapshot(
    collection(db, 'statuses'),
    (snap) => {
      const items = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as StatusStory))
        .filter(s => !s.expiresAt || new Date(s.expiresAt).getTime() > new Date(now).getTime());
      
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'statuses');
    }
  );
}

/**
 * Post a 24-hour status story
 */
export async function postStatusStory(
  user: UserProfile,
  story: {
    type: 'text' | 'image';
    content: string;
    caption?: string;
    backgroundColor?: string;
  }
): Promise<void> {
  try {
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    const statusRef = doc(collection(db, 'statuses'));

    const newStory: StatusStory = {
      id: statusRef.id,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      type: story.type,
      content: story.content,
      caption: story.caption,
      backgroundColor: story.backgroundColor || '#0F172A',
      viewers: [user.uid],
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };

    await setDoc(statusRef, newStory);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'statuses');
    throw err;
  }
}

/**
 * Record a status view
 */
export async function recordStatusView(statusId: string, userId: string) {
  try {
    const statusRef = doc(db, 'statuses', statusId);
    const snap = await getDoc(statusRef);
    if (!snap.exists()) return;

    const story = snap.data() as StatusStory;
    if (!story.viewers?.includes(userId)) {
      await updateDoc(statusRef, {
        viewers: [...(story.viewers || []), userId]
      });
    }
  } catch {
    // Non-critical
  }
}

/**
 * Delete a status story
 */
export async function deleteStatusStory(statusId: string) {
  try {
    await deleteDoc(doc(db, 'statuses', statusId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `statuses/${statusId}`);
    throw err;
  }
}
