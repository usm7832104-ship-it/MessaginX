import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  X,
  Users,
  MessageSquare,
  Palette,
  Megaphone,
  History,
  UserPlus,
  Trash2,
  Ban,
  Check,
  AlertTriangle,
  KeyRound,
  RotateCcw,
  Sparkles,
  Send,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, Chat, GlobalSettings, AuditLogEntry } from '../types';
import { GLOBAL_THEMES, ThemeDefinition, getThemeById } from '../utils/themeManager';
import {
  getRegisteredUsers,
  getAllGroups,
  banMember,
  unbanMember,
  deleteMember,
  adminAddMember,
  deleteGroup,
  clearChatMessages,
  adminResetPassword,
  updateGlobalTheme,
  publishAnnouncement,
  clearAnnouncement,
  subscribeToAuditLogs,
  MAX_MEMBERS_CAP
} from '../services/chatService';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings?: GlobalSettings;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  currentSettings
}) => {
  const { currentUser, allMembers } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'groups' | 'announcement' | 'themes' | 'audit'>('members');

  // Members state
  const [membersList, setMembersList] = useState<UserProfile[]>(allMembers);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newBio, setNewBio] = useState('');
  const [banModalUser, setBanModalUser] = useState<UserProfile | null>(null);
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [banDurationMinutes, setBanDurationMinutes] = useState(60);
  const [banReason, setBanReason] = useState('Violation of workspace standards');
  const [resetPwUser, setResetPwUser] = useState<UserProfile | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('newpassword123');

  // Groups state
  const [groupsList, setGroupsList] = useState<Chat[]>([]);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState(currentSettings?.announcement?.text || '');
  const [announcementSeverity, setAnnouncementSeverity] = useState<'info' | 'warning' | 'alert'>(
    currentSettings?.announcement?.severity || 'info'
  );

  // Themes state
  const [selectedThemeId, setSelectedThemeId] = useState(currentSettings?.themeId || 'cyber_cyan');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Feedback states
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Refresh members and groups
    getRegisteredUsers().then(setMembersList);
    getAllGroups().then(setGroupsList);

    // Subscribe to audit logs
    const unsub = subscribeToAuditLogs(setAuditLogs);
    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    if (currentSettings?.themeId) {
      setSelectedThemeId(currentSettings.themeId);
    }
    if (currentSettings?.announcement?.text) {
      setAnnouncementText(currentSettings.announcement.text);
      setAnnouncementSeverity(currentSettings.announcement.severity);
    }
  }, [currentSettings]);

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // MEMBER ACTIONS
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    setIsLoading(true);
    const res = await adminAddMember(newName, newUsername, newPassword, newBio, currentUser.displayName);
    setIsLoading(false);

    if (res.success) {
      showToast(`Member @${newUsername} added successfully!`);
      setIsAddMemberOpen(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('password123');
      setNewBio('');
      const updated = await getRegisteredUsers();
      setMembersList(updated);
    } else {
      showToast(res.error || 'Failed to add member', 'error');
    }
  };

  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    setIsLoading(true);
    try {
      await banMember(
        banModalUser.uid,
        banType,
        banReason,
        banType === 'temporary' ? banDurationMinutes : undefined,
        currentUser.displayName
      );
      showToast(`Member @${banModalUser.username} has been suspended.`);
      setBanModalUser(null);
      const updated = await getRegisteredUsers();
      setMembersList(updated);
    } catch {
      showToast('Failed to apply suspension', 'error');
    }
    setIsLoading(false);
  };

  const handleUnban = async (member: UserProfile) => {
    setIsLoading(true);
    try {
      await unbanMember(member.uid, currentUser.displayName);
      showToast(`Restored access for @${member.username}`);
      const updated = await getRegisteredUsers();
      setMembersList(updated);
    } catch {
      showToast('Failed to lift suspension', 'error');
    }
    setIsLoading(false);
  };

  const handleDeleteMember = async (member: UserProfile) => {
    if (!window.confirm(`Are you sure you want to permanently delete member @${member.username}? This cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      await deleteMember(member.uid, currentUser.displayName);
      showToast(`Deleted member @${member.username}`);
      const updated = await getRegisteredUsers();
      setMembersList(updated);
    } catch {
      showToast('Failed to delete member', 'error');
    }
    setIsLoading(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUser || !newResetPassword) return;

    setIsLoading(true);
    try {
      await adminResetPassword(resetPwUser.uid, newResetPassword, currentUser.displayName);
      showToast(`Password for @${resetPwUser.username} reset successfully.`);
      setResetPwUser(null);
      setNewResetPassword('newpassword123');
    } catch {
      showToast('Failed to reset password', 'error');
    }
    setIsLoading(false);
  };

  // GROUP ACTIONS
  const handleDeleteGroup = async (group: Chat) => {
    if (!window.confirm(`Are you sure you want to delete group "${group.name}"?`)) return;
    setIsLoading(true);
    try {
      await deleteGroup(group.id, currentUser.displayName);
      showToast(`Deleted group "${group.name}"`);
      const updated = await getAllGroups();
      setGroupsList(updated);
    } catch {
      showToast('Failed to delete group', 'error');
    }
    setIsLoading(false);
  };

  const handleClearChatHistory = async (group: Chat) => {
    if (!window.confirm(`Purge all message history in "${group.name}"?`)) return;
    setIsLoading(true);
    try {
      await clearChatMessages(group.id, currentUser.displayName);
      showToast(`Purged messages in "${group.name}"`);
    } catch {
      showToast('Failed to clear messages', 'error');
    }
    setIsLoading(false);
  };

  // THEME ACTIONS
  const handleApplyGlobalTheme = async (themeId: string) => {
    setSelectedThemeId(themeId);
    setIsLoading(true);
    try {
      await updateGlobalTheme(themeId, currentUser.displayName);
      showToast(`Global theme switched to "${getThemeById(themeId).name}"! All users updated.`);
    } catch {
      showToast('Failed to update global theme', 'error');
    }
    setIsLoading(false);
  };

  // ANNOUNCEMENT ACTIONS
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setIsLoading(true);
    try {
      await publishAnnouncement(announcementText.trim(), announcementSeverity, currentUser.displayName);
      showToast('Announcement broadcasted to top ribbon across all users!');
    } catch {
      showToast('Failed to broadcast announcement', 'error');
    }
    setIsLoading(false);
  };

  const handleClearAnnouncement = async () => {
    setIsLoading(true);
    try {
      await clearAnnouncement(currentUser.displayName);
      setAnnouncementText('');
      showToast('Top announcement ribbon cleared.');
    } catch {
      showToast('Failed to clear announcement', 'error');
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl h-[90vh] max-h-[850px] rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Admin Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-cyan-400">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  PulseChat Admin Suite
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Root Privileges
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  System Administrator: <span className="text-white font-medium">@{currentUser.username}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast message */}
          {statusMessage && (
            <div
              className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b transition-colors ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-slate-950/40 px-6 shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members ({membersList.length}/{MAX_MEMBERS_CAP})</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Groups ({groupsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('announcement')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'announcement'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Top Announcement</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'themes'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Global Themes (16)</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          </div>

          {/* TAB 1: MEMBERS MODERATION */}
          {activeTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Member Accounts & Moderation</h2>
                  <p className="text-xs text-slate-400">
                    Manage membership, grant/revoke access, issue temporary or permanent bans, and reset passwords.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  disabled={membersList.length >= MAX_MEMBERS_CAP}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Members Table */}
              <div className="rounded-2xl bg-slate-950/40 border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {membersList.map((member) => {
                    const isBanned = Boolean(member.banInfo?.isBanned);
                    const isAdminUser = member.role === 'admin' || member.username === 'admin';
                    const isSelf = member.uid === currentUser.uid;

                    return (
                      <div
                        key={member.uid}
                        className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-white truncate">{member.displayName}</span>
                              <span className="text-[11px] font-mono text-slate-500">@{member.username}</span>
                              {isAdminUser && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ADMIN
                                </span>
                              )}
                              {isBanned && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  BANNED ({member.banInfo?.banType})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-sm">
                              {member.bio || 'Member'}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        {!isAdminUser && (
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {isBanned ? (
                              <button
                                onClick={() => handleUnban(member)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                              >
                                Lift Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setBanModalUser(member);
                                  setBanReason('Policy violation');
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs transition-colors"
                                title="Ban Member"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setResetPwUser(member)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GROUPS MODERATION */}
          {activeTab === 'groups' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Group Channels</h2>
                <p className="text-xs text-slate-400">
                  Inspect active group discussions, clear messages, or delete groups.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupsList.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={group.groupIcon || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                        alt={group.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-semibold text-white truncate">{group.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {group.participantIds.length} participants · Created by {group.createdBy}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                      <span className="text-slate-500">Last activity: </span>
                      <span className="text-slate-300 truncate inline-block max-w-[200px]">
                        {group.lastMessage?.text || 'No messages'}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleClearChatHistory(group)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium transition-colors"
                      >
                        Clear History
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-300 font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENT BROADCAST */}
          {activeTab === 'announcement' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Top Ribbon Announcement</h2>
                <p className="text-xs text-slate-400">
                  Broadcast high-visibility messages to all workspace members pinned to the top of the app.
                </p>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Announcement Text</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the message you want all members to see..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Severity Level</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAnnouncementSeverity('info')}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        announcementSeverity === 'info'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      Info (Cyan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnouncementSeverity('warning')}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        announcementSeverity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      Warning (Amber)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnouncementSeverity('alert')}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        announcementSeverity === 'alert'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      Urgent Alert (Rose)
                    </button>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Live Ribbon Preview</label>
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      announcementSeverity === 'alert'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                        : announcementSeverity === 'warning'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Megaphone className="w-4 h-4 shrink-0" />
                      <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border">
                        Announcement
                      </span>
                      <span className="truncate">{announcementText || 'Your announcement will appear here...'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !announcementText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast Globally</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAnnouncement}
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium transition-colors"
                  >
                    Clear Banner
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: 16 GLOBAL THEMES */}
          {activeTab === 'themes' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Global Color Schemes & Aesthetics</h2>
                <p className="text-xs text-slate-400">
                  Select a theme to immediately update the visual styling, glass glows, and message bubbles across all 15 members' devices simultaneously.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {GLOBAL_THEMES.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleApplyGlobalTheme(theme.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-white/10 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        {/* Gradient Preview Bar */}
                        <div
                          style={{ background: theme.gradient }}
                          className="h-10 rounded-xl mb-2.5 shadow-inner border border-white/10 flex items-center justify-end pr-2"
                        >
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-slate-950/80 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{theme.name}</span>
                          <span
                            style={{ backgroundColor: theme.accentColor }}
                            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`mt-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-white/5 text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active Globally' : 'Apply Theme'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">System Audit Trail</h2>
                <p className="text-xs text-slate-400">
                  Chronological record of administrative modifications, bans, creations, and theme changes.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/40 border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No administrative actions logged yet.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">
                              {log.action}
                            </span>
                            <span className="text-white font-medium">{log.details}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            By {log.adminName} {log.target ? `· Target: ${log.target}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* MODAL 1: ADD MEMBER */}
        {isAddMemberOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAddMemberOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  Add Member (Cohort Quota {membersList.length}/{MAX_MEMBERS_CAP})
                </h3>
                <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Liam Vance"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Username Handle (@)</label>
                  <input
                    type="text"
                    placeholder="liam_v"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Bio / Role (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Specialist"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                  >
                    {isLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: BAN MEMBER */}
        {banModalUser && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setBanModalUser(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Ban className="w-4 h-4 text-amber-400" />
                  Suspend Access: {banModalUser.displayName} (@{banModalUser.username})
                </h3>
                <button onClick={() => setBanModalUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Ban Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBanType('temporary')}
                    className={`flex-1 py-2 rounded-xl font-medium border transition-colors ${
                      banType === 'temporary'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-slate-400 border-white/5'
                    }`}
                  >
                    Temporary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanType('permanent')}
                    className={`flex-1 py-2 rounded-xl font-medium border transition-colors ${
                      banType === 'permanent'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-white/5 text-slate-400 border-white/5'
                    }`}
                  >
                    Permanent
                  </button>
                </div>
              </div>

              {banType === 'temporary' && (
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '15 Min', mins: 15 },
                      { label: '1 Hour', mins: 60 },
                      { label: '24 Hours', mins: 1440 },
                      { label: '7 Days', mins: 10080 }
                    ].map((d) => (
                      <button
                        key={d.mins}
                        type="button"
                        onClick={() => setBanDurationMinutes(d.mins)}
                        className={`py-1.5 rounded-lg text-center font-mono text-[11px] border transition-colors ${
                          banDurationMinutes === d.mins
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                            : 'bg-white/5 text-slate-400 border-white/5'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Suspension Reason</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBan}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  {isLoading ? 'Applying...' : 'Enforce Suspension'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: RESET PASSWORD */}
        {resetPwUser && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setResetPwUser(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Reset Password for @{resetPwUser.username}
                </h3>
                <button onClick={() => setResetPwUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">New Password</label>
                  <input
                    type="text"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPwUser(null)}
                    className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                  >
                    Save New Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
