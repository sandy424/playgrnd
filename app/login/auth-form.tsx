"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

const COUNTRIES: [string, string][] = [
  ["KR", "🇰🇷 대한민국"], ["US", "🇺🇸 United States"], ["JP", "🇯🇵 日本"], ["CN", "🇨🇳 中国"],
  ["TW", "🇹🇼 台灣"], ["SG", "🇸🇬 Singapore"], ["VN", "🇻🇳 Việt Nam"], ["TH", "🇹🇭 ไทย"],
  ["ID", "🇮🇩 Indonesia"], ["PH", "🇵🇭 Philippines"], ["IN", "🇮🇳 India"], ["GB", "🇬🇧 United Kingdom"],
  ["DE", "🇩🇪 Deutschland"], ["FR", "🇫🇷 France"], ["CA", "🇨🇦 Canada"], ["AU", "🇦🇺 Australia"],
  ["BR", "🇧🇷 Brasil"],
];

const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#6657ed]";
const label = "mb-1 block text-xs font-bold text-slate-600";

export default function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, {});
  const state = mode === "login" ? loginState : signupState;

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-indigo-100">
      <a href="/" className="text-sm font-bold text-[#6657ed]">← Playgrnd</a>
      <h1 className="mt-3 text-2xl font-black">{mode === "login" ? "로그인 / Log in" : "회원가입 / Sign up"}</h1>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-bold">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`h-9 rounded-lg ${mode === m ? "bg-white text-[#6657ed] shadow-sm" : "text-slate-500"}`}>
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="mt-5 space-y-4">
          <div><label className={label} htmlFor="email">이메일 / Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={input} /></div>
          <div><label className={label} htmlFor="password">비밀번호 / Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={input} /></div>
          <button disabled={loginPending} className="h-11 w-full rounded-xl bg-[#6657ed] font-extrabold text-white disabled:opacity-60">
            {loginPending ? "로그인 중..." : "로그인"}
          </button>
        </form>
      ) : (
        <form action={signupAction} className="mt-5 space-y-4">
          <div><label className={label} htmlFor="s-email">이메일 / Email</label>
            <input id="s-email" name="email" type="email" required autoComplete="email" className={input} /></div>
          <div><label className={label} htmlFor="s-password">비밀번호 (8자 이상) / Password</label>
            <input id="s-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} /></div>
          <div><label className={label} htmlFor="nickname">닉네임 (2~20자) / Nickname</label>
            <input id="nickname" name="nickname" required minLength={2} maxLength={20} className={input} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label} htmlFor="country">국가 / Country</label>
              <select id="country" name="country" defaultValue="" className={input}>
                <option value="">선택 안 함</option>
                {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select></div>
            <div><label className={label} htmlFor="preferred_lang">언어 / Language</label>
              <select id="preferred_lang" name="preferred_lang" defaultValue="ko" className={input}>
                <option value="ko">한국어</option><option value="en">English</option>
              </select></div>
          </div>
          <button disabled={signupPending} className="h-11 w-full rounded-xl bg-[#6657ed] font-extrabold text-white disabled:opacity-60">
            {signupPending ? "가입 중..." : "가입하기"}
          </button>
        </form>
      )}

      {(state.error || initialError) && mode === "login" && !state.info && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{state.error ?? initialError}</p>
      )}
      {state.error && mode === "signup" && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{state.error}</p>
      )}
      {state.info && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{state.info}</p>
      )}
    </div>
  );
}
