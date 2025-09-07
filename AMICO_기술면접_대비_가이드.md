# 🎯 AMICO 앱 기술 면접 대비 완벽 가이드

## 📋 프로젝트 개요

**AMICO**는 학급 커뮤니티를 위한 React + TypeScript + Supabase 기반의 웹 애플리케이션입니다.

---

## 🏗️ 1. 전체 아키텍처 및 기술 스택

### **프론트엔드**

- **React 18 + TypeScript**: 컴포넌트 기반 UI 개발
- **Styled-components**: CSS-in-JS 스타일링
- **React Router Dom**: SPA 라우팅
- **Context API**: 전역 상태 관리

### **백엔드**

- **Supabase**:
  - PostgreSQL 데이터베이스
  - 실시간 구독 (Realtime)
  - 인증 시스템 (Auth)

---

## 🔐 2. 인증 시스템 (AuthContext.tsx)

### **핵심 구현**

```tsx
// 1. 전역 사용자 상태 관리
const [user, setUser] = useState<User | null>(() => {
  try {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
});

// 2. 로딩 상태 관리
const [loading, setLoading] = useState<boolean>(true);
```

### **세션 복원 로직**

```tsx
useEffect(() => {
  const getSession = async () => {
    const res = await supabase.auth.getSession();
    const session = res?.data?.session ?? null;

    if (session && session.user) {
      // Supabase profiles 테이블에서 사용자 정보 가져오기
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, realname")
        .eq("id", session.user.id)
        .single();

      setUser({
        id: session.user.id,
        username: profileData.username,
        email: session.user.email,
      });
    }
  };
  getSession();
}, []);
```

### **실시간 인증 상태 감지**

```tsx
const authListener = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    setUser(null);
  } else if (event === "SIGNED_IN") {
    // 프로필 데이터 다시 로드
  }
});
```

**면접 포인트**: "localStorage로 사용자 정보를 유지하면서, useEffect로 페이지 로드 시 Supabase 세션을 복원합니다. onAuthStateChange로 실시간 로그인/로그아웃 상태를 감지해서 UI를 자동 업데이트합니다."

---

## 🏠 3. 메인 화면 (MainScreen.tsx)

### **상태 관리**

```tsx
// 1. 온도 데이터 상태
const [temperature, setTemperature] = useState<number>(0);

// 2. 랭킹 데이터 상태
const [ranking, setRanking] = useState<any[]>([]);

// 3. 반별 비교 데이터
const [classComparison, setClassComparison] = useState<any[]>([]);

// 4. MVP 히스토리
const [mvpHistory, setMvpHistory] = useState<any[]>([]);
```

### **데이터 페칭**

```tsx
useEffect(() => {
  if (!user) return;

  const fetchData = async () => {
    // 1. 내 온도 가져오기
    const { data: tempData } = await supabase
      .from("profiles")
      .select("temperature")
      .eq("id", user.id)
      .single();
    setTemperature(tempData?.temperature || 0);

    // 2. 상위 5명 랭킹
    const { data: rankingData } = await supabase
      .from("profiles")
      .select("username, temperature")
      .order("temperature", { ascending: false })
      .limit(5);
    setRanking(rankingData || []);

    // 3. 반별 평균 온도
    const { data: classData } = await supabase
      .from("profiles")
      .select("class, temperature")
      .not("class", "is", null);

    const classStats = classData.reduce((acc, curr) => {
      if (!acc[curr.class]) acc[curr.class] = { total: 0, count: 0 };
      acc[curr.class].total += curr.temperature;
      acc[curr.class].count += 1;
      return acc;
    }, {});

    setClassComparison(
      Object.entries(classStats).map(([className, stats]) => ({
        class: className,
        average: Math.round(stats.total / stats.count),
      }))
    );
  };

  fetchData();
}, [user]); // user가 변경될 때만 실행
```

