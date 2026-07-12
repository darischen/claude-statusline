window.CS = window.CS || {};

(function (CS) {
  CS.colorFor = function (pct) {
    if (pct <= 70) return "ok";
    if (pct <= 80) return "warn";
    if (pct <= 90) return "high";
    return "crit";
  };

  CS.formatReset = function (iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  CS.formatTokens = function (n) {
    if (!n || n < 0) n = 0;
    if (n >= 1e6) {
      const m = n / 1e6;
      return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + "M";
    }
    if (n >= 1e3) {
      const k = n / 1e3;
      return (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10) + "k";
    }
    return String(Math.round(n));
  };

  const ORG_KEY = "cs_org_id";

  CS.getOrgId = async function () {
    try {
      const cached = await chrome.storage.local.get(ORG_KEY);
      if (cached && cached[ORG_KEY]) return cached[ORG_KEY];
    } catch (e) {}

    try {
      const res = await fetch("https://claude.ai/api/organizations", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) return null;
      const org = list.find((o) => o && o.uuid) || list[0];
      const id = org && org.uuid;
      if (!id) return null;
      try { await chrome.storage.local.set({ [ORG_KEY]: id }); } catch (e) {}
      return id;
    } catch (e) {
      return null;
    }
  };

  CS.fetchUsage = async function () {
    const org = await CS.getOrgId();
    if (!org) return null;
    let res;
    try {
      res = await fetch(
        "https://claude.ai/api/organizations/" + org + "/usage",
        { credentials: "include", headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      return null;
    }
    if (!res.ok) return { rateLimited: res.status === 429, session: null, weekly: null };

    let data;
    try { data = await res.json(); } catch (e) { return null; }

    function pick(node) {
      if (!node || typeof node.utilization !== "number") return null;
      return { pct: Math.max(0, Math.min(100, Math.round(node.utilization))), resetsAt: node.resets_at || null };
    }
    return { rateLimited: false, session: pick(data.five_hour), weekly: pick(data.seven_day) };
  };
})(window.CS);
