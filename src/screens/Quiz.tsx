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
            // 오늘 날짜 기준 문제 가져오기
            const today = new Date().toISOString().slice(0, 10);
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .gte('created_at', today + 'T00:00:00')
                .lte('created_at', today + 'T23:59:59')
                .single();
            if (error) setError("오늘의 퀴즈를 불러올 수 없습니다.");
            setQuiz(data);
            setLoading(false);
        }
        fetchQuiz();
    }, []);

    // 답 제출 및 채팅방 생성
    const handleSubmit = async () => {
        if (!quiz || !selected || !user) return;
        setLoading(true);
        setError("");
        try {
            // rooms 테이블에서 해당 답변 방이 있는지 확인
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('question_id', quiz.id)
                .eq('option', selected)
                .single();
            let roomId = roomData?.id;
            if (!roomId) {
                // 없으면 방 생성
                const { data: newRoom } = await supabase
                    .from('rooms')
                    .insert([
                        {
                            question_id: quiz.id,
                            option: selected,
                            members: JSON.stringify([user.username])
                        }
                    ])
                    .select()
                    .single();
                roomId = newRoom.id;
            } else {
                // 있으면 멤버 추가
                const members = roomData.members || [];
                if (!members.includes(user.username)) {
                    await supabase
                        .from('rooms')
                        .update({ members: JSON.stringify([...members, user.username]) })
                        .eq('id', roomId);
                }
            }
            // 채팅방으로 이동
            navigate('/chat', { state: { roomId, fromQuiz: true } });
        } catch (err: any) {
            setError("답 제출 또는 채팅방 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
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