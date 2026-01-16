/* =====================================================
   FIREBASE DB LAYER
===================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =====================
   CONFIG
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAuuwzai8Da1S9MsVmeQ78FdYFTffT6HSo",
  authDomain: "gestionale-cassa-bar.firebaseapp.com",
  projectId: "gestionale-cassa-bar",
  storageBucket: "gestionale-cassa-bar.firebasestorage.app",
  messagingSenderId: "680357723856",
  appId: "1:680357723856:web:4d84167fa82af2b395e8d5"
};

/* =====================
   INIT (UNA SOLA VOLTA)
===================== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =====================================================
   AUTH API
===================================================== */
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

/* =====================================================
   MOVIMENTI API
===================================================== */
export async function salvaMovimento(movimento) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utente non loggato");

  await addDoc(
    collection(db, "users", user.uid, "movimenti"),
    {
      ...movimento,
      createdAt: serverTimestamp()
    }
  );
}

export async function caricaMovimenti() {
  const user = auth.currentUser;
  if (!user) return [];

  const ref = collection(db, "users", user.uid, "movimenti");
  const q = query(ref, orderBy("data", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}
/* =====================================================
   FORNITORI API
===================================================== */
export async function caricaFornitori() {
  const user = auth.currentUser;
  if (!user) return [];

  const ref = collection(db, "users", user.uid, "fornitori");
  const snap = await getDocs(ref);

  return snap.docs.map(d => ({
    id: d.id,
    nome: d.data().nome
  }));
}

export async function salvaFornitore(nome) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = collection(db, "users", user.uid, "fornitori");

  await addDoc(ref, {
    nome: nome.trim()
  });
}
