-- Run once in the Supabase SQL editor. All dream data is private to its owner.
create table public.users (id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.users enable row level security;
create policy own_profile on public.users for all to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create table public.dreams (
 id text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 original_text text not null check (char_length(original_text) between 1 and 4000),
 title text not null, summary text not null, mood text not null,
 dominant_emotion text not null,
 created_at timestamptz not null default now(),
 world jsonb not null,
 primary key(id,user_id)
);
alter table public.dreams enable row level security;
create policy own_dreams on public.dreams for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index dreams_user_created on public.dreams(user_id,created_at desc);
create table public.dream_locations (id uuid primary key default gen_random_uuid(),dream_id text not null,user_id uuid not null,name text not null,description text not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade);
create table public.dream_characters (id uuid primary key default gen_random_uuid(),dream_id text not null,user_id uuid not null,name text not null,details jsonb not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade);
create table public.dream_symbols (id uuid primary key default gen_random_uuid(),dream_id text not null,user_id uuid not null,name text not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade);
create table public.dream_story_fragments (id uuid primary key default gen_random_uuid(),dream_id text not null,user_id uuid not null,position integer not null,content text not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade);
create table public.dream_images (id uuid primary key default gen_random_uuid(),dream_id text not null,user_id uuid not null,url text not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade);
create table public.dream_connections (id uuid primary key default gen_random_uuid(),dream_id text not null,connected_dream_id text not null,user_id uuid not null,symbol text not null,foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade,foreign key(connected_dream_id,user_id) references public.dreams(id,user_id) on delete cascade,unique(dream_id,connected_dream_id,user_id,symbol));
do $$ declare t text; begin foreach t in array array['dream_locations','dream_characters','dream_symbols','dream_story_fragments','dream_images','dream_connections'] loop execute format('alter table public.%I enable row level security',t);execute format('create policy own_records on public.%I for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id)',t);end loop;end $$;
create or replace function public.sync_dream_details() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 delete from dream_locations where dream_id=new.id and user_id=new.user_id;
 delete from dream_characters where dream_id=new.id and user_id=new.user_id;
 delete from dream_symbols where dream_id=new.id and user_id=new.user_id;
 delete from dream_story_fragments where dream_id=new.id and user_id=new.user_id;
 delete from dream_images where dream_id=new.id and user_id=new.user_id;
 delete from dream_connections where user_id=new.user_id and (dream_id=new.id or connected_dream_id=new.id);
 insert into dream_locations(dream_id,user_id,name,description) select new.id,new.user_id,x->>'name',x->>'description' from jsonb_array_elements(new.world->'locations') x;
 insert into dream_characters(dream_id,user_id,name,details) select new.id,new.user_id,x->>'name',x from jsonb_array_elements(new.world->'characters') x;
 insert into dream_symbols(dream_id,user_id,name) select new.id,new.user_id,x from jsonb_array_elements_text(new.world->'symbols') x;
 insert into dream_story_fragments(dream_id,user_id,position,content) select new.id,new.user_id,ordinality::integer,x from jsonb_array_elements_text(new.world->'storyFragments') with ordinality as s(x,ordinality);
 insert into dream_images(dream_id,user_id,url) values(new.id,new.user_id,coalesce(new.world->>'imageUrl','/dream-worlds.png'));
 insert into dream_connections(dream_id,connected_dream_id,user_id,symbol) select new.id,s.dream_id,new.user_id,s.name from dream_symbols s where s.user_id=new.user_id and s.dream_id<>new.id and s.name in(select jsonb_array_elements_text(new.world->'symbols')) on conflict do nothing;
 return new;
end $$;
create trigger dream_details_after_save after insert or update on public.dreams for each row execute function public.sync_dream_details();
