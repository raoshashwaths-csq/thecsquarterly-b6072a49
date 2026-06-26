create extension if not exists vector;

alter table public.posts add column if not exists embedding vector(1536);

create index if not exists posts_embedding_idx
  on public.posts using hnsw (embedding vector_cosine_ops);

create or replace function public.match_posts(
  _query vector(1536),
  _k int default 6,
  _section text default null
)
returns table (
  id uuid,
  slug text,
  title text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.slug, p.title,
         1 - (p.embedding <=> _query) as similarity
  from public.posts p
  where p.embedding is not null
    and p.published = true
    and p.published_at <= now()
    and (_section is null or p.section = _section)
  order by p.embedding <=> _query
  limit greatest(1, least(_k, 50));
$$;

grant execute on function public.match_posts(vector, int, text) to authenticated, anon, service_role;