// 데이터베이스 스키마 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('📊 데이터베이스 스키마 확인 중...\n');

  // 1. profiles 테이블 구조 확인
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      console.log('👤 profiles 테이블 컬럼:', Object.keys(profiles[0]));
    } else {
      console.log('👤 profiles 테이블: 데이터 없음');
    }
  } catch (error) {
    console.log('❌ profiles 테이블 오류:', error.message);
  }

  // 2. rooms 테이블 구조 확인
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .limit(1);
    
    if (rooms && rooms.length > 0) {
      console.log('🏠 rooms 테이블 컬럼:', Object.keys(rooms[0]));
    } else {
      console.log('🏠 rooms 테이블: 데이터 없음');
    }
  } catch (error) {
    console.log('❌ rooms 테이블 오류:', error.message);
  }

  // 3. chats 테이블 구조 확인
  try {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .limit(1);
    
    if (chats && chats.length > 0) {
      console.log('💬 chats 테이블 컬럼:', Object.keys(chats[0]));
    } else {
      console.log('💬 chats 테이블: 데이터 없음');
    }
  } catch (error) {
    console.log('❌ chats 테이블 오류:', error.message);
  }

  // 4. questions 테이블 구조 확인
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (questions && questions.length > 0) {
      console.log('❓ questions 테이블 컬럼:', Object.keys(questions[0]));
    } else {
      console.log('❓ questions 테이블: 데이터 없음');
    }
  } catch (error) {
    console.log('❌ questions 테이블 오류:', error.message);
  }

  // 5. votes 테이블 구조 확인
  try {
    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .limit(1);
    
    if (votes && votes.length > 0) {
      console.log('🗳️  votes 테이블 컬럼:', Object.keys(votes[0]));
    } else {
      console.log('🗳️  votes 테이블: 데이터 없음');
    }
  } catch (error) {
    console.log('❌ votes 테이블 오류:', error.message);
  }
}

checkSchema();
