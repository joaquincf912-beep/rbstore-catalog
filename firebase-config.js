/* ==========================================================================
   FIREBASE CONFIGURATION & SAFE DYNAMIC INITIALIZATION
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBKSEXRCDMcgDP6gi2WXoe2e6jFNqV0aFE",
  authDomain: "rbstore-a959f.firebaseapp.com",
  projectId: "rbstore-a959f",
  storageBucket: "rbstore-a959f.firebasestorage.app",
  messagingSenderId: "850130649157",
  appId: "1:850130649157:web:0027c82bea42cccfb7232c",
  measurementId: "G-TWF9TFGGH5"
};

let firebaseInstance = null;

export async function initFirebaseSDK() {
  if (firebaseInstance) return firebaseInstance;

  try {
    const [appMod, firestoreMod, storageMod, authMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js"),
      import("https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js")
    ]);

    const app = appMod.initializeApp(firebaseConfig);
    const db = firestoreMod.getFirestore(app);
    const storage = storageMod.getStorage(app);
    const auth = authMod.getAuth(app);

    firebaseInstance = {
      app,
      db,
      storage,
      auth,
      firestore: firestoreMod,
      storageMod,
      authMod
    };

    console.log("[RBstore Firebase] ✅ Firebase SDK cargado exitosamente.");
    return firebaseInstance;
  } catch (err) {
    console.warn("[RBstore Firebase] ⚠️ No se pudo cargar el SDK de Firebase (modo offline activo):", err.message);
    return null;
  }
}
