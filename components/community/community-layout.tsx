"use client";

import {
  Bell, Compass, Crown, Home, Languages, Plus, Search, TestTube2, Trophy, Zap,
} from "lucide-react";
import { categoryStyle } from "@/lib/categories";
import type { Category, Lang, SignedInUser } from "@/lib/types";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PlaygrndMark, WriteForm } from "@/components/community/components";

type Section = "home" | "community" | "qa" | "events" | "ranking";

const NAV = [
  { key: "home", icon: Home, ko: "홈", en: "Home" },
  { key: "community", icon: Compass, ko: "커뮤니티", en: "Community" },
  { key: "qa", icon: TestTube2, ko: "게임 테스트", en: "Game QA" },
  { key: "events", icon: Trophy, ko: "이벤트", en: "Events" },
  { key: "ranking", icon: Crown, ko: "랭킹", en: "Ranking" },
] as const;

type CommunityLayoutProps = {
  children: React.ReactNode;
  user: SignedInUser;
  signInPath: string;
  authControl: React.ReactNode;
  categories: Category[];
  lang: Lang;
  section: Section;
  onSectionChange: (section: Section) => void;
  onPickCategory: (id: number) => void;
  onToggleLanguage: () => void;
  translationStatus: string | null;
  writeOpen: boolean;
  onWriteOpenChange: (open: boolean) => void;
  onWrite: () => void;
  onWriteDone: () => void;
  copy: { search: string; write: string; points: string };
};

export function CommunityLayout({
  children,
  user,
  authControl,
  categories,
  lang,
  section,
  onSectionChange,
  onPickCategory,
  onToggleLanguage,
  translationStatus,
  writeOpen,
  onWriteOpenChange,
  onWrite,
  onWriteDone,
  copy,
}: CommunityLayoutProps) {
  const categoryName = (category: Category) => lang === "ko" ? category.name_ko : category.name_en;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#191f2c]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-5 px-4 md:px-7">
          <button onClick={() => onSectionChange("home")} className="flex shrink-0 items-center gap-2.5" aria-label="Playgrnd home">
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
            <input aria-label={copy.search} placeholder={copy.search} className="w-full bg-transparent text-sm outline-none" />
          </label>

          <button onClick={onToggleLanguage} className="ml-auto flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold hover:bg-slate-100 lg:ml-0">
            <Languages size={18} />
            {lang === "ko" ? "EN" : "한국어"}
          </button>
          {translationStatus && (
            <span aria-live="polite" className="hidden text-xs font-semibold text-slate-500 sm:block">{translationStatus}</span>
          )}
          <button className="grid size-10 place-items-center rounded-xl hover:bg-slate-100" aria-label="알림">
            <Bell size={20} />
          </button>
          {user && (
            <button onClick={onWrite} className="hidden h-11 items-center gap-2 rounded-2xl bg-[#6657ed] px-5 text-sm font-extrabold text-white shadow-md shadow-indigo-200 sm:flex">
              <Plus size={18} />
              {copy.write}
            </button>
          )}
          {authControl}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 md:px-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {NAV.map(({ key, icon: Icon, ko, en }) => (
              <button
                key={key}
                onClick={() => onSectionChange(key)}
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
            {categories.map((category) => (
              <button key={category.id} onClick={() => onPickCategory(category.id)} className="flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-white">
                <span className="size-2 rounded-full" style={{ background: categoryStyle(category.slug).color }} />
                {categoryName(category)}
              </button>
            ))}
          </nav>
        </aside>

        {children}

        {user && (
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-5">
              <section className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <h3 className="font-extrabold">{copy.points}</h3>
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

      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-[22px] bg-white/95 shadow-2xl lg:hidden">
        {NAV.map(({ key, icon: Icon, ko, en }) => (
          <button key={key} onClick={() => onSectionChange(key)} className={`flex flex-col items-center gap-1 text-[11px] font-bold ${section === key ? "text-[#6657ed]" : "text-slate-400"}`}>
            <Icon size={20} />
            {lang === "ko" ? ko : en}
          </button>
        ))}
      </nav>

      {user && (
        <Dialog open={writeOpen} onOpenChange={onWriteOpenChange}>
          <DialogContent className="rounded-[26px] border-0 sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">{lang === "ko" ? "새 이야기 공유하기" : "Share your work"}</DialogTitle>
              <DialogDescription>
                {lang === "ko"
                  ? "개발 과정, AI 실험, 완성 작품을 전 세계 메이커에게 보여주세요."
                  : "Show your process and work to makers worldwide."}
              </DialogDescription>
            </DialogHeader>
            <WriteForm lang={lang} categories={categories} onDone={onWriteDone} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}