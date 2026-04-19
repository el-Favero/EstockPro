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
import { auth } from '../src/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enviarRedefinicaoSenha: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      timeoutId = setTimeout(() => {
        console.log("Auth timeout - forcing loading to false");
        setLoading(false);
      }, 3000);

      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log("onAuthStateChanged:", user?.email, user?.uid);
          setUser(user);
          clearTimeout(timeoutId);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.log("Auth error:", error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    const cleanup = initAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    // Funcionalidade de login com Google desabilitada temporariamente
    throw new Error('Login com Google não disponível');
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const enviarRedefinicaoSenha = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      logout,
      enviarRedefinicaoSenha,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);