import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();
  // Strip wrapping single or double quotes which Vercel sometimes preserves
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }
  return formatted.replace(/\\n/g, '\n');
}

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

function getFirebaseAdmin(): { db: Firestore | null; adminAuth: Auth | null } {
  if (cachedDb !== null && cachedAuth !== null) {
    return { db: cachedDb, adminAuth: cachedAuth };
  }

  const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
    
    // Explicit snake_case matching standard service account JSON keys
    project_id: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
  };

  const isConfigured = !!(
    firebaseAdminConfig.projectId &&
    firebaseAdminConfig.clientEmail &&
    firebaseAdminConfig.privateKey
  );

  try {
    if (getApps().length === 0) {
      const credential = isConfigured ? cert(firebaseAdminConfig as any) : undefined;
      cachedApp = initializeApp({
        credential,
        projectId: firebaseAdminConfig.projectId || 'mock-project-id-placeholder',
      });
    } else {
      cachedApp = getApp();
    }
    cachedDb = getFirestore(cachedApp);
    cachedAuth = getAuth(cachedApp);
  } catch (err) {
    console.error("⚠️ Lazy Firebase Admin SDK initialization failed:", err);
    // Safe fallback to prevent Next.js import-time crashes
    try {
      const fallbackApp = getApps().length === 0 
        ? initializeApp({ projectId: firebaseAdminConfig.projectId || 'mock-project-id-placeholder' }) 
        : getApp();
      cachedDb = getFirestore(fallbackApp);
      cachedAuth = getAuth(fallbackApp);
    } catch (fallbackErr) {
      console.error("⚠️ Firebase Admin SDK fallback initialization also failed:", fallbackErr);
      cachedDb = null;
      cachedAuth = null;
    }
  }

  return { db: cachedDb, adminAuth: cachedAuth };
}

const EXCLUDED_PROPERTIES = new Set([
  '$$typeof',
  '__esModule',
  'default',
  'then',
  'toJSON',
  'prototype',
  'constructor',
  'toString',
  'valueOf'
]);

// Proxies to dynamically fetch the initialized services on demand
// and preserve correct 'this' bindings for class-based Firestore/Auth methods,
// while shielding compiler/Webpack property lookups from triggering initialization crashes.
export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    if (typeof prop === 'string' && EXCLUDED_PROPERTIES.has(prop)) {
      return Reflect.get(target, prop);
    }
    const services = getFirebaseAdmin();
    if (!services || !services.db) {
      console.warn(`⚠️ Warning: Firestore db proxy accessed but database is offline/uninitialized. Returning undefined for property: ${String(prop)}`);
      return undefined;
    }
    const value = Reflect.get(services.db, prop);
    return typeof value === 'function' ? value.bind(services.db) : value;
  }
});

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop) {
    if (typeof prop === 'string' && EXCLUDED_PROPERTIES.has(prop)) {
      return Reflect.get(target, prop);
    }
    const services = getFirebaseAdmin();
    if (!services || !services.adminAuth) {
      console.warn(`⚠️ Warning: Firebase adminAuth proxy accessed but auth is offline/uninitialized. Returning undefined for property: ${String(prop)}`);
      return undefined;
    }
    const value = Reflect.get(services.adminAuth, prop);
    return typeof value === 'function' ? value.bind(services.adminAuth) : value;
  }
});