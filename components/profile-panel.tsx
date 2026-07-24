import { formatMoney, numberFrom, textFrom } from "@/lib/finance";
import type { AnyRow } from "@/lib/finance";

const fields: Array<[string, string[]]> = [
  ["Name", ["name"]],
  ["Status", ["status"]],
  ["Region", ["region"]],
  ["Contact person", ["contact_person"]],
  ["Contact email", ["contact_email", "company_contact_email"]],
  ["Contact phone", ["contact_phone"]],
  ["Business address", ["business_address"]],
  ["Business registration", ["business_registration"]],
  ["NAMFISA registration", ["namfisa_registration"]],
];

export function ProfilePanel({ holder, specs }: { holder: AnyRow | null; specs: AnyRow | null }) {
  return (
    <section id="profile" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-ink">Settings & Profile</h2>
        <p className="mt-1 text-sm text-reed">Read-only until update policies or secure server actions are approved.</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map(([label, keys]) => (
            <div key={label} className="rounded-md bg-field p-3">
              <dt className="text-xs font-semibold uppercase text-reed">{label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-ink">{textFrom(holder, keys, "Not set")}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <h3 className="text-lg font-bold text-ink">Portfolio Specs</h3>
        <div className="mt-5 space-y-3">
          <Spec label="Total allocation" value={formatMoney(numberFrom(holder, ["total_allocation"]))} />
          <Spec label="Nano loan access" value={textFrom(specs, ["nano_loans_enabled", "nano_enabled"], "Policy based")} />
          <Spec label="Term loan access" value={textFrom(specs, ["term_loans_enabled", "term_enabled"], "Policy based")} />
          <Spec label="Interest settings" value={textFrom(specs, ["interest_settings", "term_loan_settings"], "Configured in admin portal")} />
          <Spec label="Profile edits" value="Disabled in this read-only build" />
        </div>
      </div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-b-0">
      <span className="text-sm text-reed">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
