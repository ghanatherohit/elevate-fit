import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId,
    });

export const adminAuth = getAuth(app);
