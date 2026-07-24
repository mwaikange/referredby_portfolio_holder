"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  CircleAlert,
  CircleDollarSign,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Layers,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { ProfilePanel } from "@/components/profile-panel";
import { SecurityNotice } from "@/components/security-notice";
import { StatCard } from "@/components/stat-card";
import { formatMoney, formatPercent, textFrom, type AnyRow } from "@/lib/finance";
import { getClientPortalData, type ClientPortalData } from "@/lib/portfolio-client-data";
import { resolvePortfolioHolder } from "@/lib/portfolio-holder-auth";
import { getSupabaseClient } from "@/lib/supabase";

type Tab = "overview" | "societies" | "profile";

export function PortfolioDashboardClientV2() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [holder, setHolder] = useState<AnyRow | null>(null);
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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
      <div className="min-h-screen bg-[var(--paper)] p-8">
        <div className="rounded-xl border border-[var(--line)] bg-white p-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">Supabase env required</h1>
          <p className="mt-2 text-[var(--ink-soft)]">Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then restart the dev server.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen bg-[var(--paper)]">
        <section className="relative hidden min-w-[280px] flex-[1_1_46%] flex-col justify-between overflow-hidden bg-[var(--teal-900)] px-10 py-11 md:flex">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, #fff 0, transparent 2%), radial-gradient(circle at 60% 40%, #fff 0, transparent 1.4%), radial-gradient(circle at 85% 75%, #fff 0, transparent 1.8%)",
              backgroundSize: "140px 140px",
            }}
          />
          <div className="relative flex items-center gap-3">
            <BrandMark size={30} />
            <Wordmark tone="light" size={19} />
          </div>

          <div className="relative max-w-[380px]">
            <Chip tone="warn">Portfolio Holder Portal</Chip>
            <h1 className="mt-4 text-[32px] font-bold leading-tight text-white">Capital, collections, and performance in one view.</h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
              Track every lending society you fund, see exactly what's deployed versus sitting in cash, and follow collections through to settlement.
            </p>
          </div>

          <div className="relative flex gap-6">
            {[
              ["5", "linked societies"],
              ["NAD 305K", "capital allocated"],
              ["30", "loans settled"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="mono text-lg font-bold text-white">{value}</div>
                <div className="text-[11.5px] text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-[1_1_54%] items-center justify-center bg-[var(--paper)] p-8">
          <form onSubmit={signIn} className="w-full max-w-[380px]">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--teal-700)]" />
              <span className="text-[12.5px] font-bold uppercase tracking-[0.03em] text-[var(--teal-700)]">Merchants & Portfolio Access</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">Sign in to your portfolio</h2>
            <p className="mt-1.5 text-[13.5px] text-[var(--ink-soft)]">Enter the credentials your relationship manager issued for your portfolio holder account.</p>

            <div className="mt-6 flex flex-col gap-3.5">
              <label className="text-[12.5px] font-semibold text-[var(--ink-soft)]">
                Email address
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-3 h-[15px] w-[15px] text-[var(--ink-soft)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-[9px] border border-[var(--line)] bg-[var(--card)] py-[11px] pl-[34px] pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal-700)]"
                    required
                  />
                </div>
              </label>
              <label className="text-[12.5px] font-semibold text-[var(--ink-soft)]">
                Password
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-3 h-[15px] w-[15px] text-[var(--ink-soft)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[9px] border border-[var(--line)] bg-[var(--card)] py-[11px] pl-[34px] pr-[34px] text-sm text-[var(--ink)] outline-none focus:border-[var(--teal-700)]"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2.5 top-2.5 border-none bg-transparent text-[var(--ink-soft)]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {message ? <p className="rounded-[9px] bg-[var(--red-100)] p-3 text-[12.5px] font-medium text-[var(--red-700)]">{message}</p> : null}

              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-[9px] border-none bg-[var(--teal-800)] px-4 py-3 text-[14.5px] font-bold text-white hover:bg-[var(--teal-700)] disabled:opacity-60"
                disabled={authLoading}
              >
                {authLoading ? "Logging in..." : "Log in"} <ArrowRight size={15} />
              </button>
            </div>

            <div className="mt-5 flex gap-2.5 rounded-[9px] bg-[var(--gold-100)] px-3.5 py-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-600)]" />
              <span className="text-[12.5px] leading-relaxed text-[var(--ink)]">This is a read-only investor view. Supabase row-level security must scope production access.</span>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (loading || !data || !holder) {
    return <div className="min-h-screen bg-[var(--paper)] p-7 text-[var(--ink-soft)]">Loading portfolio...</div>;
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Layers },
    { id: "societies" as const, label: "Societies", icon: Building2 },
    { id: "profile" as const, label: "Profile", icon: UserRound },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] text-[var(--ink)]">
      <div className="rbp-pattern-band" />
      <div className="rbp-shell-body flex min-h-0 flex-1">
        <aside className="rbp-sidebar">
          <div className="rbp-sidebar-top">
            <div className="flex items-center gap-2.5">
              <BrandMark size={26} />
              <Wordmark tone="light" size={15} />
            </div>
          </div>

          <nav className="rbp-sidebar-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="rbp-sidebar-btn"
                style={{
                  background: activeTab === tab.id ? "rgba(255,255,255,0.12)" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.65)",
                  borderLeft: activeTab === tab.id ? "3px solid var(--gold-600)" : "3px solid transparent",
                }}
              >
                <tab.icon size={16} />
                <span className="rbp-sidebar-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="rbp-sidebar-bottom">
            <div className="rbp-sidebar-identity">
              <div className="text-[10.5px] uppercase tracking-[0.05em] text-white/50">Portfolio Holder</div>
              <div className="mt-0.5 text-[13.5px] font-bold text-white">{textFrom(holder, ["name"], "Portfolio Holder")}</div>
              <div className="mt-1 text-[11.5px] text-white/45">{session.user.email}</div>
            </div>
            <button onClick={signOut} className="rbp-sidebar-logout">
              <LogOut size={14} /> <span className="rbp-sidebar-label">Logout</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[1000px] px-7 pb-[60px] pt-7">
            <div className="mb-[18px] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[22px] font-bold text-[var(--ink)]">
                  {activeTab === "overview" && "Portfolio performance"}
                  {activeTab === "societies" && "Lending societies"}
                  {activeTab === "profile" && "Profile"}
                </h2>
                <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">Aggregate capital, active exposure, repayments, upcoming collections, and funding required for approved loans awaiting disbursement.</p>
              </div>
              {(message || data.error) ? <SecurityNotice unsafeDevFilter={false} error={message || data.error} /> : null}
            </div>

            {activeTab === "overview" ? <OverviewTab data={data} /> : null}
            {activeTab === "societies" ? <SocietiesTab data={data} /> : null}
            {activeTab === "profile" ? <ProfilePanel holder={holder} specs={data.specs} /> : null}
          </div>
        </main>
      </div>

      <footer>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-6 py-3.5 text-[11.5px] text-[var(--ink-soft)]">
          <span>ReferredBy · Portfolio Holder Portal · read-only investor view</span>
          <span>RLS required before production access</span>
        </div>
        <div className="rbp-pattern-band" />
      </footer>
    </div>
  );
}

