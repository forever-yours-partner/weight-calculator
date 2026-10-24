/* Dark / light mode. Loaded in <head> so the page never flashes the wrong colours. */
(function () {
  var KEY = "wc_theme";
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function initial() {
    var s = stored();
    if (s === "dark" || s === "light") return s;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  function apply(t) { document.documentElement.setAttribute("data-theme", t); }

  apply(initial());

  window.Theme = {
    get: function () { return document.documentElement.getAttribute("data-theme") || "light"; },
    toggle: function () {
      var next = this.get() === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      return next;
    }
  };
})();
