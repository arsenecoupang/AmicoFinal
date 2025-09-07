-- profiles 테이블에 class 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS class text DEFAULT '1반';

-- class 컬럼에 제약조건 추가 (1반~10반만 허용)
ALTER TABLE public.profiles 
ADD CONSTRAINT check_class_value 
CHECK (class IN ('1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반', '9반', '10반'));

-- 기존 사용자들의 class 값을 1반으로 설정
UPDATE public.profiles 
SET class = '1반' 
WHERE class IS NULL;
