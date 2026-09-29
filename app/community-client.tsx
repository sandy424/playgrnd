"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, CalendarDays, ChevronRight, Compass, Crown, Heart, Home, Languages, MessageCircle, Plus, Search, Star, TestTube2, Trophy, Zap,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createPost, setLike, type PostState } from "./actions";
import { categoryStyle } from "@/lib/categories";
import { flagEmoji, timeAgo } from "@/lib/format";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, EventAnnouncement, FeedPost, Lang, RankRow, SignedInUser } from "@/lib/types";

type Section = "home" | "community" | "qa" | "events" | "ranking";
type Sort = "latest" | "popular";
type LikeState = { liked: boolean; count: number };

const TEXT = {
  ko: {
    search: "게임, AI 작품, 개발자를 검색해보세요",
    write: "글쓰기",
    hello: "안녕하세요, 플레이메이커님 👋",
    sub: "오늘도 멋진 게임과 AI 콘텐츠를 함께 만들어봐요.",
    start: "로그인하고 시작하기",
    feed: "커뮤니티 피드",
    points: "내 포인트",
    events: "이벤트 공지",
    more: "+ 더보기",
    live: "실시간",
    noEvents: "등록된 이벤트 공지가 없어요.",
    eventDate: "이벤트 날짜",
    all: "전체",
    latest: "최신순",
    popular: "인기순",
    emptyTitle: "아직 게시글이 없어요",
    emptyUser: "첫 번째 이야기를 공유해 보세요.",
    emptyGuest: "로그인하고 첫 번째 이야기를 공유해 보세요.",
    soon: "준비 중이에요",
  },
  en: {
    search: "Search games, AI works, and creators",
    write: "Create",
    hello: "Hello, Playmaker 👋",
    sub: "Let’s build remarkable games and AI content together.",
    start: "Log in to get started",
    feed: "Community feed",
    points: "My points",
    events: "Event announcements",
    more: "+ More",
    live: "LIVE",
    noEvents: "No event announcements yet.",
    eventDate: "Event date",
    all: "All",
    latest: "Latest",
    popular: "Popular",
    emptyTitle: "No posts yet",
    emptyUser: "Be the first to share something.",
    emptyGuest: "Log in and be the first to share something.",
    soon: "Coming soon",
  },
} as const;

const NAV = [
  { key: "home", icon: Home, ko: "홈", en: "Home" },
  { key: "community", icon: Compass, ko: "커뮤니티", en: "Community" },
  { key: "qa", icon: TestTube2, ko: "게임 테스트", en: "Game QA" },
  { key: "events", icon: Trophy, ko: "이벤트", en: "Events" },
  { key: "ranking", icon: Crown, ko: "랭킹", en: "Ranking" },
] as const;

type Props = {
  user: SignedInUser;
  signInPath: string;
  authControl: React.ReactNode;
  categories: Category[];
  posts: FeedPost[];
  ranking: RankRow[];
  events: EventAnnouncement[];
};

