# PulseChat — Real-Time Glassmorphic Messaging Platform

PulseChat is a next-generation real-time messaging application designed with a custom Material UI glassmorphic aesthetic, fluid micro-interactions, and a strict 15-member first-come registration cap. It provides authentic modern messaging capabilities including 1-on-1 direct messaging, group conversations, live read receipts (sent/delivered/read), emoji reactions, voice audio notes, file & photo sharing, 24-hour expiring status stories, and complete profile customization powered by Firebase Firestore and Authentication.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and design parameters have been confirmed:
> - **15-Member Cap**: First-come registration capping the workspace at exactly 15 user accounts. Once 15 users register, the system disables new signups and displays a membership cap indicator.
> - **Custom Material UI + Glassmorphism**: Tailored Material Design with layered frosted glass (`backdrop-blur-xl`), refined dark/light glass tokens, zero-pill typography, and fluid spring animations via `motion/react`.
> - **Authentication Hierarchy**: Google Sign-in as the primary login method, alongside a secondary username and password credential flow.
> - **Data Persistence & Live Sync**: Firebase Firestore for real-time live synchronization (`onSnapshot` for instant updates across tabs/devices) paired with Firebase Auth.

---

### 1. Overview & Core Concept

- **What It Does**: PulseChat delivers a complete high-fidelity communication hub. Members can exchange instant text messages, photos, voice notes, and documents in direct messages and groups; express themselves via 24-hour status stories; react to messages with animated emojis; monitor delivery and read receipts; and personalize their avatar, bio, and presence.
- **Target Audience**: Exclusive teams, private cohorts, and friend groups of up to 15 members needing a secure, ultra-responsive real-time communication space.
- **Key Value**: Real-time bidirectional synchronization with zero page reloads, distinctive glassmorphism visual design, and privacy-preserving member quota management.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Aesthetic Direction**: Neo-Material Glassmorphic. Soft frosted glass cards (`bg-slate-900/60 backdrop-blur-xl border border-white/10` in dark mode; `bg-white/70 backdrop-blur-xl border border-slate-200/60` in light mode), glowing active halos, and elevation depth.
- **Color Palette**:
  - Dominant Canvas: Deep Midnight Slate (`#0B0F19`) / Crisp Light Porcelain (`#F8FAFC`).
  - Structural Glass: Translucent charcoal (`rgba(17, 24, 39, 0.75)`) and pearl white (`rgba(255, 255, 255, 0.8)`).
  - Accent Energy: Electric Teal / Cyan (`#06B6D4` / `#0D9488`) for primary actions, active tabs, and read receipt double checks.
  - Text Hierarchy: Slate 50 for primary headlines, Slate 400 for unboxed metadata and timestamps.
- **Typography**: Display headlines set in `Plus Jakarta Sans`, body prose in `DM Sans`, and tabular time stamps in tabular figures (`tabular-nums`).

#### Key User Flows & Views
1. **Authentication & Member Gate**:
   - Welcome glass card showing current registered count (e.g. `4 / 15 members registered`).
   - Primary Google Sign-In with 1-click popup flow.
   - Secondary toggle for Username & Password (with validation and cap check).
   - Quick testing switcher for multi-account simulation in development.
2. **Main Workspace Layout (Split-Panel Desktop / Stacked Mobile)**:
   - **Left Glass Sidebar (360px–420px)**:
     - Top Bar: User avatar with quick profile drawer trigger, Status stories ring, New Chat/Group button, Dark/Light mode toggle, and member counter badge.
     - Search & Filter Strip: Instant search for conversations, unread messages, and group filters.
     - Chat List: Active conversations with last message snippet, timestamp, unread badge counter, and delivery status indicators.
     - Tab Selector: Clean segmented buttons for **Chats**, **Status Stories**, and **Members Directory (15 Max)**.
   - **Right Conversation Canvas**:
     - Chat Header: Active peer/group info, participant avatars, online status ("Active now" or "Typing..."), search within chat, and details drawer toggle.
     - Virtual Message Stream: Grouped by date, with distinct glass bubble styling (outgoing electric teal/cyan tint, incoming frosted neutral), emoji reaction chips, media thumbnails with lightbox triggers, voice audio players, and double-check read receipts.
     - Rich Input Bar: Attachment menu (photo, file, document), voice recording button with live waveform animation and cancel/send controls, emoji reaction picker, multiline text box, and send button.
3. **Status Stories Hub**:
   - Carousel of active 24h stories with colorful animated avatar gradient rings.
   - Story Creator modal: Text status with customizable gradient backgrounds and typography, or photo status with caption.
   - Story Viewer: Fullscreen progressive progress bars (5 seconds per slide), viewer list sheet, and direct reply to chat.
4. **Profile & Customization Drawer**:
   - Interactive avatar upload (with live client-side image compression and preset avatar generator).
   - Display name, custom username handle, bio / "About" text, and presence controls.

---

### 3. Key Product Decisions & Trade-Offs

