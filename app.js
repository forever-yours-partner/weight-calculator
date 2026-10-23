(async function () {
  "use strict";

  const MAX_ITEMS = 1000;

  const session = await Auth.requireLogin();
  if (!session) return;
  const uid = session.uid;
  const user = session.profile;
  Auth.cacheProfile(uid, user);

  const CACHE_KEY = "wc_data_" + uid;
  const $ = (id) => document.getElementById(id);

  // ---------- state ----------
  function blank() {
    return { customer: "", items: [], netWeight: "", netAmount: "", totalWeight: null, totalAmount: null };
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
  function setStatus(text, kind) {
    const el = $("syncStatus");
    if (!el) return;
    el.textContent = text;
    el.className = "sync" + (kind ? " " + kind : "");
  }

  let state = blank();
  try {
    setStatus("Loading your saved data...", "");
    const remote = normalize(await Auth.loadWork(uid));
    state = remote || readCache() || blank();
    setStatus("Saved online", "ok");
  } catch (e) {
    state = readCache() || blank();
    setStatus("Offline: using data saved on this device", "warn");
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
    setStatus("Saving...", "");
    try {
      await Auth.saveWork(uid, state);
      setStatus(dirty ? "Saving..." : "Saved online", dirty ? "" : "ok");
    } catch (e) {
      dirty = false;
      setStatus("Not saved online (no connection). Will retry on next change.", "warn");
    }
    saving = false;
    if (dirty) pushNow();
  }

  function save() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    setStatus("Saving...", "");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushNow, 700);
  }

  // push any pending change when the user leaves or switches app
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && saveTimer) pushNow();
  });
  window.addEventListener("pagehide", () => { if (saveTimer) pushNow(); });

  // ---------- helpers ----------
  const round = (n, d) => {
    const f = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * f) / f;
  };
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const fmtKg = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const fmtMoney = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function perAmount() {
    const w = num(state.netWeight);
    const a = num(state.netAmount);
    if (!(w > 0) || !(a >= 0)) return null;
    return a / w;
  }

  // Total Weight ÷ Net Weight.
  // Whole part = number of Items, decimal part × Net Weight = balance kg
  // (balance is computed as total - items × net, which is the same value without rounding noise).
  function split() {
    if (state.totalWeight === null) return null;
    const nw = num(state.netWeight);
    if (!(nw > 0)) return null;
    const q = state.totalWeight / nw;
    const items = Math.floor(q + 1e-9);
    let rem = round(state.totalWeight - items * nw, 3);
    if (rem <= 0) rem = 0; // also turns -0 into 0
    return { q, items, rem };
  }
  const splitText = (s) =>
    s.items + (s.items === 1 ? " Item " : " Items ") + fmtKg(s.rem) + " kg";

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
  $("userChip").textContent = "User: " + user.username;
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
      empty.textContent = "No items added yet.";
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
      val.textContent = fmtKg(w) + " kg";

      const del = document.createElement("button");
      del.type = "button";
      del.setAttribute("aria-label", "Remove item " + (i + 1));
      del.textContent = "×";
      del.addEventListener("click", () => removeItem(i));

      row.append(no, val, del);
      list.appendChild(row);
    });

    const n = state.items.length;
    $("itemCount").textContent = n + " / " + MAX_ITEMS + " items";
    const full = n >= MAX_ITEMS;
    $("weightInput").disabled = full;
    $("addBtn").disabled = full;
    $("weightInput").placeholder = full
      ? "Maximum " + MAX_ITEMS + " items reached"
      : "Enter item weight in kg";
  }

  function renderTotals() {
    $("totalWeightValue").textContent =
      state.totalWeight !== null ? fmtKg(state.totalWeight) + " kg" : "—";

    const pa = perAmount();
    const paText = "Rs " + fmtMoney(pa === null ? 0 : pa);
    $("perAmountValue").textContent = paText;
    $("perAmountTop").textContent = paText + " / kg";

    $("totalAmountValue").textContent =
      state.totalAmount !== null ? "Rs " + fmtMoney(state.totalAmount) : "—";

    const sp = split();
    $("quotientValue").textContent = sp ? sp.q.toFixed(7) : "—";
    $("splitValue").textContent = sp ? splitText(sp) : "—";
  }

  function renderAll() {
    renderItems();
    renderTotals();
  }

  // ---------- item actions ----------
  function invalidateResults() {
    state.totalWeight = null;
    state.totalAmount = null;
  }

  function addItem() {
    const input = $("weightInput");
    const w = num(input.value);
    if (state.items.length >= MAX_ITEMS) {
      return showMsg("You can add a maximum of " + MAX_ITEMS + " items.");
    }
    if (!(w > 0)) {
      input.focus();
      return showMsg("Please enter a weight greater than 0.");
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
    if (!confirm("Remove all " + state.items.length + " items?")) return;
    state.items = [];
    invalidateResults();
    save();
    renderAll();
  });

  // ---------- calculations ----------
  function calcTotalWeight() {
    if (state.items.length === 0) {
      showMsg("Add at least one item weight first.");
      return false;
    }
    // sum in grams to avoid floating point drift
    const grams = state.items.reduce((s, w) => s + Math.round(w * 1000), 0);
    state.totalWeight = grams / 1000;
    state.totalAmount = null;
    save();
    renderTotals();
    return true;
  }

  function calcTotalAmount() {
    if (state.totalWeight === null) {
      showMsg("Click \"Calculate Total Weight\" first.");
      return false;
    }
    const pa = perAmount();
    if (pa === null) {
      showMsg("Enter a Net Weight greater than 0 and a Net Amount to get the Per Amount.");
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

  // ---------- new bill ----------
  $("newBillBtn").addEventListener("click", () => {
    if (!confirm("Start a new bill? All current entries will be cleared.")) return;
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
  function safeFileName(s) {
    return s.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "bill";
  }

  function downloadPdf() {
    if (state.totalWeight === null) {
      return showMsg("Click \"Calculate Total Weight\" before downloading the PDF.");
    }
    if (state.totalAmount === null) {
      return showMsg("Click \"Calculate Total Amount\" before downloading the PDF.");
    }
    if (!window.jspdf) {
      return showMsg("PDF library failed to load. Please refresh the page and try again.");
    }

    const pa = perAmount();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB") + "  " +
      now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const customer = (state.customer || "").trim();
    const FIRST_PAGE_TOP = customer ? 62 : 56;
    const OTHER_PAGE_TOP = 26;

    const headerDone = new Set();
    function drawHeader() {
      // use the real document page number (autoTable's own counter restarts per table)
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      if (headerDone.has(pageNumber)) return; // both tables may draw on the same page
      headerDone.add(pageNumber);
      doc.setTextColor(29, 78, 216);
      doc.setFont("helvetica", "bold");
      if (pageNumber === 1) {
        doc.setFontSize(20);
        doc.text(user.company, pageW / 2, 18, { align: "center", maxWidth: pageW - 30 });
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (user.address) doc.text(user.address, pageW / 2, 26, { align: "center", maxWidth: pageW - 30 });
        const contact = [user.phone ? "Phone: " + user.phone : "", user.email ? "Email: " + user.email : ""]
          .filter(Boolean).join("   |   ");
        if (contact) doc.text(contact, pageW / 2, 32, { align: "center", maxWidth: pageW - 30 });
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 37, pageW - 14, 37);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Weight & Amount Bill", 14, 46);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text("Date: " + dateStr, pageW - 14, 46, { align: "right" });
        if (customer) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(11);
          doc.text("Customer: " + customer, 14, 54, { maxWidth: pageW - 28 });
        }
      } else {
        doc.setFontSize(13);
        doc.text(user.company, 14, 14);
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 18, pageW - 14, 18);
      }
    }

    // item weights, filled down the columns (4 columns when there are many items)
    const n = state.items.length;
    const cols = n > 100 ? 4 : 2;
    const rows = Math.ceil(n / cols);
    const head = [];
    const columnStyles = {};
    for (let c = 0; c < cols; c++) {
      head.push("No.", cols === 2 ? "Item Weight (kg)" : "Weight (kg)");
      columnStyles[c * 2] = { halign: "center", cellWidth: cols === 2 ? 16 : 13 };
      columnStyles[c * 2 + 1] = { halign: "right" };
    }
    const body = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const idx = r + c * rows;
        if (idx < n) row.push(String(idx + 1), fmtKg(state.items[idx]));
        else row.push("", "");
      }
      body.push(row);
    }

    doc.autoTable({
      startY: FIRST_PAGE_TOP,
      margin: { top: OTHER_PAGE_TOP, left: 14, right: 14, bottom: 16 },
      head: [head],
      body,
      theme: "grid",
      styles: {
        fontSize: cols === 2 ? 10 : 9,
        cellPadding: cols === 2 ? 2.2 : 1.6,
        textColor: [15, 23, 42],
      },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, halign: "center" },
      columnStyles,
      didDrawPage: () => drawHeader(),
    });

    // summary table
    const sp = split();
    const summaryBody = [
      ["Per Amount (Rs / kg)", "Rs " + fmtMoney(pa)],
      ["Net Weight (kg)", fmtKg(num(state.netWeight))],
      ["Net Amount (Rs)", "Rs " + fmtMoney(num(state.netAmount))],
      ["Number of Weights Entered", String(n)],
      ["Total Item Weight (kg)", fmtKg(state.totalWeight)],
      ["Total Weight ÷ Net Weight", sp.q.toFixed(7)],
      ["Items & Balance Weight", splitText(sp)],
      ["Total Amount (Rs)", "Rs " + fmtMoney(state.totalAmount)],
    ];
    const lastIdx = summaryBody.length - 1;

    // keep the whole summary together: move to a new page if it will not fit
    const SUMMARY_HEIGHT = 108;
    let summaryY = doc.lastAutoTable.finalY + 10;
    if (summaryY + SUMMARY_HEIGHT > doc.internal.pageSize.getHeight() - 16) {
      doc.addPage();
      summaryY = OTHER_PAGE_TOP;
    }

    doc.autoTable({
      startY: summaryY,
      margin: { top: OTHER_PAGE_TOP, left: 14, right: 14, bottom: 16 },
      head: [["Summary", "Value"]],
      body: summaryBody,
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 3, textColor: [15, 23, 42] },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === lastIdx) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 13;
        }
      },
      didDrawPage: () => drawHeader(),
    });

    // page numbers
    const pages = doc.getNumberOfPages();
    const pageH = doc.internal.pageSize.getHeight();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Page " + p + " of " + pages, pageW - 14, pageH - 8, { align: "right" });
    }

    const stamp = now.toISOString().slice(0, 10);
    const namePart = customer ? safeFileName(user.company) + "_" + safeFileName(customer) : safeFileName(user.company);
    doc.save(namePart + "_bill_" + stamp + ".pdf");
  }

  $("pdfBtn").addEventListener("click", downloadPdf);

  // ---------- start ----------
  renderAll();
})();
