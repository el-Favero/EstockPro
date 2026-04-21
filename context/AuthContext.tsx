// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';

let auth: any = null;
let db: any = null;

// Tentar importar Firebase - se falhar, usar placeholders
try {
  const firebaseModule = require('../src/firebaseConfig');
  auth = firebaseModule.auth;
  db = firebaseModule.db;
} catch (e) {
  console.log('Firebase não disponível:', e);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enviarRedefinicaoSenha: (email: string) => Promise<void>;
  firebaseReady: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(!!auth);

  useEffect(() => {
    if (!auth) {
      console.log('Firebase auth não disponível');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth changed:', user?.email);
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase não está disponível');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase não está disponível');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const enviarRedefinicaoSenha = async (email: string) => {
    if (!auth) throw new Error('Firebase não está disponível');
    await sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      logout,
      enviarRedefinicaoSenha,
      firebaseReady,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);