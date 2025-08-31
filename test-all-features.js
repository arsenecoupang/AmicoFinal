// 실제 스키마에 맞춘 테스트 데이터 생성 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestData() {
  console.log('🧪 테스트 데이터 생성 시작...\n');

  try {
    // 1. 기존 데이터 확인
    console.log('📊 기존 데이터 확인...');
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('username');
    
    console.log('기존 프로필:', existingProfiles?.map(p => p.username) || []);

    // 2. 테스트용 퀴즈 생성 (실제 스키마에 맞춰서)
    console.log('\n❓ 테스트 퀴즈 생성...');
    const testQuiz = {
      question1: '당신은 어떤 음식을 더 좋아하시나요?',
      question2: '테스트용 질문입니다',
      option1: '한식',
      option2: '양식'
    };

    const { data: newQuiz, error: quizError } = await supabase
      .from('questions')
      .insert(testQuiz)
      .select();
    
    if (quizError) {
      console.log('⚠️  퀴즈 생성 오류:', quizError.message);
    } else {
      console.log('✅ 테스트 퀴즈 생성 완료:', newQuiz[0].id);
    }

    // 3. 테스트용 채팅방 생성 (실제 스키마에 맞춰서)
    console.log('\n💬 테스트 채팅방 생성...');
    if (newQuiz && newQuiz[0]) {
      const testRooms = [
        {
          id: 'test_room_1',
          question_id: newQuiz[0].id,
          option: 'option1',
          members: ['test_user1', 'test_user2', 'test_user3']
        },
        {
          id: 'test_room_2', 
          question_id: newQuiz[0].id,
          option: 'option2',
          members: ['test_user1', 'test_user4']
        },
        {
          id: 'test_room_3',
          question_id: newQuiz[0].id,
          option: 'option1',
          members: ['test_user2', 'test_user3', 'test_user4']
        }
      ];

      for (const room of testRooms) {
        const { error } = await supabase
          .from('rooms')
          .upsert(room);
        if (error) {
          console.log(`⚠️  ${room.id} 생성 중 오류:`, error.message);
        } else {
          console.log(`✅ ${room.id} 생성 완료 (멤버: ${room.members.join(', ')})`);
        }
      }
    }

    // 4. 테스트용 채팅 메시지 생성
    console.log('\n💬 테스트 채팅 메시지 생성...');
    const testChats = [
      { room_id: 'test_room_1', username: 'test_user1', message: '안녕하세요!' },
      { room_id: 'test_room_1', username: 'test_user2', message: '네 안녕하세요~' },
      { room_id: 'test_room_1', username: 'test_user3', message: '반갑습니다!' },
      { room_id: 'test_room_2', username: 'test_user1', message: '테스트 메시지입니다' },
      { room_id: 'test_room_2', username: 'test_user4', message: '네 확인했습니다' },
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

    // 5. 완료 메시지
    console.log('\n🎉 테스트 데이터 생성 완료!');
    console.log('\n📋 테스트 가능한 기능들:');
    console.log('1. 🔑 로그인: 기존 계정 또는 새로 가입');
    console.log('2. 💬 채팅: 퀴즈 선택 후 채팅방 입장');
    console.log('3. 🏆 MVP 투표: 모든 날짜의 방에서 투표 가능 (날짜 제한 해제)');
    console.log('4. ❓ 퀴즈: 새로운 테스트 퀴즈 생성됨');
    console.log('5. 🌡️  온도 확인: 프로필별 온도 확인 가능');
    console.log('\n💡 팁: 브라우저에서 localhost:3000에 접속하여 로그인해보세요!');
    console.log('📱 MVP 투표를 테스트하려면 여러 명이 채팅에 참여한 후 투표해보세요!');

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error);
  }
}

// 스크립트 실행
createTestData();
