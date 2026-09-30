create table if not exists public.comment_translations (
  comment_id text not null,
  lang text not null check (lang in ('ko', 'en')),
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (comment_id, lang)
);

alter table public.comment_translations enable row level security;

grant select on public.comment_translations to anon, authenticated;

drop policy if exists "Public can read comment translations" on public.comment_translations;
create policy "Public can read comment translations"
  on public.comment_translations
  for select
  to anon, authenticated
  using (true);