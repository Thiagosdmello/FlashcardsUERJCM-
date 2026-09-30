-- Flashcards CT dos Acadêmicos — progresso de cada aluno na nuvem.
-- Uma linha por usuário; "dados" guarda o JSON completo do progresso (cartas/FSRS, histórico, plano, troféus, favoritos, listas, baralhos próprios).
-- Segurança: RLS — cada usuário só lê e grava a própria linha. A chave anônima pode ficar pública.

create table if not exists public.progresso (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

comment on table public.progresso is 'Progresso do app Flashcards CT (1 linha por usuário).';

alter table public.progresso enable row level security;

drop policy if exists "progresso: ler o próprio" on public.progresso;
create policy "progresso: ler o próprio" on public.progresso
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "progresso: criar o próprio" on public.progresso;
create policy "progresso: criar o próprio" on public.progresso
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "progresso: atualizar o próprio" on public.progresso;
create policy "progresso: atualizar o próprio" on public.progresso
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.progresso from anon;
grant select, insert, update on public.progresso to authenticated;
