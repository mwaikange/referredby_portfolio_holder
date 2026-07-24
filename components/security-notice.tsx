import { ShieldAlert } from "lucide-react";

export function SecurityNotice({ unsafeDevFilter, error }: { unsafeDevFilter: boolean; error?: string }) {
  return (
    <aside className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Production access guardrails required</p>
          <p className="mt-1 text-sm">
            This portal uses the anon key only. {unsafeDevFilter ? "A development portfolio holder id is filtering the UI." : "The UI expects Supabase RLS to return only the signed-in holder's rows."} Before launch, enforce RLS or secure API routes so portfolio holders cannot query other holders.
          </p>
          {error ? <p className="mt-2 text-sm font-medium">Supabase notice: {error}</p> : null}
        </div>
      </div>
    </aside>
  );
}
