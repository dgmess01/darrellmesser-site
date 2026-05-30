# 06 — Implementation Phases

Sequenced so the highest-risk gaps close first and legal-deadline automation is only enabled
after verification.

## Phase 1 — Stabilize ingest & parse
- Harden the per-type parsers: mojibake/`=` repair, recipient case-normalization,
  multi-document envelopes, `(for eFiler)` variants, bounce filtering.
- Stand up the **Matter Registry** sheet; lock the control-sheet schema.
- Backfill the registry from existing labels/folders.

## Phase 2 — Immediate retrieval (stop new gaps)
- High-frequency trigger; same-day fetch priority.
- Implement the fallback ledger path (`Substitute?` / `Local Source Path`) and the
  `KYCourts/Expired Retrieval` handling.

## Phase 3 — Hot-folder auto-filer
- Watch the `_Inbox` folder; metadata + OCR; footer/stamp → status; matter resolution via
  registry; canonical rename + move; ledger write. (`07-filing-and-foldering.md`)

## Phase 4 — PDF extraction
- Drive OCR pipeline; file-stamp + metadata cross-check; document classification; order
  analysis for dates/deadlines.

## Phase 5 — Deadline engine
- Implement CR 6.01 / 6.05 date math + KY holiday table.
- Tier A explicit dates first (lowest risk), then Tier B inferred with `[VERIFY]` flagging.
- **Legal review gate:** attorney confirms each rule (RAP vs old CR appellate rules; current
  day counts) before Tier B is enabled.

## Phase 6 — Calendar integration
- Idempotent event creation on the connected calendar.
- **Dry-run / propose-only** against the last 30 days of notices; diff against the attorney's
  actual docketed dates before enabling auto-create.

## Phase 7 — Reconciliation & cleanup
- Use Case Watch digests to detect missed activity / gaps.
- Migrate legacy + personal-Drive folders into the canonical structure; de-duplicate across
  accounts (`07-filing-and-foldering.md`).

## Suggested code layout (for the clasp project)

```
src/
  Config.gs          // config + registry accessors
  Ingest.gs
  Parse.gs           // + Parse.test.gs fixtures from real emails
  Route.gs
  Retrieve.gs
  Filer.gs
  Store.gs
  Extract.gs
  Deadlines.gs       // + Deadlines.test.gs (date math unit tests)
  Calendar.gs
  Ledger.gs
  Util.gs            // mojibake repair, date parsing, regexes
appsscript.json
```

> When the clasp source is pushed to a repo, fold these modules onto the existing code rather
> than greenfielding, so current working behavior is preserved.
