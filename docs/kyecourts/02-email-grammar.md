# 02 — Email Grammar (Parser Contract)

All four notices from `noreply@kycourts.net` are HTML emails (`charset=us-ascii`), with
`Label: value` lines separated by `<br>`. They share a confidentiality footer that should be
stripped before parsing.

## Parsing gotchas (handle these first)

1. **Mangled `=` signs in URLs.** Quoted-printable / Windows-1252 artifacts corrupt query
   strings. Observed live:
   - `…/Package?id=A681DC6-…` arrives as `…/Package?id<0x06>681DC6-…`
   - `…?county=1&court=1…` arrives as `…?county<0x06>1&court=1…`
   - `…&caseNumber=26-CI-00094…` arrives as `…&caseNumber&-CI-00094…`
   The retrieval **GUID** and querystring must be repaired (re-insert `=` after the known keys
   `id`, `county`, `court`, `division`, `caseNumber`, `caseTypeCode`, `client_id`) before use.
2. **Recipient case varies** — `DARRELL@darrellmesser.com` vs `darrell@darrellmesser.com`.
   Normalize to lowercase before matching.
3. **The retrieval GUID is the package join key**; the Envelope Number is the ledger join key.
4. **Bounce/loop awareness** — replies to `noreply@kycourts.net` bounce
   (`postmaster@kcoj.onmicrosoft.com` "Undeliverable"); the watcher must ignore non-court mail
   in the thread.
5. **Multi-document envelopes** — "The following document(s) were included" can list several
   titles; preserve all.
6. **`(for eFiler)` subject variants** appear when the filer is the user's own office.

## Type 1 — NEF (Notice of Electronic Filing)

Subject starts `NEF,` (or `NEF, (for eFiler)`). Fields:

```
Date and Time of Filing: May 21, 2026 at 3:52PM Eastern
eFiler: MOBERG, JESSIE (ATTORNEY FOR DEFENDANT)
Court: KNOX (CIRCUIT )
Case Caption: BRIGHT, JESSICA DIANE VS. BRIGHT, TIMOTHY DARRELL
Case Number: 23-CI-00304
Envelope Number: 13780275
Notice has been electronically mailed to:  <list of name - email>
The following document(s) were included in this eFiling:  <document titles>
You may view the document(s) at  <eFilingRetrieval/Home/Package?id=GUID>
```

Deadline signal: served documents start response clocks (see `03-deadline-rules.md`).

## Type 2 — NCP (Notification of Court Processing)

Subject starts `NCP`. "The circuit clerk has processed and ACCEPTED the following filing."
Adds `Date and Time Processed`, the eFiler, document titles, and the retrieval link — and
**sometimes an explicit scheduled event**:

```
Scheduled Event:
MOTION HOUR scheduled for 05/22/2026 at 9:30 AM ET in room , with HON. LUCAS M. JOYNER
```

Deadline signal: **direct calendar event** (date/time/judge) + confirms the filing was accepted.

## Type 3 — Notice of Entry

Subject starts `NOTICE OF ENTRY`. Body:

```
Order(s) have been entered in the above styled case.
Electronic transmission of this notice constitutes service in accordance with CR 77.04.
Date and Time Processed: May 28, 2026 at 10:13AM Eastern
Court / Case Caption / Case Number / Envelope Number
The following document(s) were included in this eFiling: CIVIL DOCKET   (or ORDER SCHEDULING, etc.)
You may view the document(s) at  <eFilingRetrieval link>
```

Deadline signal: **the CR 77.04 service date starts the post-judgment / appeal clocks** — the
single most important trigger in the system (see `03-deadline-rules.md`).

## Type 4 — Case Watch Daily Update

Subject `Case Watch Daily Update`. A digest table of activity on subscribed cases:

| Column | Example |
| --- | --- |
| Site Name/Case # | `KNOX CI` / `26-CI-00094` (links to `CaseAtAGlance`) |
| Case Style/Activity | `BLEVINS, JOHNA VS. SIZEMORE, DANIEL` / `Document (1)` |
| Activity Date | `05/28/2026` |

Activity classes: **Status Change**, **Scheduled Event**, **Document**, **Party Change**. Used
as a secondary/reconciliation signal — catches activity not separately e-served, and the
`CaseAtAGlance` link is a fallback document source. Per the CourtNet 2.0 manual, the
`CaseAtAGlance` screen also exposes a structured **"Next Court Event"** field, a clean
calendaring source — but note opening cases/images there is **billed** (see `04-pdf-pipeline.md`).
The `client_id` parameter ties to CourtNet's **Client ID Tracking** feature.

## Normalized parse model (target output)

```json
{
  "type": "NEF | NCP | NOTICE_OF_ENTRY | CASE_WATCH",
  "caseNumber": "23-CI-00304",
  "caseType": "CI",
  "caption": "BRIGHT, JESSICA DIANE VS. BRIGHT, TIMOTHY DARRELL",
  "court": { "county": "KNOX", "level": "CIRCUIT" },
  "envelope": "13780275",
  "eFiler": { "name": "MOBERG, JESSIE", "role": "ATTORNEY FOR DEFENDANT" },
  "dates": { "filed": "2026-05-21T15:52:00-04:00", "processed": null, "entered": null },
  "documents": ["TENDERED DOCUMENT: AGREED ORDER"],
  "recipients": [{ "name": "Messer, Darrell G", "email": "darrell@darrellmesser.com" }],
  "scheduledEvent": null,
  "retrieval": { "guid": "A681DC6-...-228FBD0F7DCE", "url": "https://kcoj.kycourts.net/eFilingRetrieval/Home/Package?id=..." },
  "cr7704Service": false
}
```