export default function CommunityClient({ user, signInPath, authControl, categories, posts, ranking, events: initialEvents }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ko");
  const [section, setSection] = useState<Section>("home");
  const [categoryId, setCategoryId] = useState<number | null>(null); // null = 전체
  const [sort, setSort] = useState<Sort>("latest");
  const [writeOpen, setWriteOpen] = useState(false);
  const [likeOverrides, setLikeOverrides] = useState<Record<string, LikeState>>({});
  const [events, setEvents] = useState(initialEvents);
  const [, startTransition] = useTransition();
  const t = TEXT[lang];

  const catName = (c: Category) => (lang === "ko" ? c.name_ko : c.name_en);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("event-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, async () => {
        const { data } = await supabase
          .from("events")
          .select("id, title, description, starts_at, created_at")
          .order("created_at", { ascending: false });
        if (data) {
          setEvents(data.map((event) => ({
            id: String(event.id),
            title: event.title,
            description: event.description,
            startsAt: event.starts_at,
            createdAt: event.created_at,
          })));
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const shown = useMemo(() => {
    const filtered = categoryId === null ? posts : posts.filter((p) => p.categoryId === categoryId);
    if (sort === "latest") return filtered; // 서버에서 이미 최신순으로 받아옴
    return [...filtered].sort(
      (a, b) =>
        b.likeCount - a.likeCount ||
        b.commentCount - a.commentCount ||
        b.createdAt.localeCompare(a.createdAt)
    );
  }, [posts, categoryId, sort]);

  const likeStateOf = (p: FeedPost): LikeState =>
    likeOverrides[p.id] ?? { liked: p.liked, count: p.likeCount };

  // 좋아요: 화면을 먼저 바꾸고(낙관적 업데이트), 서버 저장에 실패하면 되돌립니다.
  function toggleLike(post: FeedPost) {
    if (!user) {
      router.push(signInPath);
      return;
    }
    const current = likeStateOf(post);
    const next = { liked: !current.liked, count: current.count + (current.liked ? -1 : 1) };
    setLikeOverrides((prev) => ({ ...prev, [post.id]: next }));
    startTransition(async () => {
      const res = await setLike(post.id, next.liked);
      if (!res.ok) setLikeOverrides((prev) => ({ ...prev, [post.id]: current }));
    });
  }

  function pickCategory(id: number | null) {
    setCategoryId(id);
    setSection("community");
  }

  const openWrite = () => setWriteOpen(true);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#191f2c]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-5 px-4 md:px-7">
          <button onClick={() => setSection("home")} className="flex shrink-0 items-center gap-2.5" aria-label="Playgrnd home">
            <PlaygrndMark />
            <span className="hidden leading-none sm:block">
              <b className="block text-[21px] font-black tracking-[-.055em]">
                Playgrnd<span className="text-[#6657ed]">.</span>
              </b>
              <small className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                AI Game Creator Community
              </small>
            </span>
          </button>

          <label className="mx-auto hidden h-11 max-w-[520px] flex-1 items-center gap-2 rounded-2xl bg-[#f2f4f8] px-4 text-slate-500 lg:flex">
            <Search size={19} />
            <input aria-label={t.search} placeholder={t.search} className="w-full bg-transparent text-sm outline-none" />
          </label>

          <button
            onClick={() => setLang(lang === "ko" ? "en" : "ko")}
            className="ml-auto flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold hover:bg-slate-100 lg:ml-0"
          >
            <Languages size={18} />
            {lang === "ko" ? "EN" : "한국어"}
          </button>
          <button className="grid size-10 place-items-center rounded-xl hover:bg-slate-100" aria-label="알림">
            <Bell size={20} />
          </button>

          {user && (
            <button
              onClick={openWrite}
              className="hidden h-11 items-center gap-2 rounded-2xl bg-[#6657ed] px-5 text-sm font-extrabold text-white shadow-md shadow-indigo-200 sm:flex"
            >
              <Plus size={18} />
              {t.write}
            </button>
          )}
          {authControl}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 md:px-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* 왼쪽 메뉴 */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {NAV.map(({ key, icon: Icon, ko, en }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-[15px] font-bold ${
                  section === key ? "bg-white text-[#6657ed] shadow-sm" : "text-slate-600 hover:bg-white/70"
                }`}
              >
                <Icon size={20} />
                {lang === "ko" ? ko : en}
              </button>
            ))}
            <div className="my-5 border-t" />
            <p className="px-4 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Categories</p>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCategory(c.id)}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-white"
              >
                <span className="size-2 rounded-full" style={{ background: categoryStyle(c.slug).color }} />
                {catName(c)}
              </button>
            ))}
          </nav>
        </aside>

        {/* 가운데 본문 */}
        <main className="min-w-0">
          {section === "home" && (
            <>
              <section className="rounded-[28px] bg-[#17152e] p-7 text-white shadow-xl shadow-indigo-100 md:p-9">
                <h1 className="text-3xl font-black tracking-[-.04em] md:text-[40px]">
                  {user ? (lang === "ko" ? `${user.displayName}님, 반가워요 👋` : `Welcome, ${user.displayName} 👋`) : t.hello}
                </h1>
                <p className="mt-3 text-base text-slate-300">{t.sub}</p>
                {user ? (
                  <button
                    onClick={openWrite}
                    className="mt-7 flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-[#302a78]"
                  >
                    <Plus size={18} />
                    {t.write}
                  </button>
                ) : (
                  <a
                    href={signInPath}
                    className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-[#302a78]"
                  >
                    {t.start}
                  </a>
                )}
              </section>

              <section className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-black">{t.events}</h2>
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {t.live}
                    </span>
                  </div>
                  <button
                    onClick={() => setSection("events")}
                    className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#6657ed]"
                  >
                    {t.more}
                    <ChevronRight size={16} />
                  </button>
                </div>
                {events.length === 0 ? (
                  <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-500">
                    {t.noEvents}
                  </div>
                ) : (
                  <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} lang={lang} label={t.eventDate} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {(section === "home" || section === "community") && (
            <section className={section === "home" ? "mt-9" : ""}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#6657ed]">{section === "community" ? "EXPLORE" : "TRENDING NOW"}</p>
                  <h2 className="mt-1 text-2xl font-black">{t.feed}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl bg-white p-1 text-sm font-bold">
                    {(["latest", "popular"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSort(s)}
                        className={`h-8 rounded-lg px-3 ${sort === s ? "bg-[#eeeaff] text-[#6657ed]" : "text-slate-500"}`}
                      >
                        {t[s]}
                      </button>
                    ))}
                  </div>
                  {user && (
                    <button
                      onClick={openWrite}
                      aria-label={t.write}
                      className="grid size-10 place-items-center rounded-xl bg-[#6657ed] text-white sm:hidden"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>{t.all}</Chip>
                {categories.map((c) => (
                  <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                    {catName(c)}
                  </Chip>
                ))}
              </div>

              {shown.length === 0 ? (
                <div className="rounded-[24px] bg-white p-10 text-center shadow-sm">
                  <p className="text-lg font-black">{t.emptyTitle}</p>
                  <p className="mt-2 text-sm text-slate-500">{user ? t.emptyUser : t.emptyGuest}</p>
                  {user ? (
                    <button onClick={openWrite} className="mt-5 h-11 rounded-2xl bg-[#6657ed] px-6 text-sm font-extrabold text-white">
                      {t.write}
                    </button>
                  ) : (
                    <a href={signInPath} className="mt-5 inline-flex h-11 items-center rounded-2xl bg-[#6657ed] px-6 text-sm font-extrabold text-white">
                      {t.start}
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {shown.map((p) => {
                    const cat = categoryById.get(p.categoryId);
                    const like = likeStateOf(p);
                    return (
                      <article key={p.id} className="rounded-[24px] bg-white p-5 shadow-sm hover:shadow-md md:p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-full bg-[#eeeaff] font-black text-[#6657ed]">
                            {p.author.nickname[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold">
                              {p.author.nickname} {flagEmoji(p.author.country)}
                            </p>
                            <p className="text-xs text-slate-400" suppressHydrationWarning>
                              {timeAgo(p.createdAt, lang)}
                            </p>
                          </div>
                          {cat && (
                            <span
                              className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold text-white"
                              style={{ background: categoryStyle(cat.slug).color }}
                            >
                              {catName(cat)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-[19px] font-black leading-7">
                          <Link href={`/posts/${p.id}`} className="hover:text-[#6657ed]">{p.title}</Link>
                        </h3>
                        <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-500">{p.body}</p>
                        <div className="mt-5 flex gap-5 text-sm font-bold text-slate-500">
                          <button
                            onClick={() => toggleLike(p)}
                            aria-pressed={like.liked}
                            className={`flex items-center gap-1.5 ${like.liked ? "text-[#ff5f71]" : ""}`}
                          >
                            <Heart size={18} fill={like.liked ? "currentColor" : "none"} />
                            {like.count}
                          </button>
                          <Link href={`/posts/${p.id}`} className="flex items-center gap-1.5 hover:text-[#6657ed]">
                            <MessageCircle size={18} />
                            {p.commentCount}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {section === "qa" && (
            <ComingSoon eyebrow="GAME QA LAB" title={lang === "ko" ? "게임 테스트" : "Game QA"} note={t.soon} />
          )}
          {section === "events" && (
            <section>
              <p className="text-sm font-bold text-[#6657ed]">GLOBAL PROGRAMS</p>
              <h1 className="mt-1 text-3xl font-black">{t.events}</h1>
              {events.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-500">{t.noEvents}</div>
              ) : (
                <div className="mt-6 space-y-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} lang={lang} label={t.eventDate} fullWidth />
                  ))}
                </div>
              )}
            </section>
          )}
          {section === "ranking" && <Ranking lang={lang} rows={ranking} />}
        </main>

        {/* 오른쪽 위젯 */}
        {user && (
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-5">
              <section className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <h3 className="font-extrabold">{t.points}</h3>
                  <Zap size={18} className="text-amber-500" fill="currentColor" />
                </div>
                <p className="mt-4 text-3xl font-black">
                  {user.points.toLocaleString()} <span className="text-base text-[#6657ed]">P</span>
                </p>
              </section>
            </div>
          </aside>
        )}
      </div>

      {/* 모바일 하단 메뉴 */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-[22px] bg-white/95 shadow-2xl lg:hidden">
        {NAV.map(({ key, icon: Icon, ko, en }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold ${section === key ? "text-[#6657ed]" : "text-slate-400"}`}
          >
            <Icon size={20} />
            {lang === "ko" ? ko : en}
          </button>
        ))}
      </nav>

      {user && (
        <Dialog open={writeOpen} onOpenChange={setWriteOpen}>
          <DialogContent className="rounded-[26px] border-0 sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">{lang === "ko" ? "새 이야기 공유하기" : "Share your work"}</DialogTitle>
              <DialogDescription>
                {lang === "ko"
                  ? "개발 과정, AI 실험, 완성 작품을 전 세계 메이커에게 보여주세요."
                  : "Show your process and work to makers worldwide."}
              </DialogDescription>
            </DialogHeader>
            <WriteForm lang={lang} categories={categories} onDone={() => { setWriteOpen(false); setSection("community"); setCategoryId(null); setSort("latest"); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EventCard({ event, lang, label, fullWidth = false }: {
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

// 글쓰기 폼: Dialog가 닫히면 함께 사라지므로 열 때마다 입력값과 에러가 초기화됩니다.
function WriteForm({ lang, categories, onDone }: { lang: Lang; categories: Category[]; onDone: () => void }) {
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold ${active ? "bg-[#6657ed] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function ComingSoon({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <section>
      <p className="text-sm font-bold text-[#6657ed]">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-black">{title}</h1>
      <div className="mt-6 rounded-[26px] bg-white p-10 text-center text-slate-500 shadow-sm">{note}</div>
    </section>
  );
}

function Ranking({ lang, rows }: { lang: Lang; rows: RankRow[] }) {
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

function PlaygrndMark() {
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
