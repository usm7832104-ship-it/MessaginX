# PulseChat Admin Control Center & Global System Upgrades

This implementation introduces a dedicated, persistent **Admin Management Suite** for PulseChat alongside critical UI ergonomics improvements, fixing the empty space below the chat input bar, upgrading multi-device responsiveness, and delivering 15+ persistent global glass color schemes.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences have been confirmed:
> - **Admin Account Credentials**: Username `admin`, password `admin783`. The account is provisioned directly into Firestore with `role: 'admin'`.
> - **Persistent Global Announcement**: Top ribbon with real-time text broadcast, severity badges (Info, Alert, Urgent), admin edit/clear controls, and individual member dismiss memory.
> - **15+ Curated Global Glass Themes**: 15 distinct colorways (Emerald, Cyber Cyan, Midnight, Sunset, Rose, Amethyst, Golden Hour, Nordic Frost, Matrix Green, Royal Indigo, Crimson Velvet, Tokyo Neon, Espresso Amber, Ocean Deep, Monochrome Slate). Any theme selected by the admin persists in Firestore under `/settings/global` and applies across all connected devices in real time.
> - **Member Moderation & Ban Enforcing**: Immediate lockout screen with reason and countdown timer for temporary bans, and indefinite block for permanent bans. Admin can add, ban, unban, and remove members.
> - **Group Management**: Admin can create, inspect, and delete any group conversation.
> - **Input Bar UI Fix**: Remove unwanted empty space below the message bar by upgrading layout constraints to modern `100dvh` flex columns, removing rogue margins, and tuning safe-area insets for mobile and desktop.

---

### 1. Overview & Core Concept

PulseChat now features an authenticated administrative layer allowing workspace owners to moderate members, oversee group channels, broadcast real-time announcements, and dynamically switch the workspace's visual aesthetic for all active users simultaneously.

- **Admin Account**: `admin` / `admin783`
- **Admin Capabilities**:
  1. **Member Management**: Add new cohort members, remove members, issue temporary bans (15m, 1h, 24h, 7d) with automatic countdown, or permanent bans.
  2. **Group Moderation**: View all groups, member counts, and delete inactive or violated groups.
  3. **Global Announcement Bar**: Broadcast notifications to all members displayed at the top of the app in real time.
  4. **15+ Persistent Global Themes**: Dynamically updates CSS variables and Tailwind color accents across every user's screen instantly via Firestore `onSnapshot`.
  5. **Audit Logs & Maintenance Mode**: Track administrative actions and toggle maintenance lockouts if required.

---

### 2. User Experience & Visual Design

#### Global Announcement Ribbon
- Positioned seamlessly at the very top of the interface.
- Glassmorphic ribbon with glowing accent border, message text, author badge ("Admin Announcement"), timestamp, and member dismiss trigger.
- Admin view includes quick "Edit Announcement" and "Clear" buttons.

#### 15+ Global Glass Themes
The admin can select from 15 curated colorways:
1. **Cyber Cyan (Default)**: Deep midnight slate with electric cyan `#06B6D4`
2. **Emerald Matrix**: Dark forest slate with vibrant emerald `#10B981`
3. **Sunset Flame**: Charcoal glass with warm amber `#F59E0B` and coral `#F43F5E`
4. **Royal Amethyst**: Deep violet obsidian with electric purple `#A855F7`
5. **Rose Quartz**: Frosted dusk with neon rose `#FB7185`
6. **Nordic Frost**: Arctic deep navy with ice blue `#38BDF8`
7. **Tokyo Neon**: High-contrast dark with electric magenta `#E11D48` & cyan
8. **Golden Hour**: Warm bronze slate with luminous gold `#EAB308`
9. **Crimson Velvet**: Midnight ruby with rich scarlet `#DC2626`
10. **Royal Indigo**: Starlight sapphire with deep indigo `#6366F1`
11. **Ocean Deep**: Deep teal abyss with turquoise `#14B8A6`
12. **Espresso Amber**: Warm roasted coffee tones with amber `#D97706`
13. **Nordic Aurora**: Deep spruce glass with lime neon `#84CC16`
14. **Monochrome Stealth**: Pure carbon black with silver accents `#94A3B8`
15. **Lavender Dream**: Soft muted grape with bright lilac `#C084FC`

