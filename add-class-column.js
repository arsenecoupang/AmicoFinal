const { createClient } = require("@supabase/supabase-js");

// Supabase 설정
const supabaseUrl = "https://fojmubwmcqwjutmpfajl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvam11YndtY3F3anV0bXBmYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0Mzk5MjgsImV4cCI6MjA1MTAxNTkyOH0.h8oXW9SgGbzNUFBMXqBmwEsZG-oGFM2_WJgUYNdNQIk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function addClassColumn() {
  try {
    console.log("Adding class column to profiles table...");

    // class 컬럼 추가
    const { data: alterResult, error: alterError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class text DEFAULT '1반';`,
      }
    );

    if (alterError) {
      console.error("Error adding class column:", alterError);

      // 대안 방법: 직접 SQL 실행 (서비스 역할 키 필요)
      console.log("Trying alternative approach...");

      // 현재 테이블 구조 확인
      const { data: tableInfo, error: infoError } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (infoError) {
        console.error("Error checking table structure:", infoError);
      } else {
        console.log("Current table structure sample:", tableInfo);
        console.log(
          "Available columns:",
          tableInfo[0] ? Object.keys(tableInfo[0]) : "No data"
        );
      }

      return;
    }

    console.log("Class column added successfully");

    // 기존 사용자들의 class 값을 1반으로 업데이트
    const { data: updateResult, error: updateError } = await supabase
      .from("profiles")
      .update({ class: "1반" })
      .is("class", null);

    if (updateError) {
      console.error("Error updating existing profiles:", updateError);
    } else {
      console.log("Existing profiles updated with default class");
    }

    console.log("Class column setup completed successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// 테스트 실행
addClassColumn().then(() => {
  console.log("Test completed");
  process.exit(0);
});
