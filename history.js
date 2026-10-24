(async function () {
  "use strict";

  const session = await Auth.requireLogin();
  if (!session) return;
  const uid = session.uid;
  const user = session.profile;
  Auth.cacheProfile(uid, user);

  const { perAmount, split, splitText, money, kg } = Calc;
  const $ = (id) => document.getElementById(id);

  $("companyName").textContent = user.company;
  $("companySub").textContent = [user.address, user.phone].filter(Boolean).join("  |  ");
  $("logoutBtn").addEventListener("click", async () => {
    await Auth.logout();
    window.location.replace("index.html");
  });

  let msgTimer = null;
  function showMsg(text, type) {
    const el = $("msg");
    el.textContent = text;
    el.className = "msg show " + (type || "err");
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { el.className = "msg"; }, 5000);
  }

  let bills = [];
  let loadState = "loading"; // loading | ready | failed

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const locale = I18N.getLang() === "ta" ? "ta-LK" : "en-GB";
    try {
      return d.toLocaleDateString(locale) + " " +
        d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return d.toLocaleString();
    }
  }

  function addMeta(parent, label, value) {
    const span = document.createElement("span");
    span.append(label + ": ");
    const strong = document.createElement("strong");
    strong.textContent = value;
    span.appendChild(strong);
    parent.appendChild(span);
  }

  function makeBtn(label, cls, handler) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn small " + cls;
    b.textContent = label;
    b.addEventListener("click", handler);
    return b;
  }

  function render() {
    const list = $("billList");
    list.textContent = "";
    const q = $("searchInput").value.trim().toLowerCase();

    if (loadState === "loading") {
      list.textContent = t("hist.loading");
      list.className = "hint";
      $("billCount").textContent = "";
      return;
    }
    list.className = "";
    if (loadState === "failed") {
      const div = document.createElement("div");
      div.className = "msg show err";
      div.textContent = t("hist.failed");
      list.appendChild(div);
      return;
    }

    const shown = bills.filter((b) => {
      if (!q) return true;
      return (b.customer || "").toLowerCase().indexOf(q) !== -1 ||
        String(b.billNo || "") === q.replace("#", "");
    });
    $("billCount").textContent = t("hist.count", { n: shown.length });

    if (shown.length === 0) {
      const div = document.createElement("div");
      div.className = "hint";
      div.textContent = bills.length === 0 ? t("hist.empty") : t("hist.noMatch");
      list.appendChild(div);
      return;
    }

    shown.forEach((b) => {
      const card = document.createElement("div");
      card.className = "bill";

      const top = document.createElement("div");
      top.className = "bill-top";
      const left = document.createElement("div");
      const no = document.createElement("span");
      no.className = "bill-no";
      no.textContent = t("hist.bill", { n: b.billNo || "-" });
      const date = document.createElement("span");
      date.className = "bill-date";
      date.textContent = fmtDate(b.createdAt);
      left.append(no, date);
      const amt = document.createElement("div");
      amt.className = "bill-amount";
      amt.textContent = money(b.totalAmount || 0);
      top.append(left, amt);

      const cust = document.createElement("div");
      cust.className = "bill-customer" + (b.customer ? "" : " none");
      cust.textContent = b.customer || t("hist.noCustomer");

      const meta = document.createElement("div");
      meta.className = "bill-meta";
      addMeta(meta, t("hist.totalWeight"), kg(b.totalWeight || 0));
      const sp = split(b);
      if (sp) addMeta(meta, t("hist.items"), splitText(sp));
      const pa = perAmount(b);
      if (pa !== null) addMeta(meta, t("perAmount.label"), money(pa) + " " + t("unit.perKg"));

      const actions = document.createElement("div");
      actions.className = "bill-actions";
      actions.append(
        makeBtn(t("hist.edit"), "", () => editBill(b)),
        makeBtn(t("hist.pdf"), "green", () => pdfBill(b)),
        makeBtn(t("hist.delete"), "danger-ghost", () => deleteBill(b))
      );

      card.append(top, cust, meta, actions);
      list.appendChild(card);
    });
  }

  function pdfBill(b) {
    if (!window.jspdf) return showMsg(t("msg.pdfLib"));
    BillPdf.download(user, b);
  }

  async function deleteBill(b) {
    if (!confirm(t("hist.confirmDelete", { n: b.billNo || "-" }))) return;
    try {
      await Auth.deleteBill(uid, b.id);
      bills = bills.filter((x) => x.id !== b.id);
      render();
      showMsg(t("hist.deleted", { n: b.billNo || "-" }), "ok");
    } catch (e) {
      showMsg(t("hist.deleteFail"));
    }
  }

  // Put the saved bill on the calculator (as the current work), then open the calculator.
  async function editBill(b) {
    try {
      const cur = await Auth.loadWork(uid);
      if (cur && Array.isArray(cur.items) && cur.items.length > 0 && cur.billId !== b.id) {
        if (!confirm(t("hist.confirmEdit"))) return;
      }
      const work = {
        customer: b.customer || "",
        items: b.items,
        netWeight: b.netWeight,
        netAmount: b.netAmount,
        totalWeight: b.totalWeight,
        totalAmount: b.totalAmount,
        billId: b.id,
        billNo: b.billNo,
        billCreatedAt: b.createdAt,
      };
      await Auth.saveWork(uid, work);
      try { localStorage.setItem("wc_data_" + uid, JSON.stringify(work)); } catch (e) { /* ignore */ }
      window.location.href = "app.html";
    } catch (e) {
      showMsg(t("hist.failed"));
    }
  }

  $("searchInput").addEventListener("input", render);
  I18N.onChange(render);

  render();
  try {
    bills = await Auth.listBills(uid);
    loadState = "ready";
  } catch (e) {
    loadState = "failed";
  }
  render();
})();
