# WealthFlow v2 — Product Plan

## Product Vision
WealthFlow v2 is a personal finance and investing web app that helps adults understand where their money goes and make better investing decisions.

It is built for long-term trust, not short-term wow factor.

---

## Product Principles
1. **Finance-first, investing-second** — Get budgeting right before portfolio tracking
2. **Import engine is the core product** — The dashboard is only as good as the data powering it
3. **Manual-first investments** — Users enter holdings manually; auto-detection from bank data is supplementary only
4. **Manual-first goals** — Users define goals explicitly; bank data supports forecasting only
5. **Demo mode fully separate** — Demo is a controlled showcase, never real user data
6. **One normalized finance engine** — All pages use the same math, same engine
7. **Trust, consistency, clarity** — More important than visual flash
8. **Professional fintech style** — Calm, premium, modern. Not startup-gimmick, not crypto
9. **No crypto/gaming feel** — Avoid neon, noise, random animations
10. **Long-term maintainability** — Clean code, clear architecture, no hacks

---

## User Journey

### Onboarding
1. Sign up / log in (Supabase Auth)
2. Choose: Real mode or Demo mode
3. Prompted to import first bank statement or explore demo

### Core Loop
1. Import bank statement (CSV / Excel)
2. Review import preview — accept / correct / skip
3. View normalized transactions
4. Browse categories and spending breakdown
5. View reports and trends
6. Check dashboard summary
7. Define goals (manual)
8. Track investments (manual)

---

## Page Map
| Page | Phase | Purpose |
|---|---|---|
| `/auth/login` | 1 | Email + password login |
| `/auth/signup` | 1 | Account creation |
| `/import` | 2 | Import CSV/Excel bank statements |
| `/transactions` | 4 | View, filter, edit transactions |
| `/categories` | 4 | Manage spending categories |
| `/reports` | 4 | Trends, period comparisons, top spend |
| `/dashboard` | 5 | Summary overview |
| `/goals` | 6 | Manual goals tracking |
| `/investments` | 6 | Manual portfolio holdings |
| `/settings` | 7 | Account, export, delete data |

---

## Demo Mode
- Demo is a fixed curated dataset stored in code (or a dedicated demo schema)
- Demo users never write to the main Postgres tables
- Real users never see demo data
- Demo banner is always visible when in demo mode
- Switching between demo and real mode requires explicit action

---

## Import UX Requirements
### File Support
| Format | Reliability | Notes |
|---|---|---|
| CSV | ★★★★★ | Recommended. Highest reliability |
| Excel (.xlsx) | ★★★★☆ | Supported. High reliability |
| PDF | ★★★☆☆ | Review-based only. Lower confidence. Later phase |

### Detection Requirements
- Detect likely table start row
- Detect likely header row
- Detect columns: date, description, amount OR debit+credit, optional balance
- Skip blank rows, title rows, summary rows, footer rows

### Preview Requirements
Before saving, always show:
- Total rows detected
- Rows accepted
- Rows skipped (with reasons)
- Duplicate summary (how many detected, policy)
- Transfer summary (how many detected)
- Confidence / warning messaging per uncertain column
- Allow manual column correction if auto-detection is uncertain

### Post-Import
- All imports logged to `import_batches`
- All raw rows logged to `import_rows`
- User can review import history
- User can undo/delete an import batch

---

## Design Direction
- **Style**: Light, professional, fintech
- **Feel**: Calm, premium, trustworthy
- **Typography**: Clean sans-serif (Inter or similar)
- **Spacing**: Generous, structured hierarchy
- **Color**: Neutral base with subtle accent (no neon)
- **Animations**: Minimal, purposeful — no gimmicks
- **Icons**: Consistent icon set (Lucide or similar)
- **Charts**: Clean, labeled, accessible

### NOT Allowed
- Neon colors
- Dark hacker aesthetic
- Crypto chart feel
- Random motion/particles
- Cluttered dashboards
- Generic admin template look

---

## Non-Negotiable Data Rules
1. Money uses `numeric(15,2)` in Postgres — never float
2. Demo data never leaks into real user workspaces
3. Real user data never uses localStorage as source of truth
4. All pages use the same normalized finance engine
5. Import never silently guesses risky mappings without review
6. Transfers excluded from spend totals only when confidently detected
7. Refunds reduce spending correctly
8. Categories are relational and user-scoped
9. Every import action is auditable
10. User identity and mode are always clear
