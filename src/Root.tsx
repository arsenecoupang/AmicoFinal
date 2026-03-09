import React from "react";
import { Outlet } from "react-router-dom";
import { styled } from "styled-components";
import Header from "./components/Header";

const RootDiv = styled.div`
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
`;

function Root() {
	return (
		<RootDiv>
			<Header />
			<Outlet />
		</RootDiv>
	);
}

export default Root;
