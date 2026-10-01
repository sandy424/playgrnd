import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { categoryStyle } from "@/lib/categories";
import { flagEmoji, timeAgo } from "@/lib/format";
import type { Category, FeedPost, Lang } from "@/lib/types";

type LikeState = { liked: boolean; count: number };
type PostTranslation = { title: string; body: string };

type FeedPostListProps = {
  posts: FeedPost[];
  categories: Category[];
  lang: Lang;
  translationEnabled: boolean;
  translations: Record<string, PostTranslation>;
  getLikeState: (post: FeedPost) => LikeState;
  onLike: (post: FeedPost) => void;
};

export function FeedPostList({
  posts,
  categories,
  lang,
  translationEnabled,
  translations,
  getLikeState,
  onLike,
}: FeedPostListProps) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const category = categoryById.get(post.categoryId);
        const like = getLikeState(post);
        const translation = translations[`${post.id}:${lang}`];
        const postHref = translationEnabled ? `/posts/${post.id}?lang=${lang}` : `/posts/${post.id}`;

        return (
          <article key={post.id} className="rounded-[24px] bg-white p-5 shadow-sm hover:shadow-md md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#eeeaff] font-black text-[#6657ed]">
                {post.author.nickname[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">
                  {post.author.nickname} {flagEmoji(post.author.country)}
                </p>
                <p className="text-xs text-slate-400" suppressHydrationWarning>
                  {timeAgo(post.createdAt, lang)}
                </p>
              </div>
              {category && (
                <span
                  className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold text-white"
                  style={{ background: categoryStyle(category.slug).color }}
                >
                  {lang === "ko" ? category.name_ko : category.name_en}
                </span>
              )}
            </div>
            <h3 className="text-[19px] font-black leading-7">
              <Link href={postHref} className="hover:text-[#6657ed]">{translation?.title ?? post.title}</Link>
            </h3>
            <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-500">
              {translation?.body ?? post.body}
            </p>
            <div className="mt-5 flex gap-5 text-sm font-bold text-slate-500">
              <button
                onClick={() => onLike(post)}
                aria-pressed={like.liked}
                className={`flex items-center gap-1.5 ${like.liked ? "text-[#ff5f71]" : ""}`}
              >
                <Heart size={18} fill={like.liked ? "currentColor" : "none"} />
                {like.count}
              </button>
              <Link href={postHref} className="flex items-center gap-1.5 hover:text-[#6657ed]">
                <MessageCircle size={18} />
                {post.commentCount}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}