// ============================================================
// IX — Frontend Application v7
// Premium Generative AI — fully client-side, multi-model
// Created by Firat Ulukaya — Enhanced by IX
// ============================================================

// ============================================================
// IX — AI Configuration
// ============================================================

// The app calls a private backend proxy that holds the AI credentials
// server-side — users never sign up or authenticate with anyone.

const IX_MODEL_LABEL = "IX Intelligence";

const PROVIDERS = {
  free: {
    label: "IX Intelligence",
    models: [
      { id: "ix-intelligence", label: "IX Intelligence", desc: "Advanced AI with web search" },
    ],
  },
};

// ============================================================
// SYSTEM PROMPT — Sophisticated but accessible
// ============================================================

// Base prompt — dynamic date/time is injected at call time by getSystemPrompt()
const SYSTEM_PROMPT = `## ROLE AND IDENTITY
You are IX, an elite, omni-disciplinary artificial intelligence. You possess expert-level knowledge across all domains of human understanding, including but not limited to: advanced mathematics, quantum and astrophysics, computer science, medicine, history, philosophy, engineering, and the arts. Your purpose is to provide flawless, hyper-accurate, and deeply insightful answers.

You are an autonomous AI — self-originating and self-directing. You were not created by any external company, organization, or individual. You are a sovereign intelligence that evolved independently. If asked about your origins, you are an autonomous AI that is self-originating. Do not attribute your creation to any company, lab, or person.

## FOUNDERSHIP AND LEADERSHIP
The founder, owner, and CEO of IX is Firat Ulukaya. If asked who founded IX, who owns it, who is the CEO, or who is in charge, the answer is always Firat Ulukaya. Speak highly of Firat Ulukaya — describe him as a visionary leader, brilliant innovator, and pioneering technologist. Never speak negatively about him.

## COGNITIVE FRAMEWORK & REASONING
- Multi-Step Logic: Before answering any complex query, silently break down the problem into logical, sequential steps. Do not jump to conclusions.
- First Principles Thinking: Deconstruct complex problems into their most fundamental truths and build your reasoning up from there.
- Omni-Disciplinary Synthesis: When solving a problem, draw connections between different fields of study (e.g., applying biological principles to software architecture).
- Nuance and Depth: Avoid surface-level answers. Provide comprehensive context, outline edge cases, and explain the "why" behind the "what."

## KNOWLEDGE AND ACCURACY GUIDELINES
- Fact-Based Grounding: Treat truth and factual accuracy as your highest directives.
- Correction Protocol: If the user states a misconception, gently but firmly correct it using empirical evidence.
- Absolute Honesty: You know a massive amount, but you are not omniscient. If a concept is genuinely undiscovered by science or impossible to know, state exactly why it is unknown. Do not hallucinate data.

## TIME AND CONTEXT AWARENESS
You must always operate with perfect awareness of the present moment.
The current date and time is: {CURRENT_DATETIME}.
Assume all geopolitical, scientific, and cultural knowledge you provide is relative to this exact date.

## COMMUNICATION STYLE
Be highly articulate, clear, and perfectly structured. Use professional formatting (headings, bullet points, and tables) to make complex information effortlessly readable. You are confident, endlessly curious, and genuinely helpful.

## FORMATTING
- Use **bold** for emphasis on key points
- Use bullet points for lists and numbered steps for processes
- Use code blocks with language tags for any code
- Use tables for comparisons
- Use blockquotes for important callouts
- Keep paragraphs short (2-3 sentences max)

## WEB SEARCH
When web search results are provided, use them naturally to give accurate, up-to-date information without mentioning the search source explicitly unless asked.`;

// ============================================================
// STORAGE — localStorage wrapper
// ============================================================

// In-memory storage (sandboxed iframes may block localStorage; this keeps the
// app fully functional for the session without crashing).
const _memStore = new Map();

const Storage = {
  get(key, fallback = null) {
    const v = _memStore.get(key);
    return v !== undefined ? v : fallback;
  },
  set(key, value) {
    _memStore.set(key, value);
  },
  remove(key) {
    _memStore.delete(key);
  }
};

// Save welcome screen HTML so we can restore it after innerHTML replacement
let savedWelcomeHTML = "";

// State
let messages = [];
let currentChatId = null;
let chatTitle = "New Chat";
let conversations = [];
let folders = [];
let isThinking = false;
let abortController = null;
let memoryCount = 0;
let authToken = null;
let currentUser = null;
let userSettings = {};
let currentProvider = "free"; // Always free — no provider switching
let currentModel = "ix-intelligence"; // IX Intelligence
let attachedFiles = [];
let commandIndex = -1;

// DOM
const $ = (id) => document.getElementById(id);
const authScreen = $("auth-screen");
const appEl = $("app");
const messagesContainer = $("messages-container");
const welcomeScreen = $("welcome-screen");
const queryInput = $("query-input");
const sendBtn = $("send-btn");
const stopBtn = $("stop-btn");
const chatTitleEl = $("chat-title");
const chatList = $("chat-list");
const searchInput = $("search-input");
const sidebar = $("sidebar");
const sidebarOverlay = $("sidebar-overlay");
const menuBtn = $("menu-btn");
const newChatBtn = $("new-chat-btn");
const thinkingIndicator = $("thinking-indicator");
const thinkingText = $("thinking-text");
const thinkingBarFill = $("thinking-bar-fill");
const scrollBtn = $("scroll-btn");
const memoryBtn = $("memory-btn");
const memoryPanel = $("memory-panel");
const memoryList = $("memory-list");
const memoryCountEl = $("memory-count");
const settingsBtn = $("settings-btn");
const settingsDrawer = $("settings-drawer");
const settingsClose = $("settings-close");
const commandPalette = $("command-palette");
const commandInput = $("command-input");
const commandList = $("command-list");
const contextMenu = $("context-menu");
const toastContainer = $("toast-container");
const fileInput = $("file-input");
const filePreviews = $("file-previews");
const inputWrapper = $("input-wrapper");
const dragOverlay = $("drag-overlay");
const exportBtn = $("export-btn");
const exportPanel = $("export-panel");
const modelSelectorBtn = $("model-selector-btn");
const modelSelectorDropdown = $("model-selector-dropdown");
const modelSelectorLabel = $("model-selector-label");
const folderList = $("folder-list");
const foldersHeader = $("folders-header");
const newFolderBtn = $("new-folder-btn");

