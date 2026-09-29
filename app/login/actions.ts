"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendly(message: string, code?: string) {
  if (code === "over_email_send_rate_limit") return "인증 메일 발송 한도를 초과했어요. 잠시 후 다시 시도해 주세요.";
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (message.includes("Email not confirmed")) return "이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요.";
  return message;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL_RE.test(email) || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message, error.code) };

  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim().toUpperCase();
  const lang = formData.get("preferred_lang") === "en" ? "en" : "ko";

  if (!EMAIL_RE.test(email)) return { error: "올바른 이메일을 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 해요." };
  if (nickname.length < 2 || nickname.length > 20) return { error: "닉네임은 2~20자로 입력해 주세요." };

  const supabase = await createClient();

  // 닉네임 중복 확인 (profiles는 누구나 조회 가능)
  const { data: taken } = await supabase.from("profiles").select("id").eq("nickname", nickname).maybeSingle();
  if (taken) return { error: "이미 사용 중인 닉네임이에요." };

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname, country: country || null, preferred_lang: lang },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: friendly(error.message, error.code) };

  // 이메일 인증이 켜져 있을 때, 이미 가입된 이메일이면 identities가 비어 있음
  if (data.user && data.user.identities?.length === 0) return { error: "이미 가입된 이메일이에요." };

  if (data.session) redirect("/"); // 이메일 인증을 끈 경우 바로 로그인됨
  return { info: "가입 확인 메일을 보냈어요. 메일의 링크를 눌러 인증을 완료해 주세요." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
