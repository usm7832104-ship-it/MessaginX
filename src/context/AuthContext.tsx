import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  FirebaseUser
} from '../services/firebase';
import {
  registerOrUpdateUserProfile,
  getRegisteredUsers,
  setUserStatus,
  seedInitialCommunityIfEmpty,
  seedAdminAccount,
  hashPassword,
  MAX_MEMBERS_CAP
} from '../services/chatService';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  registeredCount: number;
  allMembers: UserProfile[];
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithCredentials: (usernameOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithCredentials: (displayName: string, username: string, pass: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoUser: (user: UserProfile) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);

  // Seed initial community if database is brand new and fetch members
  useEffect(() => {
    async function init() {
      await seedInitialCommunityIfEmpty();
      const users = await getRegisteredUsers();
      setAllMembers(users);
      setRegisteredCount(users.length);
    }
    init();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Register or sync user profile
        const email = fbUser.email || '';
        const defaultName = fbUser.displayName || email.split('@')[0] || 'Pulse Member';
        const defaultUserHandle = defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        const res = await registerOrUpdateUserProfile({
          uid: fbUser.uid,
          email,
          displayName: defaultName,
          username: defaultUserHandle,
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${fbUser.uid}`
        });

        if (res.success && res.user) {
          setCurrentUser(res.user);
        } else {
          // If capacity reached, log out
          await fbSignOut(auth);
          setCurrentUser(null);
        }
      } else {
        // Check if there was an active demo session saved in localStorage
        const storedDemoUid = localStorage.getItem('pulsechat_active_uid');
        if (storedDemoUid) {
          const members = await getRegisteredUsers();
          const match = members.find(m => m.uid === storedDemoUid);
          if (match) {
            setCurrentUser(match);
            await setUserStatus(match.uid, 'online');
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh members list periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const users = await getRegisteredUsers();
      setAllMembers(users);
      setRegisteredCount(users.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Google Sign-In (Primary method)
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const res = await registerOrUpdateUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Pulse User',
        username: (user.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_'),
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`
      });

      if (!res.success) {
        await fbSignOut(auth);
        setIsLoading(false);
        return { success: false, error: res.error || 'Registration capacity reached.' };
      }

      setCurrentUser(res.user!);
      localStorage.setItem('pulsechat_active_uid', res.user!.uid);
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = err instanceof Error ? err.message : 'Google sign-in failed.';
      return { success: false, error: errorMsg };
    }
  };

  // Sign in using Username and Password (Secondary option)
  const signInWithCredentials = async (usernameOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      const cleanInput = usernameOrEmail.trim();
      const inputHash = await hashPassword(pass);
      const members = await getRegisteredUsers();

      const found = members.find(
        m => m.username.toLowerCase() === cleanInput.toLowerCase() ||
             m.email.toLowerCase() === cleanInput.toLowerCase()
      );

      // Explicit check for system administrator credentials
      if (cleanInput.toLowerCase() === 'admin' && pass === 'admin783') {
        await seedAdminAccount();
        const refreshed = await getRegisteredUsers();
        const adminAcc = refreshed.find(m => m.username === 'admin');
        if (adminAcc) {
          setCurrentUser(adminAcc);
          localStorage.setItem('pulsechat_active_uid', adminAcc.uid);
          await setUserStatus(adminAcc.uid, 'online');
          setIsLoading(false);
          return { success: true };
        }
      }

      if (!found) {
        setIsLoading(false);
        return { success: false, error: 'No account found with that username or email.' };
      }

      // Verify password
      // Default cohort members accept 'password123' or their stored passwordHash
      const defaultPresetHash = await hashPassword('password123');
      const isPresetMember = found.uid.startsWith('member-');

      const isPasswordCorrect =
        found.passwordHash === inputHash ||
        (isPresetMember && (pass === 'password123' || inputHash === defaultPresetHash)) ||
        (!found.passwordHash && pass.length >= 4);

      if (!isPasswordCorrect) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      // If passwordHash was not set, save it now
      if (!found.passwordHash) {
        await registerOrUpdateUserProfile({ uid: found.uid, passwordHash: inputHash });
      }

      setCurrentUser(found);
      localStorage.setItem('pulsechat_active_uid', found.uid);
      await setUserStatus(found.uid, 'online');
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Sign-in error occurred.' };
    }
  };

  // Register with Username and Password (checks 15 max cap)
  const signUpWithCredentials = async (
    displayName: string,
    username: string,
    pass: string,
    bio?: string
  ) => {
    setIsLoading(true);
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (cleanUsername.length < 3) {
      setIsLoading(false);
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }

    if (pass.length < 4) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const virtualEmail = `${cleanUsername}@pulse.chat`;

    // 15-member cap check upfront
    const currentMembers = await getRegisteredUsers();
    if (currentMembers.length >= MAX_MEMBERS_CAP) {
      setIsLoading(false);
      return {
        success: false,
        error: `Workspace is full! Maximum capacity of ${MAX_MEMBERS_CAP} members reached.`
      };
    }

    // Check unique username
    if (currentMembers.some(m => m.username.toLowerCase() === cleanUsername)) {
      setIsLoading(false);
      return { success: false, error: 'Username is already taken by another member.' };
    }

    try {
      const createdUid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const passwordHash = await hashPassword(pass);

      const res = await registerOrUpdateUserProfile({
        uid: createdUid,
        email: virtualEmail,
        displayName: displayName.trim(),
        username: cleanUsername,
        bio: bio?.trim() || 'Available on PulseChat.',
        photoURL: `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`,
        passwordHash
      });

      if (!res.success || !res.user) {
        setIsLoading(false);
        return { success: false, error: res.error || 'Failed to complete registration.' };
      }

      setCurrentUser(res.user);
      localStorage.setItem('pulsechat_active_uid', res.user.uid);
      setRegisteredCount(prev => prev + 1);
      setAllMembers(prev => [...prev, res.user!]);
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Sign up error occurred.' };
    }
  };

  // Switch demo user (for multi-member testing)
  const switchDemoUser = async (targetUser: UserProfile) => {
    if (currentUser) {
      await setUserStatus(currentUser.uid, 'offline');
    }
    setCurrentUser(targetUser);
    localStorage.setItem('pulsechat_active_uid', targetUser.uid);
    await setUserStatus(targetUser.uid, 'online');
  };

  // Update profile
  const updateProfileData = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await registerOrUpdateUserProfile({
        ...currentUser,
        ...data,
        uid: currentUser.uid
      });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Logout
  const logout = async () => {
    if (currentUser) {
      await setUserStatus(currentUser.uid, 'offline');
    }
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore
    }
    localStorage.removeItem('pulsechat_active_uid');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isLoading,
        registeredCount,
        allMembers,
        signInWithGoogle,
        signInWithCredentials,
        signUpWithCredentials,
        switchDemoUser,
        updateProfileData,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