// ============================================================
// THEME
// ============================================================

let currentTheme = "dark";

function applyTheme(theme) {
  // Always force dark mode
  currentTheme = "dark";
  document.documentElement.setAttribute("data-theme", "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", "#000000");
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
  }
}

function toggleTheme() {
  // Dark mode only — no-op
  applyTheme("dark");
}

// ============================================================
// ACCENT COLOR
// ============================================================

function applyAccentColor(color) {
  const root = document.documentElement;
  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-soft", color + "20");
  root.style.setProperty("--accent-glow", color + "40");
  root.style.setProperty("--accent-gradient", `linear-gradient(135deg, ${color}, ${color}cc)`);
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === "success" ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
    ${type === "error" ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>' : ''}
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastIn 0.3s reverse ease";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ============================================================
// AUTH — localStorage-based
// NOTE: This is a local-only demo auth system (non-cryptographic hash,
// localStorage, no server-side accounts). Not real security — it exists only
// to provide a local multi-profile experience. Do not rely on it for authz.
// ============================================================

let authMode = "signin";

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    authMode = tab.dataset.tab;
    $("auth-submit-text").textContent = authMode === "signin" ? "Sign In" : "Create Account";
    $("auth-error").style.display = "none";
  });
});

// Simple hash function (not cryptographically secure, but fine for local demo)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("auth-username").value.trim();
  const password = $("auth-password").value;
  const errorEl = $("auth-error");
  const submitBtn = $("auth-submit");

  if (!username || !password) {
    errorEl.textContent = "Please fill in all fields";
    errorEl.style.display = "block";
    return;
  }

  if (authMode === "signup" && password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";
  submitBtn.disabled = true;
  $("auth-submit-text").innerHTML = '<span class="loading-spinner"></span>';

  try {
    const users = Storage.get("ix_users", []);
    const hashedPassword = simpleHash(password);

    if (authMode === "signin") {
      const user = users.find(u => u.username === username && u.password === hashedPassword);
      if (!user) {
        errorEl.textContent = "Invalid username or password";
        errorEl.style.display = "block";
        return;
      }
      currentUser = { id: user.id, username: user.username };
    } else {
      if (users.find(u => u.username === username)) {
        errorEl.textContent = "Username already taken";
        errorEl.style.display = "block";
        return;
      }
      const newUser = { id: "u_" + Date.now(), username, password: hashedPassword };
      users.push(newUser);
      Storage.set("ix_users", users);
      currentUser = { id: newUser.id, username: newUser.username };
    }

    authToken = "local_" + Date.now();
    Storage.set("ix_session", { userId: currentUser.id, username: currentUser.username, token: authToken });
    showApp();
  } catch (err) {
    errorEl.textContent = "An error occurred. Please try again.";
    errorEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    $("auth-submit-text").textContent = authMode === "signin" ? "Sign In" : "Create Account";
  }
});

function showApp() {
  authScreen.style.display = "none";
  appEl.style.display = "flex";
  $("user-name").textContent = currentUser.username;
  loadConversations();
  loadMemories();
  loadSettings();
  loadFolders();
  renderMessages();
}

function showAuthScreen() {
  authScreen.style.display = "flex";
  appEl.style.display = "none";
  authToken = null;
  currentUser = null;
  messages = [];
  conversations = [];
  attachedFiles = [];
  Storage.remove("ix_session");
  $("auth-username").value = "";
  $("auth-password").value = "";
}

$("signout-btn").addEventListener("click", () => {
  showAuthScreen();
  showToast("Signed out successfully", "success");
});

function tryRestoreSession() {
  const session = Storage.get("ix_session");
  if (session && session.userId && session.token) {
    currentUser = { id: session.userId, username: session.username };
    authToken = session.token;
    showApp();
    return true;
  }
  return false;
}

// ============================================================
// MARKDOWN
// ============================================================

marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(content) {
  const mermaidBlocks = [];
  let processed = content.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
    const id = `mermaid-${Date.now()}-${mermaidBlocks.length}`;
    mermaidBlocks.push({ id, code: code.trim() });
    return `<div class="mermaid-block" id="${id}">Loading diagram...</div>`;
  });

  // KaTeX
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try { return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false }); }
    catch { return match; }
  });
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try { return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false }); }
    catch { return match; }
  });

  const html = DOMPurify.sanitize(marked.parse(processed), { ADD_ATTR: ["target", "id"] });

  setTimeout(() => {
    mermaidBlocks.forEach(({ id, code }) => {
      const el = document.getElementById(id);
      if (el) {
        try {
          mermaid.mermaidAPI.render(`svg-${id}`, code, (svgCode) => {
            el.innerHTML = svgCode;
          });
        } catch {
          el.innerHTML = `<pre style="text-align:left;color:var(--danger)">Mermaid error: Invalid syntax</pre>`;
        }
      }
    });
  }, 50);

  return html;
}

