import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";
import { app, firebaseReady } from "./firebase";
import type { SaveDoc } from "./types";

const LOCAL_KEY = "clearread-saves";

async function localList(): Promise<SaveDoc[]> {
  const { [LOCAL_KEY]: raw } = await chrome.storage.local.get(LOCAL_KEY);
  return Array.isArray(raw) ? (raw as SaveDoc[]) : [];
}

async function localAdd(doc: SaveDoc) {
  const all = await localList();
  await chrome.storage.local.set({ [LOCAL_KEY]: [doc, ...all].slice(0, 80) });
}

export async function addSave(uid: string | null, doc: Omit<SaveDoc, "ts"> & { ts?: number }) {
  const row: SaveDoc = { ...doc, ts: doc.ts ?? Date.now() };
  await localAdd(row);
  if (!uid || !firebaseReady()) return;
  try {
    const db = getFirestore(app);
    await addDoc(collection(db, `users/${uid}/saves`), { ...row, ts: serverTimestamp() });
  } catch (err) {
    await chrome.runtime.sendMessage({ type: "ENQUEUE_SAVE", payload: { uid, row } }).catch(() => undefined);
    console.warn("cloud save queued", err);
  }
}

export async function listSaves(uid: string | null, n = 50): Promise<SaveDoc[]> {
  const local = await localList();
  if (!uid || !firebaseReady()) return local.slice(0, n);
  try {
    const db = getFirestore(app);
    const snap = await getDocs(query(collection(db, `users/${uid}/saves`), orderBy("ts", "desc"), limit(n)));
    const cloud = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        url: data.url ?? "",
        ts: typeof data.ts?.toMillis === "function" ? data.ts.toMillis() : Date.now(),
      } as SaveDoc;
    });
    if (cloud.length) {
      const merged = [...cloud];
      for (const loc of local) {
        if (!merged.some((c) => c.url === loc.url && Math.abs(c.ts - loc.ts) < 2000)) {
          merged.push(loc);
        }
      }
      merged.sort((a, b) => b.ts - a.ts);
      return merged.slice(0, n);
    }
  } catch {
    /* offline → local */
  }
  return local.slice(0, n);
}

export async function latestTitles(uid: string | null, n = 5): Promise<string[]> {
  const saves = await listSaves(uid, n);
  return saves.map((s) => s.title).filter(Boolean);
}
