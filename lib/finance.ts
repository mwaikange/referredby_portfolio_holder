export type AnyRow = Record<string, unknown>;

const moneyFields = ["loan_amount", "principal_amount", "approved_amount", "amount", "principal", "requested_amount", "amount_requested"];
const repayableFields = ["total_repayable", "repayable_amount", "total_due", "amount_due", "repayment_amount", "expected_repayment", "amount"];
const paymentFields = ["amount_paid", "payment_amount", "amount", "paid_amount", "collection_amount"];
const dueDateFields = ["due_date", "expected_payment_date", "scheduled_date", "payment_due_date"];

export function numberFrom(row: AnyRow | null | undefined, fields: string[], fallback = 0) {
  for (const field of fields) {
    const value = row?.[field];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

export function textFrom(row: AnyRow | null | undefined, fields: string[], fallback = "") {
  for (const field of fields) {
    const value = row?.[field];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  }
  return fallback;
}

export function dateFrom(row: AnyRow | null | undefined, fields = dueDateFields) {
  for (const field of fields) {
    const value = row?.[field];
    if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value);
  }
  return null;
}

export function loanPrincipal(loan: AnyRow) {
  return numberFrom(loan, moneyFields);
}

export function loanRepayable(loan: AnyRow) {
  return numberFrom(loan, repayableFields, loanPrincipal(loan));
}

export function paymentAmount(payment: AnyRow) {
  return numberFrom(payment, paymentFields);
}

export function statusOf(row: AnyRow) {
  return textFrom(row, ["status", "loan_status", "payment_status"], "unknown").toUpperCase();
}

export function isActiveLoan(row: AnyRow) {
  return ["DU", "OT", "ACTIVE", "DISBURSED", "CURRENT", "OVERDUE"].includes(statusOf(row));
}

export function isSettledLoan(row: AnyRow) {
  return ["PU", "PAID", "SETTLED", "CLOSED", "COMPLETED"].includes(statusOf(row));
}

export function isFundingRequiredLoan(row: AnyRow) {
  return ["AP", "APPROVED", "AD", "AWAITING_DISBURSEMENT", "PENDING_DISBURSEMENT"].includes(statusOf(row));
}

export function isOverdueLoan(row: AnyRow) {
  return ["OT", "OVERDUE", "DEFAULT", "DEFAULTED"].includes(statusOf(row));
}

export function isPaidPayment(row: AnyRow) {
  return ["PAID", "PU", "SETTLED", "COMPLETED", "SUCCESS"].includes(statusOf(row));
}

export function isUpcomingPayment(row: AnyRow, now = new Date()) {
  const due = dateFrom(row);
  if (!due || isPaidPayment(row)) return false;
  const days = (due.getTime() - now.getTime()) / 86400000;
  return days >= 0 && days <= 30;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency: "NAD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}
