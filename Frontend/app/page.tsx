import CommunityClient from "./community-client";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  let user: { displayName: string; email: string } | null = null;
  if (claims) {
    const email = String(claims.email ?? "");
    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", claims.sub).maybeSingle();
    const nickname = profile?.nickname ?? email.split("@")[0] ?? "user";
    user = { displayName: nickname.split("_")[0] || "user", email };
  }

  const signInPath = "/login";
  const authControl = user ? (
    <form action={signOut} className="hidden items-center gap-2 md:flex">
      <div className="max-w-40 text-right">
        <p className="truncate text-sm font-extrabold text-slate-800">{user.displayName}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <button title="로그아웃 / Log out" aria-label="로그아웃"
        className="flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#6657ed] px-3 text-xs font-bold text-white">
        로그아웃
      </button>
    </form>
  ) : (
    <a href={signInPath}
      className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold transition hover:border-[#6657ed] hover:text-[#6657ed] md:flex">
      로그인
    </a>
  );

  return <CommunityClient user={user} signInPath={signInPath} authControl={authControl} />;
}