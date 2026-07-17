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

// Initialize the Admin SDK ensuring we don't duplicate app instances during Next.js hot reloads
// and gracefully fallback if keys are missing (such as during Next.js static build evaluation or dev mode)
const app = getApps().length === 0
  ? initializeApp({
      credential: isConfigured ? cert(firebaseAdminConfig as any) : undefined,
      projectId: firebaseAdminConfig.projectId || 'mock-project-id-placeholder',
    })
  : getApp();

export const db = getFirestore(app);
export const adminAuth = getAuth(app);