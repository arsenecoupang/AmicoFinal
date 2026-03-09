/*
BalanceGame React + Supabase (MVP)
=================================================
A single-file React app that:
1) Shows a short “밸런스 게임” 질문 (AI-like generator via curated prompts)
2) Lets a student choose A/B (click once)
3) Splits students by 선택(A/B) into separate group chats for that 질문
4) Persists responses & chat to Supabase (Postgres + Realtime)

▶ How to use
- Create a Vite React project (or drop this file into your app and use it as the default export page/component).
- Install deps:  npm i @supabase/supabase-js uuid
- Set env vars:
  VITE_SUPABASE_URL=...   
  VITE_SUPABASE_ANON_KEY=...
- (Optional) Add Tailwind to your project. This component assumes Tailwind is available. If not, replace classNames or add Tailwind.

▶ Supabase SQL (run in Supabase SQL editor)
-------------------------------------------------
-- Enable realtime
-- (In Supabase, go to Realtime → configure to listen on public schema tables if needed.)

create table if not exists public.profiles (
  id uuid primary key,
  nickname text not null,
  created_at timestamptz default now()
);

create table if not exists public.balance_questions (
  id uuid primary key,
  title text not null,
  option_a text not null,
  option_b text not null,
  created_at timestamptz default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  question_id uuid references public.balance_questions(id) on delete cascade,
  choice text check (choice in ('A','B')) not null,
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room text not null, -- e.g., `${question_id}-A`
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.responses enable row level security;
alter table public.messages enable row level security;
alter table public.balance_questions enable row level security;

-- Policies (simple: anyone logged-in can read; users can write their own)
create policy if not exists "profiles select" on public.profiles for select using (true);
create policy if not exists "profiles upsert self" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "profiles update self" on public.profiles for update using (auth.uid() = id);

create policy if not exists "questions read" on public.balance_questions for select using (true);
create policy if not exists "questions insert" on public.balance_questions for insert with check (true); -- optional, limit to admins later

create policy if not exists "responses read" on public.responses for select using (true);
create policy if not exists "responses insert self" on public.responses for insert with check (auth.uid() = user_id);
create policy if not exists "responses update self" on public.responses for update using (auth.uid() = user_id);

create policy if not exists "messages read" on public.messages for select using (true);
create policy if not exists "messages insert" on public.messages for insert with check (true);

-- Realtime (Edge) settings: turn on for tables messages & responses
-- In Database → Replication → WALRUS/Realtime → add tables `public.messages`, `public.responses`.

-- Seed a few questions (optional)
-- Replace uuid_generate_v4() with gen_random_uuid() depending on extension; enable pgcrypto for gen_random_uuid().
insert into public.balance_questions (id, title, option_a, option_b)
values
  (gen_random_uuid(), '하루 종일 데이터 없는 날 vs 와이파이만 되는 날', '데이터 0MB', '와이파이만 가능'),
  (gen_random_uuid(), '시험 전날 3시간 수면 vs 일주일 전부터 매일 30분 공부', '전날 3시간 몰빵', '일주일 30분 루틴'),
  (gen_random_uuid(), '점심 떡볶이 vs 라면', '떡볶이', '라면')
on conflict do nothing;

-------------------------------------------------

*/

import { createClient } from "@supabase/supabase-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Simple in-app generator to emulate "AI 질문" feel using curated prompts
const seedPrompts = [
  {
    title: "하루 종일 데이터 없는 날 vs 와이파이만 되는 날",
    option_a: "데이터 0MB",
    option_b: "와이파이만 가능",
  },
  {
    title: "시험 전날 3시간 수면 vs 일주일 전부터 매일 30분 공부",
    option_a: "전날 3시간 몰빵",
    option_b: "일주일 30분 루틴",
  },
  { title: "점심 떡볶이 vs 라면", option_a: "떡볶이", option_b: "라면" },
  {
    title: "체육 시간 농구 vs 배드민턴",
    option_a: "농구",
    option_b: "배드민턴",
  },
  { title: "아이폰 vs 갤럭시", option_a: "아이폰", option_b: "갤럭시" },
  {"question": "1년 내내 한여름에만 살기 vs 한겨울에만 살기", "option1": "1년 내내 여름만!", "option2": "1년 내내 겨울만!"}
];

function useSupabaseAuth() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
      const { data: s } = await supabase.auth.getUser();
      setUser(s.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  return user;
}

async function upsertNickname(userId: string, nickname: string) {
  await supabase.from("profiles").upsert({ id: userId, nickname });
}

async function ensureQuestionInDB(question: { id: string; title: string; option_a: string; option_b: string }) {
  // Upsert the question so responses reference a stable UUID
  await supabase
    .from("balance_questions")
    .upsert({ id: question.id, title: question.title, option_a: question.option_a, option_b: question.option_b });
}

