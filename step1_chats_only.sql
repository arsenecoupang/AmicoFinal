-- 1단계: 필수 테이블만 생성 (충돌 방지용)

-- chats 테이블 생성 (가장 급한 것)
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid,
    username text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 기존 rooms 테이블이 있다면 members 컬럼 타입 변경
DO $$ 
BEGIN
    -- members 컬럼이 text라면 jsonb로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' 
        AND column_name = 'members' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.rooms 
        ALTER COLUMN members TYPE jsonb USING 
            CASE 
                WHEN members IS NULL THEN '[]'::jsonb
                WHEN members = '' THEN '[]'::jsonb
                ELSE members::jsonb 
            END;
    END IF;
END $$;

-- RLS 설정
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (존재하지 않을 때만)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' AND policyname = 'chats_select_policy'
    ) THEN
        CREATE POLICY "chats_select_policy" ON public.chats FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' AND policyname = 'chats_insert_policy'
    ) THEN
        CREATE POLICY "chats_insert_policy" ON public.chats FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Realtime 활성화
DO $$
BEGIN
    -- publication에 테이블 추가 (이미 있어도 오류 발생하지 않음)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- 이미 추가되어 있으면 무시
    END;
END $$;
