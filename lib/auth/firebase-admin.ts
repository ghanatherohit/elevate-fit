import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const parseServiceAccount = () => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return null;
  }

  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as {
      client_email?: string;
      private_key?: string;
    };

    if (parsed.client_email && parsed.private_key) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

const serviceAccount = parseServiceAccount();

const initAdminApp = () => {
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId,
    });
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch {
    return initializeApp({ projectId });
  }
};

const app = getApps().length
  ? getApps()[0]
  : initAdminApp();

export const adminAuth = getAuth(app);
