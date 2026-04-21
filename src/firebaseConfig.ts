// src/firebaseConfig.ts
//
// 📍 DESTINO: src/firebaseConfig.ts
//
// ✅ CORREÇÃO: adicionado guard com getApps() para evitar o erro
//    "Firebase App named '[DEFAULT]' already exists".
//    Isso acontecia porque initializeApp() era chamado direto,
//    sem verificar se o Firebase já tinha sido inicializado
//    (comum em hot reload ou imports circulares).
//
// 🗑️  AÇÃO EXTRA: delete o arquivo src/firebaseConfig.jsx
//     Ele é uma cópia antiga sem este guard e pode conflitar.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyB71ldSWFmmZnF2ug2Ar3kp4nwCd4uv9fQ",
  authDomain:        "appestoque-b0d21.firebaseapp.com",
  projectId:         "appestoque-b0d21",
  storageBucket:     "appestoque-b0d21.firebasestorage.app",
  messagingSenderId: "661036008662",
  appId:             "1:661036008662:web:c5593376328e7def3e7577",
};

// Guard: getApps() retorna a lista de apps já inicializados.
// Se estiver vazia → cria. Se já tiver algo → reusa o existente.
// Isso evita crash no hot reload e em imports duplicados.
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp(); // getApp() sem argumento pega o app padrão '[Default]'

export const db             = getFirestore(app); // Banco de dados Firestore
export const auth           = getAuth(app);       // Autenticação Firebase
export const googleProvider = new GoogleAuthProvider(); // Reservado para login Google

// Utilitário simples: true se há usuário logado, false se não
export const isLoggedIn = () => auth.currentUser !== null;