**면접 포인트**: "useEffect의 의존성 배열에 [user]를 넣어서 로그인한 사용자가 바뀔 때만 데이터를 새로 불러옵니다. 여러 개의 Supabase 쿼리를 async/await로 처리하고, JavaScript reduce를 사용해 반별 평균을 계산합니다."

---

## 💬 4. 실시간 채팅 (Chat.tsx)

### **실시간 메시지 구독**

```tsx
useEffect(() => {
  if (!roomId) return;

  // 1. 기존 메시지 불러오기
  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("room", roomId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };
  fetchMessages();

  // 2. 실시간 구독 설정
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room=eq.${roomId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  // 3. 정리 함수
  return () => {
    supabase.removeChannel(channel);
  };
}, [roomId]); // roomId가 바뀔 때마다 새로운 채널 구독
```

### **메시지 전송**

```tsx
const sendMessage = async () => {
  if (!input.trim()) return;

  await supabase.from("messages").insert({
    room: roomId,
    nickname: user.username,
    content: input,
    user_id: user.id,
  });

  setInput(""); // 입력창 초기화
};
```

**면접 포인트**: "Supabase Realtime으로 postgres_changes 이벤트를 구독해서 새 메시지가 INSERT될 때마다 실시간으로 UI를 업데이트합니다. useEffect의 return 함수로 컴포넌트 언마운트 시 채널을 정리합니다."

---

## 📝 5. 로그인/회원가입 (Login.tsx)

### **폼 상태 관리**

```tsx
const [isLogin, setIsLogin] = useState(true); // 로그인/회원가입 전환

const [formData, setFormData] = useState({
  username: "",
  password: "",
  email: "",
  realname: "",
  class: "1반", // 기본값 설정
});

const [errors, setErrors] = useState({
  username: false,
  password: false,
  email: false,
  realname: false,
  class: false,
});
```

### **입력 처리 (TypeScript)**

```tsx
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;
  setFormData({ ...formData, [name]: value });
  setErrors({ ...errors, [name]: false });
  setErrorMsg("");
};
```

### **회원가입 처리**

```tsx
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // 1. 유효성 검사
  const newErrors = {
    username: !isLogin && formData.username.trim() === "",
    password: formData.password.trim() === "",
    email: formData.email.trim() === "",
    realname: !isLogin && formData.realname.trim() === "",
    class: !isLogin && formData.class.trim() === "",
  };

  if (Object.values(newErrors).some((error) => error)) return;

  if (isLogin) {
    // 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
  } else {
    // 회원가입
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

    // profiles 테이블에 추가 정보 저장
    await supabase.from("profiles").insert({
      id: data.user.id,
      username: formData.username,
      realname: formData.realname,
      class: formData.class,
      temperature: 0,
    });
  }
};
```

**면접 포인트**: "TypeScript로 이벤트 타입을 정확히 지정하고, 스프레드 연산자로 불변성을 유지하면서 상태를 업데이트합니다. Object.values()와 some()으로 유효성 검사를 효율적으로 처리합니다."

---

## 🎮 6. 밸런스 게임 (Quiz.tsx)

### **localStorage 연동**

```tsx
// 퀴즈 결과를 localStorage에 저장
const handleSubmit = async (option: "A" | "B") => {
  // Supabase에 투표 저장
  await supabase.from("quiz_responses").insert({
    user_id: user.id,
    question_id: currentQuestion.id,
    choice: option,
  });

  // localStorage에 저장 (Chat에서 사용)
  const quizResult = {
    questionId: currentQuestion.id,
    choice: option,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("quizResult", JSON.stringify(quizResult));

  navigate("/chat");
};
```

### **실시간 투표 결과**

