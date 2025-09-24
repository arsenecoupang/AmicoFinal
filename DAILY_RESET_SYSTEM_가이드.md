# 📅 AMICO Daily Reset System 작동 순서

## � 실행 순서

### **1단계: 중복 생성 방지 검사**

- 오늘 날짜의 퀴즈가 이미 존재하는지 확인
- 존재하면 종료 (GPT 토큰 절약)

### **2단계: 이전 데이터 정리**

- 채팅 메시지 삭제 (`chats` 테이블)
- 투표 데이터 삭제 (`votes` 테이블)
- 채팅방 삭제 (`rooms` 테이블)

### **3단계: 새로운 질문 생성**

- GPT API 호출 (최대 3회 재시도)
- 응답 검증 (길이, 형식, 부적절 내용 필터링)
- 실패 시 미리 준비된 질문 풀에서 랜덤 선택

### **4단계: 데이터베이스 저장**

- 생성된 질문을 `questions` 테이블에 저장
- UUID 생성 및 타임스탬프 추가

## 🔄 실행 방법

- **수동**: `npm run daily-reset`
- **자동**: cron job으로 매일 자정 실행

```typescript
// API 할당량 초과 처리
if (res.status === 429 || json?.error?.code === "insufficient_quota") {
  console.warn("GPT API quota/rate error - falling back to local pool");
  break;
}

// JSON 파싱 실패 처리
try {
  parsed = JSON.parse(assistant);
} catch {
  parsed = null; // 폴백으로 이동
}
```

## 🔄 실행 방법

### **수동 실행**

```bash
# TypeScript 버전
npm run daily-reset

# CommonJS 버전 (Windows 호환)
node ./scripts/dailyReset.cjs
```

### **자동화 배포**

- **로컬**: cron job 또는 Task Scheduler
- **클라우드**: GitHub Actions, Netlify Functions
- **주기**: 매일 자정 (KST 00:00)

## 📊 로그 출력 예시

```
Starting daily reset...
Checking if today's quiz already exists...
📝 No quiz found for today, proceeding with generation...
Deleting previous day data...
Deleting chats...
Deleting votes...
Deleting rooms...
🤖 Calling GPT to generate question (middle-school style, natural Korean)...
🔄 GPT attempt 1/3...
GPT generated valid question
✅ GPT successfully generated quiz question
💾 Saving quiz to database...
✅ Quiz saved successfully: { question: "주말에 친구들과 PC방 vs 영화관" }
📊 GPT tokens were used for this generation
✅ Daily reset completed
```

## 🛡️ 보안 및 모니터링

### **환경변수 보안**

- `.env` 파일에 민감한 정보 저장
- 프로덕션에서는 환경변수로 안전하게 관리
- GitHub에는 `.env.example`만 공개

### **토큰 사용량 추적**

```typescript
let gptTokensUsed = false;
// GPT 호출 시 true로 설정
if (gptTokensUsed) {
  console.log("📊 GPT tokens were used for this generation");
} else {
  console.log("💰 No GPT tokens used - used fallback pool");
}
```

## 🔧 유지보수

### **폴백 질문 업데이트**

- 계절별/이벤트별 질문 추가
- 사용자 피드백 반영
- 부적절한 질문 제거

### **GPT 프롬프트 최적화**

- 더 나은 질문 품질을 위한 시스템 메시지 개선
- 온도(temperature) 값 조정으로 창의성 제어
- 토큰 수 최적화

이 시스템을 통해 AMICO는 매일 새로운 흥미진진한 밸런스 게임을 자동으로 제공하며, 사용자들이 지속적으로 참여할 수 있는 환경을 만들어냅니다.