#### Chat Input Bar Fix & Responsiveness
- Refactor chat canvas to `h-[100dvh]` with `flex flex-col min-h-0`.
- Eliminate bottom whitespace gap beneath input by anchoring the footer directly to the viewport baseline without trailing margins.
- Ensure fluid scrolling of message history right above the input bar with zero overlap.

---

### 3. Key Product Decisions & Trade-Offs

- **Theme Synchronization**:
  - *Chosen Approach*: Stored in `/settings/global` document in Firestore. All clients subscribe via `onSnapshot`.
  - *Why*: Instant, sub-second theme shifts across all connected users with zero page reloads.
- **Ban Enforcement**:
  - *Chosen Approach*: The client root checks `currentUser.banStatus`. If banned and the ban is active (temporary ban has not expired or permanent ban is flagged), the user is blocked by a full-screen glass modal showing the ban reason and remaining timer.
  - *Why*: Immediate, mathematically enforceable restriction preventing access to chats and statuses.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Global Settings & Theme                         │
│                    Firestore: /settings/global                         │
│   • activeThemeId: string (1 of 15 themes)                             │
│   • announcement: { active: bool, text: string, severity: string }     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Admin Console (/components/AdminPortal)              │
│                                                                        │
│   ├── Members Tab     (Add user, Ban temp/perm, Delete member)         │
│   ├── Groups Tab      (Inspect groups, Delete inactive channels)       │
│   ├── Announcement    (Compose top ribbon text, set severity)          │
│   ├── Themes (15+)    (Visual swatch gallery, 1-click global apply)    │
│   └── System Audit    (Audit log records of admin actions)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Client Viewport Adjustments                      │
│                                                                        │
│   • Top Ribbon: Persistent Announcement bar                            │
│   • Main Chat Canvas: 100dvh geometry, zero bottom empty space         │
│   • Banned User Gate: Lockout shield with real-time countdown          │
└────────────────────────────────────────────────────────────────────────┘
```

#### New / Updated Firestore Schemas

1. **Global Settings (`/settings/global`)**:
   ```typescript
   interface GlobalSettings {
     themeId: string;
     announcement?: {
       text: string;
       severity: 'info' | 'warning' | 'alert';
       createdAt: string;
       author: string;
       active: boolean;
     };
     maintenanceMode?: boolean;
   }
   ```

2. **User Profile Ban Extension (`/users/{userId}`)**:
   ```typescript
   interface UserBanInfo {
     isBanned: boolean;
     banType: 'temporary' | 'permanent';
     banReason: string;
     bannedAt: string;
     banExpiresAt?: string; // ISO timestamp for temporary ban
   }
   ```

---

### Step-by-Step Execution Plan

1. **Seed & Configure Admin Account**:
   - Seed `admin` user with password `admin783` (hashed via Web Crypto SHA-256) and `role: 'admin'`.
2. **Global Settings & Theme Engine**:
   - Create 15 curated theme color palettes with CSS variable mappings.
   - Implement `useGlobalSettings` hook with real-time Firestore synchronization.
3. **Admin Portal Component**:
   - Modal drawer with tabs for Members (ban/delete/add), Groups (delete/inspect), Announcements (edit/publish), Themes (15 swatches), and Audit logs.
4. **Top Announcement Ribbon**:
   - Render dismissible, animated glass banner at the top of the interface.
5. **UI & Viewport Layout Overhaul**:
   - Fix empty space below message input in `ChatArea.tsx`.
   - Upgrade responsive layout for mobile, tablet, and desktop.
6. **Verification & Linting**:
   - Verify with `lint_applet` and `compile_applet`.
