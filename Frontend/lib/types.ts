export type Lang = "ko" | "en";

export type Category = {
  id: number;
  slug: string;
  name_ko: string;
  name_en: string;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  categoryId: number;
  likeCount: number;
  commentCount: number;
  createdAt: string; // ISO 문자열
  author: { nickname: string; country: string | null };
  liked: boolean; // 현재 로그인한 사용자가 좋아요 했는지
};

export type RankRow = {
  nickname: string;
  country: string | null;
  totalPoints: number;
};

export type SignedInUser = {
  displayName: string;
  email: string;
  points: number;
} | null;
