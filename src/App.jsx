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
  CalendarDays,
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
  Filter,
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
  MoreHorizontal,
  PiggyBank,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Upload,
  UserRound,
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

const portfolio = {
  holder: "Destiny Group Pty LTD",
  allocation: 40000,
  disbursed: 19096,
  collected: 22645.03,
  activeExposure: 1070.4,
  cash: 43549.03,
  portfolioValue: 44619.43,
  performance: 4619.43,
  performancePct: 11.5,
  utilization: 47.7,
  yield: 24.2,
  collectionEfficiency: 95.5,
  par30: 0,
  activeLoans: 2,
  settledLoans: 12,
};

const societies = [
  {
    name: "Beares Namibia Staff",
    code: "BNS-001",
    type: "Employee group",
    allocation: 40000,
    exposure: 1070.4,
    collected: 22645.03,
    efficiency: 95.5,
    par30: 0,
    rating: "A",
    trend: 8.2,
  },
  {
    name: "FreshFM",
    code: "FFM-002",
    type: "Business partner",
    allocation: 100000,
    exposure: 0,
    collected: 0,
    efficiency: null,
    par30: 0,
    rating: "B",
    trend: 0,
  },
  {
    name: "Kayla Industries",
    code: "KAY-003",
    type: "Business partner",
    allocation: 50000,
    exposure: 0,
    collected: 162537.29,
    efficiency: 98.1,
    par30: 0,
    rating: "A",
    trend: 12.4,
  },
  {
    name: "Mwatotele & Partners",
    code: "MWP-004",
    type: "Business partner",
    allocation: 80000,
    exposure: 0,
    collected: 0,
    efficiency: null,
    par30: 0,
    rating: "B",
    trend: 0,
  },
  {
    name: "Namdeb Staff",
    code: "NDS-005",
    type: "Employee group",
    allocation: 35000,
    exposure: 0,
    collected: 0,
    efficiency: null,
    par30: 0,
    rating: "B",
    trend: 0,
  },
];

const PortalDataContext = createContext({
  source: "fixture",
  portfolio,
  societies,
  holder: null,
});

const usePortalData = () => useContext(PortalDataContext);

const disbursements = [
  {
    id: "RB-10482",
    borrower: "T. Ndeu",
    society: "Beares Namibia Staff",
    product: "Nano loan",
    bank: "Bank Windhoek •••• 4821",
    amount: 8500,
    approved: "21 Jul 2026",
    status: "Eligible",
  },
  {
    id: "RB-10479",
    borrower: "N. Amutenya",
    society: "Beares Namibia Staff",
    product: "Term loan",
    bank: "FNB Namibia •••• 1198",
    amount: 14200,
    approved: "20 Jul 2026",
    status: "Eligible",
  },
  {
    id: "RB-10471",
    borrower: "P. Shilongo",
    society: "FreshFM",
    product: "Nano loan",
    bank: "Nedbank •••• 9402",
    amount: 6750,
    approved: "19 Jul 2026",
    status: "On hold",
  },
  {
    id: "RB-10455",
    borrower: "S. Haikali",
    society: "Namdeb Staff",
    product: "Term loan",
    bank: "Standard Bank •••• 2210",
    amount: 18600,
    approved: "18 Jul 2026",
    status: "In batch",
  },
];

const loans = [
  { id: "RB-10391", society: "Beares Namibia Staff", borrower: "J. M*****", principal: 7600, balance: 410.4, due: "31 Jul 2026", status: "Current" },
  { id: "RB-10376", society: "Beares Namibia Staff", borrower: "A. N*****", principal: 12000, balance: 660, due: "02 Aug 2026", status: "Current" },
  { id: "RB-10292", society: "Kayla Industries", borrower: "R. K*****", principal: 9500, balance: 0, due: "Settled", status: "Settled" },
  { id: "RB-10247", society: "Kayla Industries", borrower: "M. T*****", principal: 15200, balance: 0, due: "Settled", status: "Settled" },
];

