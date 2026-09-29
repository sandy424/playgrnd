import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Supabase 연결 확인용 임시 페이지 (확인 후 삭제해도 됩니다)
export default async function SupabaseCheck() {
  let rows: { id: number; slug: string; name_ko: string; name_en: string }[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name_ko, name_en")
      .order("sort_order");
    if (error) errorMessage = `${error.code ?? ""} ${error.message}`.trim();
    else rows = data ?? [];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  const ok = !errorMessage && rows.length > 0;

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-black">Supabase 연결 확인</h1>
      <p className={`mt-3 font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
        {ok ? `연결 성공 — 카테고리 ${rows.length}개 조회됨` : "연결 실패"}
      </p>
      {errorMessage && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-rose-50 p-4 text-sm">{errorMessage}</pre>
      )}
      {!errorMessage && rows.length === 0 && (
        <p className="mt-3 text-sm text-slate-600">
          결과가 비어 있어요. playgrnd-schema.sql을 실행했는지 확인하세요.
        </p>
      )}
      <ul className="mt-4 space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl bg-white px-4 py-2 shadow-sm">
            {r.name_ko} / {r.name_en} <span className="text-slate-400">({r.slug})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
