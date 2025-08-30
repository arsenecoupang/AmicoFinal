import { styled } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from '../db';
import { useAuth } from '../AuthContext';

const QuizScreenDiv = styled.div`
    min-height: calc(100vh - 6.25rem);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    background: ${props => props.theme.base};
`;

const Header = styled.header`
    width: 100%;
    max-width: 640px;
    margin-bottom: 1rem;
`;

const Title = styled.h1`
    font-size: 1.875rem; /* 30px */
    line-height: 1.2;
    font-weight: 900;
    color: ${props => props.theme.text};
    margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
    margin: 0;
    color: ${props => props.theme.text};
    opacity: .75;
    font-size: .95rem;
`;

const TopicTag = styled.span`
    display: inline-block;
    background: ${props => props.theme.baseHover};
    color: ${props => props.theme.text};
    border: 1px solid ${props => props.theme.main};
    padding: .25rem .5rem;
    border-radius: .25rem;
    font-size: .825rem;
    font-weight: 700;

    strong {
        color: ${props => props.theme.text};
        font-weight: 900;
        font-size: 1rem;
    }
`;

const QuizCard = styled.section`
    background-color: #fff;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 16px rgba(168,198,134,0.10);
    width: 100%;
    max-width: 640px;
    border-top: 4px solid ${props => props.theme.main};
`;

const Topic = styled.h2`
    font-size: 1.375rem; /* 22px */
    font-weight: 800;
    color: ${props => props.theme.text};
    margin: .5rem 0 0.75rem;
`;

const Split = styled.div`
    position: relative;
    display: flex;
    gap: 0.75rem;
    @media (max-width: 40rem) {
        flex-direction: column;
    }
`;

const VSBadge = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: ${props => props.theme.base};
    border: 2px solid ${props => props.theme.text};
    color: ${props => props.theme.text};
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: .02em;
    @media (max-width: 40rem) {
        top: 0;
        transform: translate(-50%, -50%);
    }
`;

const OptionBase = styled.button`
    flex: 1;
    min-height: 8rem;
    border-radius: 0.375rem;
    padding: 1.25rem 1rem;
    font-size: 1.125rem;
    font-weight: 800;
    letter-spacing: .01em;
    cursor: pointer;
    transition: background .2s ease, color .2s ease, transform .1s ease, box-shadow .2s ease, border-color .2s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,.06);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    &:active { transform: translateY(1px); }
    &:focus-visible { outline: 2px solid ${props => props.theme.sub}; outline-offset: 2px; }
`;

const OptionA = styled(OptionBase)`
    background: ${props => props.theme.main};
    color: #fff;
    border: none;
    &:hover { background: ${props => props.theme.mainHover}; }
`;

const OptionB = styled(OptionBase)`
    background: #fff;
    color: ${props => props.theme.main};
    border: 2px solid ${props => props.theme.main};
    &:hover { color: ${props => props.theme.mainHover}; border-color: ${props => props.theme.mainHover}; }
