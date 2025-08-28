import {styled} from "styled-components";
import { useNavigate } from "react-router-dom";

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
    const topic = "topic example";
    const choice= [{id:1, text:"choice1"}, {id:2, text:"choice2"}];
    const navigate = useNavigate();
    return <QuizScreenDiv>
        <Header>
            <Title>오늘의 주제</Title>
            <Subtitle>하나를 선택해 의견을 남겨보세요</Subtitle>
        </Header>
        <QuizCard>
            <TopicTag>오늘의 주제</TopicTag>
            <Topic>{topic}</Topic>
            <Split>
                <OptionA aria-label={`선택 ${choice[0].text}`} onClick={() => navigate('/chat', { state: { fromQuiz: true, choice: choice[0] } })}>{choice[0].text}</OptionA>
                <OptionB aria-label={`선택 ${choice[1].text}`} onClick={() => navigate('/chat', { state: { fromQuiz: true, choice: choice[1] } })}>{choice[1].text}</OptionB>
                <VSBadge>VS</VSBadge>
            </Split>
        </QuizCard>
    </QuizScreenDiv>
}

export default QuizScreen;