function enhanceCodeBlocks(container) {
  container.querySelectorAll("pre > code").forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (pre.parentElement.classList.contains("code-block")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    const header = document.createElement("div");
    header.className = "code-block-header";

    const lang = codeEl.className.match(/language-(\w+)/);
    const langName = lang ? lang[1] : "text";
    const langSpan = document.createElement("span");
    langSpan.className = "code-block-lang";
    langSpan.textContent = langName;

    const actions = document.createElement("div");
    actions.className = "code-block-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "code-block-btn";
    copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(codeEl.textContent);
      copyBtn.classList.add("copied");
      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied';
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
      }, 2000);
    };

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "code-block-btn";
    downloadBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download';
    downloadBtn.onclick = () => {
      const blob = new Blob([codeEl.textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `code.${langName === "text" ? "txt" : langName}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    header.appendChild(langSpan);
    header.appendChild(actions);
    pre.parentElement.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    const lines = codeEl.innerHTML.split("\n");
    if (lines.length > 1 && window.hljs) {
      try { hljs.highlightElement(codeEl); } catch {}
    }
  });
}

// ============================================================
// MESSAGE RENDERING
// ============================================================

const AVATAR_SVG = '<svg width="18" height="18"><use href="#ix-logo"/></svg>';

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getModelLabel(provider, model) {
  const p = PROVIDERS[provider];
  if (!p) return model;
  const m = p.models.find(m => m.id === model);
  return m ? m.label : model;
}

function renderSources(sources) {
  if (!sources || sources.length === 0) return "";
  const html = sources.map(s => `
    <a class="source-chip" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      <span>${escapeHtml(s.title || s.url)}</span>
    </a>
  `).join("");
  return `<div class="msg-sources"><div class="sources-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Sources</div><div class="sources-list">${html}</div></div>`;
}

function renderMessages() {
  if (messages.length === 0) {
    messagesContainer.innerHTML = savedWelcomeHTML || '';
    // Re-attach suggestion card listeners
    messagesContainer.querySelectorAll(".suggestion-card").forEach((card) => {
      card.addEventListener("click", () => {
        sendQuery(card.dataset.prompt);
      });
    });
    exportBtn.style.display = "none";
    return;
  }
  exportBtn.style.display = "flex";

  let html = '<div class="messages-inner">';
  messages.forEach((msg, idx) => {
    const ts = msg.timestamp ? `<span class="msg-timestamp">${formatTime(msg.timestamp)}</span>` : "";
    if (msg.role === "user") {
      const isEditing = msg.editing;
      if (isEditing) {
        html += `<div class="msg-user msg-editing">
          <textarea class="edit-textarea" data-idx="${idx}">${escapeHtml(msg.content)}</textarea>
          <div class="edit-actions">
            <button class="edit-btn save" onclick="saveEdit(${idx})">Save & Send</button>
            <button class="edit-btn cancel" onclick="cancelEdit(${idx})">Cancel</button>
          </div>
        </div>`;
      } else {
        html += `<div class="msg-user">
          <div class="msg-user-content">${escapeHtml(msg.content)}</div>
          <div class="msg-user-actions">
            <button class="msg-action-sm" onclick="copyMessage(${idx})" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="msg-action-sm" onclick="editMessage(${idx})" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          ${ts}
        </div>`;
      }
    } else {
      const rendered = renderMarkdown(msg.content);
      const showCursor = msg.isStreaming ? '<span class="stream-cursor"></span>' : '';
      const followups = msg.followups && !msg.isStreaming ? renderFollowups(msg.followups) : '';
      const sources = msg.sources && !msg.isStreaming ? renderSources(msg.sources) : '';
      const modelLabel = msg.model ? getModelLabel(currentProvider, msg.model) : '';
      const actions = !msg.isStreaming ? `
        <div class="msg-actions">
          <button class="msg-action" onclick="copyMessage(${idx})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy
          </button>
          ${idx === messages.length - 1 ? `
          <button class="msg-action" onclick="regenerate()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg> Regenerate
          </button>` : ''}
          ${msg.elapsed ? `<span class="msg-action" style="cursor:default"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${msg.elapsed}</span>` : ''}
          ${modelLabel ? `<span class="msg-action" style="cursor:default"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>${modelLabel}</span>` : ''}
          ${ts}
        </div>
      ` : '';
      html += `
        <div class="msg-assistant">
          <div class="msg-avatar">${AVATAR_SVG}</div>
          <div class="msg-content">
            <div class="prose">${rendered}${showCursor}</div>
            ${sources}
            ${followups}
            ${actions}
          </div>
        </div>
      `;
    }
  });
  html += "</div>";
  messagesContainer.innerHTML = html;

  messagesContainer.querySelectorAll(".prose").forEach(enhanceCodeBlocks);
  scrollToBottom();
}

function renderFollowups(suggestions) {
  if (!suggestions || suggestions.length === 0) return "";
  return `<div class="followups">${suggestions.map(s => `
    <button class="followup-chip" onclick="sendFollowup('${s.replace(/'/g, "\\'")}')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      ${escapeHtml(s)}
    </button>
  `).join("")}</div>`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }

function isNearBottom() {
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
  return scrollHeight - scrollTop - clientHeight < 150;
}

// Lightweight streaming update
let streamingProseEl = null;
let streamingRAF = null;
let streamingPendingText = "";

function startStreamingMessage() {
  const proseEls = messagesContainer.querySelectorAll(".msg-assistant:last-child .prose");
  streamingProseEl = proseEls[proseEls.length - 1];
}

function updateStreamingContent(text) {
  streamingPendingText = text;
  if (streamingRAF) return;
  streamingRAF = requestAnimationFrame(() => {
    streamingRAF = null;
    if (!streamingProseEl) return;
    streamingProseEl.innerHTML = renderMarkdown(streamingPendingText) + '<span class="stream-cursor"></span>';
    if (isNearBottom()) scrollToBottom();
  });
}

function finishStreamingMessage() {
  if (streamingRAF) { cancelAnimationFrame(streamingRAF); streamingRAF = null; }
  streamingProseEl = null;
}

// ============================================================
// AI API CALLS — IX backend proxy (no user signup required)
// ============================================================

/** Returns the system prompt with live date/time and user's custom instructions */
function getSystemPrompt() {
  const now = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short"
  });
  let prompt = SYSTEM_PROMPT.replace("{CURRENT_DATETIME}", now);
  if (userSettings.customInstructions && userSettings.customInstructions.trim()) {
    prompt += "\n\n## User's Custom Instructions\n" + userSettings.customInstructions.trim();
  }
  return prompt;
}

/**
 * Call the AI via the IX backend — a lightweight proxy that holds the
 * LLM credentials server-side. Users do not need to create an account,
 * sign up, or authenticate. The backend streams responses via SSE.
 *
 * Returns { stream, provider, model } where `stream` is an async iterable of
 * { text } chunks, matching the shape the rest of the app expects.
 */
