// Single, centralized Firebase connector.
// All Firebase initialization happens here. Replace values via .env only.
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = ['apiKey', 'databaseURL', 'projectId', 'appId'].every(
  (k) => Boolean(firebaseConfig[k])
);

const app = isFirebaseConfigured ? getApps()[0] ?? initializeApp(firebaseConfig) : null;

export const db = app ? getDatabase(app) : null;
export const auth = app ? getAuth(app) : null;

export function requireDb() {
  if (!db) {
    const e = new Error('Firebase is not configured');
    e.code = 'app/not-configured';
    throw e;
  }
  return db;
}
