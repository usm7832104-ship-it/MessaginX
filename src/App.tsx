import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { StatusStories } from './components/StatusStories';
import { AuthModal } from './components/AuthModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { NewChatModal } from './components/NewChatModal';
import { MediaLightbox } from './components/MediaLightbox';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AdminPortal } from './components/AdminPortal';
import { BannedScreen } from './components/BannedScreen';
import { Chat, ChatMessage, StatusStory, GlobalSettings } from './types';
import {
  subscribeToUserChats,
  subscribeToMessages,
  subscribeToStatuses,
  subscribeToGlobalSettings
} from './services/chatService';
import { applyThemeToDocument, getThemeById } from './utils/themeManager';

function MainChatApp() {
  const { currentUser, isLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statuses, setStatuses] = useState<StatusStory[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chats' | 'directory'>('chats');
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);

  // Real-time subscription to global settings (theme & persistent announcement)
  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((settings) => {
      setGlobalSettings(settings);
      if (settings.themeId) {
        const theme = getThemeById(settings.themeId);
        applyThemeToDocument(theme);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time subscription to user's conversations
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }

    const unsubscribe = subscribeToUserChats(currentUser.uid, (updatedChats) => {
      setChats(updatedChats);
      // Auto-select first chat if none selected on desktop
      if (!activeChatId && updatedChats.length > 0 && window.innerWidth >= 768) {
        setActiveChatId(updatedChats[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Real-time subscription to 24-hour status stories
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToStatuses((updatedStatuses) => {
      setStatuses(updatedStatuses);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Real-time subscription to active chat messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  if (isLoading) {
    return (
      <div className="w-full h-full h-dvh flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 animate-pulse mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-lg">P</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono">Initializing PulseChat network...</p>
      </div>
    );
  }

  // Not logged in: Show Auth & 15-Member Quota Modal
  if (!currentUser) {
    return <AuthModal isOpen={true} />;
  }

  // If user is banned by admin, show lockout screen with countdown and reason
  if (currentUser.banInfo?.isBanned) {
    return <BannedScreen banInfo={currentUser.banInfo} userId={currentUser.uid} />;
  }

  const isAdmin = currentUser.role === 'admin' || currentUser.username === 'admin';
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <div className="w-full h-full h-dvh max-h-dvh overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* GLOBAL TOP ANNOUNCEMENT BANNER */}
      <AnnouncementBanner
        announcement={globalSettings?.announcement}
        isAdmin={isAdmin}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
      />

      {/* MAIN CHAT WORKSPACE (fills remaining viewport height cleanly) */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden">
        {/* LEFT SIDEBAR (always visible on desktop, conditionally on mobile) */}
        <div
          className={`${
            activeChatId ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 h-full min-h-0 flex-col shrink-0`}
        >
          {/* Status Stories Carousel */}
          <StatusStories
            statuses={statuses}
            onOpenChatWithUser={(chatId) => {
              setActiveChatId(chatId);
              setActiveSidebarTab('chats');
            }}
          />

          {/* Sidebar Navigation & Chat List */}
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(chatId) => setActiveChatId(chatId)}
            onOpenNewChatModal={() => setIsNewChatOpen(true)}
            onOpenProfileDrawer={() => setIsProfileOpen(true)}
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
          />
        </div>

        {/* RIGHT CHAT AREA (visible when chat active or on desktop) */}
        <div
          className={`${
            !activeChatId ? 'hidden md:flex' : 'flex'
          } flex-1 h-full min-h-0 flex-col min-w-0`}
        >
          <ChatArea
            chat={activeChat}
            messages={messages}
            onBackToSidebar={() => setActiveChatId(null)}
            onOpenLightbox={(src) => setLightboxSrc(src)}
          />
        </div>
      </div>

      {/* MODALS & DRAWERS */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectChat={(chatId) => setActiveChatId(chatId)}
      />

      <MediaLightbox
        isOpen={Boolean(lightboxSrc)}
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />

      {/* ADMIN PORTAL MODAL */}
      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        currentSettings={globalSettings || undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainChatApp />
    </AuthProvider>
  );
}
