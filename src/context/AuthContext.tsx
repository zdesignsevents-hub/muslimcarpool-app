// AuthContext — manages authentication state with Firebase + demo mode support

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { isDemoMode, onDemoModeActivated, demoLogout } from '../utils/demoMode';
import { DEMO_USER } from '../utils/demoData';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logOut: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email || 'User',
            email: firebaseUser.email || '',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // Listen for demo mode activation/deactivation
  useEffect(() => {
    const unsub = onDemoModeActivated(() => {
      if (isDemoMode()) {
        setUser(DEMO_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Create user doc in Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      createdAt: new Date(),
    });
  };

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    if (isDemoMode()) {
      demoLogout();
      return;
    }
    if (isFirebaseConfigured()) {
      await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}