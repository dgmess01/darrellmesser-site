# 07 — Hot-Folder Auto-Filer & Destination Organization

## 7a. Current destination state (analyzed from Drive)

**Canonical automated target** = `KYeCourts Archive/` in the Workspace Drive
(`darrell@darrellmesser.com`, folder id `13Qg8LhSHs-2-PbydFPNuEFfmrx7VErrJ`). Observed scheme,
consistent and machine-generated:

```
KYeCourts Archive/
  {CASE#} - {CAPTION}/                                         ← matter folder
    {YYYY-MM-DD} - Envelope {ENV#} - {STATUS} - {DOC TITLE}/   ← per-envelope subfolder
      {CASE#} - {YYYY-MM-DD} - Env {ENV#} - {DOC TITLE}.pdf    ← leaf PDF
```

Examples seen live:
- `23-CI-00304 - BRIGHT JESSICA DIANE VS BRIGHT TIMOTHY DARRELL/`
  - `2026-05-08 - Envelope 13649190 - Order Entered - ORDER SCHEDULING/`
  - `2026-05-07 - Envelope 13625934 - Order Entered - CIVIL DOCKET/`
    - `23-CI-00304 - 2026-05-07 - Env 13625934 - CIVIL DOCKET.pdf`
- Sealed/juvenile suppressed: `21-J-500020 - CONFIDENTIAL/`, `20-J-502792-001 - CONFIDENTIAL/`.

**STATUS token** is a derived lifecycle stage: `Awaiting NCP` → `Clerk Processed` →
`Order Entered`.

**Case-number suffix taxonomy:** `CI` circuit-civil · `CR` criminal · `D` district/DVO ·
`T` traffic/misdemeanor · `M` misdemeanor · `P` probate/estate/guardianship · `J` juvenile
(confidential) · `F` family/felony.

### The problem — competing schemes & duplication
1. Legacy **client-name** folders at Workspace root (`Bright, Jessica`, `Drake, Austin J`, …),
   inconsistent nesting (`Jefferson 19-CI-501104`, `CI19-CI-00107`).
2. A **parallel matter tree in the personal `darrell.messer@gmail.com` Drive**, sometimes filed
   by **opposing-party** name (`Johna Blevins`, `Timothy Bright`).
3. Saved-webpage artifact folders (`KYeCourts - eFiling_files`, `…eFiling2_files`).

→ The same matter is duplicated across two Google accounts with no single source of truth.

## 7b. Recommended canonical structure & naming

- **One canonical Drive** = Workspace `KYeCourts Archive`. Legacy/personal-Drive folders become
  **migrate/alias** targets, not active destinations.
- **Flatten the per-envelope subfolder.** It mostly holds a single PDF and creates sprawl.
  Default to **one folder per matter**, with distinguishing data in the **filename**; create a
  subfolder *only* when an envelope contains multiple documents (or as coarse categories once a
  matter grows large).
- **Folder vs filename rule of thumb:** folders carry the *stable identity* (the matter);
  filenames carry the *per-document variables* (date, status, type, envelope). Result: each
  matter folder reads as a chronological, sortable docket.
- **Canonical names**
  - Matter folder: `{CASE#} - {CAPTION}` (suppressed → `CONFIDENTIAL` for J / D / sealed).
  - Leaf file (date-first ISO for sort):
    `{YYYY-MM-DD} - {STATUS} - {DOCTYPE} - Env{ENV#}[ - p{N}].pdf`.
  - Optional category subfolders for large matters:
    `Orders / Pleadings / Motions / Discovery / Notices / Correspondence`.
- **Matter Registry** (see `05-redesign-architecture.md`) is the single source of truth mapping
  `case# ↔ client ↔ opposing party ↔ caption ↔ case type ↔ folder id ↔ label ↔ calendar`.

### Trade-off summary

| Approach | Pros | Cons |
| --- | --- | --- |
| Folder-per-envelope (current) | Groups multi-doc envelopes | Sprawl; one-PDF folders; slow to scan |
| **Flat + rich filenames (recommended)** | Chronological docket; fast search; less clutter | Long filenames; needs a naming standard |
| Category subfolders | Scales for big matters | Requires reliable doc classification |

## 7c. Hot-folder auto-filer process

A `_Inbox` / `_Unfiled` Drive folder watched by a frequent trigger. For each PDF:

1. **Metadata pass** — Drive metadata + PDF properties (producer, creation date, pages); dedupe
   by content hash.
2. **Content pass** — Drive OCR (`Drive.Files.copy` pdf→Doc); read page-1 caption/header and
   page-1/last-page footer stamp.
3. **Footer-type → lifecycle status** (core of the request) — KY eFiling stamps encode status
   independently of any email:
   - **Tendered** stamp ("TENDERED"; proposed order, not signed) → `Tendered`.
   - **Filed** stamp ("Filed &lt;date&gt; &lt;clerk&gt; &lt;county&gt; Circuit Clerk" + envelope #)
     → `Filed` / `Clerk Processed`.
   - **Entered** stamp ("Entered: &lt;date&gt;" + CR 77.04 clerk notation; judge-signed) →
     `Entered`.
   Precedence: **Entered > Filed > Tendered**.
4. **Extract fields** — Filed/Tendered/Entered dates, hearing dates, **case #**
   (`\d{2}-(CI|CR|D|T|M|P|J|F)-\d+`), envelope #, document **character/type**
   (Order / Motion / Pleading / Notice / Discovery from title + body).
5. **Resolve matter** via the Matter Registry (case# → folder id). Unknown → create from
   caption or route to `_Needs Review`.
6. **Compute canonical name** (§7b) from status/date/type/envelope.
7. **Rename + move** into the matter folder (multi-doc envelope → envelope subfolder).
8. **Record & cross-check** — write/update the control-sheet row (stamp data vs originating
   email), and hand extracted dates to the Deadlines/Calendar engine (`03-deadline-rules.md`).

This is a **second, document-driven ingestion path**: it files any PDF dropped in the inbox
(manual downloads, the `Substitute?` fallback for expired links, scanned mail) using the file's
own stamps as ground truth — and it backstops the email-driven path when retrieval links expire.
