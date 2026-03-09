import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "styled-components";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";

const Container = styled.div`
  min-height: calc(100vh - 6.25rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0 1.5rem;
  background: ${(props) => props.theme.base};
`;

const LoginForm = styled.form`
  background-color: #fff;
  padding: 2.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 26rem;
  position: relative;
  h1 {
    color: ${(props) => props.theme.main};
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1rem;
    text-align: center;
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

const LoginInput = styled.input.withConfig({
	shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>`
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.error ? "#e74c3c" : props.theme.sub)};
  padding: 0.75rem 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
  box-sizing: border-box;
  font-size: 1rem;
  background: ${(props) => (props.error ? "#ffeaea" : "#f8f9fa")};
  color: ${(props) => props.theme.text};
  border-radius: 4px;
  transition: border-color 0.2s, background 0.2s;
  &::placeholder {
    color: #6c757d;
    opacity: 0.7;
    font-weight: 400;
  }
  &:focus {
    outline: none;
    border-bottom: 2px solid
      ${(props) => (props.error ? "#e74c3c" : props.theme.subHover)};
    background: #fff;
  }
`;

const LoginSelect = styled.select<{ error?: boolean }>`
  width: 100%;
  padding: 0.75rem 0.5rem;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.error ? "#e74c3c" : props.theme.sub)};
  background: #f8f9fa;
  font-size: 1rem;
  font-weight: 400;
  font-family: inherit;
  color: ${(props) => props.theme.text};
  border-radius: 4px;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-bottom: 2px solid
      ${(props) => (props.error ? "#e74c3c" : props.theme.subHover)};
    background: #fff;
  }

  option {
    background: #fff;
    color: ${(props) => props.theme.text};
  }
`;
const LoginButton = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  background: ${(props) => props.theme.main};
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
  &:hover,
  &:focus {
    background: ${(props) => props.theme.mainHover};
    outline: none;
  }
`;

const HelperText = styled.p`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.text};
  font-size: 1rem;
  opacity: 0.85;
`;

