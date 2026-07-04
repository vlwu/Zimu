import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Ensure we safely handle newline characters in environment variables
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize the Admin SDK ensuring we don't duplicate app instances during Next.js hot reloads
const app = getApps().length === 0
  ? initializeApp({
      credential: cert(firebaseAdminConfig),
    })
  : getApp();

export const db = getFirestore(app);