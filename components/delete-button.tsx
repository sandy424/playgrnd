"use client";

import { deletePost } from "@/app/actions";
import Image from "next/image";

export default function DeletePostButton({ postId }: { postId: string }) {
  return (
    <form
      action={deletePost}
      onSubmit={(e) => {
        const ok = confirm("정말 삭제할까요?");
        if(!ok) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="post_id" value={postId} />
      <button className="flex items-center"><Image src="/delete.png" alt="delete" width={24} height={24} /></button>
    </form>
  );
}