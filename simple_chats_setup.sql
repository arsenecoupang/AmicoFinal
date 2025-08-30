-- 핵심 테이블만 간단히 생성

-- chats 테이블 (가장 급한 것)
CREATE TABLE public.chats (
    id bigserial PRIMARY KEY,
    room_id bigint,
    username text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- rooms 테이블 수정 (members를 jsonb로)
ALTER TABLE public.rooms 
ALTER COLUMN members TYPE jsonb USING members::jsonb;

-- RLS 활성화
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 기본 정책
CREATE POLICY "Anyone can view chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Anyone can create chats" ON public.chats FOR INSERT WITH CHECK (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
