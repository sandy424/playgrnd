import { ChevronRight, Plus } from "lucide-react";
import type { Category, EventAnnouncement, FeedPost, Lang, RankRow, SignedInUser } from "@/lib/types";
import { Chip, ComingSoon, EventCard, Ranking } from "@/components/community/components";
import { FeedPostList } from "@/components/community/feed-post-list";

type Section = "home" | "community" | "qa" | "events" | "ranking";
type Sort = "latest" | "popular";
type LikeState = { liked: boolean; count: number };
type PostTranslation = { title: string; body: string };

type Copy = {
  hello: string;
  sub: string;
  write: string;
  start: string;
  feed: string;
  events: string;
  more: string;
  live: string;
  noEvents: string;
  eventDate: string;
  all: string;
  latest: string;
  popular: string;
  emptyTitle: string;
  emptyUser: string;
  emptyGuest: string;
  soon: string;
};

type CommunityContentProps = {
  section: Section;
  lang: Lang;
  user: SignedInUser;
  signInPath: string;
  categories: Category[];
  shown: FeedPost[];
  ranking: RankRow[];
  events: EventAnnouncement[];
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  translationEnabled: boolean;
  translations: Record<string, PostTranslation>;
  getLikeState: (post: FeedPost) => LikeState;
  onLike: (post: FeedPost) => void;
  onWrite: () => void;
  onSectionChange: (section: Section) => void;
  copy: Copy;
};

export function CommunityContent({
  section,
  lang,
  user,
  signInPath,
  categories,
  shown,
  ranking,
  events,
  categoryId,
  onCategoryChange,
  sort,
  onSortChange,
  translationEnabled,
  translations,
  getLikeState,
  onLike,
  onWrite,
  onSectionChange,
  copy,
}: CommunityContentProps) {
  const categoryName = (category: Category) => lang === "ko" ? category.name_ko : category.name_en;

  return (
    <main className="min-w-0">
      {section === "home" && (
        <>
          <section className="rounded-[28px] bg-[#17152e] p-7 text-white shadow-xl shadow-indigo-100 md:p-9">
            <h1 className="text-3xl font-black tracking-[-.04em] md:text-[40px]">
              {user ? (lang === "ko" ? `${user.displayName}님, 반가워요 👋` : `Welcome, ${user.displayName} 👋`) : copy.hello}
            </h1>
            <p className="mt-3 text-base text-slate-300">{copy.sub}</p>
            {user ? (
              <button onClick={onWrite} className="mt-7 flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-[#302a78]">
                <Plus size={18} />
                {copy.write}
              </button>
            ) : (
              <a href={signInPath} className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-[#302a78]">
                {copy.start}
              </a>
            )}
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black">{copy.events}</h2>
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {copy.live}
                </span>
              </div>
              <button onClick={() => onSectionChange("events")} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#6657ed]">
                {copy.more}
                <ChevronRight size={16} />
              </button>
            </div>
            {events.length === 0 ? (
              <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-500">{copy.noEvents}</div>
            ) : (
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                {events.map((event) => <EventCard key={event.id} event={event} lang={lang} label={copy.eventDate} />)}
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
              <h2 className="mt-1 text-2xl font-black">{copy.feed}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-white p-1 text-sm font-bold">
                {(["latest", "popular"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => onSortChange(value)}
                    className={`h-8 rounded-lg px-3 ${sort === value ? "bg-[#eeeaff] text-[#6657ed]" : "text-slate-500"}`}
                  >
                    {copy[value]}
                  </button>
                ))}
              </div>
              {user && (
                <button onClick={onWrite} aria-label={copy.write} className="grid size-10 place-items-center rounded-xl bg-[#6657ed] text-white sm:hidden">
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            <Chip active={categoryId === null} onClick={() => onCategoryChange(null)}>{copy.all}</Chip>
            {categories.map((category) => (
              <Chip key={category.id} active={categoryId === category.id} onClick={() => onCategoryChange(category.id)}>
                {categoryName(category)}
              </Chip>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-[24px] bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-black">{copy.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{user ? copy.emptyUser : copy.emptyGuest}</p>
              {user ? (
                <button onClick={onWrite} className="mt-5 h-11 rounded-2xl bg-[#6657ed] px-6 text-sm font-extrabold text-white">{copy.write}</button>
              ) : (
                <a href={signInPath} className="mt-5 inline-flex h-11 items-center rounded-2xl bg-[#6657ed] px-6 text-sm font-extrabold text-white">{copy.start}</a>
              )}
            </div>
          ) : (
            <FeedPostList
              posts={shown}
              categories={categories}
              lang={lang}
              translationEnabled={translationEnabled}
              translations={translations}
              getLikeState={getLikeState}
              onLike={onLike}
            />
          )}
        </section>
      )}

      {section === "qa" && (
        <ComingSoon eyebrow="GAME QA LAB" title={lang === "ko" ? "게임 테스트" : "Game QA"} note={copy.soon} />
      )}
      {section === "events" && (
        <section>
          <p className="text-sm font-bold text-[#6657ed]">GLOBAL PROGRAMS</p>
          <h1 className="mt-1 text-3xl font-black">{copy.events}</h1>
          {events.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-500">{copy.noEvents}</div>
          ) : (
            <div className="mt-6 space-y-3">
              {events.map((event) => <EventCard key={event.id} event={event} lang={lang} label={copy.eventDate} fullWidth />)}
            </div>
          )}
        </section>
      )}
      {section === "ranking" && <Ranking lang={lang} rows={ranking} />}
    </main>
  );
}