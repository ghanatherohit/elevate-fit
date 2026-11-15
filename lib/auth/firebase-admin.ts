import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id || projectId,
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch {
      // fall through to split vars
    }
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const adminProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || projectId;

  if (clientEmail && privateKey) {
    return {
      projectId: adminProjectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
  }

  return null;
};

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;

function initAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
      projectId: serviceAccount.projectId || projectId,
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT (or FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY) is required",
    );
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch (error) {
    throw new Error(
      `Firebase Admin is not configured. Add FIREBASE_SERVICE_ACCOUNT to .env.local. ${
        error instanceof Error ? error.message : ""
      }`,
    );
  }
}

/** Lazy init so missing credentials don't crash unrelated imports at boot. */
export function getAdminAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }
  cachedApp = initAdminApp();
  cachedAuth = getAuth(cachedApp);
  return cachedAuth;
}

/** @deprecated Prefer getAdminAuth() for clearer failure timing */
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    const auth = getAdminAuth();
    const value = Reflect.get(auth, prop, receiver);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});
