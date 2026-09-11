-- Profile owners may edit identity fields, but verification is controlled by
-- a trusted server-side workflow rather than by client-owned profile updates.
-- Remove broad table grants first; column-level grants cannot narrow an
-- existing table-level INSERT or UPDATE privilege on their own.
revoke insert, update on table public.profiles from authenticated;

grant insert (user_id, username, display_name, avatar)
on table public.profiles
to authenticated;

grant update (username, display_name, avatar)
on table public.profiles
to authenticated;

-- Column privileges are the normal protection. This trigger is defense in depth
-- for future grants or server code that accidentally exposes the whole row.
create or replace function public.prevent_client_wsu_verification_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and coalesce(new.wsu_verified, false) then
      raise exception 'WSU verification can only be changed by a trusted service';
    end if;

    if tg_op = 'UPDATE' and new.wsu_verified is distinct from old.wsu_verified then
      raise exception 'WSU verification can only be changed by a trusted service';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_client_wsu_verification_change()
from public, anon, authenticated;

create trigger profiles_prevent_client_wsu_verification_change
before insert or update of wsu_verified
on public.profiles
for each row execute function public.prevent_client_wsu_verification_change();