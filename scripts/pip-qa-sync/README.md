# PIP QA sync for the CP Gen Support Hub

Copies each PIP agent's weekly QA score from the QA Form's "Scores" tab
(Google Sheet `1POdUHKo1EeMZdXioWYCG2HahLwYnflw5IQZ5IbLgoyY`) into the hub's PIPS rows,
so PIPeeps shows current QA without anyone opening the stats popup.

A scheduled Claude routine runs it every day at 8:00 AM and 8:00 PM Central time:

1. Download the sheet through the Google Drive connector as ODS (`download_file_content`,
   `exportMimeType: application/vnd.oasis.opendocument.spreadsheet`).
2. Read the live hub (https://claude.ai/artifact/MsZ47XuibSEGQmSFdyMWLY) with the Artifact tool.
3. `node sync.js <drive-payload.json> <live-hub.html> <out.html>`
4. Publish `out.html` back to the same artifact URL.

The script only touches QA PIPs, only weeks up to the current one, and keeps the hub's
value for any week the sheet has no score for. It stamps `QA_SYNC` with the run time and
the number of PIPs it updated; PIPeeps shows that as "Last sync".

Needs SheetJS (`xlsx`); set `XLSX_PATH` if it isn't at `/opt/node22/lib/node_modules/xlsx`.
