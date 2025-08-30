-- Supabase SQL 스크립트: 필요한 테이블들 생성 (수정된 버전)

-- 1. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    realname text NOT NULL,
    temperature integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. questions 테이블 (일일 퀴즈) - 기존과 호환되도록 uuid 사용
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question1 text NOT NULL,
    option1 text NOT NULL,
    option2 text NOT NULL,
    topic text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. rooms 테이블 (채팅방) - question_id를 uuid로 변경
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    option text NOT NULL,
    members jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. chats 테이블 (채팅 메시지) - room_id를 uuid로 변경
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    username text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. votes 테이블 (MVP 투표)
CREATE TABLE IF NOT EXISTS public.votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_username text NOT NULL,
    voted_username text NOT NULL,
    vote_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(voter_username, vote_date)
);

-- 6. user_answers 테이블 (사용자 답변 기록) - question_id를 uuid로 변경
CREATE TABLE IF NOT EXISTS public.user_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    answer text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, question_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성

-- profiles: 본인 데이터만 수정 가능, 모든 사용자 조회 가능
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- questions: 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view questions" ON public.questions
    FOR SELECT USING (true);

-- rooms: 모든 인증된 사용자가 조회/생성/수정 가능
CREATE POLICY "Authenticated users can view rooms" ON public.rooms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update rooms" ON public.rooms
    FOR UPDATE USING (auth.role() = 'authenticated');

-- chats: 모든 인증된 사용자가 조회/생성 가능
CREATE POLICY "Authenticated users can view chats" ON public.chats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create chats" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- votes: 모든 인증된 사용자가 조회/생성 가능
CREATE POLICY "Authenticated users can view votes" ON public.votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- user_answers: 본인 답변만 조회/생성 가능, 모든 답변은 조회 가능
CREATE POLICY "Users can view all answers" ON public.user_answers
    FOR SELECT USING (true);

CREATE POLICY "Users can create own answers" ON public.user_answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_question_option ON public.rooms(question_id, option);
CREATE INDEX IF NOT EXISTS idx_chats_room_id ON public.chats(room_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_date ON public.votes(vote_date);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_question ON public.user_answers(user_id, question_id);

-- 샘플 데이터 삽입 (테스트용) - UUID 사용
INSERT INTO public.questions (question1, option1, option2, topic) VALUES 
('오늘 점심 메뉴 추천', '한식', '양식', '음식'),
('주말 활동 추천', '집에서 휴식', '야외 활동', '여가'),
('선호하는 계절은?', '봄/가을', '여름/겨울', '계절')
ON CONFLICT DO NOTHING;

-- 함수: 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거: profiles와 rooms 테이블의 updated_at 자동 갱신
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime 활성화 (채팅 실시간 업데이트용)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
