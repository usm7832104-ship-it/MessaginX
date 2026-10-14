import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Sparkles,
  Check,
  CheckCheck,
  CircleDot,
  Image as ImageIcon,
  Mic,
  FileText,
  UserCheck,
  Shield
} from 'lucide-react';
import { Chat, UserProfile } from '../types';
import { formatTime } from '../utils/mediaUtils';
import { MAX_MEMBERS_CAP, getOrCreateDirectChat } from '../services/chatService';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChatModal: () => void;
  onOpenProfileDrawer: () => void;
  activeSidebarTab: 'chats' | 'directory';
  setActiveSidebarTab: (tab: 'chats' | 'directory') => void;
  onOpenAdminPortal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChatModal,
  onOpenProfileDrawer,
  activeSidebarTab,
  setActiveSidebarTab,
  onOpenAdminPortal
}) => {
  const { currentUser, allMembers, registeredCount, switchDemoUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'groups'>('all');
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  // Helper to find peer profile in direct chats
  const getPeerProfile = (chat: Chat): UserProfile | undefined => {
    if (chat.type !== 'direct' || !currentUser) return undefined;
    const peerId = chat.participantIds.find(id => id !== currentUser.uid);
    return allMembers.find(m => m.uid === peerId);
  };

  // Filter chats by search and category
  const filteredChats = chats.filter((chat) => {
    let name = chat.name || '';
    if (chat.type === 'direct') {
      const peer = getPeerProfile(chat);
      name = peer?.displayName || 'Direct Chat';
    }

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.text || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'groups') return chat.type === 'group';
    if (filterType === 'unread') {
      const unread = (chat.unreadCounts?.[currentUser?.uid || ''] || 0) > 0;
      return unread;
    }

    return true;
  });

  const handleStartDirectFromDirectory = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    try {
      const chatId = await getOrCreateDirectChat(currentUser.uid, targetUser.uid);
      onSelectChat(chatId);
      setActiveSidebarTab('chats');
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';

  return (
    <aside className="w-full flex-1 min-h-0 flex flex-col bg-slate-900/80 backdrop-blur-2xl select-none">
      {/* Top Header */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/40">
        {/* User Avatar + Profile Drawer trigger */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onOpenProfileDrawer}
            className="relative cursor-pointer group"
            title="Open profile customization"
          >
            <img
              src={currentUser?.photoURL}
              alt={currentUser?.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/10 group-hover:border-cyan-400 transition-colors shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate flex items-center gap-1.5 leading-tight">
              PulseChat
              {isAdmin && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ADMIN
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span className="text-cyan-400 font-medium">{registeredCount}/{MAX_MEMBERS_CAP}</span>
              <span>members</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Admin Portal Button */}
          {isAdmin && onOpenAdminPortal && (
            <button
              onClick={onOpenAdminPortal}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all"
              title="Admin Portal"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Quick Demo Switcher toggle */}
          <div className="relative">
            <button
              onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Switch active testing identity"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </button>

            {showAccountSwitcher && (
              <div className="absolute right-0 top-11 w-56 p-2 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-40 space-y-1">
                <p className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                  Switch Active Identity
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allMembers.map((member) => (
                    <button
                      key={member.uid}
                      onClick={() => {
                        switchDemoUser(member);
                        setShowAccountSwitcher(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left text-xs transition-colors ${
                        member.uid === currentUser?.uid
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="truncate flex-1">{member.displayName}</span>
                      {member.uid === currentUser?.uid && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChatModal}
            className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 hover:bg-cyan-400 active:scale-95 transition-all"
            title="Start new chat or group"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Primary Tab Bar: Chats vs 15-Member Directory */}
      <div className="flex border-b border-white/5 bg-slate-950/20 px-3 pt-2">
        <button
          onClick={() => setActiveSidebarTab('chats')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeSidebarTab === 'chats'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversations</span>
          {chats.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {chats.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSidebarTab('directory')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeSidebarTab === 'directory'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cohort ({allMembers.length}/{MAX_MEMBERS_CAP})</span>
        </button>
      </div>

      {/* VIEW 1: CONVERSATIONS LIST */}
      {activeSidebarTab === 'chats' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Bar */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterType === 'unread'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilterType('groups')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterType === 'groups'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Groups
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] px-2 pb-3">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-500">
                <MessageSquare className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">No conversations found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click the (+) button above to start a direct chat or create a group!
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isGroup = chat.type === 'group';
                const peer = getPeerProfile(chat);
                const chatName = isGroup ? chat.name || 'Group' : peer?.displayName || 'Direct Chat';
                const chatPhoto = isGroup
                  ? chat.groupIcon || `https://api.dicebear.com/7.x/identicon/svg?seed=${chatName}`
                  : peer?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${chat.id}`;
                const isActive = activeChatId === chat.id;
                const isOnline = !isGroup && peer?.status === 'online';
                const unreadCount = chat.unreadCounts?.[currentUser?.uid || ''] || 0;

                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all my-1 ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/30 shadow-sm'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Chat Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={chatPhoto}
                        alt={chatName}
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-sm"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Chat Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h2 className="text-xs font-semibold text-white truncate">{chatName}</h2>
                        {chat.lastMessage?.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0 ml-1">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 flex-1 pr-2">
                          {/* If current user was last sender, show checkmarks */}
                          {chat.lastMessage?.senderId === currentUser?.uid && (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 inline" />
                          )}
                          <span>{chat.lastMessage?.text || 'No messages yet'}</span>
                        </p>

                        {unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: 15-MEMBER DIRECTORY */}
      {activeSidebarTab === 'directory' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span>Cohort Roster</span>
              <span className="text-cyan-400 font-mono">{allMembers.length} / {MAX_MEMBERS_CAP} joined</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The exclusive workspace is strictly capped at {MAX_MEMBERS_CAP} registered members.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            {allMembers.map((member) => {
              const isMe = member.uid === currentUser?.uid;
              return (
                <div
                  key={member.uid}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                          member.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        {member.displayName}
                        {isMe && <span className="text-[10px] text-cyan-400 font-mono">(You)</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                        {member.bio || `@${member.username}`}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => handleStartDirectFromDirectory(member)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[11px] font-semibold border border-cyan-500/30 transition-all shrink-0"
                    >
                      Chat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
