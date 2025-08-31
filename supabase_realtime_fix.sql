-- Supabase 실시간 설정을 위한 SQL
-- 이 SQL을 Supabase 콘솔 SQL Editor에서 실행하세요

-- 1. 현재 publication 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 2. chats 테이블을 realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- 3. rooms 테이블도 추가 (이미 있을 수 있음)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 4. 다시 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 5. 테이블의 RLS 정책 확인 (realtime에서 작동하려면 필요)
SELECT * FROM pg_policies WHERE tablename IN ('chats', 'rooms');
