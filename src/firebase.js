import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDerAG2bqZMCuErcf5yKIQ2fBn9E7YJiII",
  authDomain: "aqua-alert-c0fb5.firebaseapp.com",
  projectId: "aqua-alert-c0fb5",
  storageBucket: "aqua-alert-c0fb5.firebasestorage.app",
  messagingSenderId: "840284654245",
  appId: "1:840284654245:web:5811fab551fb445c92db4c",
  measurementId: "G-22XB00VDDK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);