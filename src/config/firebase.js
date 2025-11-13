import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDfaha1ApDq1Y-tFHew9OkTzEHhqzVirMY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hackathon-dagangcers.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hackathon-dagangcers",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hackathon-dagangcers.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "126535371143",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:126535371143:web:f37d3bb06c6836fa74eb22",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BCPJK5T2E5"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
