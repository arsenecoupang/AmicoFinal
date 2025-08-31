// 통합 테스트 스크립트 - 모든 기능 테스트용 데이터 생성
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestData() {
  console.log('🧪 테스트 데이터 생성 시작...\n');

  try {
    // 1. 테스트 사용자 프로필 생성
    console.log('👥 테스트 사용자 생성...');
    const testUsers = [
      { username: 'test_user1', realname: '김테스트', temperature: 36.5 },
      { username: 'test_user2', realname: '이실험', temperature: 37.0 },
      { username: 'test_user3', realname: '박검증', temperature: 36.8 },
      { username: 'test_user4', realname: '최확인', temperature: 37.2 },
    ];

    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(user)
        .select();
      if (error) {
        console.log(`⚠️  ${user.username} 생성 중 오류 (이미 존재할 수 있음):`, error.message);
      } else {
        console.log(`✅ ${user.username} 생성 완료`);
      }
    }

    // 2. 테스트용 채팅방 생성 (다양한 날짜로)
    console.log('\n💬 테스트 채팅방 생성...');
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 48 * 60 * 60 * 1000);

    const testRooms = [
      {
        id: 'test_room_1',
        members: JSON.stringify(['test_user1', 'test_user2', 'test_user3']),
        created_at: yesterday.toISOString()
      },
      {
        id: 'test_room_2', 
        members: JSON.stringify(['test_user1', 'test_user4']),
        created_at: today.toISOString()
      },
      {
        id: 'test_room_3',
        members: JSON.stringify(['test_user2', 'test_user3', 'test_user4']),
        created_at: twoDaysAgo.toISOString()
      }
    ];

    for (const room of testRooms) {
      const { error } = await supabase
        .from('rooms')
        .upsert(room);
      if (error) {
        console.log(`⚠️  ${room.id} 생성 중 오류:`, error.message);
      } else {
        console.log(`✅ ${room.id} 생성 완료 (멤버: ${JSON.parse(room.members).join(', ')})`);
      }
    }

    // 3. 테스트용 채팅 메시지 생성
    console.log('\n💬 테스트 채팅 메시지 생성...');
    const testChats = [
      { room_id: 'test_room_1', sender: 'test_user1', message: '안녕하세요!' },
      { room_id: 'test_room_1', sender: 'test_user2', message: '네 안녕하세요~' },
      { room_id: 'test_room_1', sender: 'test_user3', message: '반갑습니다!' },
      { room_id: 'test_room_2', sender: 'test_user1', message: '테스트 메시지입니다' },
      { room_id: 'test_room_2', sender: 'test_user4', message: '네 확인했습니다' },
    ];

    for (const chat of testChats) {
      const { error } = await supabase
        .from('chats')
        .insert(chat);
      if (error) {
        console.log(`⚠️  메시지 생성 오류:`, error.message);
      }
    }
    console.log(`✅ ${testChats.length}개 테스트 메시지 생성 완료`);

    // 4. 테스트용 퀴즈 생성
    console.log('\n❓ 테스트 퀴즈 생성...');
    const testQuiz = {
      topic: '테스트 주제',
      question: '이것은 테스트용 질문입니다. 어떻게 생각하시나요?',
      option1: '첫 번째 선택지',
      option2: '두 번째 선택지',
      category: '테스트'
    };

    const { error: quizError } = await supabase
      .from('questions')
      .upsert(testQuiz);
    if (quizError) {
      console.log('⚠️  퀴즈 생성 오류:', quizError.message);
    } else {
      console.log('✅ 테스트 퀴즈 생성 완료');
    }

    // 5. 완료 메시지
    console.log('\n🎉 테스트 데이터 생성 완료!');
    console.log('\n📋 테스트 가능한 기능들:');
    console.log('1. 🔑 로그인: test_user1, test_user2, test_user3, test_user4 중 아무거나');
    console.log('2. 💬 채팅: 3개의 테스트 채팅방 생성됨');
    console.log('3. 🏆 MVP 투표: 모든 날짜의 방에서 투표 가능 (날짜 제한 해제)');
    console.log('4. ❓ 퀴즈: 테스트 퀴즈 생성됨');
    console.log('5. 🌡️  온도 확인: 프로필별 온도 설정됨');
    console.log('\n💡 팁: 브라우저에서 localhost:3000에 접속하여 test_user1로 로그인해보세요!');

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error);
  }
}

// 스크립트 실행
createTestData();
