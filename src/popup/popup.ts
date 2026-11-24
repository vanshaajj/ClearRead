import { TASKS, taskById } from "../tasks";
import { decideRoute } from "../router";
import { buildPrompt, clipText } from "../prompts";
import { probeNano, runCloud, runOnDevice } from "../ai/logic";
import { loadConfig } from "../config";
import { auth, ensureSession, onUser, signIn, signOutUser } from "../auth";
import { addSave, latestTitles, listSaves } from "../store";
import type { PageExtract, Route, SaveDoc, TaskId } from "../types";

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const btn = (s: string) => $<HTMLButtonElement>(s);

const state = {
  task: "firstRead" as TaskId,
  level: "simple",
  useHistory: false,
  last: null as SaveDoc | null,
  busy: false,
};

async function activeTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) {
    throw new Error("Chrome system pages cannot be read. Open an article instead.");
  }
  return tab.id;
}

async function pageText(): Promise<PageExtract> {
  const tabId = await activeTabId();
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "EXTRACT" });
  } catch {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const root =
          document.querySelector("article, main, [role='main']") ?? document.body;
        const clone = root.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("nav,header,footer,aside,script,style,form,noscript,iframe,svg").forEach((n) => n.remove());
        const text = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
        return {
          title: document.title,
          url: location.href,
          text,
          charCount: text.length,
          selection: (document.getSelection()?.toString() ?? "").trim(),
        };
      },
    });
    if (!result) throw new Error("Could not read this page");
    return result;
  }
}

function chip(route: Route | "idle", why: string) {
  const el = $("#chip");
  el.dataset.route = route;
  el.textContent = route === "idle" ? why : `${route === "device" ? "on-device" : "cloud"} · ${why}`;
}

function setBusy(on: boolean) {
  state.busy = on;
  $("#readPane").classList.toggle("busy", on);
  btn("#run").textContent = on ? "Working…" : "Run";
}

function renderTasks() {
  const nav = $("#tasks");
  nav.innerHTML = "";
  for (const t of TASKS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t.label;
    b.setAttribute("aria-pressed", String(t.id === state.task));
    b.onclick = () => {
      state.task = t.id;
      if (t.id === "compare") {
        state.useHistory = true;
        ($("#useHistory") as HTMLInputElement).checked = true;
      }
      renderTasks();
    };
    nav.append(b);
  }
  $("#taskHint").textContent = taskById(state.task).hint;
}

function showLibrary(items: SaveDoc[]) {
  const ul = $("#library");
  ul.innerHTML = "";
  $("#libEmpty").hidden = items.length > 0;
  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `<strong></strong><span></span>`;
    li.querySelector("strong")!.textContent = item.title || item.url;
    li.querySelector("span")!.textContent = `${item.taskId} · ${item.route} · ${new Date(item.ts).toLocaleString()}`;
    li.onclick = () => {
      $("#out").textContent = item.summary;
      chip(item.route, item.why);
      state.last = item;
      btn("#copy").disabled = false;
      btn("#save").disabled = false;
      $("#tabRead").click();
    };
    ul.append(li);
  }
}

async function refreshLibrary() {
  const uid = auth.currentUser?.uid ?? null;
  showLibrary(await listSaves(uid, 20));
}

