import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileBarChart,
  FileCheck2,
  Gauge,
  HandCoins,
  HelpCircle,
  Landmark,
  Layers3,
  LayoutDashboard,
  ListFilter,
  Lock,
  LogOut,
  Mail,
  Menu,
  PiggyBank,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { getPortfolioPortalData } from "./lib/portfolioApi";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const money = (value) =>
  `NAD ${Number(value).toLocaleString("en-NA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const LOAN_STATUS = {
  NR: "Not requested",
  AA: "Awaiting approval",
  AD: "Awaiting disbursement",
  DU: "Due",
  OT: "Outstanding",
  BL: "Blocked",
  PU: "Paid up",
  DE: "Declined",
};

const loanStatusLabel = (status) => LOAN_STATUS[status] || status || "Unknown";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-NA", { day: "2-digit", month: "short", year: "numeric" });
};

const maskedBorrower = (userId) =>
  userId ? `Borrower ••••${userId.slice(-4).toUpperCase()}` : "Borrower unavailable";

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const PortalDataContext = createContext({
  source: "unavailable",
  portfolio: null,
  societies: [],
  loans: [],
  payments: [],
  monthlySeries: [],
  holder: null,
});

const usePortalData = () => useContext(PortalDataContext);

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "portfolios", label: "Portfolios", icon: BriefcaseBusiness },
  { id: "societies", label: "Lending societies", icon: UsersRound },
  { id: "disbursements", label: "Disbursements", icon: Banknote },
  { id: "loans", label: "Loans", icon: ReceiptText },
  { id: "collections", label: "Collections", icon: HandCoins },
  { id: "risk", label: "Risk & ratings", icon: ShieldCheck },
  { id: "reports", label: "Reports & exports", icon: FileBarChart },
  { id: "audit", label: "Audit log", icon: FileCheck2 },
];

const pageCopy = {
  overview: ["Portfolio overview", "Capital, performance and risk across your funded loan book."],
  portfolios: ["Portfolios", "Compare capital deployment, returns and exposure."],
  societies: ["Lending societies", "Monitor the organisations funded by this portfolio."],
  disbursements: ["Disbursements", "Review the approval and disbursement pipeline in read-only mode."],
  loans: ["Loan book", "Inspect active, settled and pending loan accounts."],
  collections: ["Collections", "Track scheduled repayments and collection outcomes."],
  risk: ["Risk & ratings", "Understand arrears, concentration and portfolio quality."],
  reports: ["Reports & exports", "Generate controlled portfolio and operational reports."],
  audit: ["Audit log", "Trace access, exports and portfolio actions."],
};

function Logo({ inverse = false, compact = false, login = false }) {
  if (login) {
    return (
      <div className="brand brand--login">
        <img src="/assets/referredby-icon-transparent.png" alt="" className="brand__login-icon" />
        <div className="brand__login-copy">
          <div className="brand__login-name">ReferredBy</div>
          <div className="brand__login-tagline">Community vetted financing</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`brand ${inverse ? "brand--inverse" : ""}`}>
      {compact ? (
        <img src="/assets/referredby-icon.png" alt="ReferredBy" className="brand__icon" />
      ) : (
        <img src="/assets/referredby-wordmark.png" alt="ReferredBy" className="brand__wordmark" />
      )}
    </div>
  );
}

function Login({ onLogin, authError, configured }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [localInfo, setLocalInfo] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setLoading(true);

    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      setLocalError(error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setLocalError("");
    setLocalInfo("");
    if (!email.trim()) {
      setLocalError("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setLocalError(error.message);
    else setLocalInfo("If this account exists, Supabase has sent a password reset email.");
  };

  return (
    <main className="login">
      <section className="login__story">
        <div className="login__story-content">
          <Logo login />
          <div className="login__message">
            <span className="eyebrow eyebrow--light">Portfolio holder portal</span>
            <h1>Capital clarity.<br />Performance confidence.</h1>
            <p>
              See where your capital sits, how each lending society is performing,
              and what needs your attention next.
            </p>
          </div>
        </div>
      </section>

      <section className="login__form-wrap">
        <div className="login__mobile-logo"><Logo /></div>
        <form className="login__card" onSubmit={submit}>
          <div className="login__security"><ShieldCheck size={14} /> Secure portfolio access</div>
          <h2>Welcome back</h2>
          <p className="login__intro">Sign in to view your ReferredBy portfolio.</p>

          <label htmlFor="email">Email address</label>
          <div className="input-shell">
            <Mail size={17} />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="label-row">
            <label htmlFor="password">Password</label>
            <button type="button" className="text-button" onClick={forgotPassword}>Forgot password?</button>
          </div>
          <div className="input-shell">
            <Lock size={17} />
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-icon"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button className="primary-button primary-button--large" type="submit" disabled={loading || !configured}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={17} />}
          </button>

          {(localError || authError) && (
            <div className="auth-message auth-message--error" role="alert">
              <AlertTriangle size={17} />
              <span>{localError || authError}</span>
            </div>
          )}
          {localInfo && <div className="auth-message"><Check size={17} /><span>{localInfo}</span></div>}
          {!configured && (
            <div className="auth-message">
              <Settings size={17} />
              <span>Supabase configuration is required before portfolio holders can sign in.</span>
            </div>
          )}
          <p className="login__support">Need help? Contact your ReferredBy relationship manager.</p>
        </form>
        <p className="login__legal">Protected by ReferredBy security controls · Namibia</p>
      </section>
    </main>
  );
}

function Sidebar({ current, onChange, collapsed, onCollapse, onLogout, profileName = "Portfolio holder" }) {
  const initials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PH";
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div>
        <div className="sidebar__brand">
          <Logo inverse compact={collapsed} />
          <button className="sidebar__collapse" onClick={onCollapse} aria-label="Toggle navigation">
            {collapsed ? <ChevronRight size={17} /> : <ArrowLeft size={17} />}
          </button>
        </div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <p className="sidebar__section-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar__link ${current === item.id ? "sidebar__link--active" : ""}`}
                onClick={() => onChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <b>{item.badge}</b>}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="sidebar__footer">
        <div className="sidebar__profile">
          <span className="avatar">{initials}</span>
          {!collapsed && <div><strong>{profileName}</strong><small>Portfolio holder</small></div>}
          {!collapsed && <button onClick={onLogout} aria-label="Sign out"><LogOut size={17} /></button>}
        </div>
      </div>
    </aside>
  );
}

