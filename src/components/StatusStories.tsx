import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Eye, Camera, Type, Send, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { StatusStory } from '../types';
import {
  postStatusStory,
  recordStatusView,
  deleteStatusStory,
  getOrCreateDirectChat,
  sendMessage
} from '../services/chatService';
import { compressImage, formatTime } from '../utils/mediaUtils';

interface StatusStoriesProps {
  statuses: StatusStory[];
  onOpenChatWithUser?: (chatId: string) => void;
}

const BG_GRADIENTS = [
  'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #312E81 0%, #4C1D95 100%)'
];

export const StatusStories: React.FC<StatusStoriesProps> = ({ statuses, onOpenChatWithUser }) => {
  const { currentUser, allMembers } = useAuth();
  
  // State for Status Creator Modal
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorType, setCreatorType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[1]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // State for Status Viewer Modal
  const [viewerStory, setViewerStory] = useState<StatusStory | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewersList, setShowViewersList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Group statuses by user
  const myStatuses = statuses.filter(s => s.userId === currentUser?.uid);
  const otherStatuses = statuses.filter(s => s.userId !== currentUser?.uid);

  // Group other users' statuses by unique user
  const usersWithStatuses = Array.from(
    new Set(otherStatuses.map(s => s.userId))
  ).map(userId => {
    const userStories = otherStatuses.filter(s => s.userId === userId);
    return {
      userId,
      userStories,
      latestStory: userStories[0],
      hasUnseen: userStories.some(s => !s.viewers?.includes(currentUser?.uid || ''))
    };
  });

  // Open viewer with a set of stories
  const openStoryViewer = (storyList: StatusStory[], initialIdx = 0) => {
    if (!storyList.length) return;
    setStoryIndex(initialIdx);
    const story = storyList[initialIdx];
    setViewerStory(story);
    setStoryProgress(0);
    setIsPaused(false);
    setShowViewersList(false);

    // Record view
    if (currentUser && story) {
      recordStatusView(story.id, currentUser.uid);
    }
  };

  // Progress timer for viewer
  useEffect(() => {
    if (!viewerStory || isPaused || showViewersList) return;

    const interval = 50; // update every 50ms
    const step = (interval / 5000) * 100; // 5000ms = 5s total duration

    progressTimerRef.current = window.setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [viewerStory, isPaused, showViewersList, storyIndex]);

  const handleNextStory = () => {
    const currentList = viewerStory?.userId === currentUser?.uid
      ? myStatuses
      : otherStatuses.filter(s => s.userId === viewerStory?.userId);

    if (storyIndex < currentList.length - 1) {
      const nextIdx = storyIndex + 1;
      setStoryIndex(nextIdx);
      const nextStory = currentList[nextIdx];
      setViewerStory(nextStory);
      setStoryProgress(0);
      if (currentUser && nextStory) {
        recordStatusView(nextStory.id, currentUser.uid);
      }
    } else {
      closeViewer();
    }
  };

  const handlePrevStory = () => {
    const currentList = viewerStory?.userId === currentUser?.uid
      ? myStatuses
      : otherStatuses.filter(s => s.userId === viewerStory?.userId);

    if (storyIndex > 0) {
      const prevIdx = storyIndex - 1;
      setStoryIndex(prevIdx);
      const prevStory = currentList[prevIdx];
      setViewerStory(prevStory);
      setStoryProgress(0);
    }
  };

  const closeViewer = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setViewerStory(null);
    setStoryProgress(0);
    setReplyText('');
    setShowViewersList(false);
  };

  // Post new status
  const handleCreateStatus = async () => {
    if (!currentUser) return;
    if (creatorType === 'text' && !textContent.trim()) return;
    if (creatorType === 'image' && !imagePreview) return;

    setIsPosting(true);
    try {
      if (creatorType === 'text') {
        await postStatusStory(currentUser, {
          type: 'text',
          content: textContent.trim(),
          backgroundColor: selectedBg
        });
      } else if (imagePreview) {
        await postStatusStory(currentUser, {
          type: 'image',
          content: imagePreview,
          caption: imageCaption.trim()
        });
      }

      setIsPosting(false);
      setIsCreatorOpen(false);
      setTextContent('');
      setImagePreview(null);
      setImageCaption('');
    } catch (err) {
      console.error('Failed to post status story:', err);
      setIsPosting(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 0.8);
      setImagePreview(compressed);
      setCreatorType('image');
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  // Reply to story in 1-on-1 direct chat
  const handleReplyToStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !viewerStory) return;

    try {
      const chatId = await getOrCreateDirectChat(currentUser.uid, viewerStory.userId);
      const replyMessage = `Replying to status: "${
        viewerStory.type === 'text' ? viewerStory.content : viewerStory.caption || 'Photo status'
      }"\n\n${replyText.trim()}`;

      await sendMessage(chatId, currentUser, {
        type: 'text',
        content: replyMessage
      });

      setReplyText('');
      closeViewer();
      if (onOpenChatWithUser) {
        onOpenChatWithUser(chatId);
      }
    } catch (err) {
      console.error('Failed to send status reply:', err);
    }
  };

  return (
    <div className="p-3 border-b border-white/5 bg-slate-950/20">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* My Status Bubble */}
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              if (myStatuses.length > 0) {
                openStoryViewer(myStatuses, 0);
              } else {
                setIsCreatorOpen(true);
              }
            }}
            className="relative"
          >
            <div
              className={`w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                myStatuses.length > 0
                  ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400'
                  : 'border border-dashed border-slate-600'
              }`}
            >
              <img
                src={currentUser?.photoURL}
                alt="My status"
                className="w-full h-full rounded-full object-cover bg-slate-800"
              />
            </div>
            {/* Plus badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatorOpen(true);
              }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md hover:bg-cyan-400 transition-colors"
              title="Add status update"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] text-slate-300 font-medium truncate max-w-[64px]">
            {myStatuses.length > 0 ? `My Status (${myStatuses.length})` : 'Add Status'}
          </span>
        </div>

        {/* Other Members' Status Circles */}
        {usersWithStatuses.map((item) => (
          <div
            key={item.userId}
            onClick={() => openStoryViewer(item.userStories, 0)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div
              className={`w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                item.hasUnseen
                  ? 'bg-gradient-to-tr from-cyan-400 via-emerald-400 to-amber-300 animate-pulse'
                  : 'bg-slate-700/60'
              }`}
            >
              <img
                src={item.latestStory.userPhoto}
                alt={item.latestStory.userName}
                className="w-full h-full rounded-full object-cover bg-slate-800"
              />
            </div>
            <span className="text-[11px] text-slate-300 truncate max-w-[64px]">
              {item.latestStory.userName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* STATUS CREATOR MODAL */}
      <AnimatePresence>
        {isCreatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setIsCreatorOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Create 24h Status Story</span>
                </div>
                <button
                  onClick={() => setIsCreatorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type Switcher */}
              <div className="flex gap-2 p-3 bg-slate-950/20 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => { setCreatorType('text'); setImagePreview(null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                    creatorType === 'text'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Text Status
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                    creatorType === 'image'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Photo Status
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Creator Canvas */}
              <div className="p-5 flex-1 flex flex-col min-h-[300px]">
                {creatorType === 'text' ? (
                  <div className="flex-1 flex flex-col">
                    <div
                      style={{ background: selectedBg }}
                      className="flex-1 rounded-2xl p-6 flex items-center justify-center min-h-[220px] shadow-inner"
                    >
                      <textarea
                        rows={4}
                        placeholder="Type a status update for your 15-member team..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full bg-transparent text-center text-white placeholder-white/60 font-semibold text-lg focus:outline-none resize-none"
                      />
                    </div>

                    {/* Gradient Palette Picker */}
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto py-1">
                      <span className="text-[11px] text-slate-400 shrink-0">Color:</span>
                      {BG_GRADIENTS.map((bg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedBg(bg)}
                          style={{ background: bg }}
                          className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform ${
                            selectedBg === bg ? 'border-white scale-110' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-3">
                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden max-h-[260px] bg-black/40 flex items-center justify-center">
                        <img src={imagePreview} alt="Preview" className="max-h-[260px] w-auto object-contain" />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setCreatorType('text'); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 min-h-[200px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-6 text-center"
                      >
                        <Camera className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-xs text-slate-300 font-medium">Click to choose a photo</p>
                        <p className="text-[10px] text-slate-500 mt-1">JPEG, PNG or WebP</p>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Add an optional caption..."
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="h-16 px-5 border-t border-white/10 flex items-center justify-between bg-slate-950/40">
                <span className="text-[11px] text-slate-400">Disappears automatically in 24 hours</span>
                <button
                  type="button"
                  disabled={isPosting || (creatorType === 'text' && !textContent.trim()) || (creatorType === 'image' && !imagePreview)}
                  onClick={handleCreateStatus}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 hover:opacity-95 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'Publishing...' : 'Share Status'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN STATUS VIEWER */}
      <AnimatePresence>
        {viewerStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={closeViewer}
          >
            <div
              className="relative w-full max-w-md h-full max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
              style={{
                background: viewerStory.type === 'text' ? viewerStory.backgroundColor || '#0F172A' : '#000'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar Container */}
              <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{ width: `${storyProgress}%` }}
                  />
                </div>
              </div>

              {/* Story Author Header */}
              <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={viewerStory.userPhoto}
                    alt={viewerStory.userName}
                    className="w-9 h-9 rounded-full object-cover border border-white/40"
                  />
                  <div>
                    <p className="text-xs font-semibold leading-tight">{viewerStory.userName}</p>
                    <p className="text-[10px] text-white/70">{formatTime(viewerStory.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {viewerStory.userId === currentUser?.uid && (
                    <button
                      onClick={async () => {
                        await deleteStatusStory(viewerStory.id);
                        closeViewer();
                      }}
                      className="p-1.5 rounded-full bg-black/40 text-red-400 hover:text-red-300"
                      title="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={closeViewer}
                    className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Left / Right Tap Navigation */}
              <div className="absolute inset-y-16 inset-x-0 z-20 flex justify-between pointer-events-auto">
                <button
                  type="button"
                  onClick={handlePrevStory}
                  className="w-1/3 h-full opacity-0 hover:opacity-100 flex items-center justify-start pl-2 text-white/40 transition-opacity"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  onClick={handleNextStory}
                  className="w-1/3 h-full opacity-0 hover:opacity-100 flex items-center justify-end pr-2 text-white/40 transition-opacity"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              {/* Story Body */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none z-10">
                {viewerStory.type === 'text' ? (
                  <p className="text-xl sm:text-2xl font-bold text-white max-w-xs leading-relaxed drop-shadow-md">
                    {viewerStory.content}
                  </p>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <img
                      src={viewerStory.content}
                      alt="Story"
                      className="max-h-[60vh] max-w-full object-contain rounded-xl"
                    />
                    {viewerStory.caption && (
                      <p className="mt-3 text-sm text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl max-w-xs">
                        {viewerStory.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Story Footer: Viewer counts or Direct reply */}
              <div className="relative z-30 p-4 border-t border-white/10 bg-black/60 backdrop-blur-md">
                {viewerStory.userId === currentUser?.uid ? (
                  /* Author View: Show viewers count & toggle */
                  <div>
                    <button
                      onClick={() => {
                        setShowViewersList(!showViewersList);
                        setIsPaused(!showViewersList);
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-white/90 hover:text-white"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>{viewerStory.viewers?.length || 1} team views</span>
                    </button>

                    {/* Viewers Sheet */}
                    {showViewersList && (
                      <div className="mt-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                        <p className="text-[10px] uppercase font-semibold text-slate-400 px-1">Viewed by</p>
                        {viewerStory.viewers?.map((vId) => {
                          const viewerUser = allMembers.find(m => m.uid === vId);
                          return (
                            <div key={vId} className="flex items-center gap-2 px-1 py-1 text-xs text-white">
                              <img
                                src={viewerUser?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${vId}`}
                                alt="Viewer"
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="truncate">
                                {vId === currentUser.uid ? 'You' : viewerUser?.displayName || 'Member'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Viewer View: Send direct message reply */
                  <form onSubmit={handleReplyToStatus} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Reply to ${viewerStory.userName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      className="flex-1 h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="h-10 px-4 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-cyan-400"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
