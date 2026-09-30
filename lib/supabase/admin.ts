import { createClient } from "@supabase/supabase-js";

// 서버 전용! RLS(보안 규칙)를 무시하는 관리자 클라이언트예요.
// "use client" 파일에서는 절대 import하지 마세요.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // .env.local에 넣은 이름과 똑같이
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}