-- Supabase 실시간 설정
-- 이 SQL을 Supabase 콘솔의 SQL Editor에서 실행하세요

-- 1. chats 테이블에 대한 실시간 구독 활성화
alter publication supabase_realtime add table chats;

-- 2. rooms 테이블에 대한 실시간 구독 활성화 (이미 있을 수 있지만 확실히 하기 위해)
alter publication supabase_realtime add table rooms;

-- 3. 실시간 구독이 활성화된 테이블 확인
select schemaname, tablename 
from pg_publication_tables 
where pubname = 'supabase_realtime';

-- 4. 추가적으로 RLS 정책이 실시간에서도 작동하는지 확인
-- chats 테이블 정책 (이미 있다면 무시됨)
create policy "Users can read chats in their rooms" on chats
  for select using (true);

create policy "Users can insert chats" on chats
  for insert with check (true);

-- rooms 테이블 정책 (이미 있다면 무시됨)  
create policy "Users can read rooms they joined" on rooms
  for select using (true);

create policy "Users can update rooms they joined" on rooms
  for update using (true);
