"use client";

import { useActionState } from "react";
import { createComment, type CommentState } from "@/app/actions";
import type { Lang } from "@/lib/types";

export default function CommentForm({ postId, lang }: { postId: string; lang: Lang }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(createComment, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        name="body"
        required
        maxLength={1000}
        defaultValue={state.body}
        placeholder={lang === "ko" ? "댓글을 남겨보세요" : "Write a comment"}
        className="min-h-24 w-full resize-none rounded-2xl border p-4 text-sm outline-none focus:border-[#6657ed]"
      />
      {state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{state.error}</p>}
      <button disabled={pending} className="h-11 rounded-2xl bg-[#6657ed] px-6 text-sm font-extrabold text-white disabled:opacity-60">
        {pending ? (lang === "ko" ? "등록 중..." : "Posting...") : lang === "ko" ? "댓글 등록" : "Post comment"}
      </button>
    </form>
  );
}
