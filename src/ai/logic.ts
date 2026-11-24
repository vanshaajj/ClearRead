import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app, firebaseReady } from "../firebase";
import { localGenerate } from "./local";
import type { TaskId } from "../types";

export interface GenerateOpts {
  onDevice: boolean;
  task: TaskId;
  onChunk?: (text: string) => void;
}

async function nanoAvailability(): Promise<string> {
  if (typeof LanguageModel === "undefined") return "unavailable";
  try {
    return await LanguageModel.availability();
  } catch {
    return "unavailable";
  }
}

export async function probeNano(): Promise<boolean> {
  const a = await nanoAvailability();
  if (a === "downloadable" || a === "downloading") {
    LanguageModel.create().catch(() => undefined);
  }
  return a === "available";
}

async function runNano(prompt: string, onChunk?: (text: string) => void): Promise<string> {
  const session = await LanguageModel.create();
  try {
    if (onChunk && session.promptStreaming) {
      const stream = session.promptStreaming(prompt);
      const reader = stream.getReader();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += value;
        onChunk(acc);
      }
      return acc.trim();
    }
    const text = await session.prompt(prompt);
    onChunk?.(text);
    return text.trim();
  } finally {
    session.destroy?.();
  }
}

async function runFirebase(prompt: string, onChunk?: (text: string) => void): Promise<string> {
  if (!firebaseReady()) throw new Error("Firebase is not configured");
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });
  if (onChunk) {
    const streamed = await model.generateContentStream(prompt);
    let acc = "";
    for await (const piece of streamed.stream) {
      acc += piece.text();
      onChunk(acc);
    }
    return (await streamed.response).text().trim();
  }
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function runOnDevice(prompt: string, opts: Omit<GenerateOpts, "onDevice">): Promise<string> {
  try {
    if (await probeNano()) return await runNano(prompt, opts.onChunk);
  } catch (err) {
    console.warn("on-device model failed", err);
  }
  const text = localGenerate(prompt, opts.task);
  opts.onChunk?.(text);
  return text;
}

export async function runCloud(prompt: string, opts: Omit<GenerateOpts, "onDevice">): Promise<string> {
  if (navigator.onLine && firebaseReady()) {
    try {
      return await runFirebase(prompt, opts.onChunk);
    } catch (err) {
      console.warn("cloud model failed", err);
    }
  }
  const text = localGenerate(prompt, opts.task);
  opts.onChunk?.(text);
  return text;
}