- **Real-Time Synchronicity**:
  - *Chosen Approach*: Firestore collection queries with `onSnapshot` listeners.
  - *Why*: Instant sub-second delivery of incoming messages, reaction increments, and typing indicators without polling.
  - *Fallback / Graceful Boot*: Comprehensive error boundary and reactive local cache so the app functions immediately while Firebase provisioning terms are confirmed.
- **15-Member Enforcement**:
  - *Chosen Approach*: Atomic Firestore check and client-side gate on the `users` collection.
  - *Why*: Guarantees the room never exceeds 15 registered participants, preventing spam and maintaining an exclusive private cohort.
- **Media & Voice Note Handling**:
  - *Chosen Approach*: High-performance base64 data URLs compressed to web-optimized dimensions (<300KB) for photos, and Web Audio API MediaRecorder with compressed audio blobs for voice notes.
  - *Why*: Guarantees instant previews, zero external CDN dependency failures, and smooth inline audio playback with waveform visualizations.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PulseChat Web Client                          │
│                                                                        │
│   ┌───────────────────┐    ┌────────────────────┐   ┌──────────────┐   │
│   │   Auth & Gate     │    │   Sidebar Panel    │   │ Chat Canvas  │   │
│   │ (Google / Creds / │    │ (Chats/Status/15-  │   │ (Stream/     │   │
│   │ 15-Member Quota)  │    │  Member Directory) │   │  Input/Media)│   │
│   └─────────┬─────────┘    └─────────┬──────────┘   └──────┬───────┘   │
└─────────────┼────────────────────────┼─────────────────────┼───────────┘
              │                        │                     │
              ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   State Management & Firebase Service                  │
│                                                                        │
│   • Auth State (Google / Password / User Profile)                      │
│   • Live Chat Subscriptions (onSnapshot for Messages & Read Receipts)  │
│   • Status Stories Hub (24h Expiring Posts & Views)                    │
│   • Audio Recorder & Media Previews                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Firebase Firestore                            │
│                                                                        │
│   ├── /users/{userId}           (Profile, bio, avatar, createdAt)      │
│   ├── /chats/{chatId}           (Participants [max 15], lastMessage)  │
│   │     └── /messages/{msgId}   (Sender, text, media, reactions, read) │
│   └── /statuses/{statusId}      (Author, media/text, viewers, expires) │
└────────────────────────────────────────────────────────────────────────┘
```

#### Firestore Data Models

1. **User Entity (`/users/{userId}`)**:
   ```typescript
   interface UserProfile {
     uid: string;
     email: string;
     displayName: string;
     username: string;
     photoURL: string;
     bio: string;
     status: 'online' | 'offline';
     lastSeen: string;
     createdAt: string;
   }
   ```
2. **Chat Conversation Entity (`/chats/{chatId}`)**:
   ```typescript
   interface ChatConversation {
     id: string;
     type: 'direct' | 'group';
     participantIds: string[]; // max 15
     name?: string;
     groupIcon?: string;
     lastMessage?: {
       text: string;
       senderId: string;
       timestamp: string;
     };
     unreadCounts: Record<string, number>;
     updatedAt: string;
   }
   ```
3. **Message Entity (`/chats/{chatId}/messages/{messageId}`)**:
   ```typescript
   interface ChatMessage {
     id: string;
     chatId: string;
     senderId: string;
     senderName: string;
     senderPhoto?: string;
     content: string;
     type: 'text' | 'image' | 'voice' | 'file';
     mediaUrl?: string;
     fileName?: string;
     fileSize?: string;
     voiceDuration?: number;
     reactions: Record<string, string[]>; // emoji -> array of userIds
     readBy: string[]; // userIds who have opened/read
     createdAt: string;
   }
   ```
4. **Status Story Entity (`/statuses/{statusId}`)**:
   ```typescript
   interface StatusStory {
     id: string;
     userId: string;
     userName: string;
     userPhoto?: string;
     type: 'text' | 'image';
     content: string; // text or image dataUrl
     backgroundColor?: string;
     caption?: string;
     viewers: string[]; // userIds who viewed
     createdAt: string;
     expiresAt: string; // 24 hours after creation
   }
   ```

---

### Step-by-Step Execution Plan

1. **Firebase Provisioning & Rules**:
   - Call `show_aistudio_ui` with `ui_type: "firebase_setup"` to present terms.
   - Verify acceptance via `GetFirebaseTos` and call `ProvisionFirebase`.
   - Setup `firebase-blueprint.json` and deploy hardened `firestore.rules`.
2. **Audio & Media Utilities**:
   - Implement audio voice note recording utility (`useVoiceRecorder`) using Web Audio API MediaRecorder.
   - Image resizing/compression pipeline to ensure ultra-smooth base64 storage.
3. **Core Application Components**:
   - Glassmorphic theme styles, icons, and Material-inspired controls.
   - Authentication modal & 15-member quota counter.
   - Split-view sidebar: Direct chats, group creation, search, 15-member directory.
   - Chat canvas: Bubble stream, emoji reactions, voice note player, typing indicator, read receipts.
   - Status stories: 24h stories tray, fullscreen story viewer, story composer.
   - Profile drawer: Avatar upload, bio editing, name updates.
4. **Verification & Build**:
   - Compile applet with `compile_applet` and verify zero errors.
