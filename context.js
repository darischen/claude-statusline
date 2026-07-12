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

  CS.fetchContext = async function () {
    const id = CS.getConversationId();
    if (!id) return { used: 0, window: CS.DEFAULT_WINDOW, pct: 0 };

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

    const win = CS.DEFAULT_WINDOW;
    const pct = Math.max(0, Math.min(100, Math.round((used / win) * 100)));
    return { used: used, window: win, pct: pct };
  };

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
