import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const ENABLE_OPENAI = (process.env.ENABLE_OPENAI || 'false').toLowerCase() === 'true' || process.env.ENABLE_OPENAI === '1';
const DRY_RUN = (process.env.DRY_RUN || 'false').toLowerCase() === 'true' || process.env.DRY_RUN === '1';

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Supabase URL or Key not provided. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY, or set DRY_RUN=true to run without Supabase.');
  process.exit(1);
}

const supabase = !DRY_RUN && SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL as string, SUPABASE_KEY as string) : null;

async function run() {
  console.log('Starting daily reset...');

  // 0) 오늘 퀴즈가 이미 있는지 확인 (GPT 토큰 낭비 방지)
  if (!DRY_RUN && supabase) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      console.log('Checking if today\'s quiz already exists...');
      const { data: existingQuiz, error: checkError } = await supabase
        .from('questions')
        .select('id, question1, created_at')
        .gte('created_at', todayStr + 'T00:00:00')
        .lte('created_at', todayStr + 'T23:59:59')
        .limit(1)
        .single();
      
      if (existingQuiz) {
        console.log('✅ Today\'s quiz already exists:', existingQuiz.question1);
        console.log('🚫 Skipping quiz generation to save GPT tokens');
        console.log('Daily reset completed (no new quiz needed)');
        return;
      } else {
        console.log('📝 No quiz found for today, proceeding with generation...');
      }
    } catch (err: any) {
      console.log('📝 No existing quiz found, proceeding with generation...');
    }
  }

  // 1) Archive yesterday's MVPs (if any) into mvp_history already done during voting flow — placeholder
  // If you want to compute MVPs here, implement aggregation logic based on votes table.

  // 2) Delete all rooms, messages, votes for previous day (skip in DRY_RUN)
  if (!DRY_RUN && supabase) {
    try {
      console.log('Deleting previous day data...');
      console.log('Deleting chats...');
      await supabase.from('chats').delete().neq('id', '');
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

    const systemMsg = `너는 중학생들이 좋아할 밸런스 게임 질문을 만드는 전문가야. 자연스럽고 친구 같은 말투로 재미있는 질문을 만들어야 해. 질문은 현실적이고 중학생들이 공감할 수 있는 주제로 설정하고, 각 선택지는 양쪽 다 매력적이어서 고르기 어려워야 해. 모욕적이거나 부적절한 내용은 절대 포함하지 마. 오직 JSON 형식으로만 출력해야 하고, 추가 설명이나 코드 블록 없이 결과만 출력해.`;
    const userPrompt = `중학생 사이에서 유행할 수 있는 자연스럽고 친근한 말투로 한국어 밸런스 게임 질문을 한 개 생성해줘. JSON 형식: {"question": "질문", "option1": "선택지1", "option2": "선택지2"}. 질문은 현실적이고 중학생들이 공감할 수 있는 주제로, 말투는 친구처럼 자연스럽고 재밌게 만들어줘. 각 선택지는 둘 다 고민해볼 만한 매력적인 내용이어야 하고, 둘 중 하나를 고르기 쉽지 않은 것이 좋아. 오직 JSON만 출력해.`;

    const bodyTemplate = (attempt: number) => ({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userPrompt + ` (시도 ${attempt})` }
      ],
      max_tokens: 200,
      temperature: 0.6,
      n: 1
    });

    let parsed: any = null;

    // GPT 토큰 사용량 추적
    let gptTokensUsed = false;

    if (OPENAI_API_KEY && ENABLE_OPENAI) {
      console.log('🤖 Calling GPT to generate question (middle-school style, natural Korean)...');
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          gptTokensUsed = true;
          console.log(`🔄 GPT attempt ${attempt}/3...`);
          const res = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(bodyTemplate(attempt))
          });
          const json: any = await res.json();
          if (res.status === 429 || json?.error?.code === 'insufficient_quota') {
            console.warn(`GPT API quota/rate error (status ${res.status}, code ${json?.error?.code}) on attempt ${attempt}`);
            parsed = null;
            break; // fall back to local pool
          }
          const assistant = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || null;
          if (!assistant) {
            console.warn(`GPT empty response on attempt ${attempt}`);
            continue;
          }
          const match = assistant.match(/\{[\s\S]*\}/);
          try { parsed = match ? JSON.parse(match[0]) : JSON.parse(assistant); } catch { parsed = null; }
          if (isValidParsed(parsed)) {
            q1 = parsed.question.trim();
            opt1 = parsed.option1.trim();
            opt2 = parsed.option2.trim();
            console.log('GPT generated valid question');
            break;
          } else {
            console.warn(`GPT output failed validation on attempt ${attempt}`);
            parsed = null;
          }
        } catch (e:any) {
          console.warn('GPT call error, attempt', attempt, e.message || e);
        }
      }
      if (!parsed) {
        console.warn('🚫 GPT did not produce a valid question after retries — using fallback pool');
        useFallback();
      } else {
        console.log('✅ GPT successfully generated quiz question');
      }
    } else {
      if (!ENABLE_OPENAI) console.log('🔧 OpenAI disabled (ENABLE_OPENAI not set). Using local fallback questions.');
      else if (!OPENAI_API_KEY) console.log('🔧 OPENAI_API_KEY not set. Using local fallback questions.');
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
    
    console.log('💾 Saving quiz to database...');
    if (!DRY_RUN && supabase) {
      const { data, error } = await supabase.from('questions').insert([question]);
      if (error) {
        console.error('❌ Error inserting question:', error.message || error);
      } else {
        console.log('✅ Quiz saved successfully:', { question: q1 });
        
        // GPT 사용량 리포트
        if (gptTokensUsed) {
          console.log('📊 GPT tokens were used for this generation');
        } else {
          console.log('💰 No GPT tokens used - used fallback pool');
        }
      }
    } else {
      console.log('🔧 DRY_RUN: would insert question:', question);
    }
  } catch (err: any) {
    console.error('❌ Error inserting new question', err.message || err);
  }

  console.log('✅ Daily reset completed');
}

function cryptoRandomUUID() {
  // Node 14+ has crypto.randomUUID(); fallback:
  try { return (globalThis as any).crypto?.randomUUID?.() ?? require('crypto').randomUUID(); } catch { return require('crypto').randomBytes(16).toString('hex'); }
}

run().catch(err => { console.error(err); process.exit(1); });
