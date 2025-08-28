import React from "react";
import Header from "./Header";
import styled from "styled-components";

const MainContent = styled.main`
  width: 100vw;
  min-height: calc(100vh - 6.25rem);
  background: ${({ theme }) => theme.base};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MainContent>{children}</MainContent>
      {/* Footer 추가 가능 */}
    </>
  );
}

export default Layout;

