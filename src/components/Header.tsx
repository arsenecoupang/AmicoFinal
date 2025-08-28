import { Link } from "react-router-dom";
import { styled } from "styled-components";
import logoCombination from "../logo/amico_logo_combination.svg";

const Logo = styled.div`
  font-size: 2.5rem;
  height: 5rem;
  font-weight: 900;
  color: ${(props) => props.theme.accent};

  letter-spacing: 0.05em;
  text-shadow: none;
  user-select: none;
  padding-bottom: 0.5rem;
  width: 100%;
`;

const NavDiv = styled.div`
  width: 100%;
  min-height: 5rem;
  box-sizing: border-box;
  padding: 0 2.5rem;
  background-color: ${(props) => props.theme.base};
  display: flex;
  align-items: center;
  z-index: 10;
  @media (max-width: 48rem) {
    min-height: 3rem;
    padding: 0 0.75rem;
  }
`;

const NavUl = styled.ul`
  display: flex;
  flex-direction: row;
  list-style: none;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  @media (max-width: 48rem) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
    justify-content: flex-start;
    width: 100%;
    padding: 0.5rem 0;
  }
`;

const NavLi = styled.li`
  a {
    display: block;
    text-decoration: none;
    color: ${(props) => props.theme.sub};
    font-size: 1.1rem;
    padding: 0.625rem 1.125rem;
    border-radius: 0.5rem;
    transition: background 0.2s, color 0.2s;
    font-weight: 500;
    letter-spacing: 0.02em;
    &:hover {
      background: ${(props) => props.theme.subHover};
      color: #fff;
    }
  }
  @media (max-width: 48rem) {
    a {
      font-size: 1rem;
      padding: 0.75rem 0.5rem;
      border-radius: 0.375rem;
    }
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <Logo>
        <LogoImg src={logoCombination} alt="Amico Logo" />
      </Logo>
      <div>
        <NavDiv>
          <NavUl>
            <NavLi>
              <Link to={"/home"}>Home</Link>
            </NavLi>
            <NavLi>
              <Link to={"/quiz"}>Quiz</Link>
            </NavLi>
            <NavLi>
              <Link to={"/chat"}>Chat</Link>
            </NavLi>
          </NavUl>
        </NavDiv>
      </div>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
`;

const LogoImg = styled.img`
  height: 5rem;
`;

export default Header;
