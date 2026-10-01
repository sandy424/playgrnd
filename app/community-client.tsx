"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLike, translatePost } from "./actions";
import { detectLang } from "@/lib/format";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, EventAnnouncement, FeedPost, Lang, RankRow, SignedInUser } from "@/lib/types";
import { CommunityContent } from "@/components/community/community-content";
import { CommunityLayout } from "@/components/community/community-layout";


type Section = "home" | "community" | "qa" | "events" | "ranking";
type Sort = "latest" | "popular";
type LikeState = { liked: boolean; count: number };
type PostTranslation = { title: string; body: string };

const LANGUAGE_STORAGE_KEY = "playgrnd-language";
const TRANSLATION_STORAGE_KEY = "playgrnd-post-translations";

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
    translating: "번역 중...",
    translateError: "일부 게시물을 번역하지 못했어요.",
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
    translating: "Translating posts...",
    translateError: "Some posts could not be translated.",
  },
} as const;

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
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [section, setSection] = useState<Section>("home");
  const [categoryId, setCategoryId] = useState<number | null>(null); // null = 전체
  const [sort, setSort] = useState<Sort>("latest");
  const [writeOpen, setWriteOpen] = useState(false);
  const [likeOverrides, setLikeOverrides] = useState<Record<string, LikeState>>({});
  const [translations, setTranslations] = useState<Record<string, PostTranslation>>({});
  const [pendingTranslations, setPendingTranslations] = useState(0);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const requestedTranslations = useRef(new Set<string>());
  const [events, setEvents] = useState(initialEvents);
  const [, startTransition] = useTransition();
  const t = TEXT[lang];

  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang === "ko" || savedLang === "en") {
        setLang(savedLang);
        setTranslationEnabled(true);
      }

      const savedTranslations = window.localStorage.getItem(TRANSLATION_STORAGE_KEY);
      if (savedTranslations) {
        const parsed = JSON.parse(savedTranslations) as Record<string, PostTranslation>;
        if (parsed && typeof parsed === "object") setTranslations(parsed);
      }
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }, []);

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

  useEffect(() => {
    if (!translationEnabled) return;

    const targets = shown.filter((post) => {
      const key = `${post.id}:${lang}`;
      return detectLang(`${post.title}\n${post.body}`) !== lang
        && !translations[key]
        && !requestedTranslations.current.has(key);
    });
    if (targets.length === 0) return;

    targets.forEach((post) => requestedTranslations.current.add(`${post.id}:${lang}`));
    setTranslationError(null);
    setPendingTranslations((count) => count + targets.length);

    (async () => {
      for (const post of targets) {
        const key = `${post.id}:${lang}`;
        const res = await translatePost(post.id, lang);
        if (res.ok) {
          const translated = { title: res.title, body: res.body };
          setTranslations((prev) => ({ ...prev, [key]: translated }));
          try {
            const saved = JSON.parse(window.localStorage.getItem(TRANSLATION_STORAGE_KEY) ?? "{}") as Record<string, PostTranslation>;
            const entries = Object.entries({ ...saved, [key]: translated }).slice(-100);
            window.localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
          } catch {
            // Translation still works when local storage is full or unavailable.
          }
        } else {
          setTranslationError(res.error);
        }
        setPendingTranslations((count) => Math.max(0, count - 1));
      }
    })();
  }, [lang, shown, translations, translationEnabled]);

  function pickCategory(id: number | null) {
    setCategoryId(id);
    setSection("community");
  }

  const openWrite = () => setWriteOpen(true);
  const toggleLanguage = () => {
    const nextLang = lang === "ko" ? "en" : "ko";
    setTranslationEnabled(true);
    setLang(nextLang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    } catch {
      // The current page can still switch languages without storage.
    }
  };
  const finishWrite = () => {
    setWriteOpen(false);
    setSection("community");
    setCategoryId(null);
    setSort("latest");
  };

  return (
    <CommunityLayout
      user={user}
      signInPath={signInPath}
      authControl={authControl}
      categories={categories}
      lang={lang}
      section={section}
      onSectionChange={setSection}
      onPickCategory={pickCategory}
      onToggleLanguage={toggleLanguage}
      translationStatus={pendingTranslations > 0 ? t.translating : translationError}
      writeOpen={writeOpen}
      onWriteOpenChange={setWriteOpen}
      onWrite={openWrite}
      onWriteDone={finishWrite}
      copy={t}
    >
      <CommunityContent
        section={section}
        lang={lang}
        user={user}
        signInPath={signInPath}
        categories={categories}
        shown={shown}
        ranking={ranking}
        events={events}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        sort={sort}
        onSortChange={setSort}
        translationEnabled={translationEnabled}
        translations={translations}
        getLikeState={likeStateOf}
        onLike={toggleLike}
        onWrite={openWrite}
        onSectionChange={setSection}
        copy={t}
      />
    </CommunityLayout>
  );
}