`;

function QuizScreen() {
    const [quiz, setQuiz] = useState<any>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth();

    // 오늘의 퀴즈 불러오기
    useEffect(() => {
        async function fetchQuiz() {
            setLoading(true);
            setError("");
            
            try {
                console.log('Fetching today\'s quiz...');
                
                // 방법 1: 가장 최근 퀴즈 가져오기 (날짜 필터링 없이)
                const { data: latestQuiz, error: latestError } = await supabase
                    .from('questions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                console.log('Latest quiz result:', { latestQuiz, latestError });
                
                if (latestError && latestError.code !== 'PGRST116') {
                    // PGRST116은 "no rows returned" 에러
                    throw latestError;
                }
                
                if (latestQuiz) {
                    setQuiz(latestQuiz);
                    setError("");
                } else {
                    // 퀴즈가 없으면 오늘 날짜로 다시 시도
                    console.log('No quiz found, trying with date filter...');
                    
                    const today = new Date();
                    const todayStr = today.toISOString().slice(0, 10);
                    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    
                    console.log('Searching for quiz from:', yesterdayStr, 'to:', todayStr);
                    
                    const { data: dateFilteredQuiz, error: dateError } = await supabase
                        .from('questions')
                        .select('*')
                        .gte('created_at', yesterdayStr + 'T00:00:00')
                        .lte('created_at', todayStr + 'T23:59:59')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    
                    console.log('Date filtered quiz result:', { dateFilteredQuiz, dateError });
                    
                    if (dateFilteredQuiz) {
                        setQuiz(dateFilteredQuiz);
                        setError("");
                    } else {
                        setError("오늘의 퀴즈를 불러올 수 없습니다. 관리자에게 문의하세요.");
                    }
                }
            } catch (err: any) {
                console.error('Error fetching quiz:', err);
                setError(`퀴즈 로딩 오류: ${err.message || '알 수 없는 오류'}`);
            } finally {
                setLoading(false);
            }
        }
        fetchQuiz();
    }, []);

    // 답 제출 및 채팅방 생성
    const handleSubmit = async () => {
        console.log('=== SUBMIT STARTED ===');
        console.log('Current state:', { quiz: !!quiz, selected, user: user?.username });
        
        if (!quiz) {
            console.error('No quiz available');
            setError('퀴즈가 로드되지 않았습니다.');
            return;
        }
        
        if (!selected) {
            console.error('No option selected');
            setError('선택지를 선택해주세요.');
            return;
        }
        
        if (!user) {
            console.error('User not logged in');
            setError('로그인이 필요합니다.');
            return;
        }
        
        setLoading(true);
        setError("");
        
        try {
            console.log('Submitting answer:', { quizId: quiz.id, selected, user: user.username });
            
            // rooms 테이블에서 해당 답변 방이 있는지 확인
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('question_id', quiz.id)
                .eq('option', selected)
                .single();
                
            console.log('Room check result:', { roomData, roomError });
            
            let roomId = roomData?.id;
            
            if (!roomId) {
                // 없으면 방 생성
                console.log('Creating new room...');
                const { data: newRoom, error: createError } = await supabase
                    .from('rooms')
                    .insert([
                        {
                            id: crypto.randomUUID(), // 명시적으로 UUID 생성
                            question_id: quiz.id,
                            option: selected,
                            members: JSON.stringify([user.username])
                        }
                    ])
                    .select()
                    .single();
                    
                console.log('Room creation result:', { newRoom, createError });
                
                if (createError) {
                    console.error('Room creation failed:', createError);
                    throw new Error(`채팅방 생성 실패: ${createError.message}`);
                }
                
                roomId = newRoom?.id;
                console.log('New room ID:', roomId);
                
                if (!roomId) {
                    throw new Error('채팅방 ID를 가져올 수 없습니다.');
                }
            } else {
                // 있으면 멤버 추가
                console.log('Adding member to existing room...');
                let members = [];
                
                try {
                    // members 필드가 JSON 문자열인 경우 파싱
                    if (typeof roomData.members === 'string') {
                        members = JSON.parse(roomData.members);
                    } else if (Array.isArray(roomData.members)) {
                        members = roomData.members;
                    } else {
                        members = [];
                    }
                } catch (parseError) {
                    console.warn('Failed to parse members, using empty array:', parseError);
                    members = [];
                }
                
                if (!members.includes(user.username)) {
                    const { error: updateError } = await supabase
                        .from('rooms')
                        .update({ members: JSON.stringify([...members, user.username]) })
                        .eq('id', roomId);
                        
                    console.log('Member update result:', { updateError });
                    
                    if (updateError) {
                        console.warn('Failed to update members, but continuing:', updateError);
                    }
                }
            }
            
            console.log('=== NAVIGATION ATTEMPT ===');
            console.log('Navigating to chat with roomId:', roomId);
            console.log('Navigate function available:', typeof navigate);
            
            // 채팅방으로 이동
            navigate('/chat', { state: { roomId, fromQuiz: true } });
            
            console.log('=== NAVIGATION CALLED ===');
            
        } catch (err: any) {
            console.error('Quiz submission error:', err);
            setError(`답 제출 또는 채팅방 생성 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
            console.log('=== SUBMIT FINISHED ===');
        }
    };

    if (loading) return <QuizScreenDiv>로딩 중...</QuizScreenDiv>;
    if (error) return <QuizScreenDiv>{error}</QuizScreenDiv>;
    if (!quiz) return <QuizScreenDiv>오늘의 퀴즈가 없습니다.</QuizScreenDiv>;

    return <QuizScreenDiv>
        <Header>
            <Title>오늘의 주제</Title>
            <Subtitle>하나를 선택해 의견을 남겨보세요</Subtitle>
        </Header>
        <QuizCard>
            <TopicTag>오늘의 주제</TopicTag>
            <Topic>{quiz.question1}</Topic>
            <Split>
                <OptionA
                    aria-label={`선택 ${quiz.option1}`}
                    onClick={() => setSelected(quiz.option1)}
                    style={{ opacity: selected === quiz.option1 ? 1 : 0.7 }}
                >{quiz.option1}</OptionA>
                <OptionB
                    aria-label={`선택 ${quiz.option2}`}
                    onClick={() => setSelected(quiz.option2)}
                    style={{ opacity: selected === quiz.option2 ? 1 : 0.7 }}
                >{quiz.option2}</OptionB>
                <VSBadge>VS</VSBadge>
            </Split>
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={handleSubmit}
                    disabled={!selected || loading}
                    style={{
                        padding: '0.85rem 2rem',
                        background: '#A8C686',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        cursor: !selected ? 'not-allowed' : 'pointer',
                        opacity: !selected ? 0.6 : 1
                    }}
                >답 제출하기</button>
            </div>
        </QuizCard>
    </QuizScreenDiv>;
}

export default QuizScreen;