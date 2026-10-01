# Live Updates Calibration Quiz

A timed 10-question quiz on the four Live CP Gen updates (LOWTM15, LOPAYRV, CPCOMMR, CMSLNGCHN).
Agents open it as a normal web page — no Claude seat needed. Each submission adds a row to a Google Sheet.

## One-time setup

1. **Results sheet** — create a Google Sheet (e.g. "Live Updates Quiz Results").
2. **Script** — in the Sheet: Extensions → Apps Script. Replace everything with the contents of `apps-script.gs`, save.
3. **Deploy** — Deploy → New deployment → type **Web app**. Execute as **Me**, Who has access **Anyone**. Authorize, then copy the **Web app URL**.
4. **Connect** — in `quiz/index.html`, set `const RESULTS_URL = "<that URL>";`.
5. **Host** — GitHub repo Settings → Pages → Deploy from a branch → pick the branch and `/ (root)`.
   The quiz is then at `https://raine2798.github.io/Team-Raine-Performance/quiz/`.

Anyone with the page link can see the questions. Only you (the Sheet owner) see the results.
