create table if not exists public.post_translations (
  post_id text not null,
  lang text not null check (lang in ('ko', 'en')),
  title text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (post_id, lang)
);

alter table public.post_translations enable row level security;

grant select on public.post_translations to anon, authenticated;

drop policy if exists "Public can read post translations" on public.post_translations;
create policy "Public can read post translations"
  on public.post_translations
  for select
  to anon, authenticated
  using (true);