const chartValues = [
  { month: "Feb", disbursed: 7.8, collected: 5.4 },
  { month: "Mar", disbursed: 11.2, collected: 8.1 },
  { month: "Apr", disbursed: 8.6, collected: 10.2 },
  { month: "May", disbursed: 13.4, collected: 12.1 },
  { month: "Jun", disbursed: 10.8, collected: 14.2 },
  { month: "Jul", disbursed: 15.1, collected: 17.4 },
];

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "portfolios", label: "Portfolios", icon: BriefcaseBusiness },
  { id: "societies", label: "Lending societies", icon: UsersRound },
  { id: "disbursements", label: "Disbursements", icon: Banknote, badge: 2 },
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
  disbursements: ["Disbursements", "Review eligible loans and control payment batches."],
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
            <button type="button" className="text-button">Forgot password?</button>
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
          {!configured && (
            <div className="auth-message">
              <Settings size={17} />
              <span>Supabase configuration is required before portfolio holders can sign in.</span>
            </div>
          )}
          <p className="login__support">Need help? <button type="button" className="text-button">Contact support</button></p>
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
        <button className="sidebar__link"><Settings size={19} />{!collapsed && <span>Settings</span>}</button>
        <div className="sidebar__profile">
          <span className="avatar">{initials}</span>
          {!collapsed && <div><strong>{profileName}</strong><small>Portfolio holder</small></div>}
          {!collapsed && <button onClick={onLogout} aria-label="Sign out"><LogOut size={17} /></button>}
        </div>
      </div>
    </aside>
  );
}

function Header({ current, onMenu, profileName = "Portfolio holder", holderName = "Portfolio" }) {
  const [searchOpen, setSearchOpen] = useState(false);
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
        {searchOpen && <input className="header-search" autoFocus placeholder="Search portfolio…" />}
        <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search"><Search size={19} /></button>
        <button className="icon-button" aria-label="Help"><HelpCircle size={19} /></button>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button>
        <div className="topbar__user"><span className="avatar avatar--small">{initials}</span><ChevronDown size={14} /></div>
      </div>
    </header>
  );
}

