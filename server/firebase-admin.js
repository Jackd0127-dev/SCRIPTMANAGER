// Shared server code lives outside /api so Vercel does not deploy it as a route.
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp;
let cachedAuth;
let cachedFirestore;

function serviceCredential() {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }
  return applicationDefault();
}

function adminApp() {
  if (cachedApp) return cachedApp;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "social-media-script";
  cachedApp =
    getApps()[0] ||
    initializeApp(
      process.env.FIRESTORE_EMULATOR_HOST
        ? { projectId }
        : { projectId, credential: serviceCredential() },
    );
  return cachedApp;
}

export function scriptAiAdminAuth() {
  cachedAuth ||= getAuth(adminApp());
  return cachedAuth;
}

export function scriptAiAdminFirestore() {
  if (cachedFirestore) return cachedFirestore;
  cachedFirestore = getFirestore(adminApp());
  cachedFirestore.settings({ ignoreUndefinedProperties: true });
  return cachedFirestore;
}
