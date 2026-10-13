import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Check, Edit2, LogOut, Sparkles, User, FileText, Info } from 'lucide-react';
import { compressImage } from '../utils/mediaUtils';
import { UserProfile } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_BIOS = [
  'Available for quick chats ✦',
  'Deep work mode — asynchronous only',
  'Exploring glassmorphism & reactive state engines',
  'Designing next-gen communication flows ✨',
  'In a design review',
  'At the coffee lab ☕'
];

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfileData, logout, allMembers, switchDemoUser } = useAuth();
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const compressedDataUrl = await compressImage(file, 400, 0.8);
      await updateProfileData({ photoURL: compressedDataUrl });
      setIsSaving(false);
      showSuccess();
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setIsSaving(false);
    }
  };

  const handleGeneratePresetAvatar = async () => {
    setIsSaving(true);
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${randomSeed}`;
    await updateProfileData({ photoURL: newAvatar });
    setIsSaving(false);
    showSuccess();
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    await updateProfileData({ displayName: displayName.trim(), username: username.trim() });
    setIsEditingName(false);
    setIsSaving(false);
    showSuccess();
  };

  const handleSaveBio = async (newBioText?: string) => {
    const textToSave = newBioText !== undefined ? newBioText : bio;
    setIsSaving(true);
    await updateProfileData({ bio: textToSave.trim() });
    setBio(textToSave.trim());
    setIsEditingBio(false);
    setIsSaving(false);
    showSuccess();
  };

  const showSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-md h-full bg-slate-900/90 backdrop-blur-2xl border-r border-white/10 flex flex-col overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/40">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Profile & Customization
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {successToast && (
            <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Profile Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-28 h-28 rounded-full object-cover border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 group-hover:opacity-80 transition-opacity"
                />
                
                {/* Upload Trigger overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload profile picture"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Change Photo</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Avatar Preset Generator */}
              <button
                type="button"
                onClick={handleGeneratePresetAvatar}
                disabled={isSaving}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Generate Shape Avatar
              </button>
            </div>

            {/* Display Name Section */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Display Name</span>
                {!isEditingName ? (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                )}
              </div>

              {!isEditingName ? (
                <div>
                  <p className="text-sm font-semibold text-white">{currentUser.displayName}</p>
                  <p className="text-xs text-slate-500 font-mono">@{currentUser.username}</p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bio / About Section */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  About / Status Bio
                </span>
                {!isEditingBio ? (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveBio()}
                    disabled={isSaving}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                )}
              </div>

              {!isEditingBio ? (
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{currentUser.bio || 'Available on PulseChat.'}"
                </p>
              ) : (
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team what you're working on..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              )}

              {/* Quick Preset Bios */}
              <div className="pt-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Quick Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BIOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSaveBio(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Details & 15-Member Information */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium">Cohort Membership</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5 text-slate-300">
                <span className="text-slate-500">Email</span>
                <span className="font-mono text-[11px]">{currentUser.email || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5 text-slate-300">
                <span className="text-slate-500">Member ID</span>
                <span className="font-mono text-[11px] truncate max-w-[150px]">{currentUser.uid}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-500">Joined Workspace</span>
                <span>{new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Testing Account Switcher */}
            {allMembers.length > 1 && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
                <p className="text-xs font-medium text-slate-300">Switch Testing Identity</p>
                <p className="text-[11px] text-slate-500">Simulate chats as another member:</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {allMembers
                    .filter((m) => m.uid !== currentUser.uid)
                    .slice(0, 6)
                    .map((member) => (
                      <button
                        key={member.uid}
                        onClick={() => {
                          switchDemoUser(member);
                          onClose();
                        }}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors"
                      >
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-[11px] text-slate-300 truncate">{member.displayName}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-6 border-t border-white/10 shrink-0 bg-slate-950/40">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of PulseChat
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
