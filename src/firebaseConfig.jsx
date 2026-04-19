// src/firebaseConfig.jsx
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB71ldSWFmmZnF2ug2Ar3kp4nwCd4uv9fQ",
  authDomain: "appestoque-b0d21.firebaseapp.com",
  projectId: "appestoque-b0d21",
  storageBucket: "appestoque-b0d21.firebasestorage.app",
  messagingSenderId: "661036008662",
  appId: "1:661036008662:web:c5593376328e7def3e7577",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore para usar nos componentes
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Helper
export const isLoggedIn = () => auth.currentUser !== null;