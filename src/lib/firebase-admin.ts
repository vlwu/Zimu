import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
  privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
};

const isConfigured = !!(
  firebaseAdminConfig.projectId &&
  firebaseAdminConfig.clientEmail &&
  firebaseAdminConfig.privateKey
);

let app;
try {
  if (getApps().length === 0) {
    let credential;
    if (isConfigured) {
      try {
        credential = cert(firebaseAdminConfig as any);
      } catch (certErr) {
        console.error("⚠️ Failed to parse Firebase Admin credentials in cert():", certErr);
      }
    }
    app = initializeApp({
      credential,
      projectId: firebaseAdminConfig.projectId || 'mock-project-id-placeholder',
    });
  } else {
    app = getApp();
  }
} catch (err) {
  console.error("⚠️ Top-level Firebase Admin SDK initialization failed:", err);
  // Safe fallback to prevent Next.js import-time crashes
  app = getApps().length === 0 
    ? initializeApp({ projectId: firebaseAdminConfig.projectId || 'mock-project-id-placeholder' }) 
    : getApp();
}

export const db = getFirestore(app);
export const adminAuth = getAuth(app);