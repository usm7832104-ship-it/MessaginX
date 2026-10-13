import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Users, MessageSquare, Check, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { getOrCreateDirectChat, createGroupChat } from '../services/chatService';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectChat }) => {
  const { currentUser, allMembers } = useAuth();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Filter out current user from selectable list
  const availableMembers = allMembers.filter(m => m.uid !== currentUser.uid);

  const handleStartDirectChat = async (targetUser: UserProfile) => {
    setIsCreating(true);
    try {
      const chatId = await getOrCreateDirectChat(currentUser.uid, targetUser.uid);
      setIsCreating(false);
      onSelectChat(chatId);
      onClose();
    } catch (err) {
      console.error('Failed to create direct chat:', err);
      setIsCreating(false);
    }
  };

  const handleToggleMemberSelection = (uid: string) => {
    if (selectedMemberIds.includes(uid)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== uid));
    } else {
      setSelectedMemberIds([...selectedMemberIds, uid]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0) return;

    setIsCreating(true);
    try {
      const chatId = await createGroupChat(
        currentUser.uid,
        groupName.trim(),
        selectedMemberIds
      );
      setIsCreating(false);
      onSelectChat(chatId);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              Start Conversation
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-white/5 bg-slate-950/20 px-4 pt-2">
            <button
              onClick={() => setTab('direct')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${
                tab === 'direct'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              1-on-1 Direct Chat
            </button>
            <button
              onClick={() => setTab('group')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${
                tab === 'group'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              New Group Chat
            </button>
          </div>

          {/* Tab 1: 1-on-1 Direct Message */}
          {tab === 'direct' ? (
            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              <p className="text-[11px] text-slate-400 px-1">Select a registered cohort member:</p>
              {availableMembers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No other members registered yet.
                </div>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.uid}
                    disabled={isCreating}
                    onClick={() => handleStartDirectChat(member)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-left transition-all group"
                  >
                    <div className="relative">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {member.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{member.bio || `@${member.username}`}</p>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-medium px-2 py-1 rounded-lg bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      Message
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Tab 2: Group Creation */
            <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Design Leads, Sprint Alpha..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Select Participants ({selectedMemberIds.length} selected)
                  </label>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-slate-950/30 border border-white/5">
                  {availableMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.uid);
                    return (
                      <div
                        key={member.uid}
                        onClick={() => handleToggleMemberSelection(member.uid)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-medium text-white truncate">{member.displayName}</p>
                          <p className="text-[10px] text-slate-500">@{member.username}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating || !groupName.trim() || selectedMemberIds.length === 0}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 hover:opacity-95 transition-all"
              >
                <span>{isCreating ? 'Creating Group...' : 'Create Group Chat'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
