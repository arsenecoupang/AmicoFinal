import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../AuthContext";
import logoCombination from "../logo/amico_logo_combination.svg";

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;

  padding: 0 2vw;
  height: 80px;
  width: 100%;
  box-sizing: border-box;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  height: 5rem;
  font-weight: 900;
  position: absolute;
  top: 0;
  left: 0;
  color: ${(props) => props.theme.accent};
  display: flex;
  align-items: center;
  letter-spacing: 0.05em;
  user-select: none;
`;

const LogoImg = styled.img`
  height: 5rem;
  max-width: 100%;
  @media (max-width: 1000px) {
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
  @media (max-width: 370px) {
    gap: 0px;
  }
`;

const NavLi = styled.li<{ isActive?: boolean }>`
  a {
    display: block;
    text-decoration: none;
    color: ${(props) => (props.isActive ? props.theme.main : props.theme.sub)};
    background: ${(props) =>
			props.isActive ? props.theme.baseHover : "transparent"};
    font-size: 1.1rem;
    padding: 0.625rem 1.125rem;
    border-radius: 0.5rem;
    transition: background 0.2s ease-in, color 0.2s ease-in;
    font-weight: ${(props) => (props.isActive ? "700" : "500")};
    letter-spacing: 0.02em;
    &:hover {
      background: ${(props) => props.theme.subHover};
      color: #fff;
    }
  }

  button {
    display: block;
    text-decoration: none;
    color: ${(props) => (props.isActive ? props.theme.main : props.theme.sub)};
    background: ${(props) =>
			props.isActive ? props.theme.baseHover : "transparent"};
    font-size: 1.1rem;
    padding: 0.625rem 1.125rem;
    border-radius: 0.5rem;
    transition: background 0.2s, color 0.2s;
    font-weight: ${(props) => (props.isActive ? "700" : "500")};
    letter-spacing: 0.02em;
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
    a,
    button {
      font-size: 1rem;
      padding: 0.75rem 0.5rem;
      border-radius: 0.375rem;
    }
  }
`;

const UserAvatar = styled.div<{ isClickable?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${(props) => props.theme.main};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: ${(props) => (props.isClickable ? "pointer" : "default")};
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    ${(props) =>
			props.isClickable &&
			`
      background: ${props.theme.mainHover};
      border: 2px solid ${props.theme.baseHover};
    `}
  }

  @media (max-width: 48rem) {
    width: 2rem;
    height: 2rem;
    font-size: 0.9rem;
  }
`;

const UserSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const UserDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid ${(props) => props.theme.baseHover};
  min-width: 200px;
  z-index: 1000;
  opacity: ${(props) => (props.isOpen ? "1" : "0")};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transform: ${(props) =>
		props.isOpen ? "translateY(0)" : "translateY(-10px)"};
  transition: all 0.2s ease;

  @media (max-width: 48rem) {
    min-width: 180px;
    right: -1rem;
  }
`;

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.baseHover};
  text-align: center;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.text};
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const UserEmail = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.textHover};
  opacity: 0.7;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${(props) => props.theme.text};
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${(props) => props.theme.baseHover};
  }

  &.logout {
    color: #dc3545;
    border-top: 1px solid ${(props) => props.theme.baseHover};

    &:hover {
      background: #ffeaea;
    }
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const NavRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 48rem) {
    gap: 1rem;
  }
`;

function Header() {
	const { user, logout } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleLogout = async () => {
		try {
			await logout();
			navigate("/login");
		} catch (error) {
			console.error("로그아웃 실패:", error);
		}
		setIsDropdownOpen(false);
	};

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	// 드롭다운 외부 클릭 시 닫기
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const isCurrentPage = (path: string) => {
		if (path === "/home") {
			return location.pathname === "/" || location.pathname === "/home";
		}
		return location.pathname === path;
	};

	return (
		<HeaderContainer>
			<Logo>
				<LogoImg src={logoCombination} alt="Amico Logo" />
			</Logo>

			{user && (
				<NavRightSide>
					<NavArea>
						<NavUl>
							<NavLi isActive={isCurrentPage("/home")}>
								<Link to={"/home"}>Home</Link>
							</NavLi>
							<NavLi isActive={isCurrentPage("/quiz")}>
								<Link to={"/quiz"}>Quiz</Link>
							</NavLi>
							<NavLi isActive={isCurrentPage("/chat")}>
								<Link to={"/chat"}>Chat</Link>
							</NavLi>
						</NavUl>
					</NavArea>

					<UserSection ref={dropdownRef}>
						<UserAvatar isClickable onClick={toggleDropdown}>
							{user.username ? user.username.charAt(0).toUpperCase() : "?"}
						</UserAvatar>

						<UserDropdown isOpen={isDropdownOpen}>
							<DropdownHeader>
								<UserName>{user.username}</UserName>
								<UserEmail>{user.email}</UserEmail>
							</DropdownHeader>

							<DropdownItem className="logout" onClick={handleLogout}>
								<span>로그아웃</span>
							</DropdownItem>
						</UserDropdown>
					</UserSection>
				</NavRightSide>
			)}
		</HeaderContainer>
	);
}

export default Header;
