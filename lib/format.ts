import type { Lang } from "./types.ts";

// "18분 전" / "18 minutes ago" 형태로 변환
export function timeAgo(iso: string, lang: Lang): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000); // 과거면 음수
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

  if (abs < 60) return lang === "ko" ? "방금 전" : "just now";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  return new Date(iso).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US");
}

// "KR" -> 🇰🇷 (국가 코드가 없거나 이상하면 빈 문자열)
export function flagEmoji(country?: string | null): string {
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return "";
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

// 닉네임 뒤에 붙은 "_숫자" 같은 접미사를 떼고 보여줍니다.
export function displayName(nickname?: string | null): string {
  return (nickname ?? "user").split("_")[0] || "user";
}

export function detectLang(text: string): Lang {
  return /[가-힣]/.test(text) ? "ko" : "en";
}