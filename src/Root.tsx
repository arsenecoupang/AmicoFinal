import React from 'react';
import {Outlet} from "react-router-dom";
import {styled} from "styled-components";
import Header from "./components/Header";
import {ThemeProvider} from "styled-components";
import { lightTheme } from './theme';

const RootDiv = styled.div`
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    
`;

function Root() {
  return <ThemeProvider theme={lightTheme}>
      <RootDiv>
        <Header/>
        {process.env.NODE_ENV === 'development' && <DebugBanner>개발 모드: 렌더링 확인</DebugBanner>}
        <Outlet/>
      </RootDiv>
  </ThemeProvider>;
}

export default Root;

const DebugBanner = styled.div`
  background: rgba(168,198,134,0.12);
  color: #27411b;
  padding: 0.5rem 1rem;
  text-align: center;
  font-weight: 700;
`;
