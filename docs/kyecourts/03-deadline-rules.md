# 03 — Deadline Rules Engine (Calendar Spec)

> ⚠️ **Verify every rule below against the current Kentucky rules before relying on automated
> docketing.** The **Rules of Appellate Procedure (RAP)** replaced CR 73–76 effective
> Jan 1, 2023. Day counts and triggers change; this is a reference map, not legal advice.

The engine converts a parsed notice/document (see `02-email-grammar.md`) into one or more
calendar entries. Two confidence tiers.

## Tier A — Explicit dates (extract verbatim; high confidence)

Auto-create directly; no rule interpretation.

| Source | Extraction | Event |
| --- | --- | --- |
| NCP / NEF `Scheduled Event:` line | event type, date, time ET, judge, case | Hearing at stated date/time with judge |
| `ORDER SCHEDULING` / scheduling order PDF | hearing & trial dates in body (OCR) | Each scheduled date |
| `ORDER SETTING EVIDENTIARY HEARING` PDF | hearing date/time | Evidentiary hearing |
| Case Watch `Scheduled Event` row | activity date | Hearing/event (reconcile) |

## Tier B — Inferred deadlines (apply rule to trigger date; flag "VERIFY")

Auto-create but tag the event title `[VERIFY]` and cite the rule + assumption in the
description, given malpractice exposure.

### Civil (CR)

| Trigger | Deadline | Rule |
| --- | --- | --- |
| Service of Complaint / Petition | Answer due **20 days** | CR 12.01 |
| Service of Amended pleading | Respond within time remaining or **10 days** | CR 15.01 |
| Counterclaim / Cross-claim served | **20 days** | CR 12.01 |
| Interrogatories served | **30 days** | CR 33.01 |
| Requests for Production served | **30 days** | CR 34.01 |
| Requests for Admission served | **30 days** (deemed admitted if no response) | CR 36.01 |

### Post-judgment / appeal (triggered by **Notice of Entry**, CR 77.04 service date)

| Deadline | Days | Rule | Notes |
| --- | --- | --- | --- |
| Motion to alter/amend/vacate | **10** | CR 59.05 | Jurisdictional; **not extendable** |
| Motion for new trial | **10** | CR 59.02 | |
| Motion to amend findings | **10** | CR 52.02 | |
| Notice of Appeal | **30** | **RAP 3** | Jurisdictional; runs from entry |

> **CR 6.05 caution:** the +3-days-for-service-by-mail/electronic addition applies to *response*
> periods, **not** to the appeal period (which runs from entry of judgment). Do not pad the
> appeal clock.

### Criminal (RCr)

| Trigger | Deadline | Rule |
| --- | --- | --- |
| Judgment entered | Notice of Appeal **30 days** | RCr 12.04 |
| Conviction final | RCr 11.42 motion within **3 years** | RCr 11.42 |
| Arraignment / scheduling | Pretrial-motion cutoffs (court-specific) | RCr 8.x / local |
| — | Speedy-trial tracking | constitutional / statutory |

### Family (FCRPP)

- Mandatory verified disclosures and case-management deadlines per FCRPP (e.g., FCRPP 2
  preliminary disclosures). Confirm current FCRPP text and any local family-court orders.

### Evidence (KRE) & Appellate (RAP)

- KRE rarely produces calendar deadlines (mostly trial conduct), but **KRE 404(c)** and similar
  notice provisions can. Track only where a notice deadline exists.
- RAP briefing schedule (appellant/appellee/reply briefs) once an appeal is docketed.

## Date mechanics (implement once, reuse)

- **CR 6.01** — exclude the day of the event, include the last day; if the last day is a
  Saturday, Sunday, or legal holiday, roll forward to the next business day.
- **CR 6.05** — add **3 days** to *response* periods when service is by mail/electronic
  (with the appeal-period exception above).
- **Holiday calendar** — Kentucky court holidays (state holidays + court closures). Maintain a
  small holiday table, refreshed yearly.

## Output — calendar event shape

- **Title:** `[{CASE#}] {Deadline name}` (Tier B prefixed `[VERIFY]`).
- **When:** all-day for computed deadlines; timed for explicit hearings (ET).
- **Description:** trigger (envelope #, document, service date) + rule cite + computed math
  ("entry 2026-05-28 + 30 days, rolled off weekend = 2026-06-29").
- **Reminders:** configurable (e.g., 7-day and 1-day).
- **Idempotency key:** `{case#}|{rule}|{triggerEnvelope}` so re-runs update rather than
  duplicate.
- **Calendar:** the connected Google Calendar (id from `Config`).
