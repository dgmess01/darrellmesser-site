# 05 — Redesign Architecture

Modular Apps Script (`.gs`), driven by a `Config` sheet and a `Matter Registry` sheet, with
idempotent operations throughout.

## Modules

| Module | Responsibility |
| --- | --- |
| `Ingest` | Gmail search + dedupe + email-type classification & labeling |
| `Parse` | Per-type parsers (`02-email-grammar.md`) with mojibake repair + shared field extractor |
| `Route` | Resolve client/case labels; create `Client/CaseNumber` labels on demand from the registry |
| `Retrieve` | Document download with immediate-fetch priority + fallback ledger (`04-pdf-pipeline.md`) |
| `Filer` | Hot-folder auto-filer: stamp/footer status, rename, move (`07-filing-and-foldering.md`) |
| `Store` | Drive folder-per-matter; write `Drive File URL` + status back to the control sheet |
| `Extract` | PDF OCR + metadata (`04-pdf-pipeline.md`) |
| `Deadlines` | Rules engine (`03-deadline-rules.md`): KY date math (CR 6.01/6.05) + holidays |
| `Calendar` | Create/update Google Calendar events (idempotent via stable event key) |
| `Ledger/Log` | Control-sheet writer + `zRouterLog` |

`Filer` sits between `Store` and `Extract` and shares the registry + ledger writer; it is the
document-driven ingestion path that complements the email-driven path.

## Shared state (sheets)

### Matter Registry (single source of truth — new)

`case# | client | opposing party | caption | case type | canonical folder id | Gmail label |
calendar id | status (open/closed)`

Resolves the cross-account folder duplication: everything routes through one canonical folder
per matter.

### Config

`label ids | canonical Drive root | hot-folder id | fetch cadence | calendar id |
rule toggles | reminder offsets | holiday table`

### Control ledger

Existing `KYeCourts Automation Control` schema (`01-current-system.md`), extended with the
per-document fields from `04-pdf-pipeline.md` as needed.

## Cross-cutting concerns

- **Idempotency keys** — Envelope # + document title for rows/files; `{case#}|{rule}|{envelope}`
  for calendar events. Re-runs update, never duplicate.
- **Error routing** — anything unparseable/unresolved → `KYCourts/Needs Review` + a ledger note.
- **Provenance** — every stored artifact records its source email/GUID and a content hash.
- **Privacy** — juvenile (`J`), DVO (`D`), and sealed matters use `CONFIDENTIAL` captions in
  folder names and suppressed calendar titles.

## Flow (happy path)

```
Gmail notice → Ingest(classify,label) → Parse(fields) → Route(matter labels)
   → Retrieve(PDF) ──ok──→ Filer(stamp→status, rename) → Store(folder, ledger)
   │                                                         → Extract(OCR, dates)
   └──expired──→ ledger gap + Needs Review (await hot-folder Substitute)
                                                            → Deadlines(rules) → Calendar(events)
```
