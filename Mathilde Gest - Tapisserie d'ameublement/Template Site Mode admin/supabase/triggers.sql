-- 1. Create the Function to handle new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'client');
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. (Optional) Fix existing users who are missing a profile
-- Run this ONLY if you have users without profiles
insert into public.profiles (id, role)
select id, 'admin' -- Defaulting existing users to admin because you are testing!
from auth.users
where id not in (select id from public.profiles);
