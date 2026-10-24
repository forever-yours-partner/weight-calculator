/*
 * PDF bill. The PDF text is always English. Company / customer / address text that
 * contains non-Latin letters (Tamil, Sinhala ...) is drawn as a picture by the browser
 * so it shows correctly even though the built-in PDF font cannot draw those letters.
 */
const BillPdf = (() => {
  const { fmtKg, fmtMoney, num } = Calc;

  const NON_LATIN = /[^\u0000-ÿ]/;
  const FONT_STACK = '"Noto Sans Tamil","Nirmala UI","Latha","Noto Sans Sinhala","Iskoola Pota","Noto Sans",Arial,sans-serif';

  // Draw text. opts: size (pt), bold, color [r,g,b], align left|center|right, maxWidth (mm)
  function drawText(doc, text, x, y, opts) {
    const o = Object.assign({ size: 10, bold: false, color: [15, 23, 42], align: "left", maxWidth: 0 }, opts);

    if (!NON_LATIN.test(text)) {
      doc.setFont("helvetica", o.bold ? "bold" : "normal");
      doc.setFontSize(o.size);
      doc.setTextColor(o.color[0], o.color[1], o.color[2]);
      const textOpts = { align: o.align };
      if (o.maxWidth) textOpts.maxWidth = o.maxWidth;
      doc.text(text, x, y, textOpts);
      return;
    }

    const PX_PER_MM = 12;
    const mmPerPt = 25.4 / 72;
    let fontPx = o.size * mmPerPt * PX_PER_MM;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const font = (px) => (o.bold ? "bold " : "") + px + "px " + FONT_STACK;

    ctx.font = font(fontPx);
    let wPx = ctx.measureText(text).width;
    if (o.maxWidth && wPx / PX_PER_MM > o.maxWidth) {
      fontPx = fontPx * (o.maxWidth * PX_PER_MM) / wPx;
      ctx.font = font(fontPx);
      wPx = ctx.measureText(text).width;
    }
    const hPx = Math.ceil(fontPx * 1.6);
    canvas.width = Math.max(1, Math.ceil(wPx) + 4);
    canvas.height = hPx;
    const c2 = canvas.getContext("2d");
    c2.font = font(fontPx);
    c2.fillStyle = "rgb(" + o.color.join(",") + ")";
    c2.textBaseline = "alphabetic";
    const baseline = fontPx * 1.15;
    c2.fillText(text, 2, baseline);

    const wMm = canvas.width / PX_PER_MM;
    const hMm = canvas.height / PX_PER_MM;
    let left = x;
    if (o.align === "center") left = x - wMm / 2;
    else if (o.align === "right") left = x - wMm;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", left, y - baseline / PX_PER_MM, wMm, hMm);
  }

  function safeFileName(s) {
    return (s || "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  }

  // profile: company details. bill: { items, netWeight, netAmount, totalWeight, totalAmount,
  //   customer, billNo, createdAt }
  function make(profile, bill) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const when = bill.createdAt ? new Date(bill.createdAt) : new Date();
    const dateStr = when.toLocaleDateString("en-GB") + "  " +
      when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const pa = Calc.perAmount(bill);
    const sp = Calc.split(bill);
    const customer = (bill.customer || "").trim();
    const FIRST_PAGE_TOP = customer ? 62 : 56;
    const OTHER_PAGE_TOP = 26;

    const headerDone = new Set();
    function drawHeader() {
      // use the real document page number (autoTable's own counter restarts per table)
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      if (headerDone.has(pageNumber)) return; // both tables may draw on the same page
      headerDone.add(pageNumber);

      if (pageNumber === 1) {
        drawText(doc, profile.company, pageW / 2, 18,
          { size: 20, bold: true, color: [29, 78, 216], align: "center", maxWidth: pageW - 30 });
        if (profile.address) {
          drawText(doc, profile.address, pageW / 2, 26,
            { size: 10, color: [71, 85, 105], align: "center", maxWidth: pageW - 30 });
        }
        const contact = [
          profile.phone ? "Phone: " + profile.phone : "",
          profile.email ? "Email: " + profile.email : "",
        ].filter(Boolean).join("   |   ");
        if (contact) {
          drawText(doc, contact, pageW / 2, 32,
            { size: 10, color: [71, 85, 105], align: "center", maxWidth: pageW - 30 });
        }
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 37, pageW - 14, 37);

        const title = "Weight & Amount Bill" + (bill.billNo ? "   #" + bill.billNo : "");
        drawText(doc, title, 14, 46, { size: 14, bold: true });
        drawText(doc, "Date: " + dateStr, pageW - 14, 46,
          { size: 10, color: [71, 85, 105], align: "right" });
        if (customer) {
          drawText(doc, "Customer: " + customer, 14, 54,
            { size: 11, bold: true, maxWidth: pageW - 28 });
        }
      } else {
        drawText(doc, profile.company, 14, 14,
          { size: 13, bold: true, color: [29, 78, 216], maxWidth: pageW - 28 });
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 18, pageW - 14, 18);
      }
    }

    // item weights, filled down the columns (4 columns when there are many items)
    const items = bill.items;
    const n = items.length;
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
        if (idx < n) row.push(String(idx + 1), fmtKg(items[idx]));
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
    const summaryBody = [
      ["Per Amount (Rs / kg)", "Rs " + fmtMoney(pa)],
      ["Net Weight (kg)", fmtKg(num(bill.netWeight))],
      ["Net Amount (Rs)", "Rs " + fmtMoney(num(bill.netAmount))],
      ["Number of Weights Entered", String(n)],
      ["Total Item Weight (kg)", fmtKg(bill.totalWeight)],
      ["Total Weight ÷ Net Weight", sp.q.toFixed(7)],
      ["Items & Balance Weight", sp.items + (sp.items === 1 ? " Item " : " Items ") + fmtKg(sp.rem) + " kg"],
      ["Total Amount (Rs)", "Rs " + fmtMoney(bill.totalAmount)],
    ];
    const lastIdx = summaryBody.length - 1;

    // keep the whole summary together: move to a new page if it will not fit
    const SUMMARY_HEIGHT = 108;
    let summaryY = doc.lastAutoTable.finalY + 10;
    if (summaryY + SUMMARY_HEIGHT > pageH - 16) {
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
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Page " + p + " of " + pages, pageW - 14, pageH - 8, { align: "right" });
    }

    const stamp = when.toISOString().slice(0, 10);
    const filename = [
      safeFileName(profile.company),
      safeFileName(customer),
      "bill",
      bill.billNo ? "no" + bill.billNo : "",
      stamp,
    ].filter(Boolean).join("_") + ".pdf";

    return { doc, filename };
  }

  function download(profile, bill) {
    const out = make(profile, bill);
    out.doc.save(out.filename);
  }

  return { make, download };
})();
