import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Try to obtain service account from env var (FIREBASE_SERVICE_ACCOUNT) or local file.
let serviceAccount: any | null = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    // ignore parse errors and continue to other methods
    serviceAccount = null;
  }
}

// If not set via env, try to read the local file (use process.cwd() so it works when running from /backend)
if (!serviceAccount) {
  const candidate = path.join(process.cwd(), "firebase", "clave.json");
  if (fs.existsSync(candidate)) {
    // require with absolute path so it works after tsc -> dist
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    serviceAccount = require(candidate);
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback to Application Default Credentials (useful when running in GCP or when
    // GOOGLE_APPLICATION_CREDENTIALS is set). This prevents a hard crash when the
    // local JSON isn't present in dist/ during local runs.
    admin.initializeApp();
  }
}

export const db = admin.firestore();