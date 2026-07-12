window.CS = window.CS || {};

(function () {
  const ID = "cs-widget";

  function mount() {
    if (document.getElementById(ID)) return;
    const el = document.createElement("div");
    el.id = ID;
    el.textContent = "Claude Statusline";
    document.body.appendChild(el);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }
})();
