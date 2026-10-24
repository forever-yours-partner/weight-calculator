/* "Change Password" pop-up, shared by the calculator and history pages. */
const Account = (() => {
  let overlay = null;

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML =
      '<form class="modal" autocomplete="off">' +
      '  <h2 data-i18n="pwd.title"></h2>' +
      '  <div class="msg" id="pwdMsg"></div>' +
      '  <div class="field"><label for="pwdCur" data-i18n="pwd.current"></label>' +
      '    <input type="password" id="pwdCur" autocomplete="current-password" required></div>' +
      '  <div class="field"><label for="pwdNew" data-i18n="pwd.new"></label>' +
      '    <input type="password" id="pwdNew" autocomplete="new-password" required>' +
      '    <div class="hint" data-i18n="reg.passwordHint"></div></div>' +
      '  <div class="field"><label for="pwdNew2" data-i18n="pwd.confirm"></label>' +
      '    <input type="password" id="pwdNew2" autocomplete="new-password" required></div>' +
      '  <div class="modal-actions">' +
      '    <button type="button" class="btn ghost" id="pwdCancel" data-i18n="pwd.cancel"></button>' +
      '    <button type="submit" class="btn" id="pwdSave" data-i18n="pwd.save"></button>' +
      '  </div>' +
      '</form>';
    document.body.appendChild(overlay);
    I18N.apply();

    const msg = overlay.querySelector("#pwdMsg");
    const show = (text, type) => { msg.textContent = text; msg.className = "msg show " + type; };

    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector("#pwdCancel").addEventListener("click", close);
    overlay.querySelector("#pwdCur").focus();

    overlay.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const cur = overlay.querySelector("#pwdCur").value;
      const nw = overlay.querySelector("#pwdNew").value;
      const nw2 = overlay.querySelector("#pwdNew2").value;
      if (nw.length < 6) return show(t("reg.errPass"), "err");
      if (nw !== nw2) return show(t("reg.errMatch"), "err");
      if (nw === cur) return show(t("pwd.same"), "err");

      const save = overlay.querySelector("#pwdSave");
      save.disabled = true;
      const res = await Auth.changePassword(cur, nw);
      save.disabled = false;
      if (!res.ok) return show(res.error, "err");
      show(t("pwd.ok"), "ok");
      overlay.querySelector("form").reset();
      setTimeout(close, 1600);
    });
  }

  function init() {
    const btn = document.getElementById("pwdBtn");
    if (btn) btn.addEventListener("click", open);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  init();

  return { open, close };
})();
