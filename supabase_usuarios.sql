create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  username text unique not null,
  email text not null,
  criado_em timestamptz default now()
);

alter table public.usuarios enable row level security;

drop policy if exists "Usuario cria seu proprio perfil" on public.usuarios;

drop policy if exists "Leitura publica de username/email" on public.usuarios;
create policy "Leitura publica de username/email"
  on public.usuarios for select
  using (true);

-- A linha em "usuarios" é criada automaticamente por este trigger sempre que
-- um usuário novo é registrado em auth.users (mesmo sem confirmação de e-mail
-- e sem sessão ativa ainda). Por isso não existe policy de INSERT: a tabela
-- nunca recebe inserts diretos do cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome_completo, username, email)
  values (
    new.id,
    new.raw_user_meta_data->>'nome_completo',
    new.raw_user_meta_data->>'username',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
