import React, { useEffect, useState } from 'react';
import { supabase } from '../db';

function DebugRealtime() {
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [testRoomId, setTestRoomId] = useState<string>('');

  const createTestRoom = async () => {
    console.log('🏠 Debug: Creating test room...');
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          question_id: null, // nullable이므로 null 허용
          option: 'test-option',
          members: JSON.stringify(['debug-user'])
        })
        .select()
        .single();
        
      if (error) {
        console.error('🔥 Debug: Room creation error:', error);
        setStatus(`Room creation error: ${error.message}`);
      } else {
        console.log('✅ Debug: Test room created:', data);
        setTestRoomId(data.id);
        setStatus(`Test room created: ${data.id}`);
      }
    } catch (err) {
      console.error('🔥 Debug: Unexpected room creation error:', err);
      setStatus(`Unexpected room creation error: ${err}`);
    }
  };

  useEffect(() => {
    console.log('🔧 Debug: Setting up realtime test');
    
    const subscription = supabase
      .channel('debug-test')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats'
      }, payload => {
        console.log('🐛 Debug: Received realtime event:', payload);
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe((status, err) => {
        console.log('🐛 Debug: Subscription status:', status, err);
        setStatus(status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    console.log('🐛 Debug: Sending test message:', testMessage);
    
    // 테스트 방 ID가 없으면 생성
    let roomId = testRoomId;
    if (!roomId) {
      console.log('🏠 Debug: No test room ID, creating one...');
      await createTestRoom();
      return; // 방 생성 후 다시 시도하도록 함
    }
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          room_id: roomId,
          username: 'debug-user',
          message: testMessage
        })
        .select()
        .single();
        
      console.log('🐛 Debug: Insert result:', { data, error });
      
      if (error) {
        console.error('🔥 Debug: Insert error details:', error);
        console.error('🔥 Debug: Error code:', error.code);
        console.error('🔥 Debug: Error message:', error.message);
        console.error('🔥 Debug: Error details:', error.details);
        console.error('🔥 Debug: Error hint:', error.hint);
        setStatus(`Insert Error: ${error.message} (Code: ${error.code})`);
      } else {
        console.log('✅ Debug: Insert successful:', data);
        setStatus('Insert successful');
      }
    } catch (err) {
      console.error('🔥 Debug: Unexpected error:', err);
      setStatus(`Unexpected error: ${err}`);
    }
    
    setTestMessage('');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>🔧 Realtime Debug</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>구독 상태:</strong> {status}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>테스트 방 ID:</strong> {testRoomId || '없음'}
        <button 
          onClick={createTestRoom} 
          style={{ padding: '0.5rem', marginLeft: '1rem' }}
        >
          테스트 방 생성
        </button>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <input 
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          placeholder="테스트 메시지 입력"
          style={{ padding: '0.5rem', marginRight: '0.5rem', width: '200px' }}
        />
        <button 
          onClick={sendTestMessage} 
          style={{ padding: '0.5rem' }}
          disabled={!testRoomId}
        >
          테스트 메시지 전송
        </button>
        {!testRoomId && (
          <span style={{ color: '#888', marginLeft: '0.5rem' }}>
            먼저 테스트 방을 생성하세요
          </span>
        )}
      </div>
      
      <div>
        <strong>실시간 메시지들:</strong>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '1rem', 
          height: '200px', 
          overflow: 'auto',
          backgroundColor: '#f5f5f5'
        }}>
          {messages.length === 0 ? (
            <div style={{ color: '#888' }}>아직 실시간 메시지가 없습니다...</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.25rem', backgroundColor: '#fff' }}>
                <strong>{msg.username}:</strong> {msg.message}
                <br />
                <small style={{ color: '#666' }}>ID: {msg.id} | Room: {msg.room_id}</small>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        브라우저 개발자 도구 콘솔을 열어서 더 자세한 로그를 확인하세요.
      </div>
    </div>
  );
}

export default DebugRealtime;
