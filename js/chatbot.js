/* Future India Technologies — AI Chat Widget
   ------------------------------------------------------------
   Include this on EVERY page, right before </body>, after script.js:
     <script src="js/chatbot.js" defer></script>

   Before it will work, set WORKER_URL below to your deployed
   Cloudflare Worker URL (see worker.js / setup instructions).
   ------------------------------------------------------------ */
(function () {
  "use strict";

  var WORKER_URL = "https://futureindia-technologies-chatbot.rmnxch-professional.workers.dev";

  var STORAGE_KEY = "fit_chat_history";

  function loadHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveHistory(history) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
    } catch (e) {}
  }

  var css =
    "#fit-chat-bubble{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:50%;background:#E8962E;color:#14212C;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(20,33,44,.28);z-index:9999;transition:background-color .18s ease,transform .18s ease;}" +
    "#fit-chat-bubble:hover{background:#C97A1B;transform:translateY(-1px);}" +
    "#fit-chat-bubble svg{width:26px;height:26px;}" +
    "#fit-chat-panel{position:fixed;right:22px;bottom:92px;width:340px;max-width:calc(100vw - 32px);height:460px;max-height:calc(100vh - 140px);background:#EFF2F0;border:1px solid #CBD3CE;border-radius:6px;box-shadow:0 14px 40px rgba(20,33,44,.28);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans','Segoe UI',sans-serif;}" +
    "#fit-chat-panel.is-open{display:flex;}" +
    "#fit-chat-header{background:#0B131A;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex:none;}" +
    "#fit-chat-header .fit-title{font-family:'Space Grotesk','Segoe UI',sans-serif;font-weight:600;font-size:.95rem;}" +
    "#fit-chat-header .fit-sub{font-family:'IBM Plex Mono',monospace;font-size:.68rem;color:#A9B4BA;margin-top:2px;letter-spacing:.04em;}" +
    "#fit-chat-close{background:none;border:none;color:#A9B4BA;cursor:pointer;padding:4px;line-height:0;}" +
    "#fit-chat-close:hover{color:#fff;}" +
    "#fit-chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#EFF2F0;}" +
    ".fit-msg{max-width:82%;padding:.6em .85em;border-radius:6px;font-size:.87rem;line-height:1.45;white-space:pre-wrap;}" +
    ".fit-msg.user{align-self:flex-end;background:#1F7A72;color:#fff;border-bottom-right-radius:2px;}" +
    ".fit-msg.bot{align-self:flex-start;background:#fff;color:#14212C;border:1px solid #CBD3CE;border-bottom-left-radius:2px;}" +
    ".fit-msg.typing{align-self:flex-start;background:#fff;border:1px solid #CBD3CE;color:#5C6B75;font-style:italic;}" +
    "#fit-chat-form{display:flex;gap:8px;padding:10px;border-top:1px solid #CBD3CE;background:#fff;flex:none;}" +
    "#fit-chat-input{flex:1;border:1.5px solid #CBD3CE;border-radius:4px;padding:.6em .75em;font-size:.87rem;font-family:inherit;background:#EFF2F0;color:#14212C;}" +
    "#fit-chat-input:focus{outline:none;border-color:#1F7A72;}" +
    "#fit-chat-send{background:#E8962E;color:#14212C;border:none;border-radius:4px;padding:0 .9em;font-weight:600;cursor:pointer;font-family:inherit;}" +
    "#fit-chat-send:hover{background:#C97A1B;}" +
    "#fit-chat-send:disabled{opacity:.55;cursor:default;}" +
    "@media (max-width:480px){#fit-chat-panel{right:16px;left:16px;width:auto;bottom:86px;}#fit-chat-bubble{right:16px;bottom:16px;}}";

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildDOM() {
    var bubble = document.createElement("button");
    bubble.id = "fit-chat-bubble";
    bubble.type = "button";
    bubble.setAttribute("aria-label", "Open chat with Jeera");
    bubble.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.4-.7L3 21l1.8-5.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>';

    var panel = document.createElement("div");
    panel.id = "fit-chat-panel";
    panel.innerHTML =
      '<div id="fit-chat-header">' +
      '<div><div class="fit-title">Jeera</div><div class="fit-sub">FUTURE INDIA TECHNOLOGIES</div></div>' +
      '<button id="fit-chat-close" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      "</div>" +
      '<div id="fit-chat-messages"></div>' +
      '<form id="fit-chat-form">' +
      '<input id="fit-chat-input" type="text" placeholder="Type your question…" autocomplete="off">' +
      '<button id="fit-chat-send" type="submit">Send</button>' +
      "</form>";

    document.body.appendChild(bubble);
    document.body.appendChild(panel);
    return { bubble: bubble, panel: panel };
  }

  function addMessageEl(container, role, text) {
    var div = document.createElement("div");
    div.className = "fit-msg " + role;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function init() {
    injectStyle();
    var dom = buildDOM();
    var messagesEl = dom.panel.querySelector("#fit-chat-messages");
    var form = dom.panel.querySelector("#fit-chat-form");
    var input = dom.panel.querySelector("#fit-chat-input");
    var sendBtn = dom.panel.querySelector("#fit-chat-send");
    var closeBtn = dom.panel.querySelector("#fit-chat-close");

    var history = loadHistory();
    if (history.length === 0) {
      addMessageEl(
        messagesEl,
        "bot",
        "Hi, I'm Jeera 👋 — the Future India Technologies assistant. Ask me about CCTV, networking, displays, printing, AMC support, or anything else we offer."
      );
    } else {
      history.forEach(function (turn) {
        addMessageEl(messagesEl, turn.role === "user" ? "user" : "bot", turn.text);
      });
    }

    function togglePanel(open) {
      dom.panel.classList.toggle("is-open", open);
      if (open) input.focus();
    }

    dom.bubble.addEventListener("click", function () {
      togglePanel(!dom.panel.classList.contains("is-open"));
    });
    closeBtn.addEventListener("click", function () {
      togglePanel(false);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      if (!WORKER_URL || WORKER_URL.indexOf("YOUR-WORKER-NAME") !== -1) {
        addMessageEl(
          messagesEl,
          "bot",
          "Chat isn't fully set up yet — please call +91 80599 45551 or use the quote form."
        );
        input.value = "";
        return;
      }

      addMessageEl(messagesEl, "user", text);
      history.push({ role: "user", text: text });
      saveHistory(history);
      input.value = "";
      sendBtn.disabled = true;

      var typingEl = addMessageEl(messagesEl, "typing", "Typing…");

      fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          typingEl.remove();
          var reply = data.reply || "Sorry, something went wrong. Please call +91 80599 45551.";
          addMessageEl(messagesEl, "bot", reply);
          history.push({ role: "model", text: reply });
          saveHistory(history);
        })
        .catch(function () {
          typingEl.remove();
          addMessageEl(
            messagesEl,
            "bot",
            "Sorry, I couldn't connect. Please call +91 80599 45551 or email seith@futureindia.info."
          );
        })
        .finally(function () {
          sendBtn.disabled = false;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
