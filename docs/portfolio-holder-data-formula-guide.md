# ReferredBy Portfolio Holder Portal

## Data Sources, Statuses and Formula Working Guide

**Document status:** Draft v0.1  
**Prepared:** 24 July 2026  
**Purpose:** Working reference for validating every number, status and link in the Portfolio Holder Portal before preparing the final calculation guide.

> This document describes the portal’s current implementation. Items marked **Decision required** need business confirmation before the figures should be treated as final reporting definitions.

## 1. Authentication and portfolio data scope

The portal is intended only for authenticated portfolio holders.

1. The user signs in through Supabase Auth.
2. `auth.users.raw_app_meta_data.user_type` must identify the account as a portfolio-holder user.
3. `public.portfolio_holder_users` maps the authenticated user to a row in `public.portfolio_holders`.
4. That portfolio-holder record determines which lending societies and portfolio data the user may see.
5. Supabase Row Level Security must enforce the same scope on the database, rather than relying only on filtering in the browser.

### Main scope tables

| Table | Purpose |
|---|---|
| `auth.users` | Authentication identity and user type |
| `public.portfolio_holder_users` | Links an authenticated user to a portfolio holder |
| `public.portfolio_holders` | Portfolio-holder profile, allocation and contact information |
| `public.lending_societies` | Funded organisations belonging to the portfolio |
| `public.nano_loans` | Nano-loan records |
| `public.term_loans` | Term-loan records |
| `public.loan_payments` | Loan collection/payment records |
| `public.partner_ratings` | Society-level rating information |
| `public.activity_history` | Intended source for the audit log; not currently connected |

### Current implementation files

- [Portfolio data adapter](../src/lib/portfolioApi.js)
- [Portal pages and calculations](../src/App.jsx)
- [Database migration](../supabase/migrations/20260723143000_portfolio_holder_portal_auth.sql)

## 2. Portfolio-wide calculation definitions

The following definitions are currently reused across the portal.

| Metric | Current formula |
|---|---|
| Initial allocation | `portfolio_holders.total_allocation`; if empty, sum `lending_societies.total_allocation` |
| Capital deployed | Sum `loan_amount` for loans with status `DU`, `OT`, `BL` or `PU` |
| Collections received | Sum `loan_payments.amount_paid` |
| Active exposure | Sum `outstanding_balance` for loans with status `DU`, `OT` or `BL` |
| Cash on hand | `initial allocation - capital deployed + collections received` |
| Portfolio value | `cash on hand + active exposure` |
| Book performance | `portfolio value - initial allocation` |
| Book return | `book performance / initial allocation × 100` |
| Utilisation | `capital deployed / initial allocation × 100` |
| Yield | `book performance / capital deployed × 100` |
| Collection efficiency | `collections received / instalments due × 100` |
| Cash ratio | `cash on hand / portfolio value × 100` |

All division formulas return zero where the denominator is zero.

### Important interpretation

`Cash on hand` is currently a calculated balance, not a bank-ledger balance. It assumes that allocation, deployed principal and recorded collections are the only movements affecting cash.

**Decision required:** If fees, interest transfers, write-offs, top-ups, withdrawals, reversals, refunds or operating charges affect the real balance, the production figure should come from a portfolio transaction ledger or reconciliation table instead.

## 3. Overview page

![Overview page reference](C:/Users/clien/AppData/Local/Temp/codex-clipboard-c624e96d-3a9f-48fe-9ee6-236f28ed0648.png)

### Sources and formulas

| Display | Source or formula |
|---|---|
| Portfolio-holder name | `portfolio_holders.name` |
| Portfolio value | Cash on hand + active exposure |
| Cash on hand | Allocation − deployed + collections |
| Capital deployed | Sum of qualifying loan principal |
| Collections | Sum of payments received |
| Active exposure | Sum of qualifying outstanding balances |
| Book performance | Portfolio value − allocation |
| Capital movement chart | Payments and loan disbursements grouped by month |
| Performance score | Weighted score described under Risk & ratings |
| Capital composition | Cash on hand compared with active exposure |
| Lending society snapshot | Linked society allocation and exposure totals |

The capital movement chart displays the latest six months for which the client prepares month buckets. Loan amounts are grouped using the available approval/creation date; collections use the payment date.

### Links and actions

- **Export snapshot** downloads the current overview figures as CSV.
- **View all** in the society panel opens the Lending societies page.
- The top scope labels are informational; they no longer imply filters that are not implemented.

### Decisions required

- Confirm whether monthly disbursements should use `approved_at`, `created_at`, a true disbursement date, or a transaction-ledger posting date.
- Confirm which payment statuses count as cleared collections.
- Confirm whether empty months must always be shown.
- Confirm the reporting cut-off and timezone for daily/monthly reporting.

