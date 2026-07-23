# ReferredBy Portfolio Holder Portal

A responsive React prototype for ReferredBy portfolio holders, financiers, and
banks. The interface is built from the supplied ReferredBy assets and uses the
portfolio calculation guide as the source for the demo metrics.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add the correct Supabase anonymous
public key before starting Vite:

```env
VITE_SUPABASE_URL=https://trtmufpsqqpitropowgw.supabase.co
VITE_SUPABASE_ANON_KEY=your-project-anon-key
```

Open the local URL printed by Vite and sign in with a Supabase Auth user mapped
to a portfolio holder.

## Included modules

- Secure portfolio-holder login
- Portfolio performance overview and explainable KPI calculations
- Portfolio and lending-society views
- Eligible disbursements, selection, and draft batch interaction
- Loan book and collections monitoring
- Reconciled risk/rating breakdown
- Controlled report-export interface
- Audit timeline
- Responsive desktop, tablet, and mobile layouts

## Supabase authentication and migration

The migration in `supabase/migrations/20260723193000_portfolio_holder_portal_auth.sql`
stores `user_type: portfolio_holder` in supported Supabase Auth app metadata and
maps each Auth user to `public.portfolio_holder_users`. Matching is based on the
Auth email and `portfolio_holders.contact_email` or
`portfolio_holders.company_contact_email`.

After authenticating the Supabase CLI with the account that owns the project:

```bash
supabase link --project-ref trtmufpsqqpitropowgw
supabase db push
```

The UI loads the signed-in holder, linked societies, loan totals, repayments,
and ratings through RLS-scoped Supabase queries. Financial calculations should
ultimately move to one versioned decimal-safe database function or calculation
service; the current client aggregation is a transitional integration layer.
