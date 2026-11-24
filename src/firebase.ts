import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export function firebaseReady(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export const app: FirebaseApp = initializeApp(
  firebaseReady()
    ? config
    : { apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo", appId: "1:0:web:demo" },
);

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string;
  }
}

const recaptcha = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (import.meta.env.DEV || import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? true;
}

if (firebaseReady() && recaptcha) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptcha),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn("App Check skipped", err);
  }
}
