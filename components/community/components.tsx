"use client";

import { useActionState, useEffect } from "react";
import { CalendarDays, Star } from "lucide-react";
import { createPost, type PostState } from "@/app/actions";
import { flagEmoji, timeAgo } from "@/lib/format";
import type { Category, EventAnnouncement, Lang, RankRow } from "@/lib/types";

export function EventCard({ event, lang, label, fullWidth = false }: {
  event: EventAnnouncement;
  lang: Lang;
  label: string;
  fullWidth?: boolean;
}) {
  return (
    <article className={`snap-start rounded-2xl border border-slate-200/80 bg-white p-5 ${fullWidth ? "w-full" : "w-[min(82vw,300px)] shrink-0"}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <CalendarDays size={15} />
        <time dateTime={event.createdAt} suppressHydrationWarning>{timeAgo(event.createdAt, lang)}</time>
      </div>
      <h3 className="mt-3 line-clamp-1 text-base font-black">{event.title}</h3>
      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-500">{event.description}</p>
      {event.startsAt && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-bold text-[#6657ed]">
          {label}: {new Date(event.startsAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US")}
        </p>
      )}
    </article>
  );
}

export function WriteForm({ lang, categories, onDone }: { lang: Lang; categories: Category[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<PostState, FormData>(createPost, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const field = "w-full rounded-2xl border px-4 outline-none focus:border-[#6657ed]";
  return (
    <form action={action} className="mt-2 flex flex-col gap-3">
      <select name="category_id" required defaultValue="" className={`${field} h-12 bg-white`}>
        <option value="" disabled>{lang === "ko" ? "카테고리 선택" : "Choose a category"}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{lang === "ko" ? c.name_ko : c.name_en}</option>
        ))}
      </select>
      <input name="title" required minLength={2} maxLength={100} placeholder={lang === "ko" ? "제목을 입력하세요" : "Post title"} className={`${field} h-12`} />
      <textarea name="body" required placeholder={lang === "ko" ? "어떤 것을 만들었나요?" : "What did you make?"} className={`${field} min-h-32 resize-none py-3`} />
      {state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{state.error}</p>}
      <button disabled={pending} className="h-12 rounded-2xl bg-[#6657ed] font-extrabold text-white disabled:opacity-60">
        {pending ? (lang === "ko" ? "게시 중..." : "Publishing...") : lang === "ko" ? "게시하기" : "Publish"}
      </button>
    </form>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold ${active ? "bg-[#6657ed] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

export function ComingSoon({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <section>
      <p className="text-sm font-bold text-[#6657ed]">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-black">{title}</h1>
      <div className="mt-6 rounded-[26px] bg-white p-10 text-center text-slate-500 shadow-sm">{note}</div>
    </section>
  );
}

export function Ranking({ lang, rows }: { lang: Lang; rows: RankRow[] }) {
  return (
    <section>
      <p className="text-sm font-bold text-[#6657ed]">HALL OF MAKERS</p>
      <h1 className="mt-1 text-3xl font-black">{lang === "ko" ? "커뮤니티 TOP 10" : "Community Top 10"}</h1>
      <div className="mt-6 overflow-hidden rounded-[26px] bg-white">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {lang === "ko" ? "아직 랭킹이 없어요. 활동하면 포인트가 쌓여요." : "No rankings yet. Earn points by being active."}
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={`${r.nickname}-${i}`} className="grid grid-cols-[60px_1fr_auto] items-center border-b px-6 py-4 last:border-0">
              <b>{i + 1}</b>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-indigo-50 font-black text-[#6657ed]">
                  {r.nickname[0]?.toUpperCase()}
                </span>
                <b>{r.nickname} {flagEmoji(r.country)}</b>
                {i < 3 && <Star size={15} className="text-amber-500" fill="currentColor" />}
              </div>
              <b className="text-sm text-[#6657ed]">{r.totalPoints.toLocaleString()} P</b>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function PlaygrndMark() {
  return (
    <svg className="size-11 shrink-0 drop-shadow-[0_8px_12px_rgba(102,87,237,.28)]" viewBox="0 0 48 48" role="img" aria-label="Playgrnd logo">
      <defs>
        <linearGradient id="playgrnd-gradient" x1="5" y1="4" x2="43" y2="44">
          <stop stopColor="#8174ff" />
          <stop offset="1" stopColor="#5141dc" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="15" fill="url(#playgrnd-gradient)" />
      <path d="M19 14.8c0-1.6 1.8-2.5 3.1-1.6l15 10.1c1.2.8 1.2 2.6 0 3.4l-15 10.1c-1.3.9-3.1 0-3.1-1.6V14.8Z" fill="white" />
      <circle cx="14" cy="14" r="3.2" fill="#53e5bd" />
      <circle cx="37" cy="12" r="2" fill="#ffcd65" />
      <path d="M10 34c4 4.3 8.3 6.4 13 6.4" fill="none" stroke="#bdb7ff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}