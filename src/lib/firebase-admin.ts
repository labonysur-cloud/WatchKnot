import { getApps, initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "watchknot";

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson) as ServiceAccount),
      projectId,
    });
  } else {
    initializeApp({ projectId });
  }
}

export const adminAuth = getAuth();