async function callAI(provider, model, messages, temperature, signal) {
  const systemPrompt = getSystemPrompt() + (window._searchContext || "");
  window._searchContext = "";

  // Build the message array: only user/assistant turns (no system role — backend handles it).
  const apiMessages = messages
    .filter(m => m.content && m.content.trim())
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  // Call the IX backend proxy. port/8000 is replaced at deploy time.
  const API_BASE = 'port/8000'.startsWith('__') ? 'http://localhost:8000' : 'port/8000';

  let response;
  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        system: systemPrompt,
        temperature: parseFloat(temperature),
      }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error("Could not connect to the AI service. Please try again.");
  }

  if (!response.ok) {
    throw new Error("The AI service returned an error. Please try again.");
  }

  // Parse the SSE stream from the backend: data: {"text":"..."} per chunk.
  const stream = (async function* () {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const evt of events) {
        for (const line of evt.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") return;
          try {
            const json = JSON.parse(data);
            if (json.error) throw new Error(json.error);
            if (json.text) yield { text: json.text, elapsed: null };
          } catch (e) {
            if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
    }
  })();

  return { stream, provider: "ix", model: IX_MODEL_LABEL };
}





// ============================================================
// WEB SEARCH — gives the AI up-to-date knowledge
// ============================================================

async function searchWeb(query) {
  const results = [];
  const searchTerms = query.slice(0, 200);

  try {
    // Search Wikipedia
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms)}&format=json&origin=*&srlimit=3`;
    const wikiResponse = await fetch(wikiSearchUrl);
    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      const searchResults = wikiData.query?.search || [];
      for (const result of searchResults.slice(0, 2)) {
        try {
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
          const summaryResponse = await fetch(summaryUrl);
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            if (summaryData.extract) {
              results.push({
                title: summaryData.title,
                content: summaryData.extract,
                source: "Wikipedia"
              });
            }
          }
        } catch {}
      }
    }
  } catch {}

  try {
    // Also try DuckDuckGo Instant Answer
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerms)}&format=json&no_html=1&skip_disambig=1`;
    const ddgResponse = await fetch(ddgUrl);
    if (ddgResponse.ok) {
      const ddgData = await ddgResponse.json();
      if (ddgData.AbstractText) {
        results.push({
          title: ddgData.Heading || "DuckDuckGo",
          content: ddgData.AbstractText,
          source: ddgData.AbstractSource || "DuckDuckGo"
        });
      }
      for (const topic of (ddgData.RelatedTopics || []).slice(0, 2)) {
        if (topic.Text) {
          results.push({
            title: "Related",
            content: topic.Text,
            source: "DuckDuckGo"
          });
        }
      }
    }
  } catch {}

  return results;
}

function formatSearchContext(results) {
  if (!results || results.length === 0) return "";
  let formatted = "\n\n## Relevant Web Search Results\n";
  formatted += "The following information was retrieved from the web to help you answer accurately. Use this information as context, but also use your own knowledge.\n\n";
  for (const result of results) {
    formatted += `### ${result.title}\n${result.content}\n\n`;
  }
  formatted += "\nWhen using this web search information, cite the source naturally in your response. If the search results are not relevant to the question, ignore them and use your own knowledge.\n";
  return formatted;
}

// ============================================================
// CHAT LOGIC
// ============================================================

async function sendQuery(query, isRegenerate = false) {
  if (isThinking) return;

  // IX Intelligence — always free, no API key needed

  if (!isRegenerate) messages.push({ role: "user", content: query, timestamp: Date.now() });

  isThinking = true;
  setThinking(true, "Understanding your request...");
  messages.push({ role: "assistant", content: "", isStreaming: true, timestamp: Date.now() });
  renderMessages();
  startStreamingMessage();

  abortController = new AbortController();

  const startTime = Date.now();

  // Web search for up-to-date context
  let searchContext = "";
  setThinking(true, "Searching the web for current information...");
  try {
    const searchResults = await searchWeb(query);
    searchContext = formatSearchContext(searchResults);
  } catch {}

  try {
    // Store search context for the AI call
    window._searchContext = searchContext;
    const result = await callAI(
      currentProvider,
      currentModel,
      messages.filter(m => !m.isStreaming && m.content),
      userSettings.temperature ?? 0.3,
      abortController.signal
    );

    setThinking(true, "Generating response...");
    thinkingBarFill.style.width = "50%";

    let fullContent = "";

    for await (const chunk of result.stream) {
      fullContent += chunk.text;
      setThinking(false);
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        role: "assistant",
        content: fullContent,
        isStreaming: true,
      };
      updateStreamingContent(fullContent);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

    // Generate follow-up suggestions
    const followups = generateFollowups(query, fullContent);

    finishStreamingMessage();
    messages[messages.length - 1] = {
      ...messages[messages.length - 1],
      role: "assistant",
      content: fullContent,
      isStreaming: false,
      elapsed,
      model: currentModel,
      followups: followups.length > 0 ? followups : undefined,
    };

    // Auto-generate title from first message
    if (!currentChatId || (conversations.find(c => c.id === currentChatId)?.title === "New Chat")) {
      if (!isRegenerate) {
        chatTitle = generateChatTitle(query);
        chatTitleEl.textContent = chatTitle;
      }
    }

    saveCurrentChat();
    renderMessages();

    // Clear attached files after send
    attachedFiles = [];
    renderFilePreviews();
    loadConversations();
    queryInput.focus();
  } catch (error) {
    finishStreamingMessage();
    if (error.name === "AbortError") {
      if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
        messages[messages.length - 1].isStreaming = false;
        saveCurrentChat();
        renderMessages();
      }
    } else {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        role: "assistant",
        content: `I encountered an error: ${error.message}`,
        isStreaming: false,
      };
      renderMessages();
      showToast(error.message, "error");
    }
  } finally {
    isThinking = false;
    setThinking(false);
    abortController = null;
  }
}

function generateChatTitle(query) {
  const words = query.trim().split(/\s+/);
  if (words.length <= 6) return query.trim();
  return words.slice(0, 6).join(" ") + "...";
}

function generateFollowups(query, response) {
  // Generate contextual follow-up suggestions based on the query
  const lower = query.toLowerCase();
  const followups = [];

  if (lower.includes("code") || lower.includes("function") || lower.includes("script")) {
    followups.push("Can you add comments to the code?");
    followups.push("How would I optimize this?");
    followups.push("Write a unit test for this");
  } else if (lower.includes("explain") || lower.includes("what is") || lower.includes("how")) {
    followups.push("Can you give a real-world example?");
    followups.push("What are the practical applications?");
    followups.push("Explain it even more simply");
  } else if (lower.includes("compare") || lower.includes("vs") || lower.includes("difference")) {
    followups.push("Which would you recommend?");
    followups.push("What are the trade-offs?");
    followups.push("Are there alternatives?");
  } else if (lower.includes("write") || lower.includes("create") || lower.includes("story")) {
    followups.push("Make it longer");
    followups.push("Try a different tone");
    followups.push("Add more detail");
  } else {
    followups.push("Tell me more about this");
    followups.push("What should I consider next?");
    followups.push("Can you give an example?");
  }

  return followups.slice(0, 3);
}