```tsx
useEffect(() => {
  if (!currentQuestion) return;

  // 실시간 투표 수 업데이트
  const channel = supabase
    .channel(`votes-${currentQuestion.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "quiz_responses",
        filter: `question_id=eq.${currentQuestion.id}`,
      },
      () => {
        // 투표 수 다시 계산
        fetchVoteCounts();
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [currentQuestion?.id]);
```

**면접 포인트**: "localStorage.setItem으로 브라우저에 데이터를 저장하고, JSON.stringify로 객체를 문자열로 변환합니다. 실시간으로 다른 사용자의 투표를 반영하기 위해 Realtime 구독을 사용합니다."

---

## 🏆 7. MVP 투표 시스템 - 중복 투표 방지 (MvpVote.tsx)

### **중복 투표 방지 상태 관리**

```tsx
const [alreadyVoted, setAlreadyVoted] = useState(false);
const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
  null
);

// 기존 투표 확인
useEffect(() => {
  const checkExistingVote = async () => {
    const { data: myVote } = await supabase
      .from("votes")
      .select("candidate_id")
      .eq("voter_id", user.id)
      .in("room_id", roomIds)
      .limit(1)
      .single();

    if (myVote) {
      setSelectedCandidateId(myVote.candidate_id);
      setAlreadyVoted(true);
    }
  };

  if (user && roomIds.length > 0) {
    checkExistingVote();
  }
}, [user, roomIds]);
```

### **조건부 투표 제출**

```tsx
const handleVoteSubmit = async () => {
  // 이미 투표했거나 선택하지 않은 경우 차단
  if (!user || !selectedCandidateId || alreadyVoted) return;

  try {
    const newVotes = userRoomIds.map((roomId) => ({
      id: uuidv4(),
      room_id: roomId,
      voter_id: user.id,
      candidate_id: selectedCandidateId,
    }));

    const { error } = await supabase.from("votes").insert(newVotes);

    if (error) throw error;

    alert("투표가 성공적으로 제출되었습니다. 투표는 변경할 수 없습니다.");
    setAlreadyVoted(true);
  } catch (err) {
    console.error("투표 제출 오류:", err);
  }
};
```

### **UI 상태 기반 조건부 렌더링**

```tsx
// 라디오 버튼 비활성화
<input
  type="radio"
  name="candidate"
  value={c.id}
  checked={isSelected}
  onChange={() => !alreadyVoted && setSelectedCandidateId(c.id)}
  disabled={alreadyVoted}
  style={{ display: "none" }}
/>

// 버튼 비활성화
<Btn
  onClick={handleVoteSubmit}
  disabled={!selectedCandidateId || isLoading || alreadyVoted}
>
  {alreadyVoted ? "투표 완료" : "투표 제출"}
</Btn>

// 메시지 변경
<p>
  {alreadyVoted
    ? "이미 투표를 완료했습니다. 투표는 변경할 수 없습니다."
    : "가장 즐거운 시간을 만들어준 멤버에게 투표하세요."}
</p>
```

### **실시간 투표 집계**

```tsx
useEffect(() => {
  const fetchVoteCounts = async () => {
    const { data: votes } = await supabase
      .from("votes")
      .select("candidate_id")
      .in("room_id", roomIds);

    const counts: Record<string, number> = {};
    if (votes) {
      votes.forEach((v) => {
        counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
      });
    }
    setVoteCounts(counts);
  };

  if (roomIds.length > 0) {
    fetchVoteCounts();
  }
}, [roomIds, alreadyVoted]);
```

**면접 포인트**: "boolean 상태로 투표 여부를 추적하고, 조건부 렌더링과 이벤트 핸들러에서 중복 투표를 방지합니다. disabled 속성과 조건부 함수 호출로 UI와 로직 모두에서 제어합니다. UUID를 사용해 고유한 투표 ID를 생성하고 데이터 무결성을 보장합니다."

---

## 🎨 8. 스타일링 (Styled-components)

### **테마 시스템**

```tsx
// theme.ts
export const theme = {
  main: "#A8C686",
  mainHover: "#95B373",
  sub: "#8E9AAF",
  accent: "#CBC0D3",
  text: "#2D3748",
  base: "#F7FAFC",
};