function OverviewTab({ data }: { data: ClientPortalData }) {
  return (
    <div className="rbp-fade-in flex flex-col gap-6">
      <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--teal-100)] bg-[var(--teal-50)] px-3.5 py-2.5">
        <ShieldCheck size={16} color="var(--teal-700)" />
        <span className="text-[12.5px] text-[var(--teal-800)]">Read-only investor view · reconciled figures · live Supabase data</span>
      </div>

      <section className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        <StatCard title="Total allocation" value={formatMoney(data.totals.allocation)} caption={`${data.societies.length} linked lending societies`} icon={Landmark} />
        <StatCard title="Active exposure" value={formatMoney(data.totals.activePrincipal)} caption={`${data.totals.activeLoans} active loans`} icon={TrendingUp} />
        <StatCard title="Collections received" value={formatMoney(data.totals.totalCollected)} caption="net of visible reversals" icon={CircleDollarSign} tone="good" />
        <StatCard title="Upcoming collections" value={formatMoney(data.totals.expectedUpcoming)} caption="next 30 days" icon={CalendarClock} />
        <StatCard title="Available capacity" value={formatMoney(data.totals.availableCapacity)} caption="allocation less exposure & funding need" icon={WalletCards} tone="good" />
        <StatCard title="Funding required" value={formatMoney(data.totals.fundingRequired)} caption="approved, awaiting disbursement" icon={Banknote} tone="alert" />
      </section>

      <section className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        <StatCard title="Overdue exposure" value={`${data.totals.overdueLoans} loans`} caption="loans in overdue/default status" icon={AlertCircle} />
        <StatCard title="Settled loans" value={`${data.totals.settledLoans}`} caption="paid, settled, closed, or completed" icon={CircleDollarSign} />
        <StatCard title="Collection rate" value={formatPercent(data.totals.collectionRate)} caption="collected against repayable amount" icon={ShieldCheck} tone="good" />
      </section>
    </div>
  );
}

