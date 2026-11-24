import { extractPage } from "./extract";

const HOST_ID = "clearread-root";

function overlayStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host { all: initial; }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes scanClose {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(6px) scale(0.98); }
    }

    .panel {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 2147483646;
      width: min(400px, calc(100vw - 28px));
      max-height: calc(100vh - 28px);
      overflow: auto;
      font: 14px/1.65 'Inter', -apple-system, system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.88);
      background: rgba(10, 13, 18, 0.92);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(0, 212, 255, 0.25);
      border-radius: 18px;
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(0, 212, 255, 0.06),
        0 0 40px rgba(0, 212, 255, 0.04) inset;
      padding: 18px 18px 16px;
      animation: fadeSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 212, 255, 0.35) transparent;
    }

    .panel::-webkit-scrollbar { width: 4px; }
    .panel::-webkit-scrollbar-track { background: transparent; }
    .panel::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.35); border-radius: 4px; }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }

    h1 {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0;
      background: linear-gradient(135deg, #00d4ff, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    button {
      font: 11px/1 'Inter', system-ui, sans-serif;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.55);
      border-radius: 999px;
      padding: 5px 12px;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.03em;
    }

    button:hover {
      border-color: rgba(0, 212, 255, 0.4);
      color: #00d4ff;
      background: rgba(0, 212, 255, 0.07);
    }

    .body {
      white-space: pre-wrap;
      font-size: 13.5px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.82);
    }
  `;
}

function showOverlay(title: string, body: string) {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    document.documentElement.append(host);
  }
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${overlayStyles()}</style>
    <div class="panel" role="dialog" aria-label="ClearRead">
      <header>
        <h1>${title}</h1>
        <button type="button" id="close">Close ×</button>
      </header>
      <div class="body"></div>
    </div>`;
  shadow.querySelector(".body")!.textContent = body;
  shadow.getElementById("close")!.onclick = () => host?.remove();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "EXTRACT") {
    sendResponse(extractPage(document));
    return true;
  }
  if (msg?.type === "APPLY") {
    showOverlay(msg.title ?? "ClearRead", msg.body ?? "");
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
