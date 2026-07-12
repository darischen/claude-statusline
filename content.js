window.CS = window.CS || {};

(function () {
  const ID = "cs-widget";

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
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }
})();
