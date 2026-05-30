# 04 — PDF Pipeline (Retrieval, Metadata, Extraction)

## The expiry problem (root cause)

Documents are **not attached** to the notices. Each notice links to
`https://kcoj.kycourts.net/eFilingRetrieval/Home/Package?id=<GUID>`, a **session-authenticated**
package that **expires**. Backfilling old envelopes therefore fails permanently — this is the
`Gap Reason = Expired / Too Old` seen throughout the control sheet.

### Fixes

1. **Retrieve immediately.** Run the ingest/retrieve trigger frequently (minutes, not a daily
   batch) and prioritize same-day download of any new envelope.
2. **Authentication reality.** `UrlFetchApp` in Apps Script cannot log into KYeCourts on its
   own. Document the realistic options:
   - **(a) Authenticated session/cookie** captured for the fetch (most automation-friendly if
     feasible; revisit terms of use).
   - **(b) `Substitute?` fallback** (already in the sheet): pull the document from the CourtNet
     `CaseAtAGlance` view, or download manually and drop it in the **hot-folder**
     (see `07-filing-and-foldering.md`) / record a `Local Source Path`.
     > **Cost / ToU caution (per the CourtNet 2.0 manual):** CourtNet portal access is a **paid
     > subscription that meters usage** — each *unique case* opened/drilled-into and each
     > *image* (document) opened is **billed** (case rate + image rate + overages), and access
     > is governed by a signed **user agreement** with 90-day password expiration. So an
     > automated `CaseAtAGlance`/image-scraping fallback has real per-document cost and ToU
     > implications. Prefer the free, party-served `eFilingRetrieval` link (option a) and treat
     > CourtNet image pulls as a deliberate, rate-limited last resort. The `client_id` query
     > parameter seen in Case Watch links maps to CourtNet's **Client ID Tracking** feature
     > (Advanced/Professional/Enterprise plans) that ties usage to a client.
   - **(c) Metadata-only** when the PDF is unrecoverable — keep the ledger row with the email
     data and mark the gap.
3. **Design around the fallback.** The `Gap Reason` / `Substitute?` / `Local Source Path`
   columns already anticipate that fully unattended download may not always be possible; treat
   that as a designed path, not a failure.

## Metadata extractable from the PDFs

- **Document properties:** title, author/producer/creator, creation & modification dates, page
  count, encryption flag.
- **Clerk file-stamp (page 1 overlay):** envelope #, filing date/time, clerk, county, case # —
  cross-check against the email for integrity and to recover ambiguous fields.

## Extraction methods (Apps Script-friendly first)

1. **Drive OCR conversion (primary).** `Drive.Files.copy` (Advanced Drive Service) converting
   `application/pdf` → `application/vnd.google-apps.document` runs Google OCR and yields a text
   layer for free. Works on both born-digital filings and scanned/judge-signed orders.
2. **Born-digital text layer.** Attorney filings (Word→PDF) usually already carry selectable
   text; the OCR conversion covers the image-only ones (signed orders, exhibits, faxes).
3. **Heavier option (later phase only):** Google Cloud Document AI / Vision via a Cloud
   Function for structured field extraction, if the OCR trick proves insufficient.

## What to do with the extracted text

- **Footer/stamp → lifecycle status** (Tendered / Filed / Entered) — see
  `07-filing-and-foldering.md` §7c; this drives status tokens and the filer.
- **Document classification** — Order / Motion / Pleading / Notice / Discovery, refining the
  `Courtnet_Filing_Types.txt` taxonomy.
- **Order analysis** — detect granted/denied, **dates set** ("hearing on…"), **deadlines
  imposed** ("within 20 days"), judge, entry date → feed the Tier A/B calendar engine
  (`03-deadline-rules.md`).
- **Scheduling orders** — pull hearing/trial dates.
- **Full-text index** — per-matter searchable index of the case file.

## Data model (per stored document)

```json
{
  "envelope": "13625934",
  "caseNumber": "23-CI-00304",
  "docType": "ORDER",
  "docTitle": "CIVIL DOCKET",
  "status": "Entered",          // from footer/stamp
  "dates": { "tendered": null, "filed": null, "entered": "2026-05-07" },
  "pages": 2,
  "hearingDates": [],
  "imposedDeadlines": [],
  "driveFileId": "1-JqfUN1q29RSVA84VHPS6rD1QhdY9Zp8",
  "textDocId": null,
  "sha256": "..."
}
```
