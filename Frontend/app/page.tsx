import CommunityClient from "./community-client";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import type { Category, FeedPost, RankRow, SignedInUser } from "@/lib/types.ts";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // 1) 로그인 사용자 정보 (닉네임, 포인트)
  let user: SignedInUser = null;
  if (claims) {
    const email = String(claims.email ?? "");
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, total_points")
      .eq("id", claims.sub)
      .maybeSingle();
    const nickname = profile?.nickname ?? email.split("@")[0] ?? "user";
    user = {
      displayName: nickname.split("_")[0] || "user",
      email,
      points: profile?.total_points ?? 0,
    };
  }

  // 2) 카테고리 / 게시글 / 랭킹을 동시에 조회
  const [categoriesRes, postsRes, rankingRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name_ko, name_en").order("sort_order"),
    supabase
      .from("posts")
      .select("id, user_id, category_id, title, body, like_count, comment_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("leaderboard_all")
      .select("nickname, country, total_points")
      .order("total_points", { ascending: false })
      .limit(10),
  ]);

  const categories: Category[] = categoriesRes.data ?? [];
  const rawPosts = postsRes.data ?? [];

  // 3) 작성자 프로필 / 내가 누른 좋아요를 따로 조회해서 합칩니다.
  //    (posts → profiles FK가 없어도 동작하도록 조인 대신 in 조회 사용)
  const authorIds = [...new Set(rawPosts.map((p) => p.user_id))];
  const postIds = rawPosts.map((p) => p.id);

  const [profilesRes, likesRes] = await Promise.all([
    authorIds.length
      ? supabase.from("profiles").select("id, nickname, country").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; nickname: string; country: string | null }[] }),
    claims && postIds.length
      ? supabase.from("post_likes").select("post_id").eq("user_id", claims.sub).in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const likedIds = new Set((likesRes.data ?? []).map((l) => l.post_id));

  const posts: FeedPost[] = rawPosts.map((p) => {
    const author = profileById.get(p.user_id);
    return {
      id: p.id,
      title: p.title,
      body: p.body,
      categoryId: p.category_id,
      likeCount: p.like_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
      author: {
        nickname: (author?.nickname ?? "user").split("_")[0] || "user",
        country: author?.country ?? null,
      },
      liked: likedIds.has(p.id),
    };
  });

  const ranking: RankRow[] = (rankingRes.data ?? []).map((r) => ({
    nickname: (r.nickname ?? "user").split("_")[0] || "user",
    country: r.country,
    totalPoints: r.total_points ?? 0,
  }));

  const signInPath = "/login";
  const authControl = user ? (
    <form action={signOut} className="hidden items-center gap-2 md:flex">
      <div className="max-w-40 text-right">
        <p className="truncate text-sm font-extrabold text-slate-800">{user.displayName}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <button
        title="로그아웃 / Log out"
        aria-label="로그아웃"
        className="flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#6657ed] px-3 text-xs font-bold text-white"
      >
        로그아웃
      </button>
    </form>
  ) : (
    <a
      href={signInPath}
      className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold transition hover:border-[#6657ed] hover:text-[#6657ed] md:flex"
    >
      로그인
    </a>
  );

  return (
    <CommunityClient
      user={user}
      signInPath={signInPath}
      authControl={authControl}
      categories={categories}
      posts={posts}
      ranking={ranking}
    />
  );
}