function Login() {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		email: "",
		realname: "",
		class: "1반",
	});
	const [errors, setErrors] = useState({
		username: false,
		password: false,
		email: false,
		realname: false,
		class: false,
	});
	const { login } = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		setErrors({ ...errors, [name]: false });
		setErrorMsg("");
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const newErrors = {
			// username is only required when signing up
			username: !isLogin && formData.username.trim() === "",
			password: formData.password.trim() === "",
			// email is required for login and signup
			email: formData.email.trim() === "",
			realname: !isLogin && formData.realname.trim() === "",
			class: !isLogin && formData.class.trim() === "",
		};
		setErrors(newErrors);
		if (
			newErrors.username ||
			newErrors.password ||
			newErrors.email ||
			newErrors.realname ||
			newErrors.class
		)
			return;
		setLoading(true);
		setErrorMsg("");
		try {
			console.log("Attempting login with:", {
				email: formData.email,
				password: "***",
			});
			console.log("Supabase client initialized:", !!supabase);

			if (isLogin) {
				// 로그인
				const { data, error } = await supabase.auth.signInWithPassword({
					email: formData.email,
					password: formData.password,
				});

				console.log("Login response:", { data: !!data, error: error?.message });

				if (error) throw error;

				// 프로필 정보 가져오기
				const { data: profileData } = await supabase
					.from("profiles")
					.select("username, realname, role")
					.eq("id", data.user.id)
					.single();

				console.log("Profile data:", profileData);

				login({
					id: data.user.id,
					username: profileData?.username || "",
					email: formData.email,
					role: profileData?.role || undefined,
				});
				navigate("/home");
			} else {
				// 회원가입
				console.log("Attempting signup with:", { email: formData.email });

				// 1. 중복 이메일 검사
				const { data: existingEmail } = await supabase
					.from("profiles")
					.select("email")
					.eq("email", formData.email)
					.single();

				if (existingEmail) {
					throw new Error("이미 사용 중인 이메일입니다.");
				}

				// 2. 중복 별명 검사
				const { data: existingUsername } = await supabase
					.from("profiles")
					.select("username")
					.eq("username", formData.username)
					.single();

				if (existingUsername) {
					throw new Error(
						"이미 사용 중인 별명입니다. 다른 별명을 선택해주세요.",
					);
				}

				// 3. 중복 실명 검사 (같은 반 내에서)
				const { data: existingRealname } = await supabase
					.from("profiles")
					.select("realname, class")
					.eq("realname", formData.realname)
					.eq("class", formData.class)
					.single();

				if (existingRealname) {
					throw new Error(
						`${formData.class}에 이미 같은 이름이 있습니다. 본명을 정확히 입력해주세요.`,
					);
				}

				console.log("Starting signup process...");

				// Supabase 연결 테스트
				try {
					const { data: testData, error: testError } = await supabase
						.from("profiles")
						.select("id")
						.limit(1);
					console.log("Supabase connection test:", { testData, testError });

					if (testError) {
						console.error(
							"Supabase connection or table access failed:",
							testError,
						);
					}
				} catch (testErr) {
					console.error("Supabase test failed:", testErr);
				}

				// 회원가입 시도
				const { data, error } = await supabase.auth.signUp({
					email: formData.email,
					password: formData.password,
					options: {
						data: {
							username: formData.username,
							realname: formData.realname,
							class: formData.class,
						},
					},
				});

				console.log("Signup response:", {
					hasData: !!data,
					hasUser: !!data?.user,
					hasSession: !!data?.session,
					userId: data?.user?.id,
					errorMessage: error?.message,
					errorCode: error?.status,
				});

				if (error) {
					console.error("Signup error:", error);
					throw new Error(`회원가입 실패: ${error.message}`);
				}

				if (!data?.user) {
					throw new Error("사용자 정보를 받아오지 못했습니다.");
				}

				console.log("User created successfully, attempting login first...");

				// 먼저 로그인하여 세션 확보
				const { data: signInData, error: signInError } =
					await supabase.auth.signInWithPassword({
						email: formData.email,
						password: formData.password,
					});

				console.log("Sign in after signup:", {
					hasSession: !!signInData?.session,
					hasUser: !!signInData?.user,
					error: signInError?.message,
				});

				if (signInError) {
					console.error("Sign in after signup failed:", signInError);
					throw new Error(`로그인 실패: ${signInError.message}`);
				}

				if (!signInData?.session || !signInData?.user) {
					throw new Error(
						"로그인 세션을 생성할 수 없습니다. Supabase 설정을 확인해주세요.",
					);
				}

				console.log("Login successful, now creating profile...");
				console.log("User ID for profile:", signInData.user.id);
				console.log("Profile data to insert:", {
					id: signInData.user.id,
					email: formData.email,
					username: formData.username,
					realname: formData.realname,
					class: formData.class,
					temperature: 0,
				});

				// 로그인 후 프로필 생성 (인증된 상태에서)
				const { data: profileData, error: profileError } = await supabase
					.from("profiles")
					.insert([
						{
							id: signInData.user.id,
							email: formData.email,
							username: formData.username,
							realname: formData.realname,
							class: formData.class,
							temperature: 0,
						},
					])
					.select()
					.single();

				console.log("Profile creation detailed result:", {
					profileData,
					profileError,
					errorMessage: profileError?.message,
					errorCode: profileError?.code,
					errorDetails: profileError?.details,
					hint: profileError?.hint,
				});

				if (profileError) {
					if (profileError.code === "23505") {
						console.log("Profile already exists, continuing...");
					} else if (profileError.code === "42501") {
						console.error("Permission denied - check RLS policies!");
						throw new Error(
							"프로필 생성 권한이 없습니다. 관리자에게 문의하세요.",
						);
					} else {
						console.error("Profile creation failed:", profileError);
						throw new Error(`프로필 생성 실패: ${profileError.message}`);
					}
				} else {
					console.log("Profile created successfully:", profileData);
				}

				// AuthContext에 로그인 상태 설정
				login({
					id: signInData.user.id,
					username: formData.username,
					email: formData.email,
				});

				console.log("Signup and login completed successfully");
				navigate("/home");
			}
		} catch (err: any) {
			console.error("Auth error:", err);
			setErrorMsg(err.message || "오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container>
			<LoginForm onSubmit={handleSubmit}>
				<h1>{isLogin ? "로그인" : "회원가입"}</h1>
				<div>
					{/* Email should be provided for both login and signup */}
					<HelperText>이메일</HelperText>
					<LoginInput
						type="email"
						name="email"
						placeholder="이메일을 입력하세요"
						value={formData.email}
						onChange={handleInputChange}
						error={errors.email}
					/>
					{errors.email && (
						<HelperText style={{ color: "#e74c3c" }}>
							이메일을 입력하세요.
						</HelperText>
					)}

					{!isLogin && (
						<>
							<HelperText>실제 이름</HelperText>
							<LoginInput
								type="text"
								name="realname"
								placeholder="실제 이름을 입력하세요"
								value={formData.realname}
								onChange={handleInputChange}
								error={errors.realname}
							/>
							{errors.realname && (
								<HelperText style={{ color: "#e74c3c" }}>
									실제 이름을 입력하세요.
								</HelperText>
							)}

							<HelperText>반</HelperText>
							<LoginSelect
								name="class"
								value={formData.class}
								onChange={handleInputChange}
								error={errors.class}
							>
								<option value="1반">1반</option>
								<option value="2반">2반</option>
								<option value="3반">3반</option>
								<option value="4반">4반</option>
								<option value="5반">5반</option>
								<option value="6반">6반</option>
								<option value="7반">7반</option>
								<option value="8반">8반</option>
							</LoginSelect>
							{errors.class && (
								<HelperText style={{ color: "#e74c3c" }}>
									반을 선택해주세요.
								</HelperText>
							)}
							<HelperText>사용자 아이디</HelperText>
							<LoginInput
								type="text"
								name="username"
								placeholder="사용자 아이디를 입력하세요"
								value={formData.username}
								onChange={handleInputChange}
								error={errors.username}
							/>
							{errors.username && (
								<HelperText style={{ color: "#e74c3c" }}>
									사용자 아이디를 입력하세요.
								</HelperText>
							)}
						</>
					)}
					<HelperText>비밀번호</HelperText>
					<LoginInput
						type="password"
						name="password"
						placeholder="비밀번호를 입력하세요"
						value={formData.password}
						onChange={handleInputChange}
						error={errors.password}
					/>
					{errors.password && (
						<HelperText style={{ color: "#e74c3c" }}>
							비밀번호를 입력하세요.
						</HelperText>
					)}
					<LoginButton type="submit" disabled={loading}>
						{isLogin ? "로그인" : "회원가입"}
					</LoginButton>
					{errorMsg && (
						<HelperText style={{ color: "#e74c3c", whiteSpace: "pre-line" }}>
							{errorMsg}
						</HelperText>
					)}
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
		</Container>
	);
}

export default Login;
