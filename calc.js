/* Shared calculation + formatting helpers (used by the calculator, history and PDF). */
const Calc = (() => {
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

  // language-aware labels for the screen (the PDF always uses plain English "Rs" / "kg")
  const money = (n) => t("cur") + " " + fmtMoney(n);
  const kg = (n) => fmtKg(n) + " " + t("unit.kg");

  // Per Amount = Net Amount / Net Weight
  function perAmount(b) {
    const w = num(b.netWeight);
    const a = num(b.netAmount);
    if (!(w > 0) || !(a >= 0)) return null;
    return a / w;
  }

  // Total Weight / Net Weight:
  //   whole part  = number of Items
  //   decimal part x Net Weight = balance kg
  // The balance is computed as total - items x net (same value, no rounding noise).
  function split(b) {
    if (b.totalWeight === null || b.totalWeight === undefined) return null;
    const nw = num(b.netWeight);
    if (!(nw > 0)) return null;
    const q = b.totalWeight / nw;
    const items = Math.floor(q + 1e-9);
    let rem = round(b.totalWeight - items * nw, 3);
    if (rem <= 0) rem = 0; // also turns -0 into 0
    return { q, items, rem };
  }

  const splitText = (s) =>
    t(s.items === 1 ? "split.one" : "split.many", { n: s.items, kg: fmtKg(s.rem) });

  // sum in grams to avoid floating point drift
  function sumWeights(items) {
    return items.reduce((s, w) => s + Math.round(w * 1000), 0) / 1000;
  }

  return { round, num, fmtKg, fmtMoney, money, kg, perAmount, split, splitText, sumWeights };
})();
