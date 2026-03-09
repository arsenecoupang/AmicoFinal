import { styled } from "styled-components";

const NotFoundDiv = styled.div`
    min-height: calc(100vh - 6.25rem);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 2rem 1rem;
    background: ${(props) => props.theme.base};
`;

const Title = styled.h1`
    font-size: clamp(2.25rem, 6vw, 4rem);
    line-height: 1.1;
    margin: 0;
`;

const Message = styled.p`
    margin: 0;
    font-size: 1rem;
    opacity: 0.8;
    text-align: center;
`;

const Actions = styled.div`
    margin-top: 0.5rem;
`;

const HomeLink = styled.a`
    display: inline-block;
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid currentColor;
    text-decoration: none;
    color: inherit;
    transition: transform 120ms ease, opacity 120ms ease;
    will-change: transform, opacity;

    &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
        opacity: 0.8;
    }
`;

function NotFound() {
	return (
		<NotFoundDiv role="main" aria-label="페이지를 찾을 수 없음">
			<Title>404</Title>
			<Message>요청하신 페이지를 찾을 수 없습니다.</Message>
			<Actions>
				<HomeLink href="/">홈으로 가기</HomeLink>
			</Actions>
		</NotFoundDiv>
	);
}

export default NotFound;
