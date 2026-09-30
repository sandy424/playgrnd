"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { translateText, translateTexts } from "@/lib/deepl";
import { createAdminClient } from "@/lib/supabase/admin";

export type PostState = { error?: string; ok?: boolean };

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

// 글쓰기: posts에 저장 (글 작성 포인트는 DB 트리거 trg_post_points가 처리)
export async function createPost(_prev: PostState, formData: FormData): Promise<PostState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryId = Number(formData.get("category_id"));

  if (title.length < 2 || title.length > 100) return { error: "제목은 2~100자로 입력해 주세요." };
  if (!body) return { error: "내용을 입력해 주세요." };
  if (!Number.isInteger(categoryId) || categoryId <= 0) return { error: "카테고리를 선택해 주세요." };

  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  const { error } = await supabase
    .from("posts")
    .insert({ user_id: userId, category_id: categoryId, title, body });

  if (error) {
    console.error("[createPost]", error.message);
    return { error: "게시글을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/");
  return { ok: true };
}

// 좋아요 켜기/끄기: post_likes 추가/삭제 (숫자는 DB 트리거 trg_like_count가 갱신)
export async function setLike(postId: string, like: boolean): Promise<{ ok: boolean }> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false };

  if (like) {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    // 23505 = 이미 좋아요한 상태(unique 위반) → 성공으로 취급
    if (error && error.code !== "23505") {
      console.error("[setLike:insert]", error.message);
      return { ok: false };
    }
  } else {
    const { error } = await supabase.from("post_likes").delete().match({ post_id: postId, user_id: userId });
    if (error) {
      console.error("[setLike:delete]", error.message);
      return { ok: false };
    }
  }
  return { ok: true };
}

export type CommentState = { error?: string; ok?: boolean; body?: string };

// 댓글 작성: comments에 저장 (댓글 수는 trg_comment_count, 포인트는 trg_comment_points가 처리)
export async function createComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  // 실패했을 때 입력한 내용을 잃지 않도록 body를 함께 돌려줍니다.
  if (!body) return { error: "댓글 내용을 입력해 주세요.", body };
  if (body.length > 1000) return { error: "댓글은 1,000자 이내로 작성해 주세요.", body };

  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "로그인이 필요해요.", body };

  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, body });
  if (error) {
    console.error("[createComment]", error.message);
    return { error: "댓글을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", body };
  }

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
  return { ok: true };
}

// 댓글 삭제: 내 댓글만 (RLS 정책도 한 번 더 막아줌)
export async function deleteComment(formData: FormData): Promise<void> {
  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");

  const { supabase, userId } = await currentUserId();
  if (!userId || !commentId) return;

  const { error } = await supabase.from("comments").delete().match({ id: commentId, user_id: userId });
  if (error) console.error("[deleteComment]", error.message);

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
}

// 게시글 삭제: 내 게시글만
export async function deletePost(formData: FormData): Promise<void> {
  const postId = String(formData.get("post_id") ?? "");

  const { supabase, userId } = await currentUserId();
  if (!userId || !postId) return;

  const {error} = await supabase.from("posts").delete().match({id: postId, user_id: userId});
  if (error) console.error("[deletePost]", error.message);

  revalidatePath("/");
  redirect("/");
}

export type TranslateResult =
  | { ok: true; title: string; body: string; translated: boolean }
  | { ok: false; error: string };

export async function translatePost(postId: string, target: "ko" | "en"): Promise<TranslateResult> {
  // 게시물 번역은 공개 기능이므로 로그인 없이 읽을 수 있어야 합니다.
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("title, body")
    .eq("id", postId)
    .maybeSingle();
  if (error) console.error("[translatePost:post]", error.message);
  if (!post) return { ok: false, error: "글을 찾을 수 없어요." };
  // 3) 너무 긴 글은 번역하지 않아요
  if (post.body.length > 5000) {
    return { ok: false, error: "글이 너무 길어서 번역할 수 없어요." };
  }

  // 4) 원문이 이미 target 언어면 그대로 돌려줘요 (한글이 있으면 한국어로 판단)
  const sourceLang = /[가-힣]/.test(post.title + post.body) ? "ko" : "en";
  if (sourceLang === target) {
    return { ok: true, title: post.title, body: post.body, translated: false };
  }

  // 5) 저장된 번역이 있으면 그대로 사용
  const { data: cached } = await supabase
    .from("post_translations")
    .select("title, body")
    .match({ post_id: postId, lang: target })
    .maybeSingle();
  if (cached) return { ok: true, ...cached, translated: true };

  // 6) 없으면 DeepL로 번역 (제목과 본문을 동시에 요청)
  try {
    const [title, body] = await Promise.all([
      translateText(post.title, target),
      translateText(post.body, target),
    ]);

    // 번역 저장은 서버 관리자 키가 설정된 경우에만 시도합니다.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      const { error: saveError } = await admin
        .from("post_translations")
        .upsert({ post_id: postId, lang: target, title, body });
      if (saveError) console.error("[translatePost:save]", saveError.message);
    }

    return { ok: true, title, body, translated: true };
  } catch (e) {
    console.error("[translatePost]", e);
    const error = e instanceof Error && e.message.includes("DEEPL_API_KEY")
      ? "서버에 DEEPL_API_KEY 설정이 필요해요."
      : "번역에 실패했어요. 잠시 후 다시 시도해 주세요.";
    return { ok: false, error };
  }
}

export type TranslateCommentsResult =
  | { ok: true; comments: Record<string, string> }
  | { ok: false; error: string };

export async function translatePostComments(postId: string, target: "ko" | "en"): Promise<TranslateCommentsResult> {
  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, body")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[translatePostComments:comments]", error.message);
    return { ok: false, error: "댓글을 불러오지 못했어요." };
  }
  if (!comments?.length) return { ok: true, comments: {} };

  const { data: cached } = await supabase
    .from("comment_translations")
    .select("comment_id, body")
    .eq("lang", target)
    .in("comment_id", comments.map((comment) => String(comment.id)));
  const translatedById = new Map((cached ?? []).map((item) => [item.comment_id, item.body]));
  const missing = comments.filter((comment) =>
    !translatedById.has(String(comment.id))
      && (/[가-힣]/.test(comment.body) ? "ko" : "en") !== target
  );

  try {
    for (let index = 0; index < missing.length; index += 50) {
      const batch = missing.slice(index, index + 50);
      const bodies = await translateTexts(batch.map((comment) => comment.body), target);
      batch.forEach((comment, bodyIndex) => {
        translatedById.set(String(comment.id), bodies[bodyIndex]);
      });
    }

    const newTranslations = missing.map((comment) => ({
      comment_id: String(comment.id),
      lang: target,
      body: translatedById.get(String(comment.id))!,
    }));
    if (newTranslations.length && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      const { error: saveError } = await admin
        .from("comment_translations")
        .upsert(newTranslations);
      if (saveError) console.error("[translatePostComments:save]", saveError.message);
    }

    return {
      ok: true,
      comments: Object.fromEntries(translatedById),
    };
  } catch (e) {
    console.error("[translatePostComments]", e);
    const message = e instanceof Error && e.message.includes("DEEPL_API_KEY")
      ? "서버에 DEEPL_API_KEY 설정이 필요해요."
      : "댓글 번역에 실패했어요.";
    return { ok: false, error: message };
  }
}