function FilterBar() {
  const { societies } = usePortalData();
  const [period, setPeriod] = useState("Year to date");
  const [society, setSociety] = useState("All societies");
  return (
    <div className="filterbar">
      <div className="filterbar__left">
        <ListFilter size={17} />
        <label>
          <span>Period</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Year to date</option><option>Last 30 days</option><option>Last quarter</option><option>All time</option>
          </select>
        </label>
        <label>
          <span>Society</span>
          <select value={society} onChange={(e) => setSociety(e.target.value)}>
            <option>All societies</option>{societies.map((item) => <option key={item.code}>{item.name}</option>)}
          </select>
        </label>
        <button className="filter-button"><SlidersHorizontal size={15} /> More filters</button>
      </div>
      <div className="as-of"><span className="status-dot" /> Data as of 22 Jul 2026, 11:59 CAT</div>
    </div>
  );
}

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
  const max = 20;
  const points = (key) =>
    chartValues.map((item, index) => {
      const x = 42 + index * 88;
      const y = 190 - (item[key] / max) * 145;
      return `${x},${y}`;
    }).join(" ");
  return (
    <div className="chart">
      <div className="chart__grid"><span /><span /><span /><span /></div>
      <svg viewBox="0 0 510 220" role="img" aria-label="Disbursements and collections by month">
        <polyline points={points("disbursed")} fill="none" stroke="#c92634" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points("collected")} fill="none" stroke="#1b6871" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {chartValues.map((item, index) => {
          const x = 42 + index * 88;
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
  return (
    <div className="performance-gauge">
      <div className="gauge-ring" style={{ "--score": "88%" }}>
        <div><strong>88</strong><span>/100</span></div>
      </div>
      <div className="gauge-copy">
        <span className="rating-pill"><BadgeCheck size={14} /> Strong</span>
        <h4>Portfolio health</h4>
        <p>Collections are healthy and no active balance is 30+ days past due.</p>
        <div className="gauge-row"><span>Collection efficiency</span><strong>95.5%</strong></div>
        <div className="gauge-row"><span>PAR 30+</span><strong>0.0%</strong></div>
      </div>
    </div>
  );
}

function Overview({ onNavigate, onExplain }) {
  const { portfolio, societies } = usePortalData();
  return (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">Portfolio performance</span>
          <h2>{portfolio.holder}</h2>
          <p>Your portfolio gained <strong>{money(portfolio.performance)}</strong> above its initial allocation.</p>
        </div>
        <div className="hero-card__return">
          <span>Book return</span>
          <strong>+{portfolio.performancePct}%</strong>
          <small><TrendingUp size={14} /> Since inception</small>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Portfolio value" value={money(portfolio.portfolioValue)} note="Cash + active exposure" icon={BriefcaseBusiness} tone="purple" delta={11.5} onExplain={() => onExplain("Portfolio value")} />
        <MetricCard label="Cash on hand" value={money(portfolio.cash)} note="Available capital" icon={WalletCards} delta={8.9} onExplain={() => onExplain("Cash on hand")} />
        <MetricCard label="Capital deployed" value={money(portfolio.disbursed)} note="47.7% utilization" icon={Banknote} tone="blue" onExplain={() => onExplain("Capital deployed")} />
        <MetricCard label="Collections" value={money(portfolio.collected)} note="95.5% efficiency" icon={HandCoins} tone="green" delta={14.8} />
        <MetricCard label="Active exposure" value={money(portfolio.activeExposure)} note="2 active loans" icon={Activity} tone="amber" />
        <MetricCard label="Book performance" value={`+${money(portfolio.performance)}`} note="+11.5% return" icon={TrendingUp} tone="green" onExplain={() => onExplain("Book performance")} />
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
          <div className="panel__header"><div><h3>Performance score</h3><p>Current portfolio health</p></div><button className="icon-button"><MoreHorizontal size={18} /></button></div>
          <PerformanceGauge />
        </article>
      </section>

      <section className="overview-grid overview-grid--lower">
        <article className="panel">
          <div className="panel__header"><div><h3>Capital composition</h3><p>Where portfolio value sits today</p></div></div>
          <div className="composition">
            <div className="donut" />
            <div className="composition__legend">
              <div><span><i className="swatch swatch--cash" /> Cash on hand</span><strong>{money(portfolio.cash)}</strong><small>97.6%</small></div>
              <div><span><i className="swatch swatch--exposure" /> Active exposure</span><strong>{money(portfolio.activeExposure)}</strong><small>2.4%</small></div>
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

function PortfolioPage() {
  const { portfolio } = usePortalData();
  return (
    <section className="panel page-panel">
      <div className="panel__header table-toolbar">
        <div><h3>All portfolios</h3><p>1 active portfolio · NAD reporting currency</p></div>
        <div><button className="secondary-button"><Download size={15} /> Export</button><button className="primary-button"><Layers3 size={15} /> Compare</button></div>
      </div>
      <div className="portfolio-summary">
        <div><span className="portfolio-avatar">DG</span><div><strong>Destiny Group Portfolio</strong><small>RBP-DES-001 · Active</small></div></div>
        <div><span>Initial allocation</span><strong>{money(portfolio.allocation)}</strong></div>
        <div><span>Portfolio value</span><strong>{money(portfolio.portfolioValue)}</strong></div>
        <div><span>Book return</span><strong className="positive">+11.5%</strong></div>
        <div><span>PAR 30+</span><strong>0.0%</strong></div>
        <button className="icon-button"><ChevronRight size={18} /></button>
      </div>
      <div className="detail-tabs">
        {["Summary", "Performance", "Loan book", "Collections", "Risk & arrears", "Documents"].map((tab, index) => <button className={index === 0 ? "active" : ""} key={tab}>{tab}</button>)}
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
          <ProgressLine label="Utilization" value={47.7} />
          <ProgressLine label="Collection efficiency" value={95.5} />
          <ProgressLine label="Cash ratio" value={97.6} />
          <ProgressLine label="Book return" value={11.5} />
        </article>
      </div>
    </section>
  );
}

function ProgressLine({ label, value }) {
  return (
    <div className="progress-line">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <div className="progress"><i style={{ width: `${Math.min(value, 100)}%` }} /></div>
    </div>
  );
}

function SocietiesPage() {
  const { societies } = usePortalData();
  const [query, setQuery] = useState("");
  const visible = societies.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="panel page-panel">
      <div className="table-toolbar">
        <div className="search-box"><Search size={16} /><input placeholder="Search societies…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="secondary-button"><Filter size={15} /> Filter</button>
        <button className="secondary-button"><Download size={15} /> Export</button>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Society</th><th>Allocation</th><th>Active exposure</th><th>Collected</th><th>Efficiency</th><th>PAR 30+</th><th>Rating</th><th /></tr></thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.code}>
                <td><div className="table-identity"><span className="society-mark">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.code} · {item.type}</small></div></div></td>
                <td className="mono">{money(item.allocation)}</td>
                <td className="mono">{money(item.exposure)}</td>
                <td className="mono">{money(item.collected)}</td>
                <td>{item.efficiency === null ? <span className="muted">Not available</span> : <strong className="positive">{item.efficiency}%</strong>}</td>
                <td>{item.par30.toFixed(1)}%</td>
                <td><span className={`rating rating--${item.rating.toLowerCase()}`}>{item.rating}</span></td>
                <td><button className="icon-button"><ChevronRight size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DisbursementsPage({ onToast }) {
  const [selected, setSelected] = useState([]);
  const eligible = disbursements.filter((item) => item.status === "Eligible");
  const total = disbursements.filter((item) => selected.includes(item.id)).reduce((sum, item) => sum + item.amount, 0);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <>
      <div className="disbursement-summary">
        <div><span className="summary-icon summary-icon--teal"><CircleDollarSign size={20} /></span><p><span>Eligible for payment</span><strong>{money(22700)}</strong><small>2 approved loans</small></p></div>
        <div><span className="summary-icon summary-icon--amber"><Clock3 size={20} /></span><p><span>On hold</span><strong>{money(6750)}</strong><small>1 bank detail check</small></p></div>
        <div><span className="summary-icon summary-icon--blue"><Layers3 size={20} /></span><p><span>Open batches</span><strong>1</strong><small>{money(18600)} total</small></p></div>
      </div>
      <section className="panel page-panel">
        <div className="status-tabs">
          {["Eligible", "On hold", "In batch", "Exported", "Completed"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}{index < 3 && <span>{index === 0 ? 2 : 1}</span>}</button>)}
        </div>
        <div className="table-toolbar">
          <div className="search-box"><Search size={16} /><input placeholder="Search loan or borrower…" /></div>
          <button className="secondary-button"><Filter size={15} /> Filter</button>
          <div className="table-toolbar__spacer" />
          <button className="secondary-button" onClick={() => onToast("Payment result upload opened in demo mode.")}><Upload size={15} /> Upload results</button>
          <button
            className="primary-button"
            disabled={!selected.length}
            onClick={() => onToast(`Draft batch created for ${selected.length} loans (${money(total)}).`)}
          >
            Create batch {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>
        {selected.length > 0 && (
          <div className="selection-banner">
            <Check size={16} /><strong>{selected.length} selected</strong><span>Control total: {money(total)}</span><button onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th><input type="checkbox" checked={selected.length === eligible.length} onChange={() => setSelected(selected.length === eligible.length ? [] : eligible.map((item) => item.id))} /></th><th>Loan</th><th>Borrower</th><th>Society & product</th><th>Bank account</th><th>Net payable</th><th>Approved</th><th>Status</th><th /></tr></thead>
            <tbody>{disbursements.map((item) => (
              <tr key={item.id}>
                <td><input type="checkbox" disabled={item.status !== "Eligible"} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /></td>
                <td><strong>{item.id}</strong><small className="cell-sub">v1 · Validated</small></td>
                <td>{item.borrower}</td>
                <td><strong>{item.society}</strong><small className="cell-sub">{item.product}</small></td>
                <td>{item.bank}</td>
                <td className="mono"><strong>{money(item.amount)}</strong></td>
                <td>{item.approved}</td>
                <td><Status status={item.status} /></td>
                <td><button className="icon-button"><MoreHorizontal size={17} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Status({ status }) {
  const className = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status status--${className}`}><i />{status}</span>;
}

function LoansPage() {
  const [status, setStatus] = useState("All statuses");
  const filtered = loans.filter((item) => status === "All statuses" || item.status === status);
  return (
    <section className="panel page-panel">
      <div className="table-toolbar">
        <div className="search-box"><Search size={16} /><input placeholder="Search loan ID or borrower…" /></div>
        <select className="standalone-select" value={status} onChange={(e) => setStatus(e.target.value)}><option>All statuses</option><option>Current</option><option>Settled</option></select>
        <div className="table-toolbar__spacer" /><button className="secondary-button"><Download size={15} /> Export loan book</button>
      </div>
      <div className="data-table-wrap"><table className="data-table">
        <thead><tr><th>Loan ID</th><th>Borrower</th><th>Lending society</th><th>Original principal</th><th>Active balance</th><th>Next due</th><th>Status</th><th /></tr></thead>
        <tbody>{filtered.map((item) => <tr key={item.id}>
          <td><strong>{item.id}</strong></td><td>{item.borrower}</td><td>{item.society}</td><td className="mono">{money(item.principal)}</td><td className="mono"><strong>{money(item.balance)}</strong></td><td>{item.due}</td><td><Status status={item.status} /></td><td><button className="icon-button"><ChevronRight size={17} /></button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
  );
}

function CollectionsPage() {
  return (
    <div className="collection-grid">
      <section className="panel collection-hero">
        <div className="panel__header"><div><h3>Collection performance</h3><p>Due versus received by month</p></div><span className="rating-pill"><BadgeCheck size={14} /> On target</span></div>
        <div className="collection-bars">
          {chartValues.map((item) => <div key={item.month}><span className="bars"><i style={{height:`${item.disbursed*5}px`}} /><b style={{height:`${item.collected*5}px`}} /></span><small>{item.month}</small></div>)}
        </div>
        <div className="legend legend--center"><span><i className="legend__pale" /> Contractually due</span><span><i className="legend__teal" /> Collected</span></div>
      </section>
      <section className="panel collection-score">
        <span>Collection efficiency</span><strong>95.5%</strong><p>Eligible collections divided by contractually due amounts.</p>
        <div className="score-track"><i /></div>
        <div><small>Target: 90%</small><small>+5.5 pts above target</small></div>
      </section>
      <section className="panel collection-table">
        <div className="panel__header"><div><h3>Recent collections</h3><p>Successfully posted payments</p></div><button className="link-button">View ledger <ArrowRight size={15} /></button></div>
        {[
          ["PAY-78542", "Beares Namibia Staff", "NAD 1,275.00", "22 Jul 2026"],
          ["PAY-78518", "Kayla Industries", "NAD 2,430.00", "21 Jul 2026"],
          ["PAY-78491", "Beares Namibia Staff", "NAD 980.00", "19 Jul 2026"],
        ].map((row) => <div className="recent-row" key={row[0]}><span className="summary-icon summary-icon--green"><Check size={16} /></span><div><strong>{row[0]}</strong><small>{row[1]}</small></div><strong>{row[2]}</strong><span>{row[3]}</span></div>)}
      </section>
    </div>
  );
}

function RiskPage() {
  const { portfolio } = usePortalData();
  const collectionEfficiency = portfolio.collectionEfficiency ?? 0;
  const defaultRateScore = Math.max(0, 100 - (portfolio.par30 ?? 0));
  const utilization = portfolio.utilization ?? 0;
  const portfolioYield = portfolio.yield ?? 0;
  const cashRatio = portfolio.portfolioValue > 0
    ? (portfolio.cash / portfolio.portfolioValue) * 100
    : 0;
  const activeSettled = portfolio.settledLoans > 0
    ? (portfolio.activeLoans / portfolio.settledLoans) * 100
    : 0;
  const factors = [
    ["Collection efficiency", `${collectionEfficiency.toFixed(1)}%`, collectionEfficiency, "25%", (collectionEfficiency * 0.25).toFixed(1)],
    ["Default rate score", defaultRateScore.toFixed(1), defaultRateScore, "25%", (defaultRateScore * 0.25).toFixed(1)],
    ["Utilization", `${utilization.toFixed(1)}%`, utilization, "15%", (utilization * 0.15).toFixed(1)],
    ["Yield", `${portfolioYield.toFixed(1)}%`, portfolioYield, "15%", (portfolioYield * 0.15).toFixed(1)],
    ["Cash ratio", `${cashRatio.toFixed(1)}%`, cashRatio, "10%", (cashRatio * 0.1).toFixed(1)],
    ["Active / settled", `${activeSettled.toFixed(1)}%`, activeSettled, "10%", (activeSettled * 0.1).toFixed(1)],
  ];
  const total = factors.reduce((sum, item) => sum + Number(item[4]), 0).toFixed(1);
  return (
    <div className="risk-grid">
      <section className="panel risk-score-card">
        <div className="score-seal"><strong>{total}</strong><span>out of 100</span></div>
        <span className="rating-pill"><BadgeCheck size={14} /> Good</span>
        <h3>Portfolio rating</h3>
        <p>Low arrears and strong collection performance support a healthy rating.</p>
        <small>Formula version RB-RATING v1.2 · 22 Jul 2026</small>
      </section>
      <section className="panel rating-breakdown">
        <div className="panel__header"><div><h3>Rating breakdown</h3><p>Every component reconciles to the headline score</p></div><button className="secondary-button"><BookOpen size={15} /> Calculation guide</button></div>
        <div className="rating-table"><div className="rating-row rating-row--head"><span>Component</span><span>Raw value / score</span><span>Weight</span><span>Points</span></div>
          {factors.map((item) => <div className="rating-row" key={item[0]}><strong>{item[0]}</strong><span><i><b style={{width:`${item[2]}%`}} /></i>{item[1]}</span><span>{item[3]}</span><strong>{item[4]}</strong></div>)}
          <div className="rating-row rating-row--total"><strong>Final rating score</strong><span /><span>100%</span><strong>{total}</strong></div>
        </div>
      </section>
      <section className="panel arrears-card">
        <div className="panel__header"><div><h3>Arrears ageing</h3><p>Active principal by days past due</p></div></div>
        <div className="ageing-bar"><i style={{width:"100%"}} /></div>
        <div className="ageing-legend"><div><span className="dot dot--current" />Current<strong>{money(portfolio.activeExposure)}</strong></div><div><span className="dot dot--amber" />1–30 days<strong>{money(0)}</strong></div><div><span className="dot dot--red" />30+ days<strong>{money(0)}</strong></div></div>
      </section>
    </div>
  );
}

function ReportsPage({ onToast }) {
  const reports = [
    [FileBarChart, "Portfolio performance report", "Capital position, returns, KPIs and rating breakdown", "PDF"],
    [ReceiptText, "Loan book extract", "Scoped loan-level balances and statuses", "XLSX"],
    [HandCoins, "Collections ledger", "Posted repayments, reversals and allocations", "XLSX"],
    [ShieldCheck, "Risk & arrears report", "PAR, ageing and concentration indicators", "PDF"],
  ];
  return (
    <div className="reports-grid">
      {reports.map(([Icon, title, copy, format]) => <article className="report-card" key={title}><span className="report-icon"><Icon size={22} /></span><div><h3>{title}</h3><p>{copy}</p><span className="format-pill">{format}</span></div><button className="secondary-button" onClick={() => onToast(`${title} queued for export.`)}><Download size={15} /> Generate</button></article>)}
      <section className="panel audit-note"><ShieldCheck size={21} /><div><h3>Controlled exports</h3><p>Every report is scoped to your portfolio access and recorded in the audit log. Borrower and bank details remain masked by default.</p></div></section>
    </div>
  );
}

function AuditPage() {
  const events = [
    ["JM", "Josephat Mwatolele signed in", "Portal access", "Today, 09:24"],
    ["JM", "Portfolio performance report exported", "RBP-DES-001 · PDF", "21 Jul, 16:08"],
    ["AN", "Payment batch approved", "BAT-2026-0071 · NAD 18,600.00", "20 Jul, 14:42"],
    ["SK", "Loan RB-10471 placed on hold", "Bank account-name check required", "19 Jul, 11:05"],
    ["System", "Daily portfolio snapshot completed", "No reconciliation exceptions", "19 Jul, 00:05"],
  ];
  return (
    <section className="panel page-panel">
      <div className="table-toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search audit events…" /></div><button className="secondary-button"><CalendarDays size={15} /> Date range</button><button className="secondary-button"><Download size={15} /> Export log</button></div>
      <div className="audit-timeline">{events.map((item, index) => <div className="audit-event" key={item[1]}><span className={`audit-avatar ${item[0] === "System" ? "audit-avatar--system" : ""}`}>{item[0] === "System" ? <Settings size={16} /> : item[0]}</span><i /><div><strong>{item[1]}</strong><span>{item[2]}</span></div><time>{item[3]}</time>{index < events.length - 1 && <b />}</div>)}</div>
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
        <div className="drawer-meta"><div><span>Data as of</span><strong>22 Jul 2026, 11:59 CAT</strong></div><div><span>Formula version</span><strong>calc-svc v1.2.0</strong></div><div><span>Currency</span><strong>NAD</strong></div></div>
        <button className="secondary-button secondary-button--full"><BookOpen size={16} /> Open full calculation guide</button>
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

  const content = useMemo(() => {
    switch (current) {
      case "overview": return <Overview onNavigate={changePage} onExplain={setMetric} />;
      case "portfolios": return <PortfolioPage />;
      case "societies": return <SocietiesPage />;
      case "disbursements": return <DisbursementsPage onToast={notify} />;
      case "loans": return <LoansPage />;
      case "collections": return <CollectionsPage />;
      case "risk": return <RiskPage />;
      case "reports": return <ReportsPage onToast={notify} />;
      case "audit": return <AuditPage />;
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
        <Header current={current} onMenu={() => setMobileNav(true)} profileName={profileName} holderName={holderName} />
        <div className="decorative-border" />
        <main className="content">
          <div className="page-title">
            <div><h1>{pageCopy[current][0]}</h1><p>{pageCopy[current][1]}</p></div>
            {current === "overview" && <button className="secondary-button"><Download size={15} /> Export snapshot</button>}
          </div>
          <FilterBar />
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
