import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Download,
  Info,
  X,
  Phone,
  Trash2,
  ChevronDown,
  ArrowLeft,
  Users
} from 'lucide-react';
import { Chat, ChatMessage, UserProfile } from '../types';
import {
  sendMessage,
  toggleMessageReaction,
  markMessagesAsRead
} from '../services/chatService';
import { compressImage, formatBytes, formatTime } from '../utils/mediaUtils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import confetti from 'canvas-confetti';

interface ChatAreaProps {
  chat: Chat | null;
  messages: ChatMessage[];
  onBackToSidebar?: () => void;
  onOpenLightbox: (src: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onBackToSidebar,
  onOpenLightbox
}) => {
  const { currentUser, allMembers } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [isChatDetailsOpen, setIsChatDetailsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Voice recorder hook
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder();

  // Helper to find peer profile in direct chats
  const peerProfile = chat?.type === 'direct' && currentUser
    ? allMembers.find(m => m.uid === chat.participantIds.find(id => id !== currentUser.uid))
    : null;

  const chatTitle = chat?.type === 'group' ? chat.name || 'Group' : peerProfile?.displayName || 'Direct Chat';
  const chatSubtitle = chat?.type === 'group'
    ? `${chat.participantIds.length} members`
    : peerProfile?.status === 'online'
    ? 'Active now'
    : peerProfile?.lastSeen
    ? `Last active ${formatTime(peerProfile.lastSeen)}`
    : 'Offline';

  const chatAvatar = chat?.type === 'group'
    ? chat.groupIcon || `https://api.dicebear.com/7.x/identicon/svg?seed=${chatTitle}`
    : peerProfile?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${chat?.id}`;

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark unread messages as read
  useEffect(() => {
    if (chat && currentUser && messages.length > 0) {
      markMessagesAsRead(chat.id, currentUser.uid, messages);
    }
  }, [chat?.id, messages.length, currentUser?.uid]);

  // Send Text Message
  const handleSendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !chat || !currentUser) return;

    const content = inputText.trim();
    setInputText('');
    setIsEmojiPickerOpen(false);

    try {
      await sendMessage(chat.id, currentUser, {
        type: 'text',
        content
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Send Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chat || !currentUser) return;

    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(file, 900, 0.75);
      await sendMessage(chat.id, currentUser, {
        type: 'image',
        content: file.name,
        mediaUrl: compressedDataUrl,
        fileName: file.name,
        fileSize: formatBytes(file.size)
      });
      setIsUploading(false);
    } catch (err) {
      console.error('Image upload failed:', err);
      setIsUploading(false);
    }
  };

  // Send Generic Document / File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chat || !currentUser) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        await sendMessage(chat.id, currentUser, {
          type: 'file',
          content: file.name,
          mediaUrl: base64Data,
          fileName: file.name,
          fileSize: formatBytes(file.size)
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload failed:', err);
      setIsUploading(false);
    }
  };

  // Send Voice Note
  const handleStopAndSendVoice = async () => {
    if (!chat || !currentUser) return;
    const recorded = await stopRecording();
    if (recorded) {
      try {
        await sendMessage(chat.id, currentUser, {
          type: 'voice',
          content: 'Voice note',
          mediaUrl: recorded.dataUrl,
          voiceDuration: recorded.duration
        });
      } catch (err) {
        console.error('Failed to send voice note:', err);
      }
    }
  };

  // Trigger Reaction
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!chat || !currentUser) return;
    setActiveReactionMsgId(null);
    if (emoji === '🎉' || emoji === '❤️' || emoji === '🔥') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    await toggleMessageReaction(chat.id, messageId, emoji, currentUser.uid);
  };

  if (!chat) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-950/40 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
          <Smile className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">PulseChat Workspace</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Select an existing conversation from the sidebar or click (+) to start a new direct message or group chat.
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 h-full min-h-0 flex flex-col bg-slate-950/60 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* CHAT TOP BAR */}
      <header className="h-16 px-4 md:px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/70 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={chatAvatar}
              alt={chatTitle}
              className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-sm"
            />
            {chat.type === 'direct' && peerProfile?.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{chatTitle}</h2>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 font-mono">
              {chat.type === 'direct' && peerProfile?.status === 'online' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
              <span>{chatSubtitle}</span>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsChatDetailsOpen(!isChatDetailsOpen)}
            className={`p-2 rounded-xl transition-colors ${
              isChatDetailsOpen
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Conversation details"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN MESSAGES AREA */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
          {/* Welcome chat header */}
          <div className="text-center py-4">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-slate-400">
              🔒 End-to-end synchronized across the 15-member cohort
            </div>
          </div>

          {messages.map((msg, index) => {
            const isOutgoing = msg.senderId === currentUser?.uid;
            const isRead = msg.readBy && msg.readBy.length > 1; // Read by other participant

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col group ${isOutgoing ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name in Group Chat */}
                {chat.type === 'group' && !isOutgoing && (
                  <span className="text-[11px] text-cyan-400 font-semibold mb-1 ml-1">
                    {msg.senderName}
                  </span>
                )}

                {/* Message Bubble Container with hover action trigger */}
                <div className="relative max-w-[85%] sm:max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-md ${
                      isOutgoing
                        ? 'glass-bubble-outgoing text-white rounded-tr-sm'
                        : 'glass-bubble-incoming text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {/* Media Type: Image */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => onOpenLightbox(msg.mediaUrl!)}>
                        <img
                          src={msg.mediaUrl}
                          alt={msg.fileName || 'Photo'}
                          className="max-h-72 w-full object-cover rounded-xl hover:scale-[1.01] transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Media Type: Voice Note */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <VoiceNotePlayer
                        audioUrl={msg.mediaUrl}
                        duration={msg.voiceDuration || 0}
                        isOutgoing={isOutgoing}
                      />
                    )}

                    {/* Media Type: Generic File Attachment */}
                    {msg.type === 'file' && msg.mediaUrl && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-white/10 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{msg.fileName || 'Attachment'}</p>
                          <p className="text-[10px] text-slate-400">{msg.fileSize || 'Document'}</p>
                        </div>
                        <a
                          href={msg.mediaUrl}
                          download={msg.fileName || 'file'}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.type === 'text' && (
                      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp & Read Receipts */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-400 select-none tabular-nums font-mono">
                      <span>{formatTime(msg.createdAt)}</span>
                      {isOutgoing && (
                        <span>
                          {isRead ? (
                            <span title="Read">
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span title="Delivered">
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Tag Pill underneath bubble */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser?.uid || '');
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border shadow-sm transition-all ${
                              hasReacted
                                ? 'bg-cyan-500/25 border-cyan-500/40 text-cyan-200'
                                : 'bg-slate-900/70 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-mono text-[10px]">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover Reaction Toolbar Trigger */}
                  <div
                    className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-1 ${
                      isOutgoing ? '-left-20' : '-right-20'
                    }`}
                  >
                    <button
                      onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                      className="p-1.5 rounded-full bg-slate-900/90 border border-white/15 text-slate-400 hover:text-white shadow-lg"
                      title="React with emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reaction Toolbar Popup */}
                  {activeReactionMsgId === msg.id && (
                    <div
                      className={`absolute -top-10 z-30 flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl backdrop-blur-xl ${
                        isOutgoing ? 'right-0' : 'left-0'
                      }`}
                    >
                      {COMMON_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionClick(msg.id, emoji)}
                          className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center text-sm transition-transform active:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* SLIDE-OVER CONVERSATION DETAILS DRAWER */}
        {isChatDetailsOpen && (
          <aside className="w-72 md:w-80 border-l border-white/10 bg-slate-900/90 backdrop-blur-xl flex flex-col p-5 overflow-y-auto shrink-0 select-none">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-sm font-semibold text-white">Conversation Info</h3>
              <button
                onClick={() => setIsChatDetailsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={chatAvatar}
                alt={chatTitle}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/15 shadow-lg mb-3"
              />
              <h4 className="text-sm font-bold text-white">{chatTitle}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{chatSubtitle}</p>
            </div>

            {/* Participants list */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Participants ({chat.participantIds.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chat.participantIds.map((pId) => {
                  const member = allMembers.find(m => m.uid === pId);
                  const isMe = pId === currentUser?.uid;
                  return (
                    <div key={pId} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
                      <img
                        src={member?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${pId}`}
                        alt="Member"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">
                          {isMe ? 'You' : member?.displayName || 'Member'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          @{member?.username || pId.slice(0, 6)}
                        </p>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member?.status === 'online' ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* INPUT BAR */}
      <footer className="py-2.5 px-3 md:py-3 md:px-4 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 shrink-0 z-20">
        {/* Voice Recording Active UI */}
        {isRecording ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-red-500/15 border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-semibold text-red-300">Recording Voice Note...</span>
              <span className="text-xs font-mono tabular-nums text-white bg-black/40 px-2.5 py-1 rounded-lg">
                {Math.floor(recordingDuration / 60)}:
                {recordingDuration % 60 < 10 ? '0' : ''}
                {recordingDuration % 60}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStopAndSendVoice}
                className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Input Bar */
          <form onSubmit={handleSendTextMessage} className="flex items-center gap-2 m-0 p-0">
            {/* Attachment Menu Triggers */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {/* Photo upload */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => imageInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Send photo"
              >
                <ImageIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Document upload */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Text Input with auto-focus */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder={isUploading ? 'Compressing media...' : 'Type a message...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isUploading}
                className="w-full h-10 sm:h-11 px-3.5 sm:px-4 pr-9 sm:pr-10 rounded-2xl bg-slate-950/70 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 shadow-inner"
              />
              {/* Quick Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="absolute right-2 sm:right-2.5 p-1 rounded-lg text-slate-400 hover:text-white"
                title="Quick emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Emoji quick popup tray */}
              {isEmojiPickerOpen && (
                <div className="absolute right-0 bottom-13 p-2 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl flex items-center gap-1.5 z-30">
                  {COMMON_REACTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setInputText(prev => prev + em);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-base sm:text-lg p-1.5 rounded-xl hover:bg-white/10 transition-transform active:scale-125"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action button: Send if text exists, otherwise Record Voice Note */}
            {inputText.trim() ? (
              <button
                type="submit"
                style={{ background: 'var(--theme-gradient)' }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-black/20 hover:opacity-95 active:scale-95 transition-all shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/5 hover:bg-white/10 border flex items-center justify-center active:scale-95 transition-all shrink-0"
                title="Record voice note"
              >
                <Mic className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            )}
          </form>
        )}
      </footer>
    </main>
  );
};