async function run() {
  if (state.busy) return;
  const out = $("#out");
  setBusy(true);
    btn("#copy").disabled = true;
    btn("#apply").disabled = true;
  try {
    await ensureSession();
    const cfg = await loadConfig();
    const page = await pageText();
    const source = page.selection || page.text;
    const charCount = source.replace(/\s+/g, " ").trim().length;
    const nanoAvailable = await probeNano();
    const uid = auth.currentUser?.uid ?? null;
    const history = state.useHistory || state.task === "compare" ? await latestTitles(uid, 5) : undefined;
    const task = {
      ...taskById(state.task),
      needsUserHistory: taskById(state.task).needsUserHistory || state.useHistory,
      charLimit: state.task === "compare" ? 0 : taskById(state.task).charLimit || cfg.charLimit,
    };

    const decision = decideRoute(task, {
      charCount,
      nanoAvailable,
      offline: !navigator.onLine,
    });
    chip(decision.route, decision.why);

    if (decision.route === "device" && charCount < 200) {
      out.textContent = source.trim() || "This page does not have enough readable text.";
      return;
    }

    const clipped = clipText(source, decision.route === "device" ? Math.min(task.charLimit || 6000, 6000) : 18000);
    const prompt = buildPrompt(state.task, clipped, state.level, history);
    const summary =
      decision.route === "device"
        ? await runOnDevice(prompt, { task: state.task, onChunk: (t) => (out.textContent = t) })
        : await runCloud(prompt, { task: state.task, onChunk: (t) => (out.textContent = t) });

    out.textContent = summary;
    state.last = {
      url: page.url,
      title: page.title,
      summary,
      route: decision.route,
      why: decision.why,
      taskId: state.task,
      charCount,
      firstReadDone: state.task === "firstRead",
      ts: Date.now(),
    };
    btn("#save").disabled = false;
    btn("#copy").disabled = !summary;
    btn("#apply").disabled = !summary;
  } catch (e) {
    chip("cloud", "error");
    out.innerHTML = `<p class="error"></p>`;
    out.querySelector("p")!.textContent = (e as Error).message;
  } finally {
    setBusy(false);
  }
}

function setTab(lib: boolean) {
  $("#tabRead").setAttribute("aria-selected", String(!lib));
  $("#tabLib").setAttribute("aria-selected", String(lib));
  $("#readPane").hidden = lib;
  $("#libPane").hidden = !lib;
  if (lib) void refreshLibrary();
}

onUser((user) => {
  $("#signIn").textContent = user && !user.isAnonymous ? "Sign out" : "Sign in";
  void refreshLibrary();
});

btn("#signIn").onclick = async () => {
  try {
    if (auth.currentUser && !auth.currentUser.isAnonymous) await signOutUser();
    else await signIn();
  } catch (e) {
    $("#out").innerHTML = `<p class="error"></p>`;
    $("#out").querySelector("p")!.textContent = (e as Error).message;
  }
};

btn("#run").onclick = () => void run();
$("#level").onchange = (e) => (state.level = (e.target as HTMLSelectElement).value);
$("#useHistory").onchange = (e) => {
  state.useHistory = (e.target as HTMLInputElement).checked;
  if (state.useHistory) {
    state.task = "compare";
    renderTasks();
  }
};
btn("#save").onclick = async () => {
  if (!state.last) return;
  const user = await ensureSession();
  await addSave(user?.uid ?? null, state.last);
  btn("#save").textContent = "Saved";
  setTimeout(() => (btn("#save").textContent = "Save"), 1200);
  void refreshLibrary();
};
btn("#copy").onclick = async () => {
  if (state.last?.summary) await navigator.clipboard.writeText(state.last.summary);
};
btn("#apply").onclick = async () => {
  if (!state.last) return;
  const tabId = await activeTabId();
  await chrome.tabs.sendMessage(tabId, {
    type: "APPLY",
    title: taskById(state.task).label,
    body: state.last.summary,
  });
};
btn("#tabRead").onclick = () => setTab(false);
btn("#tabLib").onclick = () => setTab(true);

renderTasks();
void ensureSession();
void chrome.runtime
  .sendMessage({ type: "GET_PENDING_RUN" })
  .then((pending) => {
    if (!pending) return;
    const VALID_TASK_IDS: TaskId[] = ["firstRead", "simplify", "deepRead", "compare"];
    if (pending?.task && VALID_TASK_IDS.includes(pending.task as TaskId)) {
      state.task = pending.task as TaskId;
    }
    renderTasks();
    void run();
  })
  .catch(() => undefined);
