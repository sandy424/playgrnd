import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "./auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <AuthForm initialError={error ? "인증 링크가 만료되었거나 올바르지 않아요. 다시 시도해 주세요." : undefined} />
    </main>
  );
}
