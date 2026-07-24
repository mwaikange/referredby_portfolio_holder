import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AnyRow } from "@/lib/finance";

export type HolderResolution = {
  holder: AnyRow | null;
  role?: string;
  error?: string;
};

export async function resolvePortfolioHolder(supabase: SupabaseClient, user: User): Promise<HolderResolution> {
  const joinResult = await supabase
    .from("portfolio_holder_users")
    .select("role, portfolio_holder_id, portfolio_holders(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (joinResult.data?.portfolio_holders) {
    const holder = Array.isArray(joinResult.data.portfolio_holders)
      ? joinResult.data.portfolio_holders[0]
      : joinResult.data.portfolio_holders;
    return { holder: holder as AnyRow, role: String(joinResult.data.role || "viewer") };
  }

  const authUserResult = await supabase.from("portfolio_holders").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (authUserResult.data) return { holder: authUserResult.data };

  const userIdResult = await supabase.from("portfolio_holders").select("*").eq("user_id", user.id).maybeSingle();
  if (userIdResult.data) return { holder: userIdResult.data };

  if (user.email) {
    const emailResult = await supabase
      .from("portfolio_holders")
      .select("*")
      .or(`contact_email.eq.${user.email},company_contact_email.eq.${user.email}`)
      .maybeSingle();
    if (emailResult.data) return { holder: emailResult.data };
  }

  return {
    holder: null,
    error:
      "No portfolio holder is linked to this login yet. Add this user to portfolio_holder_users, set portfolio_holders.auth_user_id, or match their contact email.",
  };
}
