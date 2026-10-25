# AcadID – One Identity. Trusted Academics.

A browser-only prototype of an academic record validation and verification platform. Light and dark mode, six role-based areas, synthetic data. The first page shows the AICTE logo.

> **Independent prototype.** AcadID is not affiliated with, endorsed by, or connected to AICTE, APAAR, Aadhaar or DigiLocker. The AICTE logo marks the use case only. All students and IDs are fictional.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page (AICTE logo, features, FAQ, contact) and containers for the app |
| `style.css` | All styling, light and dark themes, responsive layout |
| `script.js` | Application: sign-in, dashboards, records, CSV import, validation engine, requests, proof links, analytics, reports, audit |
| `aicte-logo.jpg` | The AICTE logo you supplied (keep it next to `index.html`) |
| `README.md` | This file |

## Run it (Windows, no installation)

1. Put all five files in one folder, for example `C:\acadid`.
2. Double-click `index.html`. It opens in your browser.
3. Click **Sign in** or **Explore Demo**.

For best results (and so copied proof links work), serve the folder instead:
open the folder in VS Code, install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**. Or in a terminal inside the folder: `python -m http.server 8000` then open `http://localhost:8000`.

## Demo accounts (password for all: `Demo@1234`)

| Role | Email |
|---|---|
| Student | student@acadid.demo |
| Institutional Administrator | institution@acadid.demo |
| AICTE Administrator (demo role) | aicte@acadid.demo |
| Academic Verifier | verifier@acadid.demo |

## Suggested demo path

1. Sign in as the institution admin → **CSV import** → *Sample with problems* → upload it. Review the row errors, download the error report, confirm.
2. **Mismatch detection** → review a flag (reviewed / dismiss / needs correction).
3. Sign out, sign in as the student → **Pre-flight checker** (enter values by hand) → **Correction requests** → submit → note the ticket ID.
4. Back as the institution admin → **Correction requests** → update the status with a reason → **Audit log**.
5. As the student → **Proof links** → create a link → open it → revoke it → reopen (rejected).
6. As the AICTE admin → dashboard filters → **Reports**.

## What works

Sign-in with 30-minute session expiry and role-based pages; student, institution and national dashboards (clickable cards open filtered views); records (search, filters, sorting, pagination, add, edit, archive, CSV export); CSV import with validation, duplicate checks, error report, confirmation and rollback; mismatch engine (missing fields, APAAR format, duplicate APAAR, name variation with fuzzy matching, date-of-birth conflicts, cross-institution matches, intake exceeded) with configurable threshold; pre-flight checker with English/Tamil checklist and draft letter; correction tickets with history, notes, assignment, overdue flags; consent-based proof links with QR, expiry, revocation and access log; analytics; CSV and print-to-PDF reports; notifications; append-only audit log; settings.

## Honest limitations

- **No server and no database.** Data lives in your browser's localStorage. Role checks run in the page script, so this is **not secure** and must not hold real data. A production version needs a backend with real authentication, server-side authorisation and a database.
- Demo passwords are checked in the browser with a simple hash. This is not real authentication.
- **No OCR.** The pre-flight checker asks you to type values; the image is only checked for type and size and is not stored.
- Email and SMS are simulated; nothing is sent.
- Proof links only work in the browser that holds the demo data, because there is no shared server.
- Charts are plain HTML/CSS, not Recharts. The QR code uses a small library from a CDN; offline, the link is shown instead.
- Tamil text should be reviewed by a native speaker before real use.
- The master prompt asked for React, FastAPI, PostgreSQL and tests. This deliverable is the plain HTML/CSS/JS version you requested; those parts are not built.

## Testing performed

An automated Chromium run (Playwright) covered 105 checks: every page for every role, access denial, login errors, record CRUD and persistence after reload, CSV import including bad files, validation, request workflow, proof-link valid/revoked/expired/unknown cases, analytics consistency, theme persistence and mobile layout. All passed; the only console errors were the optional QR CDN being unreachable in the sandbox. Not tested: Safari/Firefox, screen readers, and the print-to-PDF dialog.

## Troubleshooting

- **Logo missing:** keep `aicte-logo.jpg` in the same folder (PNG/JPEG/SVG named `aicte-logo` also work). A text fallback appears otherwise.
- **Blank or stale data:** Settings → *Reset demo data*, or clear site data for the page.
- **Changes not saved:** the browser is blocking storage (private mode); a warning banner appears.
