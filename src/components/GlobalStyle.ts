import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    background: ${({ theme }) => theme.base};
    color: ${({ theme }) => theme.text};
    min-height: 100vh;
  }
  *, *::before, *::after {
    box-sizing: inherit;
    font-family: inherit;
  }
  a {
    color: ${({ theme }) => theme.sub};
    text-decoration: none;
    transition: color 0.2s;
    &:hover {
      color: ${({ theme }) => theme.subHover};
    }
  }
  /* 전역 버튼/입력 스타일 강제 제거: 각 컴포넌트 스타일이 우선 적용되도록 최소화 */
  button {
    font-family: inherit;
    cursor: pointer;
  }
  input, textarea {
    font-family: inherit;
    color: ${({ theme }) => theme.text};
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-family: inherit;
    font-weight: 700;
  }
  ::selection {
    background: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.textHover};
  }
`;

export default GlobalStyle;
