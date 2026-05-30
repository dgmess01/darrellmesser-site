# 01 — Current System (Reverse-Engineered)

Built from live Gmail data, the Gmail label list, the `KYeCourts Automation Control`
spreadsheet, and the `KYeCourts Archive` Drive tree. Source code (in `clasp`) was not
available; this describes observed behavior.

## Inputs

- **Emails** from `noreply@kycourts.net` — four types (see `02-email-grammar.md`).
- **Documents** behind each notice's `eFilingRetrieval` link.
- **Reference data** in Drive: `Courtnet_Filing_Types.txt` (filing-type taxonomy),
  CourtNet 2.0 user manuals (PDF), `courtnet.txt` / Supreme Court Minutes HTML.

## Pipeline (inferred)

1. Time-driven trigger scans Gmail for KYeCourts mail.
2. **Classify** each email by type → apply `KYCourts/{NEF,NCP,Case Watch}` label (plus a
   Notice-of-Entry handling path).
3. **Parse** the structured HTML body into fields (case #, envelope #, caption, court, eFiler,
   document titles, retrieval URL, scheduled events).
4. **Route** to per-client and per-case labels (`Client Name` and `Client Name/CaseNumber`).
5. **Retrieve** the document package from the `eFilingRetrieval` link.
6. On success: store PDF(s) in `KYeCourts Archive`, record `Drive File URL` and `Upload Status`
   in the control sheet. On failure (link expired): apply `KYCourts/Expired Retrieval`, record
   `Gap Reason = Expired / Too Old`.
7. Mark the email `KYCourts/Processed`; log routing activity (`zRouterLog`).

## Gmail label taxonomy (confirmed via API)

**Pipeline / state labels**

| Label | Purpose |
| --- | --- |
| `KYCourts/Processed` | Email fully handled |
| `KYCourts/Needs Review` | Could not auto-process; human triage |
| `KYCourts/NEF` | Notice of Electronic Filing |
| `KYCourts/NCP` | Notification of Court Processing |
| `KYCourts/Case Watch` | Case Watch Daily Update |
| `KYCourts/Expired Retrieval` | Retrieval link expired before download |
| `zRouterLog` | Routing/audit log |
| `zSCOTUS`, `zKSP`, `_TAX` | Other routing buckets |

**Matter labels** — a parent `Client Name` plus a colored child `Client Name/CaseNumber`,
e.g. `Bright, Jessica Diane` → `Bright, Jessica Diane/23-CI-00304`. Roughly a dozen active
matters across clients (Bright, Blevins/Sizemore, Davis/Drake, Lally, Drake (Austin), Mills,
Roop, Carnes, Lewis, Strunk).

## Control spreadsheet — `KYeCourts Automation Control`

Drive id `1982bKiIRBL5mE1jLJpHbwDrVQzer19wJmWnMJV2kKEo`. A retrieval/reconciliation **ledger** —
one row per envelope tracking whether the document was captured to Drive.

| Column | Meaning |
| --- | --- |
| Envelope Number | Join key for the eFiling package |
| Case Number | e.g. `23-CI-00304` |
| Case Caption | Party styling |
| Document Titles | Concatenated document titles in the envelope |
| Source Date | Filing/processing date |
| Gap Reason | Why a document is missing, e.g. `Expired / Too Old` |
| Substitute? | Whether an alternate source was used |
| Local Source Path | Path when sourced from a local download |
| Upload Status | `Pending` / done |
| Drive File URL | Link to stored PDF |
| Uploaded At / Uploaded By | Provenance |
| Notes | Free text |
| Last Updated | Row timestamp |

Many rows show `Gap Reason = Expired / Too Old` with `Upload Status = Pending` — the central
pain point: links expire before backfill can retrieve them.

## Known weak points (current)

- **Link expiry** causes permanent document gaps (see `04-pdf-pipeline.md`).
- **No deadline/calendar layer** — dates in notices are not docketed automatically.
- **Folder duplication** across two Google accounts; no single source of truth
  (see `07-filing-and-foldering.md`).
- **Parsing fragility** — email HTML mangles `=` in URLs and varies recipient case
  (see `02-email-grammar.md`).
