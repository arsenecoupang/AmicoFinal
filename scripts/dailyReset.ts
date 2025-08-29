import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const ENABLE_GEMINI = (process.env.ENABLE_GEMINI || 'false').toLowerCase() === 'true' || process.env.ENABLE_GEMINI === '1';
const DRY_RUN = (process.env.DRY_RUN || 'false').toLowerCase() === 'true' || process.env.DRY_RUN === '1';

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Supabase URL or Key not provided. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY, or set DRY_RUN=true to run without Supabase.');
  process.exit(1);
}

const supabase = !DRY_RUN && SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL as string, SUPABASE_KEY as string) : null;

async function run() {
  console.log('Starting daily reset...');

  // 1) Archive yesterday's MVPs (if any) into mvp_history already done during voting flow — placeholder
  // If you want to compute MVPs here, implement aggregation logic based on votes table.

  // 2) Delete all rooms, messages, votes for previous day (skip in DRY_RUN)
  if (!DRY_RUN && supabase) {
    try {
      console.log('Deleting messages...');
      await supabase.from('messages').delete().neq('id', '');
      console.log('Deleting votes...');
      await supabase.from('votes').delete().neq('id', '');
      console.log('Deleting rooms...');
      await supabase.from('rooms').delete().neq('id', '');
    } catch (err: any) {
      console.error('Error deleting previous data', err.message || err);
    }
    } else {
      console.log('DRY_RUN enabled: skipping deletion of Supabase tables.');
    }

  // 3) Insert new question placeholder (you can replace this with GPT integration)
  try {
    let q1 = '요즘 중학교 3학년들이 가장 관심 있는 밸런스 게임';
    let opt1 = 'A';
    let opt2 = 'B';

    const fallbackPool = [
      { q: '밤에 친구랑 노래방 가기 vs 친구 집에서 같이 게임하기', a: '노래방 가기', b: '집에서 게임' },
      { q: '매일 쉬는 시간마다 간식을 먹기 vs 쉬는 시간마다 운동하기', a: '간식 먹기', b: '운동하기' },
      { q: '시험 전날 벼락치기 공부하기 vs 매일 조금씩 공부하기', a: '벼락치기', b: '매일 조금씩' },
      { q: '수업 시간에 스마트폰 끄기 vs 쉬는 시간에만 보기', a: '수업 시간 끄기', b: '쉬는 시간에 보기' },
      { q: '친구랑 점심에 떡볶이 vs 햄버거', a: '떡볶이', b: '햄버거' },
      { q: '방과 후 학원 가기 vs 집에서 쉬기', a: '학원 가기', b: '집에서 쉬기' },
      { q: '여름 방학에 해외여행 vs 국내여행', a: '해외여행', b: '국내여행' },
      { q: '새로운 취미: 악기 배우기 vs 운동 배우기', a: '악기', b: '운동' },
      { q: '아침형 vs 밤형', a: '아침형', b: '밤형' },
      { q: '친구 생일에 서프라이즈 vs 편지 쓰기', a: '서프라이즈', b: '편지' }
    ];

    const useFallback = () => {
      const pick = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      q1 = pick.q; opt1 = pick.a; opt2 = pick.b;
    };

    const isValidParsed = (p: any) => {
      if (!p) return false;
      if (typeof p.question !== 'string' || typeof p.option1 !== 'string' || typeof p.option2 !== 'string') return false;
      const q = p.question.trim();
      const o1 = p.option1.trim();
      const o2 = p.option2.trim();
      if (q.length < 8 || q.length > 200) return false;
      if (o1.length < 1 || o2.length < 1) return false;
      if (o1 === o2) return false;
      const bad = /\b(AI|인공지능|As an AI|cannot|할 수 없습니다|할 수 없어요)\b/i;
      if (bad.test(q) || bad.test(o1) || bad.test(o2)) return false;
      return true;
    };

    const systemMsg = `너는 중학생 수준의 한국어로 밸런스 게임 질문을 만드는 AI야. 자연스럽고 친근한 말투로 써라.`;
    const userPrompt = `중학생들이 좋아할 밸런스 게임 질문 하나를 JSON으로 만들어줘. 형식: {"question": "질문", "option1": "선택지1", "option2": "선택지2"}. 오직 JSON만 출력해.`;

    let parsed: any = null;

    if (GEMINI_API_KEY && ENABLE_GEMINI) {
      console.log('Calling Gemini to generate question (middle-school style, natural Korean)...');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const prompt = `${systemMsg}\n\n${userPrompt} (시도 ${attempt})`;
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          if (!text) {
            console.warn(`Gemini empty response on attempt ${attempt}`);
            continue;
          }

          const match = text.match(/\{[\s\S]*\}/);
          try { parsed = match ? JSON.parse(match[0]) : JSON.parse(text); } catch { parsed = null; }

          if (isValidParsed(parsed)) {
            q1 = parsed.question.trim();
            opt1 = parsed.option1.trim();
            opt2 = parsed.option2.trim();
            console.log('Gemini generated valid question');
            break;
          } else {
            console.warn(`Gemini output failed validation on attempt ${attempt}`);
            parsed = null;
          }
        } catch (e: any) {
          console.warn('Gemini call error, attempt', attempt, e.message || e);
        }
      }

      if (!parsed) {
        console.warn('Gemini did not produce a valid question after retries — using fallback pool');
        useFallback();
      }
    } else {
      if (!ENABLE_GEMINI) console.log('Gemini disabled (ENABLE_GEMINI not set). Using local fallback questions.');
      else if (!GEMINI_API_KEY) console.log('GEMINI_API_KEY not set. Using local fallback questions.');
      useFallback();
    }

    const now = new Date().toISOString();
    const question = {
      id: cryptoRandomUUID(),
      question1: q1,
      question2: '',
      option1: opt1,
      option2: opt2,
      created_at: now
    };
    console.log('Inserting new question...');
    if (!DRY_RUN && supabase) {
      await supabase.from('questions').insert([question]);
    } else {
      console.log('DRY_RUN: would insert question:', question);
    }
  } catch (err: any) {
    console.error('Error inserting new question', err.message || err);
  }

  console.log('Daily reset finished.');
}

function cryptoRandomUUID() {
  // Node 14+ has crypto.randomUUID(); fallback:
  try { return (globalThis as any).crypto?.randomUUID?.() ?? require('crypto').randomUUID(); } catch { return require('crypto').randomBytes(16).toString('hex'); }
}

run().catch(err => { console.error(err); process.exit(1); });
