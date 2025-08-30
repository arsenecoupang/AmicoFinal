import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../db';
import { useAuth } from '../AuthContext';
import { styled } from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 6.25rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 2rem;
  background: ${(props) => props.theme.base};
`;

const Message = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(168,198,134,0.10);
  text-align: center;
  max-width: 400px;
  
  h2 {
    color: ${(props) => props.theme.main};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${(props) => props.theme.text};
    margin-bottom: 1.5rem;
  }
`;

const Button = styled.button`
  background: ${(props) => props.theme.main};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background: ${(props) => props.theme.mainHover};
  }
`;

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting auth handling...');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        
        // URL에서 에러 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.error('Auth error from URL:', { error, errorCode, errorDescription });
          
          if (errorCode === 'otp_expired') {
            setStatus('error');
            setMessage('이메일 인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.');
            return;
          } else if (error === 'access_denied') {
            setStatus('error');
            setMessage('이메일 인증이 거부되었습니다. 다시 시도해주세요.');
            return;
          } else {
            setStatus('error');
            setMessage(`인증 오류: ${errorDescription || error}`);
            return;
          }
        }
        
        // Supabase가 자동으로 auth 상태 변화를 감지하도록 함
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Current session:', { session: !!session, error: sessionError?.message });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage(`세션 오류: ${sessionError.message}`);
          return;
        }

        if (session && session.user) {
          console.log('User from session:', session.user);

          // 사용자 메타데이터에서 회원가입 시 입력한 정보 가져오기
          const userMetadata = session.user.user_metadata || {};
          const username = userMetadata.username || session.user.email?.split('@')[0] || 'user';
          const realname = userMetadata.realname || username;

          console.log('User metadata:', userMetadata);

          // 프로필 확인 또는 생성
          let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, realname')
            .eq('id', session.user.id)
            .single();

          console.log('Profile check:', { profileData, profileError });

          // 프로필이 없으면 생성
          if (!profileData) {
            const { data: insertData, error: insertError } = await supabase.from('profiles').insert([
              {
                id: session.user.id,
                email: session.user.email,
                username: username,
                realname: realname,
                temperature: 0
              }
            ]).select().single();

            console.log('Profile insert:', { insertData, insertError });

            if (insertError) {
              console.error('Profile insert error:', insertError);
              // 프로필 생성 실패해도 로그인은 계속 진행
            }

            profileData = { username, realname };
          }

          // 로그인 상태 설정
          login({ 
            username: profileData?.username || username, 
            email: session.user.email || '' 
          });

          setStatus('success');
          setMessage('이메일 인증이 완료되어 계정이 생성되었습니다!');
          
          // 3초 후 홈으로 이동
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        } else {
          // 세션이 없는 경우, auth state change 이벤트를 기다림
          console.log('No session found, waiting for auth state change...');
          setMessage('인증을 처리하는 중입니다...');
          
          // 10초 후에도 세션이 없으면 실패 처리
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (!session) {
                setStatus('error');
                setMessage('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.');
              }
            });
          }, 10000);
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(`인증 처리 중 오류: ${error.message || '알 수 없는 오류'}`);
      }
    };

    // auth state change 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session: !!session });
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in via auth state change');
        
        const userMetadata = session.user.user_metadata || {};
        const username = userMetadata.username || session.user.email?.split('@')[0] || 'user';
        const realname = userMetadata.realname || username;

        // 프로필 확인 또는 생성
        let { data: profileData } = await supabase
          .from('profiles')
          .select('username, realname')
          .eq('id', session.user.id)
          .single();

        if (!profileData) {
          await supabase.from('profiles').insert([
            {
              id: session.user.id,
              email: session.user.email,
              username: username,
              realname: realname,
              temperature: 0
            }
          ]);
          profileData = { username, realname };
        }

        login({ 
          username: profileData?.username || username, 
          email: session.user.email || '' 
        });

        setStatus('success');
        setMessage('이메일 인증이 완료되어 계정이 생성되었습니다!');
        
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      }
    });

    handleAuthCallback();

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, login]);

  const handleGoToLogin = () => {
    navigate('/');
  };

  const handleResendEmail = async () => {
    // 이메일 주소를 URL에서 추출하거나 localStorage에서 가져옴
    const savedEmail = localStorage.getItem('pending_email');
    if (!savedEmail) {
      alert('이메일 주소를 찾을 수 없습니다. 다시 회원가입을 시도해주세요.');
      navigate('/');
      return;
    }

    try {
      setStatus('loading');
      setMessage('새로운 인증 이메일을 발송하는 중...');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: savedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setStatus('error');
      setMessage('✉️ 새로운 인증 이메일이 발송되었습니다!\n\n⏰ 링크는 5분간 유효합니다. 빠르게 이메일을 확인하고 인증 링크를 클릭해주세요.');
    } catch (error: any) {
      setStatus('error');
      setMessage(`이메일 재발송 실패: ${error.message}`);
    }
  };

  if (status === 'loading') {
    return (
      <Container>
        <Message>
          <h2>인증 처리 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </Message>
      </Container>
    );
  }

  if (status === 'success') {
    return (
      <Container>
        <Message>
          <h2>✅ 인증 완료!</h2>
          <p>{message}</p>
          <p>곧 홈페이지로 이동합니다...</p>
        </Message>
      </Container>
    );
  }

  return (
    <Container>
      <Message>
        <h2>❌ 인증 실패</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
        {message.includes('만료') && (
          <Button onClick={handleResendEmail} style={{ marginRight: '10px' }}>
            새로운 인증 이메일 요청
          </Button>
        )}
        <Button onClick={handleGoToLogin}>로그인 페이지로 이동</Button>
      </Message>
    </Container>
  );
};

export default AuthCallback;