## 4. Portfolios page

![Portfolios page reference](C:/Users/clien/AppData/Local/Temp/codex-clipboard-7da8cf58-7dfb-4650-824d-edf5240bbfb1.png)

The authenticated user currently has one portfolio-holder record, so this page presents one portfolio rather than fabricated sub-portfolios.

### Sources and formulas

| Display | Source or formula |
|---|---|
| Portfolio identity | `portfolio_holders.id` and `portfolio_holders.name` |
| Status | `portfolio_holders.status` |
| Initial allocation | Portfolio allocation definition |
| Portfolio value | Cash on hand + active exposure |
| Book return | Book performance ÷ allocation |
| PAR 30+ | 30+-day arrears ÷ active exposure |
| Capital position | Allocation, deployed, collections and calculated cash |
| Performance ratios | Utilisation, collection efficiency, cash ratio and book return |

### Links and actions

- **Summary** remains on the current portfolio summary.
- **Loan book** opens the Loans page.
- **Collections** opens the Collections page.
- **Risk & arrears** opens Risk & ratings.
- **Documents** currently indicates that no document repository has been connected.
- **Export CSV** downloads the current portfolio summary.

### Decisions required

- Confirm whether one portfolio holder may own several separately reportable funds in future.
- If separate funds are required, introduce a dedicated portfolio/fund entity rather than treating the holder itself as the fund.

## 5. Lending societies page

![Lending societies page review reference](C:/Users/clien/AppData/Local/Temp/codex-clipboard-21bd6a30-9baa-4ca3-afb2-70bd7e5bc400.png)

> This is an earlier review capture. Some controls shown in the image were removed because they did not yet have real filtering behaviour.

### Sources and formulas

| Display | Source or formula |
|---|---|
| Society name/type | `lending_societies` |
| Allocation | `lending_societies.total_allocation` |
| Active exposure | Sum of the society’s qualifying loan balances |
| Collected | Sum of payments linked to the society’s loans |
| Efficiency | Society collections ÷ society instalments due |
| PAR 30+ | Currently `partner_ratings.default_rate` when available |
| Rating | `partner_ratings.rating_tier`, with score retained separately |

Selecting the row arrow expands the society’s current data summary; it does not navigate to an invented page.

### Decisions required

- Portfolio PAR is calculated from loan arrears, while society PAR currently comes from `partner_ratings.default_rate`. Confirm whether these are meant to be the same measure.
- Confirm whether allocation belongs on `lending_societies` or on a separate portfolio-to-society funding agreement.
- Define the approved rating-tier vocabulary and whether a missing rating should display as “Not rated”.

## 6. Disbursements page

![Disbursements page review reference](C:/Users/clien/AppData/Local/Temp/codex-clipboard-bb5e855b-50fb-4e5b-a31c-da61cb52896c.png)

> This is an earlier review capture. Invented batch, bank-account and processing-status information shown during prototyping has been removed.

### Current data scope

| Group | Loan status |
|---|---|
| Awaiting approval | `AA` |
| Awaiting disbursement | `AD` |

The page combines eligible records from `nano_loans` and `term_loans`. It shows the loan reference, masked borrower identifier, lending society, loan type, principal, relevant date and canonical status.

The portfolio-holder portal is read-only. It does not create batches, upload bank results or change loan statuses.

### Decisions required

- Confirm whether `AD` means approved but not paid, or whether a separate “approved” status is needed.
- Add a real disbursement transaction/batch table if the business needs bank files, payment batches, settlement references or reconciliation results.
- Confirm which date is the authoritative approval and payment date.

## 7. Loans page

**Screenshot:** Pending final capture.

### Sources

- `nano_loans`
- `term_loans`
- `lending_societies`

### Displayed data

| Display | Source |
|---|---|
| Loan reference | Loan table identifier/reference |
| Borrower | Masked `user_id`; the portal does not expose unsupported borrower names |
| Society | Society lookup |
| Loan type | Source table: Nano or Term |
| Principal | `loan_amount` |
| Outstanding balance | `outstanding_balance` |
| Relevant dates | Available created, approved and due dates |
| Status | Canonical loan-status mapping |

Search and status filters operate on the loaded authenticated portfolio data. Export downloads the filtered loan view as CSV.

### Decisions required

- Confirm which borrower information a portfolio holder is legally permitted to see.
- Confirm whether settled loans should remain in the default view.
- Define treatment of refinanced, restructured, written-off and reversed loans if those states are introduced.

## 8. Collections page

**Screenshot:** Pending final capture.

### Sources and formulas

| Display | Source or formula |
|---|---|
| Amount due | Sum `loan_payments.amount_due` |
| Amount received | Sum `loan_payments.amount_paid` |
| Collection efficiency | Amount received ÷ amount due |
| Monthly chart | Due and paid amounts grouped by payment date month |
| Recent payments | Latest scoped rows from `loan_payments` |
| Society | Loan-to-society lookup |

