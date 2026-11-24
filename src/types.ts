export type Route = "device" | "cloud";

export type TaskId = "firstRead" | "simplify" | "deepRead" | "compare";

export interface Task {
  id: TaskId;
  label: string;
  hint: string;
  needsUserHistory: boolean;
  charLimit: number;
}

export interface RouteContext {
  charCount: number;
  nanoAvailable: boolean;
  offline: boolean;
}

export interface Decision {
  route: Route;
  why: string;
}

export interface PageExtract {
  title: string;
  url: string;
  text: string;
  charCount: number;
  selection?: string;
}

export interface SaveDoc {
  url: string;
  title: string;
  summary: string;
  route: Route;
  why: string;
  taskId: TaskId;
  charLimit?: number;
  charCount: number;
  firstReadDone: boolean;
  ts: number;
}

export type WorkerMessage =
  | { type: "ENQUEUE_SAVE"; payload: unknown }
  | { type: "FLUSH_SAVES" }
  | { type: "GET_PENDING_RUN" };
