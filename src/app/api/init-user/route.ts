import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { userId, level, isDemo } = await request.json();
    if (!userId || level === undefined) {
      return NextResponse.json({ error: 'Missing userId or level' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data/dictionary.json');
    let knownWords: string[] = [];
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const dict = JSON.parse(rawData);
      
      for (const [word, entry] of Object.entries(dict)) {
        const hsk = (entry as any).h;
        if (hsk && hsk <= level) {
          knownWords.push(word);
        }
      }
    }

    const targetHskLevel = level < 7 ? level + 1 : 7;

    if (!isDemo) {
      try {
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
          knownWords,
          targetHskLevel
        }, { merge: true });
      } catch (dbError) {
        console.warn('Could not write to Firebase, perhaps unconfigured in dev mode:', dbError);
      }
    }

    return NextResponse.json({ success: true, count: knownWords.length, knownWords, targetHskLevel });
  } catch (error: any) {
    console.error('Error initializing user:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown Initialization Server Error',
      stack: error.stack,
      envCheck: {
        hasProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
        hasClientEmail: !!(process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL),
        hasPrivateKey: !!(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
      }
    }, { status: 500 });
  }
}