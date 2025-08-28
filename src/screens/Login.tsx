import React, { useState } from "react";
import {styled, keyframes} from "styled-components";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
    min-height: calc(100vh - 6.25rem);
    
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 0 1.5rem;
    background: ${(props) => props.theme.base};
    position: relative;
    overflow: hidden;
`;


const LoginForm = styled.form`
    background-color: #fff;
    padding: 2.5rem 2rem;
    border-radius: 0;
    box-shadow: 0 2px 16px rgba(168,198,134,0.10);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    width: 100%;
    max-width: 26rem;
    animation: ${fadeInUp} 0.8s cubic-bezier(.5,1.5,.5,1) both;
    position: relative;
    h1 {
        color: ${(props) => props.theme.main};
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 1rem;
        text-align: center;
        background: none;
        -webkit-background-clip: initial;
        -webkit-text-fill-color: initial;
        background-clip: initial;
    }
    div {
        width: 100%;
    }
    @media (max-width: 48rem) {
        padding: 2rem 1rem;
        max-width: 100%;
        h1 {
            font-size: 1.5rem;
        }
    }
`;

const LoginInput = styled.input<{ error?: boolean }>`
    border: none;
    border-bottom: 2px solid ${props => props.error ? '#e74c3c' : props.theme.sub};
    padding: 0.85rem 0.5rem;
    margin-bottom: 1.2rem;
    width: 100%;
    box-sizing: border-box;
    font-size: 1.15rem;
    background: ${props => props.error ? '#ffeaea' : props.theme.baseHover};
    color: ${props => props.theme.text};
    border-radius: 0;
    transition: border-color 0.25s, background 0.25s;
    &::placeholder {
        color: ${props => props.theme.textHover};
        opacity: 0.7;
        font-weight: 500;
    }
    &:focus {
        outline: none;
        border-bottom: 2px solid ${props => props.error ? '#e74c3c' : props.theme.subHover};
        background: #fff;
    }
`;

const LoginButton = styled.button`
    width: 100%;
    padding: 0.85rem 0;
    background: ${props => props.theme.main};
    color: #fff;
    border: none;
    border-radius: 0;
    font-size: 1.15rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 1rem;
    box-shadow: 0 2px 12px rgba(168,198,134,0.10);
    transition: background 0.25s, transform 0.15s;
    letter-spacing: 0.03em;
    &:hover, &:focus {
        background: ${props => props.theme.mainHover};
        outline: none;
        transform: scale(1.04);
    }
`;

const HelperText = styled.p`
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${props => props.theme.text};
    font-size: 1rem;
    opacity: 0.85;
`;

function Login (){
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: "", password: "", email: "" });
    const [errors, setErrors] = useState({ username: false, password: false, email: false });
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: false }); // 입력 시 에러 해제
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 입력값 검사
        const newErrors = {
            username: formData.username.trim() === "",
            password: formData.password.trim() === "",
            email: !isLogin && formData.email.trim() === ""
        };
        setErrors(newErrors);
        // 에러가 있으면 제출 중단
        if (newErrors.username || newErrors.password || newErrors.email) return;
        // 실제 서버 연결 없이 바로 로그인 처리
        login({ username: formData.username, email: formData.email });
        navigate("/home");
    };

    return <Container>

        <LoginForm onSubmit={handleSubmit}>
            <h1>{isLogin ? "로그인" : "회원가입"}</h1>
            <div>
                {!isLogin && (
                    <>
                        <HelperText>이메일</HelperText>
                        <LoginInput
                            type="email"
                            name="email"
                            placeholder="이메일을 입력하세요"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={errors.email}
                        />
                        {errors.email && <HelperText style={{color:'#e74c3c'}}>이메일을 입력하세요.</HelperText>}
                    </>
                )}
                <HelperText>아이디</HelperText>
                <LoginInput
                    type="text"
                    name="username"
                    placeholder="아이디를 입력하세요"
                    value={formData.username}
                    onChange={handleInputChange}
                    error={errors.username}
                />
                {errors.username && <HelperText style={{color:'#e74c3c'}}>아이디를 입력하세요.</HelperText>}
                <HelperText>비밀번호</HelperText>
                <LoginInput
                    type="password"
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                />
                {errors.password && <HelperText style={{color:'#e74c3c'}}>비밀번호를 입력하세요.</HelperText>}
                <LoginButton type="submit">{isLogin ? "로그인" : "회원가입"}</LoginButton>
            </div>
            <HelperText>
                {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
                <span
                    style={{ color: "#A8C686", cursor: "pointer" }}
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? " 회원가입" : " 로그인"}
                </span>
            </HelperText>
        </LoginForm>
    </Container>;
}

export default Login;