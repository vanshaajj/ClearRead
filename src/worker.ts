/// <reference types="chrome" />

const QUEUE = "pending-saves";
const PENDING_RUN = "pending-run";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "clearread-page",
      title: "ClearRead this page",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "clearread-selection",
      title: "ClearRead selection",
      contexts: ["selection"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await chrome.storage.local.set({
    [PENDING_RUN]: {
      task: "firstRead",
      useSelection: info.menuItemId === "clearread-selection",
      selection: info.selectionText ?? "",
    },
  });
  if (tab?.id) await chrome.action.openPopup().catch(() => chrome.action.setBadgeText({ text: "•" }));
});

async function getQueue(): Promise<unknown[]> {
  const { [QUEUE]: q } = await chrome.storage.local.get(QUEUE);
  return (q as unknown[]) ?? [];
}

export async function enqueueSave(payload: unknown) {
  const q = (await getQueue()).concat(payload);
  await chrome.storage.local.set({ [QUEUE]: q });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "ENQUEUE_SAVE") {
    enqueueSave(msg.payload).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === "GET_PENDING_RUN") {
    chrome.storage.local.get(PENDING_RUN).then(async (data) => {
      await chrome.storage.local.remove(PENDING_RUN);
      await chrome.action.setBadgeText({ text: "" });
      sendResponse(data[PENDING_RUN] ?? null);
    });
    return true;
  }
  if (msg?.type === "FLUSH_SAVES") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

self.addEventListener("online", () => {
  chrome.runtime.sendMessage({ type: "FLUSH_SAVES" }).catch(() => undefined);
});