function Header({ current, onMenu, onToast, profileName = "Portfolio holder", holderName = "Portfolio" }) {
  const initials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PH";
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button>
      <div className="topbar__crumb">
        <span>{holderName}</span><ChevronRight size={14} /><strong>{pageCopy[current][0]}</strong>
      </div>
      <div className="topbar__actions">
        <button className="icon-button" onClick={() => onToast("Help is available from your ReferredBy relationship manager.")} aria-label="Help"><HelpCircle size={19} /></button>
        <button className="icon-button" onClick={() => onToast("You have no new portfolio notifications.")} aria-label="Notifications"><Bell size={19} /></button>
        <div className="topbar__user"><span className="avatar avatar--small">{initials}</span><ChevronDown size={14} /></div>
      </div>
    </header>
  );
}

function FilterBar() {
  const { portfolio, societies } = usePortalData();
  return (
    <div className="filterbar">
      <div className="filterbar__left">
        <ListFilter size={17} />
        <span className="filter-chip"><small>Period</small><strong>All available data</strong></span>
        <span className="filter-chip"><small>Scope</small><strong>{societies.length} linked {societies.length === 1 ? "society" : "societies"}</strong></span>
      </div>
      <div className="as-of"><span className="status-dot" /> Data refreshed {formatDate(portfolio.dataAsOf)}</div>
    </div>
  );
}

const buildRiskModel = (portfolio) => {
  const component = (value) => Math.max(0, Math.min(Number(value) || 0, 100));
  const collectionEfficiency = component(portfolio.collectionEfficiency);
  const defaultRateScore = component(100 - (portfolio.par30 ?? 0));
  const utilization = component(portfolio.utilization);
  const portfolioYield = component(portfolio.yield);
  const cashRatio = component(portfolio.portfolioValue > 0
    ? (portfolio.cash / portfolio.portfolioValue) * 100
    : 0);
  const activeSettled = component(portfolio.settledLoans > 0
    ? (portfolio.activeLoans / portfolio.settledLoans) * 100
    : 0);
  const factors = [
    ["Collection efficiency", collectionEfficiency, 25],
    ["Default rate score", defaultRateScore, 25],
    ["Utilization", utilization, 15],
    ["Yield", portfolioYield, 15],
    ["Cash ratio", cashRatio, 10],
    ["Active / settled", activeSettled, 10],
  ];
  return {
    factors,
    score: factors.reduce((sum, [, value, weight]) => sum + value * (weight / 100), 0),
  };
};

const getMetricDetails = (portfolio) => ({
  "Portfolio value": {
    description: "The total current value held as cash and active loan exposure.",
    formula: "Cash on hand + active exposure",
    working: `${money(portfolio.cash)} + ${money(portfolio.activeExposure)} = ${money(portfolio.portfolioValue)}`,
  },
  "Cash on hand": {
    description: "Capital currently available for future disbursements.",
    formula: "Initial allocation − disbursements + collections",
    working: `${money(portfolio.allocation)} − ${money(portfolio.disbursed)} + ${money(portfolio.collected)} = ${money(portfolio.cash)}`,
  },
  "Book performance": {
    description: "The portfolio's absolute gain above its original capital base.",
    formula: "Portfolio value − initial allocation",
    working: `${money(portfolio.portfolioValue)} − ${money(portfolio.allocation)} = ${money(portfolio.performance)}`,
  },
  "Capital deployed": {
    description: "Cumulative principal successfully paid to borrowers.",
    formula: "Sum of qualifying loan disbursement transactions",
    working: `${money(portfolio.disbursed)} across the selected reporting period`,
  },
});

