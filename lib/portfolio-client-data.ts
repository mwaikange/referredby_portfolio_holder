import type { SupabaseClient } from "@supabase/supabase-js";
import { AnyRow, isActiveLoan, isFundingRequiredLoan, isOverdueLoan, isSettledLoan, isUpcomingPayment, loanPrincipal, loanRepayable, numberFrom, paymentAmount } from "@/lib/finance";
import type { PortfolioTotals, SocietyAccounting } from "@/lib/portfolio-data";

export type ClientPortalData = {
  specs: AnyRow | null;
  societies: SocietyAccounting[];
  totals: PortfolioTotals;
  error?: string;
};

const emptyTotals: PortfolioTotals = {
  allocation: 0,
  activePrincipal: 0,
  totalRepayable: 0,
  totalCollected: 0,
  expectedUpcoming: 0,
  availableCapacity: 0,
  fundingRequired: 0,
  activeLoans: 0,
  settledLoans: 0,
  overdueLoans: 0,
  approvedAwaitingLoans: 0,
  collectionRate: 0,
};

export async function getClientPortalData(supabase: SupabaseClient, holder: AnyRow): Promise<ClientPortalData> {
  const portfolioHolderId = String(holder.id);
  const [{ data: specs }, { data: societies, error: societiesError }] = await Promise.all([
    supabase.from("portfolio_holder_specs").select("*").eq("portfolio_holder_id", portfolioHolderId).maybeSingle(),
    supabase.from("lending_societies").select("*").eq("portfolio_holder_id", portfolioHolderId).order("name"),
  ]);

  if (societiesError) {
    return { specs: specs ?? null, societies: [], totals: emptyTotals, error: societiesError.message };
  }

  const societyRows = societies ?? [];
  const societyIds = societyRows.map((society) => String(society.id));
  const [nanoLoans, termLoans, payments] = societyIds.length
    ? await Promise.all([
        supabase.from("nano_loans").select("*").in("lending_society_id", societyIds),
        supabase.from("term_loans").select("*").in("lending_society_id", societyIds),
        supabase.from("loan_payments").select("*").in("lending_society_id", societyIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const fetchError = nanoLoans.error?.message || termLoans.error?.message || payments.error?.message;
  const accounting = societyRows.map((society) => {
    const id = String(society.id);
    const societyNanoLoans = (nanoLoans.data ?? []).filter((loan) => loan.lending_society_id === id);
    const societyTermLoans = (termLoans.data ?? []).filter((loan) => loan.lending_society_id === id);
    const societyPayments = (payments.data ?? []).filter((payment) => payment.lending_society_id === id);

    return {
      society,
      nanoLoans: societyNanoLoans,
      termLoans: societyTermLoans,
      payments: societyPayments,
      metrics: calculateTotals(society, societyNanoLoans, societyTermLoans, societyPayments),
    };
  });

  return { specs: specs ?? null, societies: accounting, totals: combineTotals(accounting.map((item) => item.metrics), holder), error: fetchError };
}

function calculateTotals(society: AnyRow, nanoLoans: AnyRow[], termLoans: AnyRow[], payments: AnyRow[]): PortfolioTotals {
  const loans = [...nanoLoans, ...termLoans];
  const allocation = numberFrom(society, ["portfolio_allocation", "portfolio_amount", "total_allocation"]);
  const active = loans.filter(isActiveLoan);
  const settled = loans.filter(isSettledLoan);
  const overdue = loans.filter(isOverdueLoan);
  const awaiting = loans.filter(isFundingRequiredLoan);
  const activePrincipal = active.reduce((sum, loan) => sum + loanPrincipal(loan), 0);
  const totalRepayable = loans.reduce((sum, loan) => sum + loanRepayable(loan), 0);
  const totalCollected = payments.reduce((sum, payment) => sum + paymentAmount(payment), 0);
  const expectedUpcoming = payments.filter((payment) => isUpcomingPayment(payment)).reduce((sum, payment) => sum + paymentAmount(payment), 0);
  const fundingRequired = awaiting.reduce((sum, loan) => sum + loanPrincipal(loan), 0);

  return {
    allocation,
    activePrincipal,
    totalRepayable,
    totalCollected,
    expectedUpcoming,
    availableCapacity: Math.max(0, allocation - activePrincipal - fundingRequired),
    fundingRequired,
    activeLoans: active.length,
    settledLoans: settled.length,
    overdueLoans: overdue.length,
    approvedAwaitingLoans: awaiting.length,
    collectionRate: totalRepayable > 0 ? (totalCollected / totalRepayable) * 100 : 0,
  };
}

function combineTotals(items: PortfolioTotals[], holder: AnyRow): PortfolioTotals {
  const totals = items.reduce<PortfolioTotals>(
    (acc, item) => ({
      allocation: acc.allocation + item.allocation,
      activePrincipal: acc.activePrincipal + item.activePrincipal,
      totalRepayable: acc.totalRepayable + item.totalRepayable,
      totalCollected: acc.totalCollected + item.totalCollected,
      expectedUpcoming: acc.expectedUpcoming + item.expectedUpcoming,
      availableCapacity: acc.availableCapacity + item.availableCapacity,
      fundingRequired: acc.fundingRequired + item.fundingRequired,
      activeLoans: acc.activeLoans + item.activeLoans,
      settledLoans: acc.settledLoans + item.settledLoans,
      overdueLoans: acc.overdueLoans + item.overdueLoans,
      approvedAwaitingLoans: acc.approvedAwaitingLoans + item.approvedAwaitingLoans,
      collectionRate: 0,
    }),
    { ...emptyTotals },
  );

  totals.allocation = totals.allocation || numberFrom(holder, ["total_allocation"]);
  totals.availableCapacity = Math.max(0, totals.allocation - totals.activePrincipal - totals.fundingRequired);
  totals.collectionRate = totals.totalRepayable > 0 ? (totals.totalCollected / totals.totalRepayable) * 100 : 0;
  return totals;
}