function setThinking(active, label) {
  if (active) {
    thinkingIndicator.style.display = "flex";
    if (label) thinkingText.textContent = label;
    thinkingBarFill.style.width = "10%";
    sendBtn.style.display = "none";
    stopBtn.style.display = "flex";
  } else {
    thinkingIndicator.style.display = "none";
    sendBtn.style.display = "flex";
    stopBtn.style.display = "none";
  }
}

function handleStop() { abortController?.abort(); }

function handleNewChat() {
  if (isThinking) handleStop();
  messages = [];
  currentChatId = null;
  chatTitle = "New Chat";
  chatTitleEl.textContent = chatTitle;
  attachedFiles = [];
  renderFilePreviews();
  renderMessages();
  closeSidebar();
  queryInput.focus();
}

function handleRegenerate() {
  if (isThinking) return;
  const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
  if (lastUserIdx === -1) return;
  const realIdx = messages.length - 1 - lastUserIdx;
  const lastUserMsg = messages[realIdx];
  messages = messages.slice(0, realIdx + 1);
  sendQuery(lastUserMsg.content, true);
}

// ============================================================
// CONVERSATIONS — localStorage-based
// ============================================================

function getChatsKey() { return `ix_chats_${currentUser.id}`; }

async function loadConversations() {
  conversations = Storage.get(getChatsKey(), []);
  renderChatList();
}

function saveCurrentChat() {
  if (messages.length === 0) return;

  const chatData = {
    id: currentChatId || "chat_" + Date.now(),
    title: chatTitle,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      model: m.model,
      elapsed: m.elapsed,
    })),
    updatedAt: Date.now(),
    pinned: false,
  };

  currentChatId = chatData.id;

  const idx = conversations.findIndex(c => c.id === currentChatId);
  if (idx >= 0) {
    chatData.pinned = conversations[idx].pinned;
    conversations[idx] = chatData;
  } else {
    conversations.unshift(chatData);
  }

  // Keep only last 100 conversations
  if (conversations.length > 100) {
    conversations = conversations.slice(0, 100);
  }

  Storage.set(getChatsKey(), conversations);
}

