// MVP 테스트를 위한 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testMvp() {
  console.log('🧪 MVP 테스트 시작...');
  
  try {
    // 1. 테스트용 방 생성
    const roomId = crypto.randomUUID();
    const testMembers = ['user1', 'user2', 'user3'];
    
    console.log('1. 테스트 방 생성...');
    const { error: roomError } = await supabase
      .from('rooms')
      .insert([{
        id: roomId,
        members: testMembers
      }]);
    
    if (roomError) {
      console.error('방 생성 실패:', roomError);
      return;
    }
    console.log('✅ 테스트 방 생성 완료:', roomId);
    
    // 2. 테스트용 프로필 생성 (온도 추적용)
    console.log('2. 테스트 프로필 생성...');
    const profileIds = {};
    for (const member of testMembers) {
      const profileId = crypto.randomUUID();
      profileIds[member] = profileId;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: profileId,
          username: member,
          realname: `${member} 실명`,
          temperature: Math.floor(Math.random() * 50) + 20 // 20-70도 랜덤
        }]);
      
      if (profileError) {
        console.log('프로필 업서트 오류 (무시):', profileError.message);
      }
    }
    console.log('✅ 테스트 프로필 생성 완료');
    
    // 3. 테스트용 투표 데이터 생성
    console.log('3. 테스트 투표 생성...');
    const votes = [
      { id: crypto.randomUUID(), room_id: roomId, voter_id: 'user1', candidate_id: profileIds['user2'] },
      { id: crypto.randomUUID(), room_id: roomId, voter_id: 'user2', candidate_id: profileIds['user3'] },
      { id: crypto.randomUUID(), room_id: roomId, voter_id: 'user3', candidate_id: profileIds['user2'] },
    ];
    
    const { error: voteError } = await supabase
      .from('votes')
      .insert(votes);
    
    if (voteError) {
      console.error('투표 생성 실패:', voteError);
      return;
    }
    console.log('✅ 테스트 투표 생성 완료');
    
    // 4. 투표 결과 확인
    console.log('4. 투표 결과 확인...');
    const { data: voteData } = await supabase
      .from('votes')
      .select('candidate_id')
      .eq('room_id', roomId);
    
    const counts = {};
    if (voteData) {
      voteData.forEach(vote => {
        counts[vote.candidate_id] = (counts[vote.candidate_id] || 0) + 1;
      });
    }
    
    console.log('📊 투표 결과:', counts);
    
    // 5. 현재 온도 확인
    console.log('5. 현재 멤버 온도 확인...');
    for (const member of testMembers) {
      const { data: tempData } = await supabase
        .from('profiles')
        .select('temperature')
        .eq('username', member)
        .single();
      
      console.log(`🌡️ ${member}: ${tempData?.temperature || 0}°C`);
    }
    
    console.log(`\n🎯 MVP 투표 테스트용 방 ID: ${roomId}`);
    console.log('이제 브라우저에서 다음 URL로 이동하세요:');
    console.log(`http://localhost:3000/mvp`);
    console.log('그리고 state로 roomId를 전달하거나, 직접 MvpVote 컴포넌트에서 roomId를 설정하세요.');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testMvp();
