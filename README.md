# Portfolio Holder Portal

Standalone portal for portfolio holders. It connects to the same Supabase project as the RBA Admin Portal but does not import or modify the admin codebase.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm install`, then `npm run dev`.
4. Open the local URL and sign in with a Supabase Auth portfolio-holder user.

## Auth Mapping

After login, the app resolves the signed-in Supabase user to a portfolio holder in this order:

1. `portfolio_holder_users.user_id = auth.users.id`, joined to `portfolio_holders`.
2. `portfolio_holders.auth_user_id = auth.users.id`.
3. `portfolio_holders.user_id = auth.users.id`.
4. `portfolio_holders.contact_email` or `company_contact_email` matches the auth email.

The recommended production model is:

```sql
create table public.portfolio_holder_users (
  id uuid primary key default gen_random_uuid(),
  portfolio_holder_id uuid not null references public.portfolio_holders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (portfolio_holder_id, user_id)
);
```

## What It Shows

- Aggregate allocation, exposure, collections, upcoming collections, available capacity, and funding required.
- Per-lending-society accounting across `nano_loans`, `term_loans`, and `loan_payments`.
- Loan status exposure for active, settled, overdue, and approved/awaiting-disbursement loans.
- Read-only portfolio holder profile and settings/specs view.

## Required RLS

Before production, enforce policies so a portfolio holder can only select:

- Their own `portfolio_holders` row.
- Their own `portfolio_holder_specs` row.
- `lending_societies` where `portfolio_holder_id` matches their holder id.
- `society_portfolio_specs` for linked societies.
- `nano_loans` and `term_loans` where `lending_society_id` belongs to one of their societies.
- `loan_payments` where `lending_society_id` belongs to one of their societies.
- Minimal borrower/reporting fields from `users`, only where linked through their societies.

Profile edits are intentionally disabled until update policies or secure server-side routes are approved.