Export downloads the current collection records as CSV.

### Decisions required

- Confirm which payment status indicates cleared/settled cash.
- Confirm handling of failed payments, reversals, refunds and duplicates.
- Confirm whether prepayments belong to their receipt month or scheduled due month.
- Confirm whether `days_late` is stored at payment time or should be recalculated from due and paid dates.

## 9. Risk & ratings page

![Risk and ratings review reference](C:/Users/clien/AppData/Local/Temp/codex-clipboard-66b949e3-51dc-469d-a9f9-604bf5b54230.png)

> This is an earlier review capture. The current page labels the result as calculated and avoids unsupported qualitative claims.

### Current portfolio score

| Component | Input | Weight |
|---|---:|---:|
| Collection efficiency | Portfolio collection efficiency | 25% |
| Default-rate score | `100 − PAR 30+` | 25% |
| Utilisation | Portfolio utilisation | 15% |
| Yield | Portfolio yield | 15% |
| Cash ratio | Portfolio cash ratio | 10% |
| Active/settled score | Settled loans ÷ deployed loans | 10% |

`Portfolio score = sum(component score × component weight)`

Each input is constrained to the 0–100 range before weighting.

### Arrears calculations

For each payment:

`unpaid amount = max(amount due − amount paid, 0)`

| Bucket | Current rule |
|---|---|
| Current | Unpaid amount where days late is 0 or less |
| 1–29 days | Unpaid amount where days late is between 1 and 29 |
| 30+ days | Unpaid amount where days late is 30 or more |

`PAR 30+ = 30+-day arrears / active exposure × 100`

### Decisions required

- Confirm whether PAR should use arrears amount, full outstanding balance of delinquent loans, or another regulatory definition.
- Confirm whether “default” begins at 30, 60 or 90 days.
- Confirm the rating weights, caps and qualitative bands.
- Confirm whether the cash ratio should reward high cash, or whether excessive undeployed cash should reduce the score.
- Confirm whether the active/settled component measures portfolio maturity rather than credit quality.

## 10. Reports & exports page

**Screenshot:** Pending final capture.

The current page creates CSV exports from the authenticated portfolio data already loaded by the portal.

| Export | Content |
|---|---|
| Portfolio summary | Headline capital and performance metrics |
| Loan book | Scoped nano and term loan records |
| Collections | Scoped payment records |
| Lending societies | Society allocations, exposure and collections |
| Risk snapshot | Current score components and arrears values |

### Limitations

- Exports are CSV, not audited statements.
- They contain the current browser-loaded data and calculation rules.
- No report-signing, immutable reporting snapshot or scheduled report service is connected.

## 11. Audit log page

**Screenshot:** Pending final capture.

The UI does not invent audit events. It currently explains that `activity_history` is not connected for portfolio-holder access.

### Required before activation

1. Confirm the real audit table and its columns.
2. Define a safe portfolio-holder Row Level Security policy.
3. Decide which internal actions a portfolio holder may see.
4. Map event type, actor, timestamp, entity and description.
5. Remove or mask sensitive staff and borrower information.

## 12. Canonical loan status dictionary

| Code | Portal label | Current use |
|---|---|---|
| `NR` | Not requested | Loan has not entered approval |
| `AA` | Awaiting approval | Disbursement pipeline |
| `AD` | Awaiting disbursement | Approved/pre-payment pipeline |
| `DU` | Due | Active/deployed |
| `OT` | Outstanding | Active/deployed |
| `BL` | Blocked | Active/deployed |
| `PU` | Paid up | Settled and included in cumulative deployment |
| `DE` | Declined | Not deployed |

**Decision required:** Confirm this dictionary against the production loan lifecycle and database constraints. Statuses must not be inferred from prototype wording.

## 13. Calculation-control checklist

Before the guide is approved, confirm:

- [ ] Exact portfolio-to-society relationship and allocation ownership
- [ ] Loan status dictionary
- [ ] Active exposure definition
- [ ] Capital-deployed definition
- [ ] Cleared-payment rules
- [ ] Cash-on-hand source
- [ ] Reporting date and timezone
- [ ] PAR and default definition
- [ ] Collection-efficiency denominator
- [ ] Rating components, weights and bands
- [ ] Treatment of write-offs, refunds, reversals and fees
- [ ] Borrower privacy rules
- [ ] Export and audit-log access rules
- [ ] RLS tests proving one holder cannot access another holder’s data

## 14. Revision log

| Version | Date | Notes |
|---|---|---|
| 0.1 | 24 July 2026 | Initial working guide based on the live portal implementation |

