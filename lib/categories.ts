import { Bot, Code2, Hash, MessageCircle, Sparkles, TestTube2, Users, type LucideIcon } from "lucide-react";

type CategoryStyle = { icon: LucideIcon; color: string };

// slug를 소문자 알파벳만 남겨서 비교합니다. ("dev-log", "devlog", "Dev Log" 모두 "devlog")
const STYLES: Record<string, CategoryStyle> = {
  showcase: { icon: Sparkles, color: "#6C5CE7" },
  devlog: { icon: Code2, color: "#1677FF" },
  ailab: { icon: Bot, color: "#8B5CF6" },
  gameqa: { icon: TestTube2, color: "#00A878" },
  teamup: { icon: Users, color: "#F59E0B" },
  freetalk: { icon: MessageCircle, color: "#FF6685" },
};

const FALLBACK: CategoryStyle = { icon: Hash, color: "#64748b" };

export function categoryStyle(slug: string): CategoryStyle {
  return STYLES[slug.toLowerCase().replace(/[^a-z]/g, "")] ?? FALLBACK;
}
