import { Link } from "react-router-dom";
import styled from "styled-components";
import logoCombination from "../logo/amico_logo_combination.svg";
import { useAuth } from "../AuthContext";

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 2vw;
  width: 100%;
  box-sizing: border-box;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  height: 5rem;
  font-weight: 900;
  color: ${(props) => props.theme.accent};
  display:flex;
  align-items:center;
  letter-spacing: 0.05em;
  user-select: none;
`;

const LogoImg = styled.img`
  height: 5rem;
  max-width: 100%;
  @media (max-width: 48rem) {
    height: 3rem;
  }
`;

const NavArea = styled.nav`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavUl = styled.ul`
  display: flex;
  flex-direction: row;
  list-style: none;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
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
  
  button {
    display: block;
    text-decoration: none;
    color: ${(props) => props.theme.sub};
    font-size: 1.1rem;
    padding: 0.625rem 1.125rem;
    border-radius: 0.5rem;
    transition: background 0.2s, color 0.2s;
    font-weight: 500;
    letter-spacing: 0.02em;
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    
    &:hover {
      background: ${(props) => props.theme.subHover};
      color: #fff;
    }
  }
  
  @media (max-width: 48rem) {
    a, button {
      font-size: 1rem;
      padding: 0.75rem 0.5rem;
      border-radius: 0.375rem;
    }
  }
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${(props) => props.theme.accent};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-right: 0.75rem;
  font-size: 1.2rem;

  @media (max-width: 48rem) {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
    margin-right: 0.5rem;
  }
`;


const LogoutSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-left: 0.75rem;
  border-left: 1px solid ${(props) => props.theme.baseHover};
`;

const UserInfo = styled.span`
  color: ${(props) => props.theme.text};
  font-size: 0.9rem;
  width: 100%;
  text-align: left;
  font-weight: 600;
  opacity: 0.8;
  


  @media (max-width: 48rem) {
    text-align: center;
    padding: 0.5em;
    font-size: 0.8rem;
  }
`;

const NavRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

function Header() {
  const { user } = useAuth();

  return (
    <HeaderContainer>
      <Logo>
        <LogoImg src={logoCombination} alt="Amico Logo" />
      </Logo>

      {user && (
        <NavRightSide>
          <NavArea>
            <NavUl>
              <NavLi>
                <Link to={'/home'}>Home</Link>
              </NavLi>
              <NavLi>
                <Link to={'/quiz'}>Quiz</Link>
              </NavLi>
              <NavLi>
                <Link to={'/chat'}>Chat</Link>
              </NavLi>
            </NavUl>
          </NavArea>
        </NavRightSide>
      )}
    </HeaderContainer>
  );
}

export default Header;