// 컴포넌트에서 사용
const Button = styled.button`
  background: ${(props) => props.theme.main};
  color: white;

  &:hover {
    background: ${(props) => props.theme.mainHover};
  }
`;
```

### **반응형 디자인**

```tsx
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;
```

**면접 포인트**: "Styled-components로 props를 통해 테마 값을 전달받아 일관된 디자인을 유지합니다. CSS Grid와 미디어 쿼리로 반응형 레이아웃을 구현합니다."

---

## 🔄 9. 상태 관리 패턴

### **Context API 활용**

```tsx
// Store.tsx - 앱 전역 상태
const StoreContext = createContext<StoreState | undefined>(undefined);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
```

### **Custom Hook 패턴**

```tsx
// 인증 상태 관리
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

**면접 포인트**: "Context API로 전역 상태를 관리하고, Custom Hook으로 로직을 재사용 가능하게 만듭니다. 에러 처리로 Provider 외부 사용을 방지합니다."

---

## 🚀 10. 성능 최적화

### **의존성 배열 최적화**

```tsx
// 필요한 값만 의존성으로 설정
useEffect(() => {
  fetchUserData();
}, [user.id]); // user 전체가 아닌 id만 감지

// useMemo로 비용 큰 계산 최적화
const sortedRanking = useMemo(() => {
  return ranking.sort((a, b) => b.temperature - a.temperature);
}, [ranking]);
```

### **조건부 렌더링**

```tsx
{
  user && (
    <UserSection>
      <UserProfile />
    </UserSection>
  );
}

{
  loading ? <LoadingSpinner /> : <MainContent />;
}
```

**면접 포인트**: "useEffect의 의존성 배열을 정확히 설정해서 불필요한 리렌더링을 방지하고, useMemo로 비용이 큰 계산을 최적화합니다."

---

## 📊 11. 데이터베이스 설계

### **주요 테이블 구조**

```sql
-- profiles (사용자 정보)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  realname VARCHAR(50),
  class VARCHAR(10),
  temperature INTEGER DEFAULT 0,
  email VARCHAR(255)
);

-- messages (채팅 메시지)
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  nickname VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- quiz_responses (퀴즈 응답)
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  question_id VARCHAR(100),
  choice VARCHAR(1) CHECK (choice IN ('A', 'B')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**면접 포인트**: "UUID를 기본키로 사용해 보안을 강화하고, 외래키 제약조건으로 데이터 무결성을 보장합니다. CHECK 제약조건으로 유효한 값만 허용합니다."

---

## 🛠️ 12. 에러 처리 및 로딩 상태

### **에러 바운더리**

```tsx
const [error, setError] = useState<string>("");
const [loading, setLoading] = useState<boolean>(false);

const handleSubmit = async () => {
  try {
    setLoading(true);
    setError("");

    const result = await supabase.from("table").insert(data);

    if (result.error) throw result.error;
  } catch (err: any) {
    setError(err.message || "알 수 없는 오류가 발생했습니다");
  } finally {
    setLoading(false);
  }
};
```

**면접 포인트**: "try-catch-finally 패턴으로 에러를 처리하고, TypeScript의 any 타입을 명시적으로 사용해서 에러 객체의 message 속성에 안전하게 접근합니다."

---

## 🧭 13. Header 네비게이션 - 현재 페이지 감지 및 UI 변화

### **useLocation Hook 활용**

```tsx
import { useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  // 현재 페이지인지 확인하는 함수
  const isCurrentPage = (path: string) => {
    if (path === "/home") {
      return location.pathname === "/" || location.pathname === "/home";
    }
    return location.pathname === path;
  };
}
```

### **조건부 스타일링 (Styled-components)**

```tsx
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

    &:hover {
      background: ${(props) => props.theme.subHover};
      color: #fff;
    }
  }
`;
```

### **동적 props 전달**

```tsx
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
```

### **드롭다운 메뉴 상태 관리**

