// Firebase SDK Configuration & Authentication Helpers
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// User's Firebase web application configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCt-huFVx2AEz0nTpakRmtK9b4DojQCLYg",
  authDomain: "ai-detector-8fa75.firebaseapp.com",
  projectId: "ai-detector-8fa75",
  storageBucket: "ai-detector-8fa75.firebasestorage.app",
  messagingSenderId: "558007713590",
  appId: "1:558007713590:web:f0ef2debe920d57b057d97",
  measurementId: "G-BLVN31Y38L"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics safely
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((yes) => {
      if (yes) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}
export { analytics };

/**
 * Sign In with official Google Popup via Firebase
 */
export async function signInWithGoogleFirebase() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign In with Google Redirect via Firebase (mobile/fallback)
 */
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Handle Google Redirect Result on page return
 */
export async function checkGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
  } catch (err) {
    console.warn("Google Redirect check notice:", err);
  }
  return null;
}

/**
 * Sign In with Email & Password via Firebase
 */
export async function signInWithEmailFirebase(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Create Account with Email & Password via Firebase
 */
export async function registerWithEmailFirebase(email, password, displayName = '') {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && result.user) {
    try {
      await updateProfile(result.user, { displayName });
    } catch {
      // Non-critical profile update
    }
  }
  return result.user;
}

/**
 * Send Password Reset Email via Firebase
 */
export async function resetPasswordFirebase(email) {
  await sendPasswordResetEmail(auth, email);
  return true;
}

/**
 * Sign Out from Firebase
 */
export async function logoutFirebase() {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Auth State Changes
 */
export function onFirebaseAuthStateChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export default app;

