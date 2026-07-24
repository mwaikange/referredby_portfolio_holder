import { formatMoney, formatPercent, textFrom } from "@/lib/finance";
import type { SocietyAccounting } from "@/lib/portfolio-data";

export function SocietyTable({ societies }: { societies: SocietyAccounting[] }) {
  return (
    <section id="societies">
      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Society</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Allocation</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Exposure</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Collected</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Upcoming</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Available</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Funding Req.</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Loan Status</th>
              </tr>
            </thead>
            <tbody>
              {societies.map(({ society, metrics }) => (
                <tr key={String(society.id)} className="border-t border-ink/10">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-ink">{textFrom(society, ["name"], "Unnamed society")}</p>
                    <p className="mt-1 inline-flex rounded bg-field px-2 py-1 text-[11px] font-semibold uppercase text-reed">{textFrom(society, ["partner_type", "type", "region"], "Lending society")}</p>
                  </td>
                  <td className="mono px-3 py-3 text-xs font-medium">{formatMoney(metrics.allocation)}</td>
                  <td className="mono px-3 py-3 text-xs">{formatMoney(metrics.activePrincipal)}</td>
                  <td className="px-3 py-3">
                    <p className="mono text-xs">{formatMoney(metrics.totalCollected)}</p>
                    <p className="text-xs text-reed">{formatPercent(metrics.collectionRate)} collected</p>
                  </td>
                  <td className="mono px-3 py-3 text-xs">{formatMoney(metrics.expectedUpcoming)}</td>
                  <td className="mono px-3 py-3 text-xs font-medium text-emerald-700">{formatMoney(metrics.availableCapacity)}</td>
                  <td className="mono px-3 py-3 text-xs font-medium text-ember">{formatMoney(metrics.fundingRequired)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={`${metrics.activeLoans} active`} />
                      <Badge label={`${metrics.settledLoans} settled`} />
                      <Badge label={`${metrics.overdueLoans} overdue`} tone={metrics.overdueLoans ? "alert" : "default"} />
                      <Badge label={`${metrics.approvedAwaitingLoans} awaiting`} tone={metrics.approvedAwaitingLoans ? "alert" : "default"} />
                    </div>
                  </td>
                </tr>
              ))}
              {societies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-reed">
                    No lending societies are visible for this portfolio holder.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "alert" }) {
  return <span className={`rounded px-2 py-1 text-xs font-semibold ${tone === "alert" ? "bg-ember/10 text-ember" : "bg-field text-ink"}`}>{label}</span>;
}
