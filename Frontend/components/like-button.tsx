"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { setLike } from "@/app/actions";

type Props = { postId: string; initialLiked: boolean; initialCount: number; signedIn: boolean };

export default function LikeButton({ postId, initialLiked, initialCount, signedIn }: Props) {
  const router = useRouter();
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const prev = state;
    const next = { liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) };
    setState(next); // 화면 먼저 변경
    startTransition(async () => {
      const res = await setLike(postId, next.liked);
      if (!res.ok) setState(prev); // 실패하면 되돌림
    });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={state.liked}
      className={`flex items-center gap-1.5 text-sm font-bold ${state.liked ? "text-[#ff5f71]" : "text-slate-500"}`}
    >
      <Heart size={18} fill={state.liked ? "currentColor" : "none"} />
      {state.count}
    </button>
  );
}
