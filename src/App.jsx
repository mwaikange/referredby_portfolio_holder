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
  Upload,
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

const borrowerReference = (userId) =>
  userId ? String(userId) : "Borrower unavailable";

const spreadsheetSafe = (value) => {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};
const csvCell = (value) => `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;
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
  disbursements: ["Pending disbursements", "Select eligible loans, prepare payment instructions and validate uploaded payment results."],
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

const ACTIVE_LOAN_STATUSES = new Set(["DU", "OT", "BL"]);
const percent = (numerator, denominator) => denominator > 0 ? (numerator / denominator) * 100 : null;
const sumValues = (rows, accessor) => rows.reduce((total, row) => total + Number(accessor(row) || 0), 0);
const chartPalette = ["#176b73", "#db9438", "#5e62c7", "#2f9d78", "#c94b59", "#3c7fbd", "#8557a8", "#8aa346"];

function HoneycombUnitChart({ items, total, committedTotal, onSelect }) {
  const usable = items
    .map((item, index) => ({ ...item, color: item.color || chartPalette[index % chartPalette.length], value: Number(item.value || 0) }))
    .filter((item) => item.value > 0);
  const denominator = Number(total || sumValues(usable, (item) => item.value));
  const committed = Number(committedTotal || denominator);

  if (!usable.length || denominator <= 0) {
    return <div className="analytics-empty">No allocation values are available for this selection.</div>;
  }
  const cellValue = denominator / 100;
  const unallocatedCommitment = Math.max(committed - denominator, 0);
  const allocatedShare = committed > 0 ? (denominator / committed) * 100 : null;

  const allocations = usable.map((item) => {
    const exact = (item.value / denominator) * 100;
    return { ...item, exact, cells: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = 100 - allocations.reduce((sum, item) => sum + item.cells, 0);
  [...allocations]
    .sort((a, b) => b.remainder - a.remainder || a.label.localeCompare(b.label))
    .forEach((item) => {
      if (remaining > 0) {
        const target = allocations.find((entry) => entry.label === item.label);
        target.cells += 1;
        remaining -= 1;
      }
    });
  const categoryCells = allocations.flatMap((item) => Array.from({ length: item.cells }, (_, index) => ({ ...item, cellKey: `${item.label}-${index}` })));
  const boardRadius = 9;
  const spacing = 13.2;
  const hexRadius = 11.35;
  const centerX = 250;
  const centerY = 188;
  const boardCells = [];
  for (let q = -boardRadius; q <= boardRadius; q += 1) {
    const rowStart = Math.max(-boardRadius, -q - boardRadius);
    const rowEnd = Math.min(boardRadius, -q + boardRadius);
    for (let r = rowStart; r <= rowEnd; r += 1) {
      const x = centerX + spacing * 1.5 * q;
      const y = centerY + spacing * Math.sqrt(3) * (r + q / 2);
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      const angle = (Math.atan2(y - centerY, x - centerX) + Math.PI * 2) % (Math.PI * 2);
      boardCells.push({ q, r, x, y, distance, angle, key: `${q}:${r}` });
    }
  }
  const coloredPositions = [...boardCells]
    .sort((a, b) => a.distance - b.distance || a.angle - b.angle)
    .slice(0, 100)
    .sort((a, b) => a.angle - b.angle || a.distance - b.distance);
  const assignments = new Map(coloredPositions.map((position, index) => [position.key, categoryCells[index]]));
  const polygonPoints = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index;
    return `${(Math.cos(angle) * hexRadius).toFixed(2)},${(Math.sin(angle) * hexRadius).toFixed(2)}`;
  }).join(" ");

  return (
    <div className="honeycomb-layout">
      <div className="honeycomb-visual">
        <div className="honeycomb-meta"><strong>Society allocation mosaic</strong><span>1 filled hexagon = {money(cellValue)} (1%)</span></div>
        <div className="mosaic-context">
          <div><span>Allocated to linked societies</span><strong>{money(denominator)}</strong><small>{usable.length} societies · {allocatedShare == null ? "N/A" : `${allocatedShare.toFixed(1)}%`} of committed capital</small></div>
          <div><span>Not allocated to a society</span><strong>{money(unallocatedCommitment)}</strong><small>Outside this allocation mosaic</small></div>
        </div>
        <div className="honeycomb">
          <svg className="honeycomb__svg" viewBox="0 -28 500 440" role="img" aria-labelledby="allocation-mosaic-title allocation-mosaic-description">
            <title id="allocation-mosaic-title">Allocated capital by lending society</title>
            <desc id="allocation-mosaic-description">One hundred colored hexagons represent the capital allocated across linked lending societies. Each filled cell is one percent of the society-allocated total. Pale surrounding hexagons are a visual reference grid and are not included in any financial total.</desc>
            {boardCells.map((position) => {
              const cell = assignments.get(position.key);
              if (!cell) {
                return <polygon className="honeycomb__cell honeycomb__cell--neutral" key={position.key} points={polygonPoints} transform={`translate(${position.x} ${position.y})`} aria-hidden="true" />;
              }
              const cellLabel = `${cell.label}: ${money(cell.value)}, ${cell.exact.toFixed(1)} percent of selected total`;
              return (
                <g
                  className="honeycomb__unit"
                  key={position.key}
                  role="button"
                  tabIndex="0"
                  aria-label={cellLabel}
                  onClick={() => onSelect?.(cell.label)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(cell.label);
                    }
                  }}
                >
                  <title>{cellLabel}</title>
                  <polygon className="honeycomb__cell honeycomb__cell--active" points={polygonPoints} transform={`translate(${position.x} ${position.y})`} style={{ fill: cell.color }} />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mosaic-key"><span><i /> Pale cells: decorative reference grid</span><span><strong>100</strong> filled society-allocation units</span></div>
        <p className="chart-note">Filled cells divide {money(denominator)} among linked societies using largest-remainder rounding. They do not represent the unallocated commitment. Exact legend values reconcile to 100% of the society-allocated total.</p>
      </div>
      <div className="honeycomb-legend" aria-label="Exact allocation legend">
        {allocations.map((item) => (
          <button type="button" key={item.label} onClick={() => onSelect?.(item.label)}>
            <i style={{ background: item.color }} />
            <span><strong>{item.label}</strong><small>{item.count == null ? "Partner portfolio" : `${item.count} loans`}</small></span>
            <span className="honeycomb-legend__value"><strong>{money(item.value)}</strong><small>{item.exact.toFixed(1)}%</small></span>
          </button>
        ))}
        <div className="honeycomb-total"><span>Allocated society total</span><strong>{money(denominator)}</strong></div>
      </div>
    </div>
  );
}

function RankedBars({ items, valueFormatter = money, emptyText = "No values available." }) {
  const max = Math.max(0, ...items.map((item) => Number(item.value || 0)));
  if (!items.length || max <= 0) return <div className="analytics-empty">{emptyText}</div>;
  return (
    <div className="ranked-bars">
      {items.map((item, index) => (
        <div className="ranked-bars__row" key={item.label}>
          <span className="ranked-bars__rank">{String(index + 1).padStart(2, "0")}</span>
          <div><div className="ranked-bars__label"><strong>{item.label}</strong><span>{valueFormatter(item.value)}</span></div><div className="ranked-bars__track"><i style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: item.color || chartPalette[index % chartPalette.length] }} /></div></div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsWorkspace({ onNavigate }) {
  const { portfolio, societies, loans, payments } = usePortalData();
  const [tab, setTab] = useState("capital");
  const activeLoans = loans.filter((loan) => ACTIVE_LOAN_STATUSES.has(loan.status));
  const pendingLoans = loans.filter((loan) => loan.status === "AD");
  const pendingAmount = sumValues(pendingLoans, (loan) => loan.loan_amount);
  const grossBook = sumValues(activeLoans, (loan) => loan.outstanding_balance);
  const overdueAmount = sumValues(payments, (payment) => Math.max(Number(payment.amount_due || 0) - Number(payment.amount_paid || 0), 0));
  const dueAmount = sumValues(payments, (payment) => payment.amount_due);
  const collectedAmount = sumValues(payments, (payment) => payment.amount_paid);
  const allocationItems = societies.map((society) => ({ label: society.name, value: society.allocation, count: loans.filter((loan) => loan.lending_society_id === society.id).length }));

  const products = [...loans.reduce((map, loan) => {
    const label = loan.loanType || "Other";
    const current = map.get(label) || { label, value: 0, original: 0, count: 0 };
    current.original += Number(loan.loan_amount || 0);
    current.count += 1;
    if (ACTIVE_LOAN_STATUSES.has(loan.status)) current.value += Number(loan.outstanding_balance || 0);
    map.set(label, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.value - a.value);

  const maturityLabels = ["≤30 days", "31–90 days", "91–180 days", "181–365 days", ">365 days"];
  const maturityValues = maturityLabels.map((label) => ({ label, value: 0 }));
  activeLoans.forEach((loan) => {
    const due = new Date(loan.final_deduction_date || loan.due_date);
    const days = Number.isNaN(due.getTime()) ? null : Math.ceil((due.getTime() - Date.now()) / 86400000);
    const bucket = days == null || days <= 30 ? 0 : days <= 90 ? 1 : days <= 180 ? 2 : days <= 365 ? 3 : 4;
    maturityValues[bucket].value += Number(loan.outstanding_balance || 0);
  });

  const paymentRisk = new Map();
  payments.forEach((payment) => {
    const current = paymentRisk.get(payment.loan_id) || 0;
    paymentRisk.set(payment.loan_id, Math.max(current, Number(payment.days_late || 0)));
  });
  const parAmount = (days) => sumValues(activeLoans.filter((loan) => (paymentRisk.get(loan.loan_id) || 0) >= days), (loan) => loan.outstanding_balance);
  const nplAmount = parAmount(90);
  const qualityRows = [1, 30, 60, 90].map((days) => ({ label: `PAR ${days}+`, value: parAmount(days) }));

  const borrowers = [...loans.reduce((map, loan) => {
    const key = loan.user_id || `unknown-${loan.id}`;
    const current = map.get(key) || { id: key, label: borrowerReference(loan.user_id), value: 0, originated: 0, count: 0 };
    current.count += 1;
    current.originated += Number(loan.loan_amount || 0);
    if (ACTIVE_LOAN_STATUSES.has(loan.status)) current.value += Number(loan.outstanding_balance || 0);
    map.set(key, current);
    return map;
  }, new Map()).values()];
  const topBorrowers = [...borrowers].sort((a, b) => b.value - a.value).slice(0, 10);
  const repeatBorrowers = [...borrowers].filter((item) => item.count > 1).sort((a, b) => b.count - a.count || b.originated - a.originated).slice(0, 10);

  const analyticsTabs = [
    ["capital", "A. Capital allocation"],
    ["loans", "B. Gross loans & advances"],
    ["quality", "C. Portfolio quality"],
    ["customers", "D. Customer profiles"],
  ];

  return (
    <section className="analytics-workspace">
      <div className="analytics-tabs" role="tablist" aria-label="JM dashboard categories">
        {analyticsTabs.map(([id, label]) => <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === "capital" && (
        <div className="analytics-section">
          <div className="action-queue-grid">
            <button type="button" className="action-queue action-queue--amber" onClick={() => onNavigate("disbursements")}><span><Banknote size={19} /></span><div><small>Approved pending disbursement</small><strong>{money(pendingAmount)}</strong><p>{pendingLoans.length} loans require payment action</p></div><ArrowRight size={17} /></button>
            <div className="action-queue"><span><WalletCards size={19} /></span><div><small>Available cash</small><strong>{money(portfolio.cash)}</strong><p>Before pending obligations and reserves</p></div></div>
            <div className="action-queue"><span><AlertTriangle size={19} /></span><div><small>Reconciliation check</small><strong>{money(portfolio.allocation - sumValues(societies, (society) => society.allocation))}</strong><p>Holder allocation less society allocations</p></div></div>
          </div>
          <article className="panel analytics-panel">
            <div className="panel__header"><div><h3>Allocated capital by lending society</h3><p>Shows the distribution of society allocations, separately from total committed capital</p></div><span className="formula-version">{portfolio.formulaVersion}</span></div>
            <HoneycombUnitChart items={allocationItems} total={sumValues(allocationItems, (item) => item.value)} committedTotal={portfolio.allocation} onSelect={() => onNavigate("societies")} />
          </article>
          <div className="analytics-kpis">
            <div><span>Total capital committed</span><strong>{money(portfolio.allocation)}</strong><small>Approved portfolio allocation</small></div>
            <div><span>Cumulative capital deployed</span><strong>{money(portfolio.disbursed)}</strong><small>{percent(portfolio.disbursed, portfolio.allocation)?.toFixed(1) || "N/A"}% of allocation</small></div>
            <div><span>Current deployed capital</span><strong>{money(grossBook)}</strong><small>Gross active outstanding principal</small></div>
            <div><span>Unutilised commitment</span><strong>{money(Math.max(portfolio.allocation - portfolio.disbursed, 0))}</strong><small>Committed less cumulative deployment</small></div>
          </div>
        </div>
      )}

      {tab === "loans" && (
        <div className="analytics-section analytics-two-column">
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Gross loan book by product</h3><p>Outstanding principal, not cumulative originations</p></div></div><RankedBars items={products} /></article>
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Remaining maturity distribution</h3><p>Active outstanding principal by contractual end date</p></div></div><RankedBars items={maturityValues} /></article>
          <div className="analytics-kpis analytics-kpis--wide">
            <div><span>Gross loans & advances</span><strong>{money(grossBook)}</strong><small>{activeLoans.length} active loans</small></div>
            <div><span>Period / all-record originations</span><strong>{money(sumValues(loans, (loan) => loan.loan_amount))}</strong><small>{loans.length} originated loans in loaded scope</small></div>
            <div><span>Average original loan size</span><strong>{loans.length ? money(sumValues(loans, (loan) => loan.loan_amount) / loans.length) : "N/A"}</strong><small>Originated principal ÷ originated count</small></div>
            <div><span>Average active balance</span><strong>{activeLoans.length ? money(grossBook / activeLoans.length) : "N/A"}</strong><small>Gross book ÷ active loan count</small></div>
          </div>
        </div>
      )}

      {tab === "quality" && (
        <div className="analytics-section analytics-two-column">
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Portfolio at risk</h3><p>Outstanding principal by days-past-due threshold</p></div></div><RankedBars items={qualityRows} /></article>
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Collection performance</h3><p>Contractually due versus eligible posted collections</p></div></div><RankedBars items={[{ label: "Amount due", value: dueAmount, color: "#d89a3a" }, { label: "Collected", value: collectedAmount, color: "#2f9d78" }, { label: "Overdue", value: overdueAmount, color: "#c94b59" }]} /></article>
          <div className="analytics-kpis analytics-kpis--wide">
            <div><span>NPL amount (90+ DPD)</span><strong>{money(nplAmount)}</strong><small>{percent(nplAmount, grossBook)?.toFixed(1) || "N/A"}% of gross loan book</small></div>
            <div><span>Collection efficiency</span><strong>{percent(collectedAmount, dueAmount) == null ? "N/A" : `${percent(collectedAmount, dueAmount).toFixed(1)}%`}</strong><small>Collected ÷ amount due</small></div>
            <div><span>Gross outstanding principal</span><strong>{money(grossBook)}</strong><small>Active, non-written-off balance</small></div>
            <div><span>Overdue amount</span><strong>{money(overdueAmount)}</strong><small>Unpaid scheduled amount due</small></div>
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="analytics-section analytics-two-column">
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Top 10 borrowers by exposure</h3><p>Borrower references · active outstanding principal</p></div></div><RankedBars items={topBorrowers} emptyText="No borrower exposure is available." /></article>
          <article className="panel analytics-panel"><div className="panel__header"><div><h3>Most frequent borrowers</h3><p>Ranked by loan count, separate from exposure</p></div></div><RankedBars items={repeatBorrowers.map((item) => ({ ...item, value: item.count }))} valueFormatter={(value) => `${value} loans`} emptyText="No repeat borrowers are present in the loaded scope." /></article>
          <div className="profile-coverage panel">
            <div><ShieldCheck size={23} /><span><strong>Reference-based profile reporting</strong><small>Database borrower references are shown without exposing borrower names.</small></span></div>
            <div className="coverage-grid"><span><strong>Gender</strong><small>Not supplied · 0% coverage</small></span><span><strong>Occupation</strong><small>Not supplied · 0% coverage</small></span><span><strong>Geography</strong><small>Not supplied · 0% coverage</small></span><span><strong>Income band</strong><small>Not supplied · 0% coverage</small></span></div>
          </div>
        </div>
      )}
    </section>
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

      <AnalyticsWorkspace onNavigate={onNavigate} />

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

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""])));
};

function DisbursementsPage({ onToast }) {
  const { loans, societies, portfolio } = usePortalData();
  const [statusCode, setStatusCode] = useState("AD");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [stagedRows, setStagedRows] = useState([]);
  const [batchOpen, setBatchOpen] = useState(false);
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
  const selectedLoans = awaitingDisbursement.filter((loan) => selected.has(loan.id));
  const selectedTotal = sumValues(selectedLoans, (loan) => loan.loan_amount);
  const batchId = `RB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(selectedLoans.length).padStart(3, "0")}`;

  const toggleLoan = (loanId) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(loanId)) next.delete(loanId); else next.add(loanId);
    return next;
  });
  const toggleVisible = () => setSelected((current) => {
    const next = new Set(current);
    const eligible = visible.filter((loan) => loan.status === "AD");
    const allSelected = eligible.length > 0 && eligible.every((loan) => next.has(loan.id));
    eligible.forEach((loan) => allSelected ? next.delete(loan.id) : next.add(loan.id));
    return next;
  });

  const exportPipeline = () => {
    if (!selectedLoans.length) return;
    downloadCsv(
      `${batchId}-payment-instructions.csv`,
      ["batch_id", "batch_version", "row_id", "loan_id", "portfolio_code", "lending_society", "borrower_reference", "currency", "approved_principal", "deductions", "net_amount_payable", "requested_payment_date", "payment_status", "payment_reference", "paid_at", "failure_code", "failure_reason", "operator_comment"],
      selectedLoans.map((loan) => [
        batchId,
        1,
        loan.id,
        loan.loan_id,
        portfolio.holderId?.slice(0, 8).toUpperCase(),
        societyById.get(loan.lending_society_id) || "Unknown society",
        borrowerReference(loan.user_id),
        "NAD",
        loan.loan_amount,
        0,
        loan.loan_amount,
        new Date().toISOString().slice(0, 10),
        "NOT_PROCESSED",
        "",
        "",
        "",
        "",
        "",
      ]),
    );
    setBatchOpen(true);
    onToast("Controlled payment instruction CSV downloaded for Excel.");
  };

  const uploadResults = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onToast("Use the exported CSV template; native XLSX parsing requires the server-side batch service.");
      return;
    }
    const parsed = parseCsv(await file.text());
    const pendingByLoan = new Map(awaitingDisbursement.map((loan) => [loan.loan_id, loan]));
    const seen = new Set();
    const validated = parsed.map((row, index) => {
      const errors = [];
      const status = row.payment_status?.toUpperCase();
      if (!row.loan_id) errors.push("Missing loan_id");
      if (!pendingByLoan.has(row.loan_id)) errors.push("Loan is not awaiting disbursement");
      if (seen.has(row.loan_id)) errors.push("Duplicate loan_id");
      seen.add(row.loan_id);
      if (!["PAID", "FAILED", "REJECTED", "NOT_PROCESSED"].includes(status)) errors.push("Invalid payment_status");
      if (status === "PAID" && !row.payment_reference) errors.push("PAID requires payment_reference");
      if (status === "PAID" && !row.paid_at) errors.push("PAID requires paid_at");
      if (["FAILED", "REJECTED"].includes(status) && !row.failure_reason) errors.push(`${status} requires failure_reason`);
      if (row.batch_id && batchOpen && row.batch_id !== batchId) errors.push("Batch ID does not match current draft");
      return { ...row, payment_status: status, rowNumber: index + 2, errors };
    });
    setStagedRows(validated);
    onToast(`${validated.length} payment result rows staged for review; no loan records changed.`);
  };
  const stagedErrors = stagedRows.reduce((sum, row) => sum + row.errors.length, 0);
  return (
    <>
      <div className="disbursement-summary">
        <div><span className="summary-icon summary-icon--teal"><CircleDollarSign size={20} /></span><p><span>Awaiting disbursement</span><strong>{money(sumValues(awaitingDisbursement, (loan) => loan.loan_amount))}</strong><small>{awaitingDisbursement.length} approved {awaitingDisbursement.length === 1 ? "loan" : "loans"}</small></p></div>
        <div><span className="summary-icon summary-icon--amber"><Clock3 size={20} /></span><p><span>Awaiting approval</span><strong>{money(sumValues(awaitingApproval, (loan) => loan.loan_amount))}</strong><small>{awaitingApproval.length} pending {awaitingApproval.length === 1 ? "decision" : "decisions"}</small></p></div>
        <div><span className="summary-icon summary-icon--blue"><Layers3 size={20} /></span><p><span>Selected for draft batch</span><strong>{money(selectedTotal)}</strong><small>{selectedLoans.length} payment instructions</small></p></div>
      </div>
      <section className="panel batch-workspace">
        <div className="panel__header"><div><h3>Payment batch workspace</h3><p>Select eligible loans, export an Excel-compatible instruction file, then stage payment results for validation.</p></div><span className="status-badge status-badge--warning">Frontend staging · no ledger posting</span></div>
        <div className="batch-controls">
          <div><span>Draft batch ID</span><strong>{selectedLoans.length ? batchId : "Select eligible loans"}</strong></div>
          <div><span>Items</span><strong>{selectedLoans.length}</strong></div>
          <div><span>Net payable</span><strong>{money(selectedTotal)}</strong></div>
          <div><span>Available cash after batch</span><strong>{money(portfolio.cash - selectedTotal)}</strong></div>
          <button type="button" className="secondary-button" disabled={!selectedLoans.length} onClick={() => setBatchOpen(true)}><FileCheck2 size={15} /> Review draft</button>
          <button type="button" className="primary-button" disabled={!selectedLoans.length} onClick={exportPipeline}><Download size={15} /> Export for Excel</button>
          <label className="secondary-button upload-button"><Upload size={15} /> Upload payment results<input type="file" accept=".csv,text/csv" onChange={uploadResults} /></label>
        </div>
        {batchOpen && <div className="batch-notice"><ShieldCheck size={18} /><div><strong>Maker-checker control required</strong><p>This draft can be exported and reviewed here. Final batch approval, XLSX protection, payment posting, idempotency, reversals and audit events must be completed by the server-side disbursement service before production use.</p></div></div>}
      </section>
      <section className="panel page-panel">
        <div className="status-tabs">
          {[["AD", "Eligible / awaiting disbursement", awaitingDisbursement.length], ["AA", "Awaiting approval", awaitingApproval.length]].map(([code, label, count]) => <button className={statusCode === code ? "active" : ""} key={code} onClick={() => setStatusCode(code)}>{label}<span>{count}</span></button>)}
        </div>
        <div className="table-toolbar">
          <div className="search-box"><Search size={16} /><input placeholder="Search loan or society…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="table-toolbar__spacer" />
          <small className="selection-count">{selectedLoans.length} selected</small>
        </div>
        <div className="data-table-wrap">
          <table className="data-table disbursement-table">
            <thead><tr><th className="checkbox-column"><input type="checkbox" aria-label="Select all visible eligible loans" checked={visible.some((loan) => loan.status === "AD") && visible.filter((loan) => loan.status === "AD").every((loan) => selected.has(loan.id))} onChange={toggleVisible} /></th><th>Loan</th><th>Borrower reference</th><th>Society & product</th><th>Principal / net payable</th><th>Approved</th><th>Status</th></tr></thead>
            <tbody>{visible.map((loan) => (
              <tr key={loan.id} className={selected.has(loan.id) ? "row-selected" : ""}>
                <td className="checkbox-column"><input type="checkbox" disabled={loan.status !== "AD"} checked={selected.has(loan.id)} onChange={() => toggleLoan(loan.id)} aria-label={`Select loan ${loan.loan_id}`} /></td>
                <td><strong>{loan.loan_id}</strong><small className="cell-sub">Row {loan.id.slice(0, 8).toUpperCase()}</small></td>
                <td>{borrowerReference(loan.user_id)}</td>
                <td><strong>{societyById.get(loan.lending_society_id) || "Unknown society"}</strong><small className="cell-sub">{loan.loanType}</small></td>
                <td className="mono"><strong>{money(loan.loan_amount)}</strong><small className="cell-sub">NAD · deductions 0.00</small></td>
                <td>{formatDate(loan.approved_at)}</td>
                <td><Status status={loanStatusLabel(loan.status)} code={loan.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!visible.length && <div className="empty-table">No loans match this pipeline status.</div>}
      </section>
      {stagedRows.length > 0 && (
        <section className="panel page-panel validation-preview">
          <div className="panel__header"><div><h3>Payment-results dry-run preview</h3><p>Uploaded rows are staged in the browser only. Review validation outcomes before any future checker approval.</p></div><span className={stagedErrors ? "status-badge status-badge--error" : "status-badge status-badge--success"}>{stagedErrors ? `${stagedErrors} validation errors` : "All rows passed"}</span></div>
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Row</th><th>Loan</th><th>Payment status</th><th>Reference</th><th>Paid at</th><th>Validation</th></tr></thead><tbody>{stagedRows.map((row) => <tr key={`${row.rowNumber}-${row.loan_id}`}><td>{row.rowNumber}</td><td><strong>{row.loan_id || "Missing"}</strong></td><td><Status status={row.payment_status || "Invalid"} code={row.payment_status === "PAID" ? "PU" : row.payment_status === "FAILED" ? "BL" : "AD"} /></td><td>{row.payment_reference || "—"}</td><td>{row.paid_at || "—"}</td><td>{row.errors.length ? <span className="validation-error">{row.errors.join("; ")}</span> : <span className="validation-pass"><Check size={14} /> Passed</span>}</td></tr>)}</tbody></table></div>
          <div className="validation-actions"><button type="button" className="secondary-button" onClick={() => setStagedRows([])}>Clear staging</button><button type="button" className="primary-button" disabled title="Requires server-side checker approval and atomic ledger service">Approve & post (backend required)</button></div>
        </section>
      )}
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
        borrowerReference(loan.user_id),
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
          <td><strong>{loan.loan_id}</strong></td><td>{borrowerReference(loan.user_id)}</td><td>{societyById.get(loan.lending_society_id) || "Unknown society"}</td><td>{loan.loanType}</td><td className="mono">{money(loan.loan_amount)}</td><td className="mono"><strong>{money(loan.outstanding_balance)}</strong></td><td>{formatDate(loan.due_date || loan.final_deduction_date)}</td><td><Status status={loanStatusLabel(loan.status)} code={loan.status} /></td>
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
  const receivedPayments = [...payments]
    .filter((payment) => Number(payment.amount_paid) > 0)
    .sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at));
  const recentPayments = receivedPayments.slice(0, 8);
  const totalReceived = receivedPayments.reduce(
    (total, payment) => total + Number(payment.amount_paid || 0),
    0,
  );
  const collectingSocieties = new Set(
    receivedPayments.map((payment) => payment.lending_society_id).filter(Boolean),
  ).size;
  const latestCollection = receivedPayments[0]?.payment_date || receivedPayments[0]?.created_at;
  return (
    <div className="collections-page">
      <section className="collection-summary" aria-label="Collection summary">
        <article><span className="summary-icon summary-icon--green"><HandCoins size={18} /></span><div><small>Total received</small><strong>{money(totalReceived)}</strong><p>Confirmed amount paid records</p></div></article>
        <article><span className="summary-icon"><ReceiptText size={18} /></span><div><small>Payments received</small><strong>{receivedPayments.length}</strong><p>Across the visible portfolio</p></div></article>
        <article><span className="summary-icon"><Building2 size={18} /></span><div><small>Collecting societies</small><strong>{collectingSocieties}</strong><p>With recorded payments</p></div></article>
        <article><span className="summary-icon"><Clock3 size={18} /></span><div><small>Latest receipt</small><strong className="collection-summary__date">{latestCollection ? formatDate(latestCollection) : "None recorded"}</strong><p>Most recent payment date</p></div></article>
      </section>
      <div className="collection-grid">
        <section className="panel collection-hero">
          <div className="panel__header"><div><h3>Received versus due</h3><p>Contractual repayments and amounts actually received by month</p></div></div>
          <div className="collection-bars">
            {monthlySeries.map((item) => <div key={item.key}><span className="bars"><i style={{height:`${(item.due / maxMonthly) * 180}px`}} /><b style={{height:`${(item.collected / maxMonthly) * 180}px`}} /></span><small>{item.month}</small></div>)}
          </div>
          <div className="legend legend--center"><span><i className="legend__pale" /> Contractually due</span><span><i className="legend__teal" /> Payment received</span></div>
          {!monthlySeries.length && <div className="empty-table">No dated payment records available.</div>}
        </section>
        <section className="panel collection-score">
          <span>Collection efficiency</span><strong>{portfolio.collectionEfficiency == null ? "N/A" : `${portfolio.collectionEfficiency}%`}</strong><p>Amount received divided by the contractual amount due in the visible payment records.</p>
          <div className="score-track"><i style={{ width: `${Math.min(portfolio.collectionEfficiency ?? 0, 100)}%` }} /></div>
          <div><small>Source: loan_payments</small><small>{receivedPayments.length} received payments</small></div>
        </section>
        <section className="panel collection-table">
          <div className="panel__header"><div><h3>Recent collections</h3><p>Payments received, ordered by most recent receipt date</p></div></div>
          {!!recentPayments.length && <div className="collection-ledger-head"><span>Loan ID</span><span>Lending society</span><span>Amount received</span><span>Received date</span></div>}
          {recentPayments.map((payment) => <div className="recent-row" key={payment.id}><div className="collection-loan"><span className="summary-icon summary-icon--green"><Check size={16} /></span><strong>{payment.loan_id || "Loan ID unavailable"}</strong></div><span>{societyById.get(payment.lending_society_id) || "Unknown society"}</span><strong>{money(payment.amount_paid)}</strong><time>{formatDate(payment.payment_date || payment.created_at)}</time></div>)}
          {!recentPayments.length && <div className="empty-table">No received payments are recorded.</div>}
        </section>
      </div>
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
