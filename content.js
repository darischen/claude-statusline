window.CS = window.CS || {};

(function (CS) {
  const ID = "cs-widget";
  const COLLAPSE_KEY = "cs_collapsed";
  const USAGE_MS = 60000;
  const CONTEXT_MS = 4000;

  let usageTimer = null;
  let contextTimer = null;
  let usageBackoffUntil = 0;

  function rowHtml(kind, label) {
    return (
      '<div class="cs-row" data-kind="' + kind + '">' +
        '<div class="cs-head">' +
          '<span class="cs-label">' + label + '</span>' +
          '<span class="cs-pct">--</span>' +
        '</div>' +
        '<div class="cs-track"><div class="cs-fill"></div></div>' +
        '<div class="cs-sub"></div>' +
      '</div>'
    );
  }

  function setRow(kind, pct, sub, marker) {
    const root = document.getElementById(ID);
    if (!root) return;
    const row = root.querySelector('.cs-row[data-kind="' + kind + '"]');
    if (!row) return;
    const pctEl = row.querySelector(".cs-pct");
    const fill = row.querySelector(".cs-fill");
    const subEl = row.querySelector(".cs-sub");
    if (pct == null || isNaN(pct)) {
      pctEl.textContent = "--";
      fill.style.width = "0%";
      fill.removeAttribute("data-color");
    } else {
      pctEl.textContent = (marker || "") + pct + "%";
      fill.style.width = pct + "%";
      fill.setAttribute("data-color", CS.colorFor(pct));
    }
    subEl.textContent = sub || "";
  }

  async function tickUsage() {
    if (Date.now() < usageBackoffUntil) return;
    let u = null;
    try { u = await CS.fetchUsage(); } catch (e) {}
    if (!u) { setRow("session", null, ""); setRow("weekly", null, ""); return; }
    if (u.rateLimited) { usageBackoffUntil = Date.now() + 5 * 60000; return; }

    if (u.session) setRow("session", u.session.pct, resetSub(u.session.resetsAt));
    else setRow("session", null, "");

    if (u.weekly) setRow("weekly", u.weekly.pct, resetSub(u.weekly.resetsAt));
    else setRow("weekly", null, "");
  }

  function resetSub(iso) {
    const s = CS.formatReset(iso);
    return s ? "resets " + s : "";
  }

  async function tickContext() {
    let c = null;
    try { c = await CS.fetchContext(); } catch (e) {}
    if (!c) { setRow("context", null, ""); return; }
    const sub = CS.formatTokens(c.used) + "/" + CS.formatTokens(c.window) + " est.";
    setRow("context", c.pct, sub, "~");
  }

  async function applyCollapsed() {
    const root = document.getElementById(ID);
    if (!root) return;
    let collapsed = false;
    try {
      const s = await chrome.storage.local.get(COLLAPSE_KEY);
      collapsed = !!(s && s[COLLAPSE_KEY]);
    } catch (e) {}
    root.setAttribute("data-cs-collapsed", collapsed ? "true" : "false");
  }

  function wireCollapse() {
    const root = document.getElementById(ID);
    if (!root) return;
    const btn = root.querySelector(".cs-collapse");
    btn.addEventListener("click", async () => {
      const now = root.getAttribute("data-cs-collapsed") === "true";
      const next = !now;
      root.setAttribute("data-cs-collapsed", next ? "true" : "false");
      try { await chrome.storage.local.set({ [COLLAPSE_KEY]: next }); } catch (e) {}
    });
  }

  let lastPath = location.pathname;
  function watchUrl() {
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        tickContext();
      }
    }, 1000);
  }

  function watchMount() {
    setInterval(() => {
      if (!document.getElementById(ID) && document.body) mount();
    }, 2000);
  }

  function mount() {
    if (document.getElementById(ID)) return;
    const el = document.createElement("div");
    el.id = ID;
    el.innerHTML =
      '<button class="cs-collapse" type="button" title="Collapse">–</button>' +
      rowHtml("context", "Context") +
      rowHtml("session", "Session") +
      rowHtml("weekly", "Weekly");
    document.body.appendChild(el);
    wireCollapse();
    applyCollapsed();
    tickUsage();
    tickContext();
    usageTimer = setInterval(tickUsage, USAGE_MS);
    contextTimer = setInterval(tickContext, CONTEXT_MS);
    watchUrl();
    watchMount();
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})(window.CS);