function MetricCard({ label, value, note, icon: Icon, tone = "teal", delta, onExplain }) {
  return (
    <article className="metric-card">
      <div className={`metric-card__icon metric-card__icon--${tone}`}><Icon size={19} /></div>
      <div className="metric-card__head">
        <span>{label}</span>
        {onExplain && <button onClick={onExplain} aria-label={`Explain ${label}`}><HelpCircle size={15} /></button>}
      </div>
      <strong>{value}</strong>
      <div className="metric-card__foot">
        {delta !== undefined && (
          <span className={delta >= 0 ? "delta delta--up" : "delta delta--down"}>
            {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {Math.abs(delta)}%
          </span>
        )}
        <small>{note}</small>
      </div>
    </article>
  );
}

function CashflowChart() {
  const { monthlySeries = [] } = usePortalData();
  if (!monthlySeries.length) {
    return <div className="chart chart--empty">No dated disbursement or collection records available.</div>;
  }
  const max = Math.max(
    1,
    ...monthlySeries.flatMap((item) => [item.disbursed, item.collected]),
  );
  const points = (key) =>
    monthlySeries.map((item, index) => {
      const x = 42 + index * (440 / Math.max(monthlySeries.length - 1, 1));
      const y = 190 - (item[key] / max) * 145;
      return `${x},${y}`;
    }).join(" ");
  return (
    <div className="chart">
      <div className="chart__grid"><span /><span /><span /><span /></div>
      <svg viewBox="0 0 510 220" role="img" aria-label="Disbursements and collections by month">
        <polyline points={points("disbursed")} fill="none" stroke="#c92634" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points("collected")} fill="none" stroke="#1b6871" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {monthlySeries.map((item, index) => {
          const x = 42 + index * (440 / Math.max(monthlySeries.length - 1, 1));
          return (
            <g key={item.month}>
              <circle cx={x} cy={190 - (item.disbursed / max) * 145} r="4" fill="#fff" stroke="#c92634" strokeWidth="2.5" />
              <circle cx={x} cy={190 - (item.collected / max) * 145} r="4" fill="#fff" stroke="#1b6871" strokeWidth="2.5" />
              <text x={x} y="213" textAnchor="middle">{item.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PerformanceGauge() {
  const { portfolio } = usePortalData();
  const score = buildRiskModel(portfolio).score;
  const scoreLabel = score.toFixed(1);
  return (
    <div className="performance-gauge">
      <div className="gauge-ring" style={{ "--score": `${Math.min(score, 100)}%` }}>
        <div><strong>{scoreLabel}</strong><span>/100</span></div>
      </div>
      <div className="gauge-copy">
        <span className="rating-pill"><BadgeCheck size={14} /> Calculated</span>
        <h4>Portfolio score</h4>
        <p>Weighted from the six documented portfolio components. No qualitative band is assumed.</p>
        <div className="gauge-row"><span>Collection efficiency</span><strong>{portfolio.collectionEfficiency == null ? "N/A" : `${portfolio.collectionEfficiency}%`}</strong></div>
        <div className="gauge-row"><span>PAR 30+</span><strong>{portfolio.par30 == null ? "N/A" : `${portfolio.par30}%`}</strong></div>
      </div>
    </div>
  );
}

function Overview({ onNavigate, onExplain }) {
  const { portfolio, societies } = usePortalData();
  const cashShare = portfolio.portfolioValue > 0
    ? (portfolio.cash / portfolio.portfolioValue) * 100
    : 0;
  const exposureShare = Math.max(0, 100 - cashShare);
  return (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">Portfolio performance</span>
          <h2>{portfolio.holder}</h2>
          <p>Book performance is <strong>{money(portfolio.performance)}</strong> relative to initial allocation.</p>
        </div>
        <div className="hero-card__return">
          <span>Book return</span>
          <strong>{portfolio.performancePct == null ? "N/A" : `${portfolio.performancePct >= 0 ? "+" : ""}${portfolio.performancePct}%`}</strong>
          <small><TrendingUp size={14} /> All available records</small>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Portfolio value" value={money(portfolio.portfolioValue)} note="Cash + active exposure" icon={BriefcaseBusiness} tone="purple" onExplain={() => onExplain("Portfolio value")} />
        <MetricCard label="Cash on hand" value={money(portfolio.cash)} note="Calculated available capital" icon={WalletCards} onExplain={() => onExplain("Cash on hand")} />
        <MetricCard label="Capital deployed" value={money(portfolio.disbursed)} note={portfolio.utilization == null ? "Utilization unavailable" : `${portfolio.utilization}% utilization`} icon={Banknote} tone="blue" onExplain={() => onExplain("Capital deployed")} />
        <MetricCard label="Collections" value={money(portfolio.collected)} note={portfolio.collectionEfficiency == null ? "Efficiency unavailable" : `${portfolio.collectionEfficiency}% efficiency`} icon={HandCoins} tone="green" />
        <MetricCard label="Active exposure" value={money(portfolio.activeExposure)} note={`${portfolio.activeLoans} active ${portfolio.activeLoans === 1 ? "loan" : "loans"}`} icon={Activity} tone="amber" />
        <MetricCard label="Book performance" value={money(portfolio.performance)} note={portfolio.performancePct == null ? "Return unavailable" : `${portfolio.performancePct}% return`} icon={TrendingUp} tone="green" onExplain={() => onExplain("Book performance")} />
      </section>

      <section className="overview-grid">
        <article className="panel panel--chart">
          <div className="panel__header">
            <div><h3>Capital movement</h3><p>Monthly disbursements and collections</p></div>
            <div className="legend"><span><i className="legend__teal" /> Collections</span><span><i className="legend__red" /> Disbursements</span></div>
          </div>
          <CashflowChart />
        </article>
        <article className="panel">
          <div className="panel__header"><div><h3>Performance score</h3><p>Current portfolio health</p></div></div>
          <PerformanceGauge />
        </article>
      </section>

      <section className="overview-grid overview-grid--lower">
        <article className="panel">
          <div className="panel__header"><div><h3>Capital composition</h3><p>Where portfolio value sits today</p></div></div>
          <div className="composition">
            <div className="donut" style={{ background: `conic-gradient(var(--teal-600) ${cashShare}%, var(--red-600) 0)` }} />
            <div className="composition__legend">
              <div><span><i className="swatch swatch--cash" /> Cash on hand</span><strong>{money(portfolio.cash)}</strong><small>{cashShare.toFixed(1)}%</small></div>
              <div><span><i className="swatch swatch--exposure" /> Active exposure</span><strong>{money(portfolio.activeExposure)}</strong><small>{exposureShare.toFixed(1)}%</small></div>
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel__header">
            <div><h3>Lending society snapshot</h3><p>Top funded relationships</p></div>
            <button className="link-button" onClick={() => onNavigate("societies")}>View all <ArrowRight size={15} /></button>
          </div>
          <div className="society-list">
            {societies.slice(0, 3).map((item) => (
              <button key={item.code} onClick={() => onNavigate("societies")}>
                <span className="society-mark">{item.name.slice(0, 2).toUpperCase()}</span>
                <div><strong>{item.name}</strong><small>{item.type}</small></div>
                <div className="society-list__amount"><strong>{money(item.allocation)}</strong><small>allocated</small></div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function PortfolioPage({ onNavigate, onToast }) {
  const { portfolio, holder } = usePortalData();
  const cashRatio = portfolio.portfolioValue > 0
    ? (portfolio.cash / portfolio.portfolioValue) * 100
    : null;
  const exportPortfolio = () => {
    downloadCsv("portfolio-summary.csv", ["Metric", "Value"], [
      ["Initial allocation", portfolio.allocation],
      ["Capital deployed", portfolio.disbursed],
      ["Collections received", portfolio.collected],
      ["Cash on hand", portfolio.cash],
      ["Active exposure", portfolio.activeExposure],
      ["Portfolio value", portfolio.portfolioValue],
      ["Book return percent", portfolio.performancePct ?? ""],
      ["PAR 30+ percent", portfolio.par30 ?? ""],
    ]);
    onToast("Portfolio summary downloaded.");
  };
  const tabs = [
    ["Summary", null],
    ["Loan book", "loans"],
    ["Collections", "collections"],
    ["Risk & arrears", "risk"],
    ["Documents", "reports"],
  ];
  return (
    <section className="panel page-panel">
      <div className="panel__header table-toolbar">
        <div><h3>Portfolio</h3><p>One authenticated portfolio · NAD reporting currency</p></div>
        <div><button className="secondary-button" onClick={exportPortfolio}><Download size={15} /> Export CSV</button></div>
      </div>
      <div className="portfolio-summary">
        <div><span className="portfolio-avatar">{portfolio.holder.slice(0, 2).toUpperCase()}</span><div><strong>{portfolio.holder}</strong><small>{portfolio.holderId.slice(0, 8).toUpperCase()} · {holder?.status || "Status unavailable"}</small></div></div>
        <div><span>Initial allocation</span><strong>{money(portfolio.allocation)}</strong></div>
        <div><span>Portfolio value</span><strong>{money(portfolio.portfolioValue)}</strong></div>
        <div><span>Book return</span><strong className="positive">{portfolio.performancePct == null ? "N/A" : `${portfolio.performancePct}%`}</strong></div>
        <div><span>PAR 30+</span><strong>{portfolio.par30 == null ? "N/A" : `${portfolio.par30}%`}</strong></div>
      </div>
      <div className="detail-tabs">
        {tabs.map(([tab, page], index) => <button className={index === 0 ? "active" : ""} key={tab} onClick={() => page && onNavigate(page)}>{tab}</button>)}
      </div>
      <div className="portfolio-detail-grid">
        <article className="soft-card">
          <div className="soft-card__title"><Landmark size={18} /><span>Capital position</span></div>
          <div className="value-line"><span>Initial allocation</span><strong>{money(portfolio.allocation)}</strong></div>
          <div className="value-line"><span>Capital deployed</span><strong>{money(portfolio.disbursed)}</strong></div>
          <div className="value-line"><span>Collections received</span><strong>{money(portfolio.collected)}</strong></div>
          <div className="value-line value-line--total"><span>Cash on hand</span><strong>{money(portfolio.cash)}</strong></div>
        </article>
        <article className="soft-card">
          <div className="soft-card__title"><Gauge size={18} /><span>Performance ratios</span></div>
          <ProgressLine label="Utilization" value={portfolio.utilization ?? 0} />
          <ProgressLine label="Collection efficiency" value={portfolio.collectionEfficiency ?? 0} />
          <ProgressLine label="Cash ratio (cash / portfolio value)" value={cashRatio ?? 0} />
          <ProgressLine label="Book return" value={portfolio.performancePct ?? 0} />
        </article>
      </div>
    </section>
  );
}

function ProgressLine({ label, value }) {
  const displayValue = Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0";
  return (
    <div className="progress-line">
      <div><span>{label}</span><strong>{displayValue}%</strong></div>
      <div className="progress"><i style={{ width: `${Math.min(value, 100)}%` }} /></div>
    </div>
  );
}

function SocietiesPage({ onToast }) {
  const { societies } = usePortalData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const visible = societies.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const exportSocieties = () => {
    downloadCsv(
      "lending-societies.csv",
      ["Society", "Type", "Allocation", "Active exposure", "Collected", "Efficiency %", "PAR 30+ %", "Rating"],
      visible.map((item) => [item.name, item.type, item.allocation, item.exposure, item.collected, item.efficiency ?? "", item.par30, item.rating]),
    );
    onToast("Lending society data downloaded.");
  };
  return (
    <section className="panel page-panel">
      <div className="table-toolbar">
        <div className="search-box"><Search size={16} /><input placeholder="Search societies…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="table-toolbar__spacer" />
        <button className="secondary-button" onClick={exportSocieties}><Download size={15} /> Export CSV</button>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Society</th><th>Allocation</th><th>Active exposure</th><th>Collected</th><th>Efficiency</th><th>PAR 30+</th><th>Rating</th><th /></tr></thead>
          <tbody>
            {visible.map((item) => (
              <React.Fragment key={item.code}>
              <tr>
                <td><div className="table-identity"><span className="society-mark">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.code} · {item.type}</small></div></div></td>
                <td className="mono">{money(item.allocation)}</td>
                <td className="mono">{money(item.exposure)}</td>
                <td className="mono">{money(item.collected)}</td>
                <td>{item.efficiency === null ? <span className="muted">Not available</span> : <strong className="positive">{item.efficiency}%</strong>}</td>
                <td>{item.par30.toFixed(1)}%</td>
                <td><span className="rating-tier">{item.rating}</span></td>
                <td><button className="icon-button" onClick={() => setSelectedId(selectedId === item.id ? null : item.id)} aria-label={`View ${item.name} details`}><ChevronRight size={17} /></button></td>
              </tr>
              {selectedId === item.id && (
                <tr className="table-detail-row">
                  <td colSpan="8">
                    <strong>{item.name}</strong>
                    <span>Allocation {money(item.allocation)} · exposure {money(item.exposure)} · collected {money(item.collected)} · rating sourced from partner_ratings: {item.rating}</span>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DisbursementsPage({ onToast }) {
  const { loans, societies } = usePortalData();
  const [statusCode, setStatusCode] = useState("AD");
  const [query, setQuery] = useState("");
  const societyById = new Map(societies.map((item) => [item.id, item.name]));
  const pipeline = loans.filter((loan) => ["AA", "AD"].includes(loan.status));
  const visible = pipeline.filter((loan) => {
    const search = query.toLowerCase();
    return loan.status === statusCode && (
      loan.loan_id?.toLowerCase().includes(search)
      || societyById.get(loan.lending_society_id)?.toLowerCase().includes(search)
    );
  });
  const awaitingApproval = pipeline.filter((loan) => loan.status === "AA");
  const awaitingDisbursement = pipeline.filter((loan) => loan.status === "AD");
  const exportPipeline = () => {
    downloadCsv(
      "disbursement-pipeline.csv",
      ["Loan ID", "Borrower reference", "Society", "Product", "Principal", "Approved date", "Status"],
      visible.map((loan) => [
        loan.loan_id,
        maskedBorrower(loan.user_id),
        societyById.get(loan.lending_society_id) || "Unknown society",
        loan.loanType,
        loan.loan_amount,
        formatDate(loan.approved_at),
        loanStatusLabel(loan.status),
      ]),
    );
    onToast("Disbursement pipeline downloaded.");
  };
  return (
    <>
      <div className="disbursement-summary">
        <div><span className="summary-icon summary-icon--teal"><CircleDollarSign size={20} /></span><p><span>Awaiting disbursement</span><strong>{money(awaitingDisbursement.reduce((sum, loan) => sum + Number(loan.loan_amount || 0), 0))}</strong><small>{awaitingDisbursement.length} approved {awaitingDisbursement.length === 1 ? "loan" : "loans"}</small></p></div>
        <div><span className="summary-icon summary-icon--amber"><Clock3 size={20} /></span><p><span>Awaiting approval</span><strong>{money(awaitingApproval.reduce((sum, loan) => sum + Number(loan.loan_amount || 0), 0))}</strong><small>{awaitingApproval.length} pending {awaitingApproval.length === 1 ? "decision" : "decisions"}</small></p></div>
        <div><span className="summary-icon summary-icon--blue"><Layers3 size={20} /></span><p><span>Portal access</span><strong>Read only</strong><small>Batches are managed operationally</small></p></div>
      </div>
      <section className="panel page-panel">
        <div className="status-tabs">
          {[["AD", "Awaiting disbursement", awaitingDisbursement.length], ["AA", "Awaiting approval", awaitingApproval.length]].map(([code, label, count]) => <button className={statusCode === code ? "active" : ""} key={code} onClick={() => setStatusCode(code)}>{label}<span>{count}</span></button>)}
        </div>
        <div className="table-toolbar">
          <div className="search-box"><Search size={16} /><input placeholder="Search loan or society…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="table-toolbar__spacer" />
          <button className="secondary-button" onClick={exportPipeline}><Download size={15} /> Export CSV</button>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Loan</th><th>Borrower reference</th><th>Society & product</th><th>Principal</th><th>Approved</th><th>Status</th></tr></thead>
            <tbody>{visible.map((loan) => (
              <tr key={loan.id}>
                <td><strong>{loan.loan_id}</strong></td>
                <td>{maskedBorrower(loan.user_id)}</td>
                <td><strong>{societyById.get(loan.lending_society_id) || "Unknown society"}</strong><small className="cell-sub">{loan.loanType}</small></td>
                <td className="mono"><strong>{money(loan.loan_amount)}</strong></td>
                <td>{formatDate(loan.approved_at)}</td>
                <td><Status status={loanStatusLabel(loan.status)} code={loan.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!visible.length && <div className="empty-table">No loans match this pipeline status.</div>}
      </section>
    </>
  );
}

function Status({ status, code }) {
  const className = (code || status).toLowerCase().replaceAll(" ", "-");
  return <span className={`status status--${className}`}><i />{status}</span>;
}

function LoansPage({ onToast }) {
  const { loans: liveLoans, societies } = usePortalData();
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const societyById = new Map(societies.map((item) => [item.id, item.name]));
  const filtered = liveLoans.filter((loan) => {
    const search = query.toLowerCase();
    return (status === "ALL" || loan.status === status)
      && (loan.loan_id?.toLowerCase().includes(search)
        || societyById.get(loan.lending_society_id)?.toLowerCase().includes(search));
  });
  const exportLoans = () => {
    downloadCsv(
      "loan-book.csv",
      ["Loan ID", "Borrower reference", "Lending society", "Product", "Principal", "Active balance", "Due date", "Status"],
      filtered.map((loan) => [
        loan.loan_id,
        maskedBorrower(loan.user_id),
        societyById.get(loan.lending_society_id) || "Unknown society",
        loan.loanType,
        loan.loan_amount,
        loan.outstanding_balance,
        formatDate(loan.due_date || loan.final_deduction_date),
        loanStatusLabel(loan.status),
      ]),
    );
    onToast("Loan book downloaded.");
  };
  return (
    <section className="panel page-panel">
      <div className="table-toolbar">
        <div className="search-box"><Search size={16} /><input placeholder="Search loan ID or society…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select className="standalone-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {Object.entries(LOAN_STATUS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
        <div className="table-toolbar__spacer" /><button className="secondary-button" onClick={exportLoans}><Download size={15} /> Export CSV</button>
      </div>
      <div className="data-table-wrap"><table className="data-table">
        <thead><tr><th>Loan ID</th><th>Borrower reference</th><th>Lending society</th><th>Product</th><th>Original principal</th><th>Active balance</th><th>Due date</th><th>Status</th></tr></thead>
        <tbody>{filtered.map((loan) => <tr key={loan.id}>
          <td><strong>{loan.loan_id}</strong></td><td>{maskedBorrower(loan.user_id)}</td><td>{societyById.get(loan.lending_society_id) || "Unknown society"}</td><td>{loan.loanType}</td><td className="mono">{money(loan.loan_amount)}</td><td className="mono"><strong>{money(loan.outstanding_balance)}</strong></td><td>{formatDate(loan.due_date || loan.final_deduction_date)}</td><td><Status status={loanStatusLabel(loan.status)} code={loan.status} /></td>
        </tr>)}</tbody>
      </table></div>
      {!filtered.length && <div className="empty-table">No loans match the current search and status.</div>}
    </section>
  );
}

function CollectionsPage({ onToast }) {
  const { portfolio, monthlySeries = [], payments, societies } = usePortalData();
  const societyById = new Map(societies.map((item) => [item.id, item.name]));
  const maxMonthly = Math.max(1, ...monthlySeries.flatMap((item) => [item.due, item.collected]));
  const recentPayments = [...payments]
    .filter((payment) => Number(payment.amount_paid) > 0)
    .sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at))
    .slice(0, 5);
  const exportLedger = () => {
    downloadCsv(
      "collections-ledger.csv",
      ["Payment reference", "Loan ID", "Society", "Amount due", "Amount paid", "Payment date", "Status", "Days late"],
      payments.map((payment) => [
        payment.payment_ref || payment.id,
        payment.loan_id,
        societyById.get(payment.lending_society_id) || "Unknown society",
        payment.amount_due,
        payment.amount_paid,
        formatDate(payment.payment_date),
        payment.status,
        payment.days_late ?? "",
      ]),
    );
    onToast("Collections ledger downloaded.");
  };
  return (
    <div className="collection-grid">
      <section className="panel collection-hero">
        <div className="panel__header"><div><h3>Collection performance</h3><p>Contractually due versus received by month</p></div></div>
        <div className="collection-bars">
          {monthlySeries.map((item) => <div key={item.key}><span className="bars"><i style={{height:`${(item.due / maxMonthly) * 180}px`}} /><b style={{height:`${(item.collected / maxMonthly) * 180}px`}} /></span><small>{item.month}</small></div>)}
        </div>
        <div className="legend legend--center"><span><i className="legend__pale" /> Contractually due</span><span><i className="legend__teal" /> Collected</span></div>
        {!monthlySeries.length && <div className="empty-table">No dated payment records available.</div>}
      </section>
      <section className="panel collection-score">
        <span>Collection efficiency</span><strong>{portfolio.collectionEfficiency == null ? "N/A" : `${portfolio.collectionEfficiency}%`}</strong><p>Recorded amount paid divided by recorded amount due.</p>
        <div className="score-track"><i style={{ width: `${Math.min(portfolio.collectionEfficiency ?? 0, 100)}%` }} /></div>
        <div><small>Source: loan_payments</small><small>{payments.length} payment records</small></div>
      </section>
      <section className="panel collection-table">
        <div className="panel__header"><div><h3>Recent collections</h3><p>Payment records with a collected amount</p></div><button className="link-button" onClick={exportLedger}>Download ledger <Download size={15} /></button></div>
        {recentPayments.map((payment) => <div className="recent-row" key={payment.id}><span className="summary-icon summary-icon--green"><Check size={16} /></span><div><strong>{payment.payment_ref || payment.loan_id}</strong><small>{societyById.get(payment.lending_society_id) || "Unknown society"}</small></div><strong>{money(payment.amount_paid)}</strong><span>{formatDate(payment.payment_date || payment.created_at)}</span></div>)}
        {!recentPayments.length && <div className="empty-table">No collected payments available.</div>}
      </section>
    </div>
  );
}

function RiskPage({ onToast }) {
  const { portfolio } = usePortalData();
  const model = buildRiskModel(portfolio);
  const factors = model.factors.map(([label, value, weight]) => [
    label,
    `${value.toFixed(1)}%`,
    value,
    `${weight}%`,
    (value * (weight / 100)).toFixed(1),
  ]);
  const total = model.score.toFixed(1);
  const arrears = portfolio.arrears || { current: portfolio.activeExposure, oneTo30: 0, over30: 0 };
  const totalExposure = Math.max(arrears.current + arrears.oneTo30 + arrears.over30, 1);
  return (
    <div className="risk-grid">
      <section className="panel risk-score-card">
        <div className="score-seal"><strong>{total}</strong><span>out of 100</span></div>
        <span className="rating-pill"><BadgeCheck size={14} /> Calculated score</span>
        <h3>Portfolio risk score</h3>
        <p>No qualitative rating band is displayed because band thresholds are not defined in the supplied policy.</p>
        <small>{portfolio.formulaVersion} · refreshed {formatDate(portfolio.dataAsOf)}</small>
      </section>
      <section className="panel rating-breakdown">
        <div className="panel__header"><div><h3>Rating breakdown</h3><p>Weighted using the supplied calculation guide</p></div><button className="secondary-button" onClick={() => onToast("The score uses the six documented weights; qualitative band thresholds still require policy confirmation.")}><BookOpen size={15} /> Method note</button></div>
        <div className="rating-table"><div className="rating-row rating-row--head"><span>Component</span><span>Raw value / score</span><span>Weight</span><span>Points</span></div>
          {factors.map((item) => <div className="rating-row" key={item[0]}><strong>{item[0]}</strong><span><i><b style={{width:`${item[2]}%`}} /></i>{item[1]}</span><span>{item[3]}</span><strong>{item[4]}</strong></div>)}
          <div className="rating-row rating-row--total"><strong>Final rating score</strong><span /><span>100%</span><strong>{total}</strong></div>
        </div>
      </section>
      <section className="panel arrears-card">
        <div className="panel__header"><div><h3>Arrears ageing</h3><p>Active principal by days past due</p></div></div>
        <div className="ageing-bar">
          <i style={{ width: `${(arrears.current / totalExposure) * 100}%` }} />
          <i className="ageing-bar__amber" style={{ width: `${(arrears.oneTo30 / totalExposure) * 100}%` }} />
          <i className="ageing-bar__red" style={{ width: `${(arrears.over30 / totalExposure) * 100}%` }} />
        </div>
        <div className="ageing-legend"><div><span className="dot dot--current" />Current<strong>{money(arrears.current)}</strong></div><div><span className="dot dot--amber" />1–30 days<strong>{money(arrears.oneTo30)}</strong></div><div><span className="dot dot--red" />30+ days<strong>{money(arrears.over30)}</strong></div></div>
      </section>
    </div>
  );
}

function ReportsPage({ onToast }) {
  const data = usePortalData();
  const reports = [
    [FileBarChart, "Portfolio performance extract", "Capital position, returns and portfolio KPIs", "portfolio"],
    [ReceiptText, "Loan book extract", "Scoped loan-level balances and canonical statuses", "loans"],
    [HandCoins, "Collections ledger", "Portfolio-scoped payment records", "payments"],
    [ShieldCheck, "Society risk extract", "PAR and rating fields returned by partner_ratings", "societies"],
  ];
  const generate = (type, title) => {
    if (type === "portfolio") {
      downloadCsv("portfolio-performance.csv", ["Metric", "Value"], Object.entries(data.portfolio).filter(([, value]) => typeof value !== "object"));
    } else if (type === "loans") {
      downloadCsv("loan-book.csv", ["Loan ID", "Product", "Principal", "Balance", "Status"], data.loans.map((loan) => [loan.loan_id, loan.loanType, loan.loan_amount, loan.outstanding_balance, loanStatusLabel(loan.status)]));
    } else if (type === "payments") {
      downloadCsv("collections-ledger.csv", ["Reference", "Loan ID", "Due", "Paid", "Date", "Status"], data.payments.map((payment) => [payment.payment_ref || payment.id, payment.loan_id, payment.amount_due, payment.amount_paid, formatDate(payment.payment_date), payment.status]));
    } else {
      downloadCsv("society-risk.csv", ["Society", "PAR 30+ %", "Rating", "Rating score"], data.societies.map((society) => [society.name, society.par30, society.rating, society.ratingScore ?? ""]));
    }
    onToast(`${title} downloaded.`);
  };
  return (
    <div className="reports-grid">
      {reports.map(([Icon, title, copy, type]) => <article className="report-card" key={title}><span className="report-icon"><Icon size={22} /></span><div><h3>{title}</h3><p>{copy}</p><span className="format-pill">CSV</span></div><button className="secondary-button" onClick={() => generate(type, title)}><Download size={15} /> Download</button></article>)}
      <section className="panel audit-note"><ShieldCheck size={21} /><div><h3>Portfolio-scoped exports</h3><p>Downloads contain only data returned through the signed-in holder's Supabase access. Borrower identities remain masked.</p></div></section>
    </div>
  );
}

function AuditPage({ user }) {
  return (
    <section className="panel page-panel">
      <div className="audit-empty">
        <FileCheck2 size={30} />
        <h3>No portfolio-scoped audit feed is connected</h3>
        <p>The previous entries were sample content and have been removed. The signed-in account is {user?.email}; historical events will appear only after an approved read policy and portfolio-holder mapping are added for <code>activity_history</code>.</p>
      </div>
    </section>
  );
}

function MetricDrawer({ metric, onClose }) {
  const { portfolio } = usePortalData();
  if (!metric) return null;
  const detail = getMetricDetails(portfolio)[metric];
  return (
    <div className="drawer-layer" onMouseDown={onClose}>
      <aside className="metric-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer__header"><div><span className="eyebrow">Calculation guide</span><h3>{metric}</h3></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
        <p>{detail.description}</p>
        <div className="formula-box"><span>Formula</span><strong>{detail.formula}</strong></div>
        <div className="working-box"><span>Current calculation</span><p>{detail.working}</p></div>
        <div className="drawer-meta"><div><span>Data refreshed</span><strong>{formatDate(portfolio.dataAsOf)}</strong></div><div><span>Formula version</span><strong>{portfolio.formulaVersion}</strong></div><div><span>Currency</span><strong>NAD</strong></div></div>
      </aside>
    </div>
  );
}

function EmptyPage({ type, onNavigate }) {
  return (
    <section className="panel empty-page">
      <span className="empty-icon">{type === "risk" ? <ShieldCheck size={31} /> : <FileBarChart size={31} />}</span>
      <h3>{pageCopy[type][0]}</h3>
      <p>This module is ready for your live ReferredBy data connection.</p>
      <button className="primary-button" onClick={() => onNavigate("overview")}>Back to overview</button>
    </section>
  );
}

function Dashboard({ onLogout, portalData, user }) {
  const [current, setCurrent] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [metric, setMetric] = useState(null);
  const [toast, setToast] = useState("");
  const profileName =
    portalData.holder?.contact_person ||
    portalData.portfolio?.contactPerson ||
    user?.email ||
    "Portfolio holder";
  const holderName = portalData.portfolio?.holder || portalData.holder?.name || "Portfolio";

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  };

  const changePage = (page) => {
    setCurrent(page);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportSnapshot = () => {
    downloadCsv("portfolio-snapshot.csv", ["Metric", "Value"], [
      ["Portfolio holder", portalData.portfolio.holder],
      ["Initial allocation", portalData.portfolio.allocation],
      ["Capital deployed", portalData.portfolio.disbursed],
      ["Collections", portalData.portfolio.collected],
      ["Active exposure", portalData.portfolio.activeExposure],
      ["Cash on hand", portalData.portfolio.cash],
      ["Portfolio value", portalData.portfolio.portfolioValue],
      ["Book performance", portalData.portfolio.performance],
      ["Book return percent", portalData.portfolio.performancePct ?? ""],
    ]);
    notify("Portfolio snapshot downloaded.");
  };

  const content = useMemo(() => {
    switch (current) {
      case "overview": return <Overview onNavigate={changePage} onExplain={setMetric} />;
      case "portfolios": return <PortfolioPage onNavigate={changePage} onToast={notify} />;
      case "societies": return <SocietiesPage onToast={notify} />;
      case "disbursements": return <DisbursementsPage onToast={notify} />;
      case "loans": return <LoansPage onToast={notify} />;
      case "collections": return <CollectionsPage onToast={notify} />;
      case "risk": return <RiskPage onToast={notify} />;
      case "reports": return <ReportsPage onToast={notify} />;
      case "audit": return <AuditPage user={user} />;
      default: return <EmptyPage type={current} onNavigate={changePage} />;
    }
  }, [current]);

  return (
    <PortalDataContext.Provider value={portalData}>
    <div className="app-shell">
      <div className={`mobile-overlay ${mobileNav ? "mobile-overlay--show" : ""}`} onClick={() => setMobileNav(false)} />
      <div className={mobileNav ? "mobile-sidebar mobile-sidebar--show" : "mobile-sidebar"}>
        <Sidebar current={current} onChange={changePage} collapsed={false} onCollapse={() => setMobileNav(false)} onLogout={onLogout} profileName={profileName} />
      </div>
      <div className="desktop-sidebar"><Sidebar current={current} onChange={changePage} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} onLogout={onLogout} profileName={profileName} /></div>
      <div className="app-main">
        <Header current={current} onMenu={() => setMobileNav(true)} onToast={notify} profileName={profileName} holderName={holderName} />
        <div className="decorative-border" />
        <main className="content">
          <div className="page-title">
            <div><h1>{pageCopy[current][0]}</h1><p>{pageCopy[current][1]}</p></div>
            {current === "overview" && <button className="secondary-button" onClick={exportSnapshot}><Download size={15} /> Export snapshot</button>}
          </div>
          {current === "overview" && <FilterBar />}
          {content}
        </main>
      </div>
      <MetricDrawer metric={metric} onClose={() => setMetric(null)} />
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
    </PortalDataContext.Provider>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [booting, setBooting] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setBooting(false);
        return;
      }

      if (!data.session) {
        setBooting(false);
        return;
      }

      try {
        const loaded = await getPortfolioPortalData(data.session.user);
        if (!active) return;
        setSession(data.session);
        setPortalData(loaded);
      } catch (loadError) {
        await supabase.auth.signOut();
        if (!active) return;
        setAuthError(loadError.message);
      } finally {
        if (active) setBooting(false);
      }
    };

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setSession(null);
        setPortalData(null);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!supabase) {
      throw new Error("Supabase environment variables have not been configured.");
    }

    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    try {
      const loaded = await getPortfolioPortalData(data.user);
      setSession(data.session);
      setPortalData(loaded);
    } catch (loadError) {
      await supabase.auth.signOut();
      throw loadError;
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setPortalData(null);
  };

  if (booting) {
    return (
      <div className="portal-loading">
        <Logo />
        <span className="loading-spinner" />
        <p>Loading your portfolio…</p>
      </div>
    );
  }

  return session && portalData ? (
    <Dashboard onLogout={logout} portalData={portalData} user={session.user} />
  ) : (
    <Login onLogin={login} authError={authError} configured={isSupabaseConfigured} />
  );
}
