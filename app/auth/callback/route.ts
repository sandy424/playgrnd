import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 이메일 인증 링크 클릭 시 도착하는 곳: code를 세션으로 교환
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