export default function App() {
  const user = useSupabaseAuth();
  const [nickname, setNickname] = useState<string>(localStorage.getItem("nickname") || "");
  const [nickStage, setNickStage] = useState<boolean>(false);
  const [question, setQuestion] = useState<{ id: string; title: string; option_a: string; option_b: string } | null>(
    null
  );
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [counts, setCounts] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const roomId = useMemo(() => (question && choice ? `${question.id}-${choice}` : null), [question, choice]);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  // Pick a question on mount
  useEffect(() => {
    const idx = Math.floor(Math.random() * seedPrompts.length);
    const q = seedPrompts[idx];
    const qid = uuidv4();
    const qq = { id: qid, ...q };
    setQuestion(qq);
    // Also ensure it exists in DB so we can store responses
    ensureQuestionInDB(qq);
  }, []);

  // Subscribe to response count updates (realtime) for this question
  useEffect(() => {
    if (!question) return;
    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from("responses")
        .select("choice, count:count(*)")
        .eq("question_id", question.id)
        .group("choice");
      if (!error && data) {
        const A = data.find((d: any) => d.choice === "A")?.count || 0;
        const B = data.find((d: any) => d.choice === "B")?.count || 0;
        setCounts({ A, B });
      }
    };
    fetchCounts();

    const channel = supabase
      .channel(`responses-${question.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses", filter: `question_id=eq.${question.id}` },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [question?.id]);

  // When user has chosen a side, subscribe to that chat room
  useEffect(() => {
    if (!roomId) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, nickname, content, created_at")
        .eq("room", roomId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchHistory();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-700">초기화 중…</div>
      </div>
    );
  }

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    await upsertNickname(user.id, nickname.trim());
    localStorage.setItem("nickname", nickname.trim());
    setNickStage(false);
  };

  const handleChoose = async (c: "A" | "B") => {
    if (!question) return;
    if (!nickname) {
      setNickStage(true);
      return;
    }
    setChoice(c);
    await supabase
      .from("responses")
      .upsert({ user_id: user.id, question_id: question.id, choice: c });
  };

  const sendMessage = async () => {
    if (!input.trim() || !roomId) return;
    await supabase.from("messages").insert({ room: roomId, user_id: user.id, nickname, content: input.trim() });
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">밸런스 게임 · Group Chat</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{nickname ? `닉네임: ${nickname}` : "닉네임 설정"}</span>
            <button
              className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"
              onClick={() => setNickStage(true)}
            >
              {nickname ? "변경" : "설정"}
            </button>
          </div>
        </header>

        {/* Nickname modal */}
        {nickStage && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-semibold mb-3">닉네임 입력</h2>
              <input
                autoFocus
                className="w-full border rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring"
                placeholder="예) 수학왕, 축구러버"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 text-sm" onClick={() => setNickStage(false)}>취소</button>
                <button
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm"
                  onClick={handleSaveNickname}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question card */}
        {question && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
            <h2 className="text-xl font-semibold mb-4">{question.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className={`rounded-2xl border px-4 py-6 text-left hover:shadow ${
                  choice === "A" ? "border-gray-900" : "border-gray-200"
                }`}
                onClick={() => handleChoose("A")}
                disabled={!!choice}
              >
                <div className="text-sm text-gray-500 mb-1">A</div>
                <div className="text-lg font-medium">{question.option_a}</div>
                <div className="mt-2 text-xs text-gray-500">현재: {counts.A}명</div>
              </button>
              <button
                className={`rounded-2xl border px-4 py-6 text-left hover:shadow ${
                  choice === "B" ? "border-gray-900" : "border-gray-200"
                }`}
                onClick={() => handleChoose("B")}
                disabled={!!choice}
              >
                <div className="text-sm text-gray-500 mb-1">B</div>
                <div className="text-lg font-medium">{question.option_b}</div>
                <div className="mt-2 text-xs text-gray-500">현재: {counts.B}명</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">선택은 1회만 가능. 같은 선택을 한 친구들과 채팅방이 연결됩니다.</p>
          </div>
        )}

        {/* Chat area (after choosing) */}
        {choice && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">그룹 채팅 · {choice === "A" ? "A" : "B"}팀</div>
              <div className="text-sm text-gray-500">Room: {roomId}</div>
            </div>

            <div ref={listRef} className="h-72 overflow-y-auto border rounded-xl p-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">첫 메시지를 남겨보세요!</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="mb-2">
                  <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString()}</div>
                  <div className="text-sm"><span className="font-medium">{m.nickname}</span>: {m.content}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 border rounded-xl px-3 py-2"
                placeholder="메시지 입력"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button className="px-4 py-2 bg-gray-900 text-white rounded-xl" onClick={sendMessage}>보내기</button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 text-xs text-gray-500 space-y-1">
          <div>· 질문을 고정하고 싶으면, seedPrompts에서 원하는 항목을 선택해 고정 ID로 사용하세요.</div>
          <div>· 여러 질문 라운드를 운영하려면 질문 목록을 DB에 저장하고 선택 UI에 페이지네이션/다음 질문 버튼을 추가하세요.</div>
          <div>· 운영 시간대에만 입장 가능하게 하려면 supabase Row Level Security 정책을 조정하세요.</div>
        </div>
      </div>
    </div>
  );
}
