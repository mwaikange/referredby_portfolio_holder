import { supabase } from "./supabase";

const ACTIVE_STATUSES = new Set(["DU", "OT", "BL"]);
const DISBURSED_STATUSES = new Set(["DU", "OT", "BL", "PU"]);

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sum = (rows, field, predicate = () => true) =>
  rows.reduce((total, row) => total + (predicate(row) ? number(row[field]) : 0), 0);

const round = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const safePercent = (numerator, denominator) =>
  denominator > 0 ? round((numerator / denominator) * 100, 1) : null;

function buildPortfolio(holder, societies, loans, payments) {
  const societyAllocation = sum(societies, "portfolio_allocation");
  const allocation = number(holder.total_allocation) || societyAllocation;
  const disbursed = sum(loans, "loan_amount", (loan) => DISBURSED_STATUSES.has(loan.status));
  const activeExposure = sum(
    loans,
    "outstanding_balance",
    (loan) => ACTIVE_STATUSES.has(loan.status),
  );
  const collected = sum(payments, "amount_paid");
  const amountDue = sum(payments, "amount_due");
  const cash = allocation - disbursed + collected;
  const portfolioValue = cash + activeExposure;
  const performance = portfolioValue - allocation;
  const activeLoans = loans.filter((loan) => ACTIVE_STATUSES.has(loan.status)).length;
  const settledLoans = loans.filter((loan) => loan.status === "PU").length;

  return {
    holder: holder.name,
    holderId: holder.id,
    allocation: round(allocation),
    disbursed: round(disbursed),
    collected: round(collected),
    activeExposure: round(activeExposure),
    cash: round(cash),
    portfolioValue: round(portfolioValue),
    performance: round(performance),
    performancePct: safePercent(performance, allocation),
    utilization: safePercent(disbursed, allocation),
    yield: safePercent(performance, disbursed),
    collectionEfficiency: safePercent(collected, amountDue),
    par30: 0,
    activeLoans,
    settledLoans,
    contactPerson: holder.contact_person,
    contactEmail: holder.contact_email,
    status: holder.status,
    region: holder.region,
    formulaVersion: "RB-PORTFOLIO-v1",
    dataAsOf: new Date().toISOString(),
  };
}

function buildSocieties(rows, loans, payments, ratings) {
  const ratingBySociety = new Map(
    ratings.map((rating) => [rating.lending_society_id || rating.partner_id, rating]),
  );

  return rows.map((society) => {
    const societyLoans = loans.filter((loan) => loan.lending_society_id === society.id);
    const societyPayments = payments.filter(
      (payment) => payment.lending_society_id === society.id,
    );
    const collected = sum(societyPayments, "amount_paid");
    const due = sum(societyPayments, "amount_due");
    const exposure = sum(
      societyLoans,
      "outstanding_balance",
      (loan) => ACTIVE_STATUSES.has(loan.status),
    );
    const rating = ratingBySociety.get(society.id);

    return {
      id: society.id,
      name: society.name,
      code: society.id.slice(0, 8).toUpperCase(),
      type: society.partner_type || "Lending society",
      allocation: number(society.portfolio_allocation),
      exposure: round(exposure),
      collected: round(collected),
      efficiency: safePercent(collected, due),
      par30: number(rating?.default_rate),
      rating: rating?.rating_tier?.slice(0, 1)?.toUpperCase() || "—",
      trend: 0,
    };
  });
}

async function requirePortfolioHolder(user) {
  const metadataType = user.app_metadata?.user_type;
  const metadataHolderId = user.app_metadata?.portfolio_holder_id;

  const { data: mapping, error } = await supabase
    .from("portfolio_holder_users")
    .select("portfolio_holder_id, user_type")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const holderId = mapping?.portfolio_holder_id || metadataHolderId;
  const userType = mapping?.user_type || metadataType;

  if (userType !== "portfolio_holder" || !holderId) {
    throw new Error("This account is not authorised for the Portfolio Holder Portal.");
  }

  return holderId;
}

export async function getPortfolioPortalData(user) {
  if (!supabase || !user) throw new Error("Supabase is not configured.");

  const holderId = await requirePortfolioHolder(user);

  const [holderResult, societiesResult] = await Promise.all([
    supabase.from("portfolio_holders").select("*").eq("id", holderId).single(),
    supabase
      .from("lending_societies")
      .select("id, name, partner_type, portfolio_allocation, portfolio_allocation_balance, cash_on_hand")
      .eq("portfolio_holder_id", holderId)
      .order("name"),
  ]);

  const identityError = [holderResult, societiesResult].find((result) => result.error)?.error;
  if (identityError) throw identityError;

  const holder = holderResult.data;
  const societyRows = societiesResult.data || [];
  const societyIds = societyRows.map((society) => society.id);
  const noSocietyIds = societyIds.length === 0;
  const emptyResult = Promise.resolve({ data: [], error: null });

  const [nanoResult, termResult, paymentsResult, ratingsResult] = await Promise.all([
    noSocietyIds
      ? emptyResult
      : supabase
          .from("nano_loans")
          .select("id, loan_id, lending_society_id, loan_amount, total_repayable, outstanding_balance, status, disbursed_at")
          .in("lending_society_id", societyIds),
    noSocietyIds
      ? emptyResult
      : supabase
          .from("term_loans")
          .select("id, loan_id, lending_society_id, loan_amount, total_repayable, outstanding_balance, status, disbursed_at")
          .in("lending_society_id", societyIds),
    supabase
      .from("loan_payments")
      .select("id, lending_society_id, portfolio_holder_id, amount_due, amount_paid, status, payment_date")
      .eq("portfolio_holder_id", holderId),
    supabase
      .from("partner_ratings")
      .select("partner_id, lending_society_id, default_rate, rating_tier, score")
      .eq("portfolio_holder_id", holderId),
  ]);

  const firstError = [nanoResult, termResult, paymentsResult, ratingsResult].find(
    (result) => result.error,
  )?.error;

  if (firstError) throw firstError;

  const loans = [...(nanoResult.data || []), ...(termResult.data || [])];
  const payments = paymentsResult.data || [];
  const ratings = ratingsResult.data || [];

  return {
    source: "supabase",
    holder,
    portfolio: buildPortfolio(holder, societyRows, loans, payments),
    societies: buildSocieties(societyRows, loans, payments, ratings),
    loans,
    payments,
  };
}