```tsx
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// 드롭다운 토글
const toggleDropdown = () => {
  setIsDropdownOpen(!isDropdownOpen);
};

// 외부 클릭 시 닫기 (useEffect + Event Listener)
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
```

### **조건부 애니메이션 스타일링**

```tsx
const UserDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  opacity: ${(props) => (props.isOpen ? "1" : "0")};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transform: ${(props) =>
    props.isOpen ? "translateY(0)" : "translateY(-10px)"};
  transition: all 0.2s ease;
`;

const UserAvatar = styled.div<{ isClickable?: boolean }>`
  cursor: ${(props) => (props.isClickable ? "pointer" : "default")};
  transition: all 0.2s ease;

  &:hover {
    ${(props) =>
      props.isClickable &&
      `
      background: ${props.theme.mainHover};
      border: 2px solid ${props.theme.baseHover};
    `}
  }
`;
```

**면접 포인트**: "useLocation으로 현재 경로를 감지하고, 조건부 렌더링으로 활성 상태를 표시합니다. useRef와 addEventListener로 외부 클릭을 감지해 드롭다운을 닫습니다. TypeScript 제네릭과 조건부 props로 컴포넌트의 동적 스타일링을 구현합니다."

---

## 🎯 면접 예상 질문 & 답변

### **Q1: React Hooks를 왜 사용했나요?**

"useState로 컴포넌트 상태를 관리하고, useEffect로 사이드 이펙트(API 호출, 구독)를 처리합니다. useContext로 전역 상태에 접근하고, Custom Hook으로 로직을 재사용합니다."

### **Q2: Supabase를 선택한 이유는?**

"PostgreSQL 기반의 안정적인 데이터베이스와 실시간 기능, 그리고 인증 시스템이 모두 제공되어 빠른 개발이 가능했습니다. 또한 무료 티어로 학습 목적에 적합했습니다."

### **Q3: 실시간 기능은 어떻게 구현했나요?**

"Supabase Realtime의 postgres_changes 이벤트를 구독해서 데이터베이스 변경사항을 실시간으로 감지하고, React 상태를 업데이트합니다."

### **Q4: TypeScript를 사용한 이유는?**

"컴파일 타임에 타입 에러를 잡아서 런타임 에러를 줄이고, IDE의 자동완성과 리팩토링 기능을 활용할 수 있어서 개발 효율성이 높아집니다."

### **Q5: Header에서 현재 페이지를 어떻게 감지하나요?**

"useLocation Hook으로 현재 경로 정보를 가져오고, 조건부 함수로 각 메뉴의 활성 상태를 판단합니다. Styled-components의 props를 통해 활성 상태에 따른 다른 스타일을 적용합니다."

### **Q6: 드롭다운 메뉴는 어떻게 구현했나요?**

"useState로 열림/닫힘 상태를 관리하고, useRef와 addEventListener로 외부 클릭을 감지해 자동으로 닫힙니다. CSS transform과 opacity를 조합해 부드러운 애니메이션을 구현했습니다."

### **Q7: MVP 투표에서 중복 투표를 어떻게 방지했나요?**

"alreadyVoted 상태로 투표 여부를 추적하고, 조건부 렌더링으로 UI를 제어합니다. disabled 속성과 조건부 이벤트 핸들러로 이중 보안을 적용했습니다. 데이터베이스에서 기존 투표를 조회해 초기 상태를 설정합니다."

### **Q8: 투표 집계는 실시간으로 어떻게 업데이트되나요?**

"다른 사용자의 투표가 완료될 때마다 fetchVoteCounts 함수를 호출해 최신 투표 현황을 가져옵니다. JavaScript reduce 함수로 후보자별 득표수를 계산하고, 퍼센티지로 변환해 진행률 바에 표시합니다."

---

**이 가이드로 면접에서 자신 있게 기술적 질문에 답변할 수 있을 것입니다! 화이팅! 🚀**
