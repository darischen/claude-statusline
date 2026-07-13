window.CS = window.CS || {};

(function (CS) {
  const SPECIAL_RE = /[　-鿿가-힯＀-￯]/g;
  CS.DEFAULT_WINDOW = 200000;

  CS.estimateTokens = function (text) {
    if (!text || text.trim() === "") return 0;
    const special = (text.match(SPECIAL_RE) || []).length;
    const rest = text.length - special;
    return Math.ceil(rest / 4 + special / 1.5);
  };

  CS.getConversationId = function () {
    const m = location.pathname.match(/\/chat\/([0-9a-f-]{16,})/i);
    return m ? m[1] : null;
  };

  // claude.ai chat-app context window for a given model id, paid plans.
  CS.windowForModel = function (model) {
    const m = (model || "").toLowerCase();
    if (/sonnet-?5/.test(m)) return 1000000;
    if (/opus-4-[678]/.test(m)) return 500000;
    if (/sonnet-4-6/.test(m)) return 500000;
    return CS.DEFAULT_WINDOW;
  };

  CS.modelLabel = function (model) {
    const m = (model || "").toLowerCase();
    if (/opus-4-8/.test(m)) return "Opus 4.8";
    if (/opus-4-7/.test(m)) return "Opus 4.7";
    if (/opus-4-6/.test(m)) return "Opus 4.6";
    if (/opus-4-5/.test(m)) return "Opus 4.5";
    if (/sonnet-4-6/.test(m)) return "Sonnet 4.6";
    if (/sonnet-4-5/.test(m)) return "Sonnet 4.5";
    if (/sonnet-?5/.test(m)) return "Sonnet 5";
    if (/haiku-4-5/.test(m)) return "Haiku 4.5";
    if (/fable-?5/.test(m)) return "Fable 5";
    return model || "";
  };

  CS.fetchContext = async function () {
    const id = CS.getConversationId();
    if (!id) return { used: 0, window: CS.DEFAULT_WINDOW, pct: 0, model: "", modelLabel: "" };

    const org = await CS.getOrgId();
    if (!org) return null;

    let res;
    try {
      res = await fetch(
        "https://claude.ai/api/organizations/" + org +
          "/chat_conversations/" + id + "?tree=True&rendering_mode=raw",
        { credentials: "include", headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      return null;
    }
    if (!res.ok) return null;

    let conv;
    try { conv = await res.json(); } catch (e) { return null; }

    const messages = (conv && conv.chat_messages) || (conv && conv.messages) || [];
    let used = 0;
    for (const msg of messages) {
      used += CS.estimateTokens(textOf(msg));
    }

    const model = modelOf(conv, messages);
    const win = CS.windowForModel(model);
    const pct = Math.max(0, Math.min(100, Math.round((used / win) * 100)));
    return { used: used, window: win, pct: pct, model: model, modelLabel: CS.modelLabel(model) };
  };

  function modelOf(conv, messages) {
    const msgs = messages || (conv && (conv.chat_messages || conv.messages)) || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i] && typeof msgs[i].model === "string" && msgs[i].model) return msgs[i].model;
    }
    if (conv && typeof conv.model === "string" && conv.model) return conv.model;
    if (conv && conv.settings && typeof conv.settings.model === "string") return conv.settings.model;
    return "";
  }

  function textOf(msg) {
    if (!msg) return "";
    if (typeof msg.text === "string" && msg.text) return msg.text;
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      let out = "";
      for (const block of msg.content) {
        if (block && typeof block.text === "string") out += block.text + " ";
      }
      return out;
    }
    return "";
  }
})(window.CS);
