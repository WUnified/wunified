-- Extend the Auth-backed profile without replacing the already-applied
-- baseline migration. Existing rows are backfilled from their username.
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar text,
  add column if not exists wsu_verified boolean not null default false;

update public.profiles
set display_name = username
where display_name is null;

alter table public.profiles
  alter column display_name set not null;

-- Keep profile creation in one database trigger while supporting separate
-- username and display-name metadata from the signup request.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  candidate_display_name text;
  suffix integer := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );

  candidate_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    base_username
  );
  candidate_username := base_username;

  loop
    begin
      insert into public.profiles (user_id, username, display_name, avatar)
      values (
        new.id,
        candidate_username,
        candidate_display_name,
        nullif(trim(new.raw_user_meta_data ->> 'avatar'), '')
      );

      exit;
    exception
      when unique_violation then
        suffix := suffix + 1;
        candidate_username := base_username || '_' || suffix::text;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists create_profile_after_user_signup on auth.users;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();
