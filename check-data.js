// 데이터베이스 현재 상태 확인
const { createClient } = require("@supabase/supabase-js");
require("dotenv/config");

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
	console.log("📊 데이터베이스 상태 확인...");

	try {
		// 방 확인
		const { data: rooms } = await supabase.from("rooms").select("*");
		console.log("🏠 방 목록:", rooms);

		// 프로필 확인
		const { data: profiles } = await supabase.from("profiles").select("*");
		console.log("👤 프로필 목록:", profiles);

		// 투표 확인
		const { data: votes } = await supabase.from("votes").select("*");
		console.log("🗳️ 투표 목록:", votes);
	} catch (error) {
		console.error("❌ 오류:", error);
	}
}

checkData();