function SocietiesTab({ data }: { data: ClientPortalData }) {
  return (
    <div className="rbp-fade-in">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-[19px] font-bold text-[var(--ink)]">Per-lending-society accounting</h3>
          <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Allocation, exposure, collections, and funding requirements by society.</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--card)]">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-[var(--teal-50)]">
              {["Society", "Allocation", "Active exposure", "Collected", "Upcoming", "Available", "Funding req.", ""].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.02em] text-[var(--teal-800)]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.societies.map(({ society, metrics }) => (
              <tr key={String(society.id)} className="border-t border-[var(--line)]">
                <td className="px-4 py-3.5">
                  <div className="text-[13.5px] font-bold">{textFrom(society, ["name"], "Unnamed society")}</div>
                  <Chip>{textFrom(society, ["partner_type", "type", "region"], "Lending society")}</Chip>
                </td>
                <td className="mono px-4 py-3.5 text-[13px]">{formatMoney(metrics.allocation)}</td>
                <td className="mono px-4 py-3.5 text-[13px]">{formatMoney(metrics.activePrincipal)}</td>
                <td className="px-4 py-3.5">
                  <div className="mono text-[13px]">{formatMoney(metrics.totalCollected)}</div>
                  <div className="text-[11px] text-[var(--ink-soft)]">{formatPercent(metrics.collectionRate)} collected</div>
                </td>
                <td className="mono px-4 py-3.5 text-[13px]">{formatMoney(metrics.expectedUpcoming)}</td>
                <td className="mono px-4 py-3.5 text-[13px] text-[var(--green-700)]">{formatMoney(metrics.availableCapacity)}</td>
                <td className="mono px-4 py-3.5 text-[13px] text-[var(--ink-soft)]">{formatMoney(metrics.fundingRequired)}</td>
                <td className="px-4 py-3.5">
                  <button className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-xs text-[var(--teal-700)]">
                    Details <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4C24 4 12 14 12 25c0 6.6 5.4 12 12 12s12-5.4 12-12C36 14 24 4 24 4Z" fill="none" stroke="var(--teal-500)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M24 10c0 8-5 12-5 17" stroke="var(--teal-500)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M8 34c4.5 2.6 27.5 2.6 32 0" stroke="var(--red-600)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M9 39c4.2 2.3 25.6 2.3 30 0" stroke="var(--red-600)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function Wordmark({ tone = "dark", size = 20 }: { tone?: "dark" | "light"; size?: number }) {
  const color = tone === "light" ? "#FFFFFF" : "var(--teal-800)";
  return (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: size, color }}>Referred</span>
        <span style={{ fontWeight: 700, fontSize: size, color: "var(--red-600)" }}>By</span>
      </div>
      <span
        style={{
          fontWeight: 600,
          fontSize: size * 0.28,
          letterSpacing: "0.14em",
          color: tone === "light" ? "rgba(255,255,255,0.8)" : "var(--ink-soft)",
          marginTop: 2,
          textTransform: "uppercase",
        }}
      >
        Community Vetted Financing
      </span>
    </div>
  );
}

function Chip({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }) {
  const map = {
    neutral: { bg: "var(--teal-50)", fg: "var(--teal-700)" },
    good: { bg: "var(--green-100)", fg: "var(--green-700)" },
    warn: { bg: "var(--gold-100)", fg: "var(--gold-600)" },
    bad: { bg: "var(--red-100)", fg: "var(--red-700)" },
  };
  const colors = map[tone];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.fg,
        fontSize: 11.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}
