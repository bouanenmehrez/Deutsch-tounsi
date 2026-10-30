-- Deutsch Tounsi: Admin + Student roles migration
-- Run in Supabase SQL Editor. Then create your own normal account on the website.
alter table public.profiles add column if not exists role text not null default 'student' check (role in ('student','admin'));
create or replace function public.is_deutsch_tounsi_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
revoke all on function public.is_deutsch_tounsi_admin() from public; grant execute on function public.is_deutsch_tounsi_admin() to anon,authenticated;
create or replace function public.prevent_self_role_change() returns trigger language plpgsql security definer set search_path=public as $$ begin if new.role is distinct from old.role and auth.uid() is not null and not public.is_deutsch_tounsi_admin() then raise exception 'Only an existing administrator can change account roles.'; end if; return new; end; $$;
drop trigger if exists protect_profile_role on public.profiles; create trigger protect_profile_role before update on public.profiles for each row execute function public.prevent_self_role_change();
drop policy if exists "Admins can view all profiles" on public.profiles; create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.is_deutsch_tounsi_admin());
drop policy if exists "Admins can manage lessons" on public.lessons; create policy "Admins can manage lessons" on public.lessons for all to authenticated using (public.is_deutsch_tounsi_admin()) with check (public.is_deutsch_tounsi_admin());
drop policy if exists "Admins can view all progress" on public.lesson_progress; create policy "Admins can view all progress" on public.lesson_progress for select to authenticated using (public.is_deutsch_tounsi_admin());
drop policy if exists "Admins can view all quiz attempts" on public.quiz_attempts; create policy "Admins can view all quiz attempts" on public.quiz_attempts for select to authenticated using (public.is_deutsch_tounsi_admin());

-- AFTER creating your account on the website, replace the email below and run this UPDATE alone.
-- update public.profiles set role='admin' where id=(select id from auth.users where lower(email)=lower('YOUR_EMAIL_HERE'));
