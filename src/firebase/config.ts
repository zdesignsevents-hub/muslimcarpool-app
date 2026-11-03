// Firebase configuration with lazy Proxy pattern
// Prevents crashes when placeholder credentials are used (demo mode)

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function isConfigured(): boolean {
  return !firebaseConfig.apiKey.includes('YOUR_');
}

function getFirebaseApp(): FirebaseApp | null {
  if (!_app) {
    if (!isConfigured()) return null;
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

// Lazy proxies — only initialize on first access with real credentials
export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    const app = getFirebaseApp();
    if (!app) return undefined;
    if (!_auth) _auth = getAuth(app);
    return Reflect.get(_auth, prop);
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    const app = getFirebaseApp();
    if (!app) return undefined;
    if (!_db) _db = getFirestore(app);
    return Reflect.get(_db, prop);
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    const app = getFirebaseApp();
    if (!app) return undefined;
    if (!_storage) _storage = getStorage(app);
    return Reflect.get(_storage, prop);
  },
});

export const isFirebaseConfigured = isConfigured;