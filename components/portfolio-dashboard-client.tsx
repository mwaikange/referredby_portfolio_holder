"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, Banknote, Building2, CalendarClock, CircleDollarSign, Landmark, Layers, LogIn, LogOut, TrendingUp, UserRound, WalletCards } from "lucide-react";
import { ProfilePanel } from "@/components/profile-panel";
import { SecurityNotice } from "@/components/security-notice";
import { SocietyTable } from "@/components/society-table";
import { StatCard } from "@/components/stat-card";
import { formatMoney, formatPercent, textFrom, type AnyRow } from "@/lib/finance";
import { getClientPortalData, type ClientPortalData } from "@/lib/portfolio-client-data";
import { resolvePortfolioHolder } from "@/lib/portfolio-holder-auth";
import { getSupabaseClient } from "@/lib/supabase";

export function PortfolioDashboardClient() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [holder, setHolder] = useState<AnyRow | null>(null);
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "societies" | "profile">("overview");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: authData }) => {
      setSession(authData.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setHolder(null);
      setData(null);
      setMessage(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session?.user) return;

    let cancelled = false;
    const client = supabase;
    const user = session.user;
    setLoading(true);

    async function loadPortfolio() {
      const resolution = await resolvePortfolioHolder(client, user);
      if (cancelled) return;

      if (!resolution.holder) {
        setMessage(resolution.error || "No portfolio holder is linked to this login.");
        setLoading(false);
        return;
      }

      const portalData = await getClientPortalData(client, resolution.holder);
      if (cancelled) return;

      setHolder(resolution.holder);
      setData(portalData);
      setMessage(portalData.error || null);
      setLoading(false);
    }

    loadPortfolio();
    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) setMessage(error.message);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!supabase) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-ink">Supabase env required</h1>
        <p className="mt-2 text-reed">Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then restart the dev server.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-field">
        <div className="pattern-strip h-4 w-full" />
        <div className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[1fr_420px]">
          <section className="flex flex-col justify-center">
            <img src="/brand/rba-wordmark.svg" alt="ReferredBy" className="mb-8 h-14 w-fit" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ember">Portfolio Holder Portal</p>
            <h1 className="mt-3 text-4xl font-bold text-ink">Sign in to view your portfolio.</h1>
            <p className="mt-4 max-w-2xl text-reed">
              Portfolio holders use Supabase Auth credentials. After sign-in, the portal resolves the linked portfolio holder record and loads only connected lending societies, loans, and collections.
            </p>
          </section>

          <form onSubmit={signIn} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-ink/10 text-ink">
              <LogIn className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-ink">Login</h2>
            <label className="mt-5 block text-sm font-medium text-ink">
              Email
              <input className="mt-2 h-11 w-full rounded-md border border-ink/15 px-3 outline-none focus:border-ink" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="mt-4 block text-sm font-medium text-ink">
              Password
              <input className="mt-2 h-11 w-full rounded-md border border-ink/15 px-3 outline-none focus:border-ink" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {message ? <p className="mt-4 rounded-md bg-ember/10 p-3 text-sm font-medium text-ember">{message}</p> : null}
            <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 font-semibold text-white hover:bg-ink/90 disabled:opacity-60" disabled={authLoading}>
              <LogIn className="h-4 w-4" />
              {authLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <div className="pattern-strip fixed bottom-0 h-4 w-full" />
      </div>
    );
  }

  if (loading || !data || !holder) {
    return <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">Loading portfolio...</div>;
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Layers },
    { id: "societies" as const, label: "Societies", icon: Building2 },
    { id: "profile" as const, label: "Profile", icon: UserRound },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-field">
      <div className="pattern-strip h-4 w-full shrink-0" />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col bg-ink text-white md:w-[244px]">
          <div className="px-5 py-5">
            <img src="/brand/rba-wordmark.svg" alt="ReferredBy" className="h-12 w-auto rounded bg-white px-2 py-1" />
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-11 min-w-fit items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition md:min-w-0 ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white ring-1 ring-white/10"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="rounded-md bg-white/10 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">Portfolio Holder</p>
              <p className="mt-1 text-sm font-bold text-white">{textFrom(holder, ["name"], "Portfolio Holder")}</p>
              <p className="mt-1 text-xs text-white/55">{session.user.email}</p>
            </div>
            <button onClick={signOut} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-6 lg:px-7">
            <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">
                  {activeTab === "overview" ? "Portfolio performance" : activeTab === "societies" ? "Lending societies" : "Settings"}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                  {activeTab === "overview" && textFrom(holder, ["name"], "Portfolio Holder Dashboard")}
                  {activeTab === "societies" && "Per-lending-society accounting"}
                  {activeTab === "profile" && "Profile"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-reed">
                  Aggregate capital, active exposure, repayments, upcoming collections, and funding required for approved loans awaiting disbursement.
                </p>
              </div>
              {(message || data.error) ? <SecurityNotice unsafeDevFilter={false} error={message || data.error} /> : null}
            </section>

            {activeTab === "overview" ? (
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total allocation" value={formatMoney(data.totals.allocation)} caption={`${data.societies.length} linked lending societies`} icon={Landmark} />
                <StatCard title="Active exposure" value={formatMoney(data.totals.activePrincipal)} caption={`${data.totals.activeLoans} active loans across nano and term`} icon={TrendingUp} />
                <StatCard title="Collections received" value={formatMoney(data.totals.totalCollected)} caption={`${formatPercent(data.totals.collectionRate)} against repayable amount`} icon={CircleDollarSign} tone="good" />
                <StatCard title="Upcoming collections" value={formatMoney(data.totals.expectedUpcoming)} caption="Expected in the next 30 days" icon={CalendarClock} />
                <StatCard title="Available capacity" value={formatMoney(data.totals.availableCapacity)} caption="Allocation less exposure and approved funding need" icon={WalletCards} tone="good" />
                <StatCard title="Funding required" value={formatMoney(data.totals.fundingRequired)} caption={`${data.totals.approvedAwaitingLoans} awaiting disbursement`} icon={Banknote} tone="alert" />
                <StatCard title="Overdue exposure" value={`${data.totals.overdueLoans} loans`} caption="Overdue/default-style statuses" icon={AlertCircle} tone={data.totals.overdueLoans ? "alert" : "default"} />
                <StatCard title="Settled loans" value={`${data.totals.settledLoans}`} caption="Paid, settled, closed, or completed loans" icon={CircleDollarSign} />
              </section>
            ) : null}

            {activeTab === "societies" ? <SocietyTable societies={data.societies} /> : null}
            {activeTab === "profile" ? <ProfilePanel holder={holder} specs={data.specs} /> : null}
          </div>
        </main>
      </div>
      <footer className="shrink-0 border-t border-ink/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-reed">
          <span>ReferredBy · Portfolio Holder Portal · read-only investor view</span>
          <span>RLS required before production access</span>
        </div>
        <div className="pattern-strip h-4 w-full" />
      </footer>
    </div>
  );
}
