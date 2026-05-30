# KYeCourts Automation — System Documentation & Redesign

> **Status:** Design/redesign documentation (reverse-engineered). No production code is
> contained here yet. This blueprint precedes the Apps Script rewrite.

## What this is

Darrell Messer's Kentucky law practice runs a Google Apps Script project ("KYeCourts") that:

1. Watches Gmail for notifications from `noreply@kycourts.net` (the Kentucky Court of Justice
   eFiling system / CourtNet).
2. Classifies and labels each notice, routes it to per-client / per-case Gmail labels.
3. Parses the structured email body for case/envelope/document data.
4. Retrieves the filed PDF(s) behind the notice's eFiling-retrieval link.
5. Files the documents into a Drive archive and logs everything to a control spreadsheet.

This documentation set reverse-engineers that system from live data (Gmail, the Gmail label
taxonomy, the Drive `KYeCourts Automation Control` sheet, the `KYeCourts Archive` folder tree,
the CourtNet reference files in Drive, and the **CourtNet 2.0 User Manual** [AOC, rev.
2014-09-05]), then proposes a redesign.

The redesign goals:

- **Document** the current system so it can be maintained and handed off.
- **Stop document loss** — eFiling retrieval links expire ("Expired / Too Old"); fetch must
  happen immediately and have a defined fallback.
- **Add a deadline / calendar engine** that converts filings into docketed Google Calendar
  dates (Kentucky CR / RCr / FCRPP / KRE / RAP).
- **Extract data from the PDFs themselves** (metadata + OCR text + file-stamp/footer status).
- **Add a hot-folder auto-filer** that files any dropped PDF by reading its own stamps.
- **End the folder duplication** across two Google accounts with one canonical structure and a
  matter registry.

## Document set

| File | Contents |
| --- | --- |
| [`01-current-system.md`](01-current-system.md) | Reverse-engineered architecture, Gmail labels, control-sheet schema |
| [`02-email-grammar.md`](02-email-grammar.md) | The four email types, their fields, and parsing rules/gotchas |
| [`03-deadline-rules.md`](03-deadline-rules.md) | Rule-to-deadline mapping — the calendar engine spec |
| [`04-pdf-pipeline.md`](04-pdf-pipeline.md) | Retrieval (expiry problem), metadata, OCR/extraction |
| [`05-redesign-architecture.md`](05-redesign-architecture.md) | Target module breakdown & data models |
| [`06-implementation-phases.md`](06-implementation-phases.md) | Phased build plan |
| [`07-filing-and-foldering.md`](07-filing-and-foldering.md) | Hot-folder auto-filer + canonical Drive structure & naming |

## ⚠️ Legal-safety note

Deadline rules in `03-deadline-rules.md` are reference mappings that **must be verified against
the current Kentucky rules before any automated docketing is relied upon** — note in particular
that the **Rules of Appellate Procedure (RAP)** replaced the old CR 73–76 appellate rules
effective Jan 1, 2023. Inferred deadlines carry malpractice exposure if a rule is mis-applied;
the design keeps them flagged and reviewable even when auto-creation of calendar events is on.
