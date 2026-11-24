(function(){"use strict";const i="nav, header, footer, aside, script, style, form, noscript, iframe, svg, [aria-hidden='true'], [hidden]";function l(e){var a,n;const r=e.querySelector("article");if(r&&(((a=r.textContent)==null?void 0:a.length)??0)>200)return r;const t=e.querySelector("main, [role='main'], #content, .post, .entry-content");return t&&(((n=t.textContent)==null?void 0:n.length)??0)>200?t:e.body}function c(e){if(!e.body)return"";const r=l(e).cloneNode(!0);return r.querySelectorAll(i).forEach(t=>t.remove()),(r.textContent??"").replace(/[ \t]+\n/g,`
`).replace(/\n{3,}/g,`

`).replace(/[ \t]{2,}/g," ").trim()}const s=e=>e.replace(/\s+/g," ").trim().length;function p(e){var r;return(((r=e.getSelection())==null?void 0:r.toString())??"").replace(/\s+/g," ").trim()}function d(e){var t;const r=c(e);return{title:e.title,url:((t=e.location)==null?void 0:t.href)??"",text:r,charCount:s(r),selection:p(e)}}const o="clearread-root";function b(){return`
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
  `}function u(e,r){let t=document.getElementById(o);t||(t=document.createElement("div"),t.id=o,document.documentElement.append(t));const a=t.shadowRoot??t.attachShadow({mode:"open"});a.innerHTML=`<style>${b()}</style>
    <div class="panel" role="dialog" aria-label="ClearRead">
      <header>
        <h1>${e}</h1>
        <button type="button" id="close">Close ×</button>
      </header>
      <div class="body"></div>
    </div>`,a.querySelector(".body").textContent=r,a.getElementById("close").onclick=()=>t==null?void 0:t.remove()}chrome.runtime.onMessage.addListener((e,r,t)=>(e==null?void 0:e.type)==="EXTRACT"?(t(d(document)),!0):(e==null?void 0:e.type)==="APPLY"?(u(e.title??"ClearRead",e.body??""),t({ok:!0}),!0):!1)})();
