// Writes each PIP agent's weekly QA from the QA Form's "Scores" tab into the CP Gen Support Hub's PIPS rows.
// Run by the scheduled routine at 8:00 AM and 8:00 PM CT (see README.md).
//   node sync.js <drive-payload.json> <live-hub.html> <out.html>
// drive-payload.json: the Google Drive download_file_content result for the Scores sheet exported as ODS ({content: base64, ...}).
// Only QA PIPs are touched, only weeks up to the current one, and a week with no score on the sheet keeps what the hub had.
const fs = require("fs");
const X = require(process.env.XLSX_PATH || "/opt/node22/lib/node_modules/xlsx");
const [payloadPath, livePath, outPath] = process.argv.slice(2);
if (!outPath) { console.error("usage: node sync.js <drive-payload.json> <live-hub.html> <out.html>"); process.exit(2); }

let payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
if (typeof payload.payload === "string") payload = JSON.parse(payload.payload);
const b64 = payload.content || (payload.payload && payload.payload.content);
if (!b64) throw new Error("Drive payload has no content");
const ws = X.read(b64, { type: "base64" }).Sheets["Scores"];
if (!ws) throw new Error("No Scores tab in the export");
const rows = X.utils.sheet_to_json(ws, { header: 1, raw: true }), head = rows[0] || [];
const scores = {};
rows.slice(1).forEach(x => {
  const name = String(x[2] || "").trim().toLowerCase(); if (!name) return;
  const o = scores[name] || (scores[name] = {});
  head.forEach((h, i) => { const wk = Number(h), v = x[i]; if (Number.isInteger(wk) && wk > 400 && wk < 2000 && typeof v === "number") o[wk] = Math.round(v * 1000) / 10; });
});

// Same week maths as the hub: ISO "YYYY-Www" weeks; company Week 1 began Mon Jan 4 2016.
const COMPANY_WEEK1 = Date.UTC(2016, 0, 4);
const companyWeek = mon => Math.round((mon.getTime() - COMPANY_WEEK1) / 6048e5) + 1;
function isoWeekMonday(w){
  const m = /^(\d{4})-W(\d{2})$/.exec(w || ""); if (!m) return null;
  const jan4 = new Date(Date.UTC(+m[1], 0, 4));
  return new Date(jan4.getTime() + (-((jan4.getUTCDay() + 6) % 7) + (+m[2] - 1) * 7) * 864e5);
}
const now = new Date(), today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const thisMon = today.getTime() - ((today.getUTCDay() + 6) % 7) * 864e5;

let html = fs.readFileSync(livePath, "utf8");
const re = /  const PIPS = \[\n([\s\S]*?)\n  \];/;
const m = re.exec(html); if (!m) throw new Error("PIPS array not found in the hub");
const pips = JSON.parse("[" + m[1].trim().replace(/,\s*$/, "") + "]");
let updated = 0; const log = [];
pips.forEach(r => {
  if (!/QA/.test(r[3] || "")) return;
  const start = isoWeekMonday(r[4]), end = isoWeekMonday(r[5]), sc = scores[String(r[1]).trim().toLowerCase()];
  if (!start || !end || !sc) { log.push(`${r[1]}: ${sc ? "no weeks set" : "no row on the Scores tab"}`); return; }
  while (r.length < 14) r.push(null);
  const weekly = r[13] && typeof r[13] === "object" ? r[13] : {}, qa = Array.isArray(weekly.qa) ? weekly.qa.slice() : [];
  let changed = false, i = 0;
  for (let d = start.getTime(); d <= end.getTime() && i < 12; d += 6048e5, i++) {
    while (qa.length <= i) qa.push("");
    const v = sc[companyWeek(new Date(d))];
    if (d <= thisMon && v !== undefined && qa[i] !== v) { qa[i] = v; changed = true; }
  }
  if (changed) { r[13] = Object.assign({}, weekly, { qa }); updated++; }
  log.push(`${r[1]}: ${JSON.stringify(qa)}${changed ? " (updated)" : ""}`);
});
const literal = "  const PIPS = [\n" + pips.map(r => "    [" + r.map(v => JSON.stringify(v === undefined ? null : v)).join(", ") + "],").join("\n") + "\n  ];";
html = html.replace(re, () => literal);
const stamp = `const QA_SYNC = ${JSON.stringify({ at: now.toISOString(), updated })};`;
if (!/const QA_SYNC = \{[^\n]*\};/.test(html)) throw new Error("QA_SYNC stamp not found in the hub");
html = html.replace(/const QA_SYNC = \{[^\n]*\};/, () => stamp);
fs.writeFileSync(outPath, html);
console.log(log.join("\n")); console.log(`PIPs updated: ${updated}`);
