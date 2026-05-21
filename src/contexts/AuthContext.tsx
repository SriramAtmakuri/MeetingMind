import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setSessionUserId } from '@/lib/session';
import {
  isFirebaseConfigured,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  FirebaseUser,
} from '@/lib/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function firebaseUserToUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || '',
    isGuest: false,
    photoURL: fbUser.photoURL || undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = (u: User | null) => {
    setUser(u);
    setSessionUserId(u?.id ?? null);
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        applyUser(fbUser ? firebaseUserToUser(fbUser) : null);
        setIsLoading(false);
      });
      return unsub;
    } else {
      // Fallback: localStorage mock auth
      const stored = localStorage.getItem('meetingmind_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          applyUser(u);
        } catch { localStorage.removeItem('meetingmind_user'); }
      }
      setIsLoading(false);
    }
  }, []);

  // ── Firebase path ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await new Promise(r => setTimeout(r, 800));
      const u: User = { id: Date.now().toString(), name: email.split('@')[0], email, isGuest: false };
      applyUser(u);
      localStorage.setItem('meetingmind_user', JSON.stringify(u));
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Google sign-in requires Firebase configuration.');
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signup = async (name: string, email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      applyUser(firebaseUserToUser({ ...cred.user, displayName: name }));
    } else {
      await new Promise(r => setTimeout(r, 800));
      const u: User = { id: Date.now().toString(), name, email, isGuest: false };
      applyUser(u);
      localStorage.setItem('meetingmind_user', JSON.stringify(u));
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      throw new Error('Password reset requires Firebase. Contact support@meetingmind.app');
    }
  };

  const loginAsGuest = () => {
    const guest: User = { id: 'guest-' + Date.now(), name: 'Guest User', email: 'guest@meetingmind.com', isGuest: true };
    applyUser(guest);
    localStorage.setItem('meetingmind_user', JSON.stringify(guest));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    applyUser(null);
    localStorage.removeItem('meetingmind_user');
  };

  return (
    <AuthContext.Provider value={{
      user, login, loginWithGoogle, signup, loginAsGuest, logout, resetPassword,
      isAuthenticated: !!user, isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
