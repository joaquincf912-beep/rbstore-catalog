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

// ⚠️ REEMPLAZA ESTOS VALORES CON TUS LLAVES DE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Inicializar Servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Exportar funciones helper para Firestore, Storage y Auth
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
