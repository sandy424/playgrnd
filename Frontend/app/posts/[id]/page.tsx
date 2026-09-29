import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { categoryStyle } from "@/lib/categories";
import { displayName, flagEmoji, timeAgo } from "@/lib/format";
import LikeButton from "@/components/like-button";
import CommentForm from "@/components/comment-form";
import { deleteComment } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? null;

  // 숨김 처리된 글이나 잘못된 id는 조회 결과가 없어서 404가 됩니다.
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, category_id, title, body, like_count, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  const [categoryRes, commentsRes, likeRes] = await Promise.all([
    supabase.from("categories").select("slug, name_ko").eq("id", post.category_id).maybeSingle(),
    supabase
      .from("comments")
      .select("id, user_id, body, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    userId
      ? supabase.from("post_likes").select("post_id").eq("post_id", id).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const category = categoryRes.data;
  const comments = commentsRes.data ?? [];

  const authorIds = [...new Set([post.user_id, ...comments.map((c) => c.user_id)])];
  const { data: profiles } = await supabase.from("profiles").select("id, nickname, country").in("id", authorIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const postAuthor = profileById.get(post.user_id);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#191f2c]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm font-bold text-[#6657ed]">← Playgrnd</Link>

        <article className="mt-4 rounded-[24px] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#eeeaff] font-black text-[#6657ed]">
              {displayName(postAuthor?.nickname)[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {displayName(postAuthor?.nickname)} {flagEmoji(postAuthor?.country)}
              </p>
              <p className="text-xs text-slate-400">{timeAgo(post.created_at, "ko")}</p>
            </div>
            {category && (
              <span
                className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold text-white"
                style={{ background: categoryStyle(category.slug).color }}
              >
                {category.name_ko}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black leading-8">{post.title}</h1>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">{post.body}</p>

          <div className="mt-6 flex items-center gap-5 border-t pt-4">
            <LikeButton postId={post.id} initialLiked={!!likeRes.data} initialCount={post.like_count} signedIn={!!userId} />
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
              <MessageCircle size={18} />
              {comments.length}
            </span>
          </div>
        </article>

        <section className="mt-6 rounded-[24px] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-black">댓글 {comments.length}</h2>

          <div className="mt-4">
            {userId ? (
              <CommentForm postId={post.id} />
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                댓글을 쓰려면 <Link href="/login" className="font-bold text-[#6657ed]">로그인</Link>이 필요해요.
              </p>
            )}
          </div>

          {comments.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-400">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
          ) : (
            <ul className="mt-6 divide-y">
              {comments.map((c) => {
                const author = profileById.get(c.user_id);
                return (
                  <li key={c.id} className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <b className="font-extrabold">{displayName(author?.nickname)} {flagEmoji(author?.country)}</b>
                      <span className="text-xs text-slate-400">{timeAgo(c.created_at, "ko")}</span>
                      {c.user_id === userId && (
                        <form action={deleteComment} className="ml-auto">
                          <input type="hidden" name="comment_id" value={c.id} />
                          <input type="hidden" name="post_id" value={post.id} />
                          <button className="text-xs font-bold text-slate-400 hover:text-rose-500">삭제</button>
                        </form>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{c.body}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
