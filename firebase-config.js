/* ==========================================================================
   FIREBASE CONFIGURATION & INITIALIZATION (v10+ Modular SDK)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// REAL FIREBASE CONFIGURATION (rbstore-a959f)
const firebaseConfig = {
  apiKey: "AIzaSyBKSEXRCDMcgDP6gi2WXoe2e6jFNqV0aFE",
  authDomain: "rbstore-a959f.firebaseapp.com",
  projectId: "rbstore-a959f",
  storageBucket: "rbstore-a959f.firebasestorage.app",
  messagingSenderId: "850130649157",
  appId: "1:850130649157:web:0027c82bea42cccfb7232c",
  measurementId: "G-TWF9TFGGH5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Exportar helpers para uso en app.js
export { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy,
  ref, 
  uploadBytes, 
  getDownloadURL,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
