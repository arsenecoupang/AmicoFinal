// Auto-generated CommonJS version of dailyReset.ts for Windows/node compatibility
require("dotenv").config();
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
	process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL =
	process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const ENABLE_OPENAI =
	(process.env.ENABLE_OPENAI || "false").toLowerCase() === "true" ||
	process.env.ENABLE_OPENAI === "1";
const DRY_RUN =
	(process.env.DRY_RUN || "false").toLowerCase() === "true" ||
	process.env.DRY_RUN === "1";

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
	console.error(
		"Supabase URL or Key not provided. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY, or set DRY_RUN=true to run without Supabase.",
	);
	process.exit(1);
}

const supabase =
	!DRY_RUN && SUPABASE_URL && SUPABASE_KEY
		? createClient(SUPABASE_URL, SUPABASE_KEY)
		: null;

function cryptoRandomUUID() {
	try {
		return globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID();
	} catch {
		return require("crypto").randomBytes(16).toString("hex");
	}
}

async function run() {
	console.log("Starting daily reset...");
	if (!DRY_RUN && supabase) {
		try {
			console.log("Deleting messages...");
			await supabase.from("messages").delete().neq("id", "");
			console.log("Deleting votes...");
			await supabase.from("votes").delete().neq("id", "");
			console.log("Deleting rooms...");
			await supabase.from("rooms").delete().neq("id", "");
		} catch (err) {
			console.error("Error deleting previous data", err.message || err);
		}
	} else {
		console.log("DRY_RUN enabled: skipping deletion of Supabase tables.");
	}

	try {
		let q1 = "요즘 중학교 3학년들이 가장 관심 있는 밸런스 게임";
		let opt1 = "A";
		let opt2 = "B";

		const fallbackPool = [
			{
				q: "밤에 친구랑 노래방 가기 vs 친구 집에서 같이 게임하기",
				a: "노래방 가기",
				b: "집에서 게임",
			},
			{
				q: "매일 쉬는 시간마다 간식을 먹기 vs 쉬는 시간마다 운동하기",
				a: "간식 먹기",
				b: "운동하기",
			},
			{
				q: "시험 전날 벼락치기 공부하기 vs 매일 조금씩 공부하기",
				a: "벼락치기",
				b: "매일 조금씩",
			},
			{
				q: "수업 시간에 스마트폰 끄기 vs 쉬는 시간에만 보기",
				a: "수업 시간 끄기",
				b: "쉬는 시간에 보기",
			},
		];

		const useFallback = () => {
			const pick =
				fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
			q1 = pick.q;
			opt1 = pick.a;
			opt2 = pick.b;
		};

		const isValidParsed = (p) => {
			if (!p) return false;
			if (
				typeof p.question !== "string" ||
				typeof p.option1 !== "string" ||
				typeof p.option2 !== "string"
			)
				return false;
			const q = p.question.trim();
			const o1 = p.option1.trim();
			const o2 = p.option2.trim();
			if (q.length < 8 || q.length > 200) return false;
			if (o1.length < 1 || o2.length < 1) return false;
			if (o1 === o2) return false;
			const bad =
				/\b(AI|인공지능|As an AI|cannot|할 수 없습니다|할 수 없어요)\b/i;
			if (bad.test(q) || bad.test(o1) || bad.test(o2)) return false;
			return true;
		};

		const systemMsg = `너는 친근하고 자연스러운 말투로, 중학교 3학년 학생들이 이해하기 쉬운 한국어 문장으로 답해야 해. AI 티가 나지 않게 쓰고, 자기소개나 메타 발언(예: "저는 AI입니다" 같은 문장)을 절대 포함하지 마. 문장은 짧고 평이한 단어를 써라.`;
		const userPrompt = `다음 조건을 지켜서 단일 밸런스 게임(질문 1개, 선택지 2개)을 JSON으로 딱 하나만 출력해줘. JSON 키: question (string), option1 (string), option2 (string). 한국어로, 중학생 수준, 자연스럽고 친근한 표현. 예시나 추가 설명을 절대 붙이지 말고, 오직 JSON만 출력해줘.`;

		const bodyTemplate = (attempt) => ({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemMsg },
				{ role: "user", content: userPrompt + ` (시도 ${attempt})` },
			],
			max_tokens: 200,
			temperature: 0.6,
			n: 1,
		});

		let parsed = null;

		if (OPENAI_API_KEY && ENABLE_OPENAI) {
			console.log(
				"Calling GPT to generate question (middle-school style, natural Korean)...",
			);
			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					const res = await fetch(OPENAI_API_URL, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${OPENAI_API_KEY}`,
						},
						body: JSON.stringify(bodyTemplate(attempt)),
					});
					const json = await res.json();
					const assistant =
						json.choices?.[0]?.message?.content ||
						json.choices?.[0]?.text ||
						null;
					if (!assistant) {
						console.warn(`GPT empty response on attempt ${attempt}`);
						continue;
					}
					const match = assistant.match(/\{[\s\S]*\}/);
					try {
						parsed = match ? JSON.parse(match[0]) : JSON.parse(assistant);
					} catch {
						parsed = null;
					}
					if (isValidParsed(parsed)) {
						q1 = parsed.question.trim();
						opt1 = parsed.option1.trim();
						opt2 = parsed.option2.trim();
						console.log("GPT generated valid question");
						break;
					} else {
						console.warn(`GPT output failed validation on attempt ${attempt}`);
						parsed = null;
					}
				} catch (e) {
					console.warn("GPT call error, attempt", attempt, e.message || e);
				}
			}
			if (!parsed) {
				console.warn(
					"GPT did not produce a valid question after retries — using fallback pool",
				);
				useFallback();
			}
		} else {
			if (!ENABLE_OPENAI)
				console.log(
					"OpenAI disabled (ENABLE_OPENAI not set). Using local fallback questions.",
				);
			else if (!OPENAI_API_KEY)
				console.log("OPENAI_API_KEY not set. Using local fallback questions.");
			useFallback();
		}

		const now = new Date().toISOString();
		const question = {
			id: cryptoRandomUUID(),
			question1: q1,
			question2: "",
			option1: opt1,
			option2: opt2,
			created_at: now,
		};
		console.log("Inserting new question...");
		if (!DRY_RUN && supabase) {
			await supabase.from("questions").insert([question]);
		} else {
			console.log("DRY_RUN: would insert question:", question);
		}
	} catch (err) {
		console.error("Error inserting new question", err.message || err);
	}

	console.log("Daily reset finished.");
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
