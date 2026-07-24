import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone?: "default" | "alert" | "good";
};

export function StatCard({ title, value, caption, icon: Icon, tone = "default" }: StatCardProps) {
  const toneClass =
    tone === "alert"
      ? "bg-[var(--red-100)] text-[var(--red-700)]"
      : tone === "good"
        ? "bg-[var(--green-100)] text-[var(--green-700)]"
        : "bg-[var(--teal-50)] text-[var(--teal-700)]";

  return (
    <section className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--card)] px-[18px] py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg ${toneClass}`}>
            <Icon className="h-[15px] w-[15px]" />
          </div>
          <p className="text-[12.5px] font-semibold text-[var(--ink-soft)]">{title}</p>
        </div>
      </div>
      <p className="mono break-words text-[22px] font-bold leading-tight text-[var(--ink)]">{value}</p>
      <p className="min-h-4 text-xs text-[var(--ink-soft)]">{caption}</p>
    </section>
  );
}
