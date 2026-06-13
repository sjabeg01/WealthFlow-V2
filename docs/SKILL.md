# Rakam v2 — SKILL.md
> Project memory. Read this before making any changes.

---

## 1. Architecture
- **Stack:** Next.js (App Router) + Supabase Auth + Supabase Postgres
- **Storage:** Supabase Storage (only if explicitly needed)
- **Deployment:** Local-first build; Vercel deployment only after core flows are stable
- **Backend:** No heavy custom backend — thin server logic only
- **State:** No localStorage as a source of truth for real financial data

---

## 2. Product Principles
- **Finance-First:** Calm, premium, professional, trustworthy fintech UI. No clutter or gimmicks.
- **Import-First:** Transaction ingestion via statements (CSV/Excel) is the core mechanism.
- **Trust-First:** No silent architecture shortcuts, fake random data pollution, or guessing risky mappings without review.
- **Manual-First Goals:** Users manage goals manually. No auto-creation from bank data.
- **Manual-First Investments:** Users manage holdings manually. No auto-creation from bank data.
- **Demo Mode:** Fully separated and isolated from real user data.
- **Single Source of Truth:** One shared finance engine used by all pages.

---

## 3. Build Order
1. Foundation (Next.js + Supabase + Auth + Schema)
2. Import Pipeline
3. Normalization & Trust Engine
4. Transactions, Categories, Reports (Read views)
5. Dashboard
6. Goals & Investments (Manual-first)
7. Settings (Accounts & User management)
8. Hardening & Polish
9. Deployment

---

## 4. Data Rules
- **Real Data:** Fetched exclusively from Supabase (unless Demo Mode is explicitly active).
- **Scope:** All data must be user-scoped via `user_id` and enforced by RLS.
- **Relational Categories:** Categories are strictly relational, not ad-hoc text fields.
- **Money Precision:** Handled correctly (`numeric(15,2)` in Postgres).
- **Auditability:** Every import must be auditable (`import_batches` and `import_rows`).
- **Flexible Import:** Users can preview imports without an account; account selection/creation is required only for the final commit. Inline account creation is preferred over forcing navigation to Settings.

---

## 5. UX Rules
- **No Fake Data:** Do not inject random seed data into real user accounts.
- **No Placeholders:** No placeholder "Coming Soon" production pages left in the final product. Every page must be fully functional.
- **Actionable Empty States:** Every empty state must tell the user exactly what to do next (e.g., "Create an account in Settings").
- **Clear Flow:** A new user must be able to log in, create an account, import data, and see results without getting stuck in a dead-end.

---

## 6. QA & Testing Rules
- **Fixed Test Accounts Only:** All QA and smoke testing must use only these two approved accounts:
  - `testuser1@test.com` (password: `admin1`)
  - `tester_final_1@example.com` (password: `admin1`)
- **No Random Users:** Do not create new auth users for testing. Do not use throwaway emails.
- **No Uncontrolled Signups:** Do not trigger the public signup flow for automated testing unless absolutely necessary.
- **Clean App Data, Not Auth:** If a fresh environment is needed, clean the app data (accounts, transactions, goals, investments) for these users — do not create new auth identities.
- **User Isolation:** Verify that data from one user never leaks into another user's session.
- **Release Gate:** Do not declare "production ready" unless the real running UI passes with both approved test accounts.

---

## 7. Import Pipeline Rules
- **Format Support:** CSV and Excel (`.xlsx`) must both be supported.
- **Unified Parsing:** One shared parser pipeline must be used to convert all files into a normalized data grid before processing. CSV and XLSX must feed the exact same pipeline.
- **Excel Dates:** `.xlsx` parsing must use `cellDates: true` and `raw: true` to handle native Date objects, strictly normalizing them to `YYYY-MM-DD` strings before processing.
- **Preview Math:** Import UI MUST show preview math (Estimated Income, Estimated Expense, Net Impact) before committing.
- **Account Selection:** A target account MUST be selected or created inline before committing an import.
- **Duplicate Detection:** O(1) database duplicate detection must run *before* commit. Duplicates must be moved to 'Skipped' to prevent double-counting.
- **Math Consistency:** The committed import rows must precisely match the mathematical aggregation shown on the Dashboard and Reports.

---

## 8. Source Integration Rules
- **CSV is Primary:** CSV/Excel file upload via the Import pipeline remains the PRIMARY and fully-supported data ingestion method. Every import commits to `data_sources` automatically.
- **Bank Connect is Secondary/Beta:** The Bank Connect UI flow (3-step modal: Consent → Select Bank → Beta screen) is UI-only. It MUST display a clear "Beta — Coming Soon" screen at Step 3. No real bank credentials are collected or stored.
- **Auto-Source Linking:** After every successful `commitImportBatch`, the system must:
  1. Find or auto-create a `data_sources` record of type `csv` labelled "CSV Uploads".
  2. Link the `import_batch_id` → `source_id` on the batch.
  3. Link all `transactions.source_id` for that batch.
  4. Write a `sync_logs` record with `status: 'success'` and row counts.
- **Setup Wizard Gate:** New users (no data sources, `rakam_setup_dismissed` cookie not set) MUST see the `SetupWizard` full-screen overlay on first load. It is dismissible via "Skip" or by connecting a source.
- **Status Dots:** `StatusDot` color logic is: `green` = active/success, `yellow` = syncing or partial, `red` = error/disconnected, `gray` = no sources. Animated ping only on `syncing`.
- **Source Detail Page:** `/sources/[id]` is a Server Component that reads `data_sources` + `sync_logs` for that source. It must show stats, error state if any, and the last N sync log rows.
- **Sidebar Indicator:** `SyncStatusIndicator` in the sidebar footer fetches sources client-side on mount and displays the overall health dot.
- **Demo Mode:** All source functions (`getDataSources`, `createDataSource`, etc.) MUST check `isDemoModeActive()` and use in-memory arrays if true. No DB writes in demo mode.
- **DB Schema:** `data_sources` and `sync_logs` are defined in `supabase/migrations/009_data_sources.sql`. RLS enforces user-scoped access.