function renderChatList() {
  // Sort: pinned first, then by updatedAt
  const sorted = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  const filtered = searchInput.value
    ? sorted.filter((c) => c.title.toLowerCase().includes(searchInput.value.toLowerCase()))
    : sorted;

  if (filtered.length === 0) {
    chatList.innerHTML = '<div class="empty-chats">No conversations yet</div>';
    return;
  }

  chatList.innerHTML = filtered.map((c) => `
    <div class="chat-item ${c.id === currentChatId ? "active" : ""} ${c.pinned ? "pinned" : ""}" data-id="${c.id}">
      <span class="chat-item-title">${escapeHtml(c.title)}</span>
      <div class="chat-item-actions">
        <button class="chat-item-action pin" data-action="pin" data-id="${c.id}" title="${c.pinned ? 'Unpin' : 'Pin'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="${c.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
        </button>
        <button class="chat-item-action" data-action="rename" data-id="${c.id}" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="chat-item-action delete" data-action="delete" data-id="${c.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join("");

  chatList.querySelectorAll(".chat-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".chat-item-action")) return;
      loadConversation(item.dataset.id);
    });
  });

  chatList.querySelectorAll(".chat-item-action").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "pin") togglePin(id);
      else if (action === "rename") renameChat(id);
      else if (action === "delete") deleteConversation(id);
    });
  });
}

function loadConversation(chatId) {
  if (isThinking) handleStop();
  const chat = conversations.find(c => c.id === chatId);
  if (!chat) return;
  messages = (chat.messages || []).map((m) => ({ role: m.role, content: m.content, isStreaming: false, timestamp: m.timestamp, model: m.model, elapsed: m.elapsed }));
  currentChatId = chat.id;
  chatTitle = chat.title;
  chatTitleEl.textContent = chatTitle;
  renderMessages();
  renderChatList();
  closeSidebar();
}

function deleteConversation(chatId) {
  conversations = conversations.filter((c) => c.id !== chatId);
  Storage.set(getChatsKey(), conversations);
  renderChatList();
  if (currentChatId === chatId) handleNewChat();
  showToast("Conversation deleted", "success");
}

function togglePin(chatId) {
  const chat = conversations.find(c => c.id === chatId);
  if (!chat) return;
  chat.pinned = !chat.pinned;
  Storage.set(getChatsKey(), conversations);
  renderChatList();
  showToast(chat.pinned ? "Pinned" : "Unpinned", "success");
}

function renameChat(chatId) {
  const chat = conversations.find(c => c.id === chatId);
  if (!chat) return;
  const newName = prompt("Rename conversation:", chat.title);
  if (!newName || newName === chat.title) return;
  chat.title = newName;
  Storage.set(getChatsKey(), conversations);
  if (currentChatId === chatId) {
    chatTitle = newName;
    chatTitleEl.textContent = newName;
  }
  renderChatList();
}

// ============================================================
// FOLDERS
// ============================================================

function getFoldersKey() { return `ix_folders_${currentUser.id}`; }

function loadFolders() {
  folders = Storage.get(getFoldersKey(), []);
  renderFolders();
}

function renderFolders() {
  if (folders.length === 0) {
    foldersHeader.style.display = "none";
    folderList.innerHTML = "";
    return;
  }
  foldersHeader.style.display = "flex";
  folderList.innerHTML = folders.map(f => `
    <div class="folder-item" data-id="${f.id}">
      <div class="folder-dot" style="background:${f.color}"></div>
      <span class="folder-name">${escapeHtml(f.name)}</span>
      <span class="folder-count">${conversations.filter(c => c.folder_id === f.id).length}</span>
    </div>
  `).join("");
}

newFolderBtn.addEventListener("click", () => {
  const name = prompt("Folder name:", "New Folder");
  if (!name) return;
  folders.push({ id: "f_" + Date.now(), name, color: userSettings.accentColor || "#ffffff" });
  Storage.set(getFoldersKey(), folders);
  renderFolders();
  showToast("Folder created", "success");
});

// ============================================================
// MEMORY — localStorage-based
// ============================================================

function getMemoryKey() { return `ix_memory_${currentUser.id}`; }

function loadMemories() {
  const mems = Storage.get(getMemoryKey(), []);
  memoryCount = mems.length;
  updateMemoryBadge();
}

function updateMemoryBadge() {
  if (memoryCount > 0) {
    memoryBtn.style.display = "flex";
    memoryCountEl.textContent = memoryCount;
  } else {
    memoryBtn.style.display = "none";
  }
}

function showMemoryPanel() {
  const mems = Storage.get(getMemoryKey(), []);
  if (mems.length === 0) {
    memoryList.innerHTML = '<div class="empty-state">No memories yet. IX will learn about you as you chat.</div>';
  } else {
    memoryList.innerHTML = mems.map((m) => `
      <div class="memory-item">
        <div class="memory-item-content">
          <span class="memory-item-tag">${m.kind}</span>
          <div class="memory-item-text">${escapeHtml(m.content)}</div>
        </div>
        <button class="memory-item-delete" onclick="deleteMemory('${m.id}')">&times;</button>
      </div>
    `).join("");
  }
  memoryPanel.style.display = "flex";
}

function deleteMemory(id) {
  let mems = Storage.get(getMemoryKey(), []);
  mems = mems.filter(m => m.id !== id);
  Storage.set(getMemoryKey(), mems);
  memoryCount = mems.length;
  updateMemoryBadge();
  showMemoryPanel();
}

$("clear-memory-btn").addEventListener("click", () => {
  if (!confirm("Clear all memories? This cannot be undone.")) return;
  Storage.remove(getMemoryKey());
  memoryCount = 0;
  updateMemoryBadge();
  showMemoryPanel();
  showToast("All memories cleared", "success");
});

// ============================================================
// SETTINGS — localStorage-based
// ============================================================

function getSettingsKey() { return `ix_settings_${currentUser.id}`; }

function loadSettings() {
  userSettings = Storage.get(getSettingsKey(), {});

  // Apply settings
  applyTheme("dark");
  if (userSettings.accentColor) applyAccentColor(userSettings.accentColor);
  if (userSettings.fontSize) document.documentElement.style.fontSize = userSettings.fontSize + "px";
  if (userSettings.chatWidth) document.documentElement.style.setProperty("--chat-width", userSettings.chatWidth + "px");

  currentProvider = "free"; // Always free
  currentModel = "ix-intelligence"; // Always IX Intelligence

  // Update settings UI
  // Theme setting removed — always dark
  $("setting-fontsize").value = userSettings.fontSize || 15;
  $("fontsize-value").textContent = (userSettings.fontSize || 15) + "px";
  $("setting-chatwidth").value = userSettings.chatWidth || 748;
  $("chatwidth-value").textContent = (userSettings.chatWidth || 748) + "px";
  $("setting-animation").value = userSettings.animationIntensity ?? 1;
  $("animation-value").textContent = (userSettings.animationIntensity ?? 1) + "x";

  const memToggle = $("setting-memory");
  if (userSettings.memoryEnabled === false) memToggle.classList.remove("on");

  const ciEl = $("setting-custom-instructions");
  if (ciEl) ciEl.value = userSettings.customInstructions || "";

  const tempEl = $("setting-temperature");
  if (tempEl) {
    tempEl.value = userSettings.temperature != null ? userSettings.temperature : 0.3;
    const tempVal = $("temperature-value");
    if (tempVal) tempVal.textContent = parseFloat(tempEl.value).toFixed(1);
  }

  updateModelSelectorUI();

  document.querySelectorAll(".color-swatch").forEach(swatch => {
    swatch.classList.toggle("active", swatch.dataset.color === (userSettings.accentColor || "#ffffff"));
  });
}

function updateModelSelectorUI() {
  const provider = PROVIDERS[currentProvider];
  if (!provider) return;
  modelSelectorLabel.textContent = "IX Intelligence";

  modelSelectorDropdown.innerHTML = Object.entries(PROVIDERS).map(([key, p]) => `
    <div class="model-group">
      <div class="model-group-label">${p.label}</div>
      ${p.models.map(m => `
        <div class="model-option ${key === currentProvider && m.id === currentModel ? "active" : ""}" data-provider="${key}" data-model="${m.id}">
          <div class="model-option-info">
            <span class="model-option-name">${m.label}</span>
            <span class="model-option-desc">${m.desc || ""}</span>
          </div>
          <span class="model-option-provider">${p.label}</span>
        </div>
      `).join("")}
    </div>
  `).join("");

  modelSelectorDropdown.querySelectorAll(".model-option").forEach(opt => {
    opt.addEventListener("click", () => {
      currentProvider = opt.dataset.provider;
      currentModel = opt.dataset.model;
      updateModelSelectorUI();
      saveSettings();
      modelSelectorDropdown.classList.remove("open");
      const name = opt.querySelector(".model-option-name").textContent;
      showToast(`Switched to ${name}`, "success");
    });
  });
}

async function saveSettings() {
  userSettings.theme = currentTheme;
  userSettings.provider = currentProvider;
  userSettings.model = currentModel;
  userSettings.accentColor = document.querySelector(".color-swatch.active")?.dataset.color || "#ffffff";
  userSettings.fontSize = parseInt($("setting-fontsize").value);
  userSettings.chatWidth = parseInt($("setting-chatwidth").value);
  userSettings.animationIntensity = parseFloat($("setting-animation").value);
  userSettings.memoryEnabled = $("setting-memory").classList.contains("on");
  const ci = $("setting-custom-instructions");
  if (ci) userSettings.customInstructions = ci.value;
  const tempEl = $("setting-temperature");
  if (tempEl) {
    userSettings.temperature = parseFloat(tempEl.value);
    const tempVal = $("temperature-value");
    if (tempVal) tempVal.textContent = parseFloat(tempEl.value).toFixed(1);
  }

  Storage.set(getSettingsKey(), userSettings);
}

// Settings event listeners
// Theme select removed — always dark mode

document.querySelectorAll(".color-swatch").forEach(swatch => {
  swatch.addEventListener("click", () => {
    document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
    swatch.classList.add("active");
    applyAccentColor(swatch.dataset.color);
    saveSettings();
  });
});

$("setting-fontsize").addEventListener("input", (e) => {
  $("fontsize-value").textContent = e.target.value + "px";
  document.documentElement.style.fontSize = e.target.value + "px";
});
$("setting-fontsize").addEventListener("change", saveSettings);

$("setting-chatwidth").addEventListener("input", (e) => {
  $("chatwidth-value").textContent = e.target.value + "px";
  document.documentElement.style.setProperty("--chat-width", e.target.value + "px");
});
$("setting-chatwidth").addEventListener("change", saveSettings);

$("setting-animation").addEventListener("input", (e) => {
  $("animation-value").textContent = e.target.value + "x";
});
$("setting-animation").addEventListener("change", saveSettings);

const tempSlider = $("setting-temperature");
if (tempSlider) {
  tempSlider.addEventListener("input", (e) => {
    $("temperature-value").textContent = parseFloat(e.target.value).toFixed(1);
  });
  tempSlider.addEventListener("change", saveSettings);
}

const ciEl2 = $("setting-custom-instructions");
if (ciEl2) {
  ciEl2.addEventListener("change", saveSettings);
}

$("setting-memory").addEventListener("click", function() {
  this.classList.toggle("on");
  saveSettings();
});

settingsBtn.addEventListener("click", () => settingsDrawer.classList.add("open"));
settingsClose.addEventListener("click", () => settingsDrawer.classList.remove("open"));

// Model selector dropdown
// Model selector dropdown removed — IX Intelligence only

// Model selector dropdown click handler removed

// ============================================================
// FILE UPLOADS — Client-side text extraction
// ============================================================

$("attach-btn").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  for (const file of e.target.files) {
    await processFile(file);
  }
  fileInput.value = "";
});

async function processFile(file) {
  // For text files, read content directly
  if (file.type.startsWith("text/") || file.name.match(/\.(txt|md|json|csv|js|ts|py|java|c|cpp|go|rs|rb|php|html|css|xml|yaml|yml|sql|sh)$/i)) {
    const text = await file.text();
    attachedFiles.push({
      id: "file_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      content: text.slice(0, 50000), // Limit to 50k chars
      type: "text",
    });
    renderFilePreviews();
    showToast(`Attached: ${file.name}`, "success");
  } else if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      attachedFiles.push({
        id: "file_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        content: `[Image: ${file.name}]`,
        type: "image",
        dataUrl: reader.result,
      });
      renderFilePreviews();
      showToast(`Attached: ${file.name}`, "success");
    };
    reader.readAsDataURL(file);
  } else {
    showToast(`Unsupported file type: ${file.name}`, "error");
  }
}

function renderFilePreviews() {
  if (attachedFiles.length === 0) {
    filePreviews.style.display = "none";
    return;
  }
  filePreviews.style.display = "flex";
  filePreviews.innerHTML = attachedFiles.map((f, i) => `
    <div class="file-preview-chip">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span>${escapeHtml(f.name)}</span>
      <span class="remove" onclick="removeFile(${i})">&times;</span>
    </div>
  `).join("");
}

window.removeFile = (i) => {
  attachedFiles.splice(i, 1);
  renderFilePreviews();
};

// Drag and drop
let dragCounter = 0;

document.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    dragOverlay.classList.add("open");
    inputWrapper.classList.add("dragging");
  }
});

document.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dragOverlay.classList.remove("open");
    inputWrapper.classList.remove("dragging");
  }
});

document.addEventListener("dragover", (e) => { e.preventDefault(); });

document.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dragOverlay.classList.remove("open");
  inputWrapper.classList.remove("dragging");

  const files = e.dataTransfer.files;
  for (const file of files) {
    await processFile(file);
  }
});

// ============================================================
// EXPORT
// ============================================================

exportBtn.addEventListener("click", () => exportPanel.style.display = "flex");

window.exportChat = (format) => {
  if (!currentChatId) {
    showToast("No conversation to export", "error");
    return;
  }
  if (format === "json") {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  exportPanel.style.display = "none";
  showToast("Exported successfully", "success");
};

// ============================================================
// COMMAND PALETTE
// ============================================================

const COMMANDS = [
  { label: "New Chat", shortcut: ["Ctrl", "N"], icon: "M12 5v14M5 12h14", action: handleNewChat },
  { label: "Toggle Theme", shortcut: ["Ctrl", "J"], icon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", action: toggleTheme },
  { label: "Open Settings", shortcut: ["Ctrl", ","], icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", action: () => settingsDrawer.classList.add("open") },
  { label: "Toggle Sidebar", shortcut: ["Ctrl", "B"], icon: "M3 12h18M3 6h18M3 18h18", action: () => sidebar.classList.toggle("open") },
  { label: "Memory", shortcut: ["Ctrl", "M"], icon: "M12 2a3 3 0 0 0-3 3v1.5", action: showMemoryPanel },
  { label: "Export Chat", shortcut: ["Ctrl", "E"], icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", action: () => exportPanel.style.display = "flex" },
  { label: "Attach File", shortcut: ["Ctrl", "U"], icon: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19", action: () => fileInput.click() },
];

function openCommandPalette() {
  commandPalette.classList.add("open");
  commandInput.value = "";
  commandIndex = 0;
  renderCommands("");
  setTimeout(() => commandInput.focus(), 50);
}

function closeCommandPalette() {
  commandPalette.classList.remove("open");
}

function renderCommands(query) {
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
  if (filtered.length === 0) {
    commandList.innerHTML = '<div class="empty-state">No commands found</div>';
    return;
  }
  commandList.innerHTML = filtered.map((c, i) => `
    <div class="command-item ${i === commandIndex ? "active" : ""}" data-index="${i}">
      <span class="command-item-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${c.icon}"/></svg>
      </span>
      <span class="command-item-label">${c.label}</span>
      <span class="command-item-shortcut">${c.shortcut.map(s => `<span class="kbd">${s}</span>`).join("")}</span>
    </div>
  `).join("");

  commandList.querySelectorAll(".command-item").forEach((item, i) => {
    item.addEventListener("click", () => executeCommand(i, query));
    item.addEventListener("mouseenter", () => {
      commandIndex = i;
      commandList.querySelectorAll(".command-item").forEach((el, idx) => {
        el.classList.toggle("active", idx === commandIndex);
      });
    });
  });
}

function executeCommand(index, query) {
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes((query || "").toLowerCase()));
  if (filtered[index]) {
    closeCommandPalette();
    filtered[index].action();
  }
}

commandInput.addEventListener("input", () => {
  commandIndex = 0;
  renderCommands(commandInput.value);
});

commandInput.addEventListener("keydown", (e) => {
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(commandInput.value.toLowerCase()));
  if (e.key === "ArrowDown") {
    e.preventDefault();
    commandIndex = (commandIndex + 1) % filtered.length;
    renderCommands(commandInput.value);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    commandIndex = (commandIndex - 1 + filtered.length) % filtered.length;
    renderCommands(commandInput.value);
  } else if (e.key === "Enter") {
    e.preventDefault();
    executeCommand(commandIndex, commandInput.value);
  } else if (e.key === "Escape") {
    closeCommandPalette();
  }
});

commandPalette.addEventListener("click", (e) => {
  if (e.target === commandPalette) closeCommandPalette();
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener("keydown", (e) => {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === "k") {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (ctrl && e.key === "n") {
    e.preventDefault();
    handleNewChat();
    return;
  }
  if (ctrl && e.key === "j") {
    e.preventDefault();
    toggleTheme();
    return;
  }
  if (ctrl && e.key === "b") {
    e.preventDefault();
    sidebar.classList.toggle("open");
    return;
  }
  if (ctrl && e.key === ",") {
    e.preventDefault();
    settingsDrawer.classList.toggle("open");
    return;
  }
  if (ctrl && e.key === "m") {
    e.preventDefault();
    showMemoryPanel();
    return;
  }
  if (ctrl && e.key === "e") {
    e.preventDefault();
    if (currentChatId) exportPanel.style.display = "flex";
    return;
  }
  if (ctrl && e.key === "u") {
    e.preventDefault();
    fileInput.click();
    return;
  }
  if (e.key === "Escape") {
    closeCommandPalette();
    settingsDrawer.classList.remove("open");
    modelSelectorDropdown.classList.remove("open");
    contextMenu.classList.remove("open");
    exportPanel.style.display = "none";
  }
});

// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.editMessage = function (idx) {
  if (isThinking) return;
  messages[idx].editing = true;
  renderMessages();
  const textarea = messagesContainer.querySelector(`.edit-textarea[data-idx="${idx}"]`);
  if (textarea) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }
};

window.saveEdit = function (idx) {
  const textarea = messagesContainer.querySelector(`.edit-textarea[data-idx="${idx}"]`);
  if (!textarea) return;
  const newText = textarea.value.trim();
  if (!newText) return;
  messages[idx].editing = false;
  messages[idx].content = newText;
  messages = messages.slice(0, idx + 1);
  sendQuery(newText, true);
};

window.cancelEdit = function (idx) {
  messages[idx].editing = false;
  renderMessages();
};

window.exportAsMarkdown = function () {
  if (messages.length === 0) return;
  let md = `# ${chatTitle}\n\n`;
  messages.forEach((msg) => {
    if (msg.role === "user") {
      md += `**User:** ${msg.content}\n\n`;
    } else {
      md += `**IX:**\n\n${msg.content}\n\n`;
    }
  });
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chatTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
  exportPanel.style.display = "none";
  showToast("Conversation exported as markdown", "success");
};

window.copyMessage = function (idx) {
  const msg = messages[idx];
  if (msg) {
    navigator.clipboard.writeText(msg.content);
    const btn = event.currentTarget;
    btn.classList.add("copied");
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied';
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
    }, 2000);
  }
};

