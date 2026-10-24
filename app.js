(async function () {
  "use strict";

  const MAX_ITEMS = 1000;

  const session = await Auth.requireLogin();
  if (!session) return;
  const uid = session.uid;
  const user = session.profile;
  Auth.cacheProfile(uid, user);

  const { round, num, fmtKg, fmtMoney, money, kg, perAmount, split, splitText, sumWeights } = Calc;
  const CACHE_KEY = "wc_data_" + uid;
  const $ = (id) => document.getElementById(id);

  // ---------- state ----------
  function blank() {
    return {
      customer: "", items: [], netWeight: "", netAmount: "",
      totalWeight: null, totalAmount: null,
      billId: null, billNo: null, billCreatedAt: null,
    };
  }

  function normalize(s) {
    if (s && Array.isArray(s.items)) {
      const out = Object.assign(blank(), s);
      delete out.updatedAt;
      return out;
    }
    return null;
  }

  function readCache() {
    try { return normalize(JSON.parse(localStorage.getItem(CACHE_KEY))); }
    catch (e) { return null; }
  }

  // ---------- online sync (Firestore) ----------
  let statusKey = "";
  let statusKind = "";
  function renderStatus() {
    const el = $("syncStatus");
    el.textContent = statusKey ? t(statusKey) : "";
    el.className = "sync" + (statusKind ? " " + statusKind : "");
  }
  function setStatus(key, kind) {
    statusKey = key;
    statusKind = kind || "";
    renderStatus();
  }

  let state = blank();
  try {
    setStatus("sync.loading", "");
    const remote = normalize(await Auth.loadWork(uid));
    state = remote || readCache() || blank();
    setStatus("sync.saved", "ok");
  } catch (e) {
    state = readCache() || blank();
    setStatus("sync.offline", "warn");
  }

  let saveTimer = null;
  let saving = false;
  let dirty = false;

  async function pushNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (saving) { dirty = true; return; }
    saving = true;
    dirty = false;
    setStatus("sync.saving", "");
    try {
      await Auth.saveWork(uid, state);
      if (dirty) setStatus("sync.saving", "");
      else setStatus("sync.saved", "ok");
    } catch (e) {
      dirty = false;
      setStatus("sync.failed", "warn");
    }
    saving = false;
    if (dirty) pushNow();
  }

  function save() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    setStatus("sync.saving", "");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushNow, 700);
  }

  // push any pending change when the user leaves or switches app
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && saveTimer) pushNow();
  });
  window.addEventListener("pagehide", () => { if (saveTimer) pushNow(); });

  // ---------- helpers ----------
  let msgTimer = null;
  function showMsg(text, type) {
    const el = $("msg");
    el.textContent = text;
    el.className = "msg show " + (type || "err");
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { el.className = "msg"; }, 5000);
  }

  // ---------- header ----------
  $("companyName").textContent = user.company;
  $("companySub").textContent = [user.address, user.phone].filter(Boolean).join("  |  ");
  $("userName").textContent = user.username;
  $("logoutBtn").addEventListener("click", async () => {
    if (saveTimer) await pushNow();
    await Auth.logout();
    window.location.replace("index.html");
  });

  // ---------- rendering ----------
  function renderItems() {
    const list = $("itemList");
    list.textContent = "";
    if (state.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("items.empty");
      list.appendChild(empty);
    }
    state.items.forEach((w, i) => {
      const row = document.createElement("div");
      row.className = "item";

      const no = document.createElement("span");
      no.className = "no";
      no.textContent = "#" + (i + 1);

      const val = document.createElement("span");
      val.className = "w";
      val.textContent = kg(w);

      const del = document.createElement("button");
      del.type = "button";
      del.setAttribute("aria-label", t("items.remove", { n: i + 1 }));
      del.textContent = "×";
      del.addEventListener("click", () => removeItem(i));

      row.append(no, val, del);
      list.appendChild(row);
    });

    const n = state.items.length;
    $("itemCount").textContent = t("items.count", { n, max: MAX_ITEMS });
    const full = n >= MAX_ITEMS;
    $("weightInput").disabled = full;
    $("addBtn").disabled = full;
    $("weightInput").placeholder = full ? t("item.phFull", { n: MAX_ITEMS }) : t("item.ph");
  }

  function renderTotals() {
    $("totalWeightValue").textContent =
      state.totalWeight !== null ? kg(state.totalWeight) : "—";

    const pa = perAmount(state);
    $("perAmountValue").textContent = money(pa === null ? 0 : pa);
    $("perAmountTop").textContent = money(pa === null ? 0 : pa) + " " + t("unit.perKg");

    $("totalAmountValue").textContent =
      state.totalAmount !== null ? money(state.totalAmount) : "—";

    const sp = split(state);
    $("quotientValue").textContent = sp ? sp.q.toFixed(7) : "—";
    $("splitValue").textContent = sp ? splitText(sp) : "—";
  }

  function renderBadge() {
    const b = $("billBadge");
    if (state.billId && state.billNo) {
      b.textContent = t("badge.editing", { n: state.billNo });
      b.classList.remove("hidden");
    } else {
      b.classList.add("hidden");
    }
  }

  function renderAll() {
    renderItems();
    renderTotals();
    renderBadge();
  }

  // re-draw everything when the language changes
  I18N.onChange(() => { renderAll(); renderStatus(); });

  // ---------- item actions ----------
  function invalidateResults() {
    state.totalWeight = null;
    state.totalAmount = null;
  }

  function addItem() {
    const input = $("weightInput");
    const w = num(input.value);
    if (state.items.length >= MAX_ITEMS) {
      return showMsg(t("msg.maxItems", { n: MAX_ITEMS }));
    }
    if (!(w > 0)) {
      input.focus();
      return showMsg(t("msg.enterWeight"));
    }
    state.items.push(round(w, 3));
    invalidateResults();
    save();
    input.value = "";
    renderAll();
    input.focus();
    const list = $("itemList");
    list.scrollTop = list.scrollHeight;
  }

  function removeItem(index) {
    state.items.splice(index, 1);
    invalidateResults();
    save();
    renderAll();
  }

  $("addBtn").addEventListener("click", addItem);
  $("weightInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addItem(); }
  });

  $("clearItemsBtn").addEventListener("click", () => {
    if (state.items.length === 0) return;
    if (!confirm(t("confirm.clearItems", { n: state.items.length }))) return;
    state.items = [];
    invalidateResults();
    save();
    renderAll();
  });

  // ---------- calculations ----------
  function calcTotalWeight() {
    if (state.items.length === 0) {
      showMsg(t("msg.addOne"));
      return false;
    }
    state.totalWeight = sumWeights(state.items);
    state.totalAmount = null;
    save();
    renderTotals();
    return true;
  }

  function calcTotalAmount() {
    if (state.totalWeight === null) {
      showMsg(t("msg.calcWeightFirst"));
      return false;
    }
    const pa = perAmount(state);
    if (pa === null) {
      showMsg(t("msg.needNet"));
      return false;
    }
    state.totalAmount = round(state.totalWeight * pa, 2);
    save();
    renderTotals();
    return true;
  }

  $("calcWeightBtn").addEventListener("click", calcTotalWeight);
  $("calcAmountBtn").addEventListener("click", calcTotalAmount);

  // ---------- customer name (optional) ----------
  $("customerName").value = state.customer;
  $("customerName").addEventListener("input", () => {
    state.customer = $("customerName").value;
    save();
  });

  // ---------- net weight / net amount ----------
  $("netWeight").value = state.netWeight;
  $("netAmount").value = state.netAmount;

  function onNetChange() {
    state.netWeight = $("netWeight").value;
    state.netAmount = $("netAmount").value;
    state.totalAmount = null; // per amount changed, so total must be recalculated
    save();
    renderTotals();
  }
  $("netWeight").addEventListener("input", onNetChange);
  $("netAmount").addEventListener("input", onNetChange);

  // ---------- save bill (history) ----------
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  async function saveBill() {
    if (state.totalWeight === null || state.totalAmount === null) {
      return showMsg(t("msg.saveNeed"));
    }
    const btn = $("saveBillBtn");
    btn.disabled = true;
    try {
      const now = new Date().toISOString();
      let id = state.billId;
      let billNo = state.billNo;
      let createdAt = state.billCreatedAt;
      if (!id) {
        billNo = await Auth.nextBillNo(uid);
        id = newId();
        createdAt = now;
      }
      await Auth.saveBill(uid, id, {
        billNo,
        customer: (state.customer || "").trim(),
        items: state.items,
        netWeight: state.netWeight,
        netAmount: state.netAmount,
        totalWeight: state.totalWeight,
        totalAmount: state.totalAmount,
        createdAt: createdAt || now,
        updatedAt: now,
      });
      state.billId = id;
      state.billNo = billNo;
      state.billCreatedAt = createdAt || now;
      save();
      renderBadge();
      showMsg(t("msg.saved", { n: billNo }), "ok");
    } catch (e) {
      showMsg(t("msg.saveFail"));
    }
    btn.disabled = false;
  }
  $("saveBillBtn").addEventListener("click", saveBill);

  // ---------- new bill ----------
  $("newBillBtn").addEventListener("click", () => {
    if (!confirm(t("confirm.newBill"))) return;
    state = blank();
    save();
    $("customerName").value = "";
    $("netWeight").value = "";
    $("netAmount").value = "";
    $("weightInput").value = "";
    renderAll();
    $("weightInput").focus();
  });

  // ---------- PDF ----------
  function downloadPdf() {
    if (state.totalWeight === null) return showMsg(t("msg.pdfWeight"));
    if (state.totalAmount === null) return showMsg(t("msg.pdfAmount"));
    if (!window.jspdf) return showMsg(t("msg.pdfLib"));

    const bill = Object.assign({}, state, { createdAt: state.billCreatedAt || undefined });
    BillPdf.download(user, bill);
  }
  $("pdfBtn").addEventListener("click", downloadPdf);

  // ---------- start ----------
  renderAll();
  I18N.apply();
})();
