// 간단한 투표 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testVote() {
  console.log('🗳️ 투표 테스트...');
  
  try {
    // 실제 존재하는 방 ID 사용
    const roomId = '92f60cb9-cfea-4b6d-8f5e-b0d5730eb975';
    
    // 간단한 투표 생성 (username 기반)
    const { data, error } = await supabase
      .from('votes')
      .insert([{
        room_id: roomId,
        voter_id: 'user1',
        candidate_id: 'user2'
      }]);
    
    if (error) {
      console.error('❌ 투표 생성 실패:', error);
    } else {
      console.log('✅ 투표 생성 성공:', data);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

testVote();
