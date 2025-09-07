const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://dajdwwsnhtxruxrwobcq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Supabase key not found. Please set SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount() {
  console.log('Creating admin account...');

  try {
    // 1. 관리자 계정 회원가입
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@amico.dev',
      password: 'AmicoDev2025!',
      email_confirm: true, // 이메일 인증 생략
      user_metadata: {
        username: 'AmicoDev',
        realname: '관리자',
        class: '개발팀',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    console.log('Admin user created:', authData.user.id);

    // 2. 프로필 테이블에 관리자 정보 추가
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: 'admin@amico.dev',
        username: 'AmicoDev',
        realname: '관리자',
        class: '개발팀',
        temperature: 1000, // 관리자는 높은 온도
        role: 'admin'
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return;
    }

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@amico.dev');
    console.log('🔑 Password: AmicoDev2025!');
    console.log('👤 Username: AmicoDev');
    console.log('🏷️ Role: admin');

  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

createAdminAccount();