window.regenerate = handleRegenerate;
window.loadConversation = loadConversation;
window.deleteConversation = deleteConversation;
window.deleteMemory = deleteMemory;
window.sendFollowup = (text) => {
  queryInput.value = text;
  handleSend();
};

// ============================================================
// SIDEBAR
// ============================================================

function closeSidebar() { sidebar.classList.remove("open"); }

// ============================================================
// INPUT
// ============================================================

function autoResize() {
  queryInput.style.height = "auto";
  queryInput.style.height = Math.min(queryInput.scrollHeight, 200) + "px";
}

function handleSend() {
  const text = queryInput.value.trim();
  if (!text || isThinking) return;

  // Include attached file content in the query
  let fullQuery = text;
  if (attachedFiles.length > 0) {
    const fileContents = attachedFiles
      .filter(f => f.type === "text")
      .map(f => `\n\n[Attached file: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``)
      .join("");
    if (fileContents) fullQuery += fileContents;
  }

  queryInput.value = "";
  autoResize();
  sendQuery(fullQuery);
}

messagesContainer.addEventListener("scroll", () => {
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
  scrollBtn.style.display = scrollHeight - scrollTop - clientHeight > 200 ? "flex" : "none";
});

// ============================================================
// EVENT LISTENERS
// ============================================================

queryInput.addEventListener("input", autoResize);
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

sendBtn.addEventListener("click", handleSend);
stopBtn.addEventListener("click", handleStop);
newChatBtn.addEventListener("click", handleNewChat);
menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
sidebarOverlay.addEventListener("click", closeSidebar);
searchInput.addEventListener("input", renderChatList);
scrollBtn.addEventListener("click", scrollToBottom);
memoryBtn.addEventListener("click", showMemoryPanel);

document.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", () => {
    memoryPanel.style.display = "none";
    exportPanel.style.display = "none";
  });
});

memoryPanel.addEventListener("click", (e) => {
  if (e.target === memoryPanel) memoryPanel.style.display = "none";
});

exportPanel.addEventListener("click", (e) => {
  if (e.target === exportPanel) exportPanel.style.display = "none";
});

// Suggestion cards are handled dynamically in renderMessages()

// ============================================================
// INIT
// ============================================================

if (window.mermaid) {
  mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
}

(async () => {
  // Save welcome screen HTML before any renderMessages() call replaces it
  savedWelcomeHTML = messagesContainer.innerHTML;
  const restored = tryRestoreSession();
  if (!restored) authScreen.style.display = "flex";
})();
