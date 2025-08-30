import React, { useEffect, useMemo, useRef, useState } from "react";
import { styled, keyframes } from "styled-components";
import { useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { supabase } from '../db';

const ChatScreenDiv = styled.div`
    min-height: calc(100vh - 6.25rem);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    background: ${props => props.theme.base};
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.base};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const OverlayCard = styled.div`
  background: #fff;
  border: 1px solid ${props => props.theme.main};
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  padding: 1.25rem 1.5rem;
  border-radius: .5rem;
  display: flex;
  align-items: center;
  gap: .75rem;
  animation: ${fadeIn} .3s ease both;
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.theme.main};
  display: inline-block;
  animation: bounce 1s infinite ease-in-out;
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  &:nth-child(2) { animation-delay: .2s; }
  &:nth-child(3) { animation-delay: .4s; }
`;

const Message = styled.span`
  color: ${props => props.theme.text};
  font-weight: 800;
  letter-spacing: .01em;
`;

// 채팅 UI
const Shell = styled.div`
  width: 100%;
  max-width: 48rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: .75rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MembersRow = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem 0;
`;

const ProfileAvatar = styled.div<{ isMe?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${p => p.isMe ? p.theme.main : p.theme.sub};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  color: #fff;
  border: 2px solid ${p => p.isMe ? p.theme.mainHover : p.theme.subHover};
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #22c55e;
  border-radius: 50%;
  border: 2px solid #fff;
`;

const MemberName = styled.div`
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: .65rem;
  color: ${props => props.theme.textHover};
  font-weight: 500;
  white-space: nowrap;
  background: ${props => props.theme.base};
  padding: .25rem .5rem;
  border-radius: .25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  
  ${ProfileAvatar}:hover & {
    opacity: 1;
  }
`;

const MemberCount = styled.div`
  font-size: .8rem;
  color: ${props => props.theme.textHover};
  font-weight: 600;
  margin-left: auto;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: ${props => props.theme.text};
`;

const RoomTag = styled.span`
  border: 1px solid ${props => props.theme.main};
  color: ${props => props.theme.main};
  background: #fff;
  border-radius: .25rem;
  padding: .25rem .5rem;
  font-size: .8rem;
  font-weight: 700;
`;

const Board = styled.div`
  background: #fff;
  border: 1px solid ${props => props.theme.baseHover};
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  border-radius: .5rem;
  min-height: 18rem;
  max-height: calc(70vh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Messages = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: .25rem;
`;

const BubbleRow = styled.div<{me?: boolean}>`
  display: flex;
  justify-content: ${p => p.me ? 'flex-end' : 'flex-start'};
  margin-bottom: .75rem;
`;

const MessageContainer = styled.div<{me?: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: ${p => p.me ? 'flex-end' : 'flex-start'};
  max-width: 70%;
`;

const Username = styled.div<{me?: boolean}>`
  font-size: .75rem;
  font-weight: 600;
  color: ${p => p.me ? p.theme.main : p.theme.textHover};
  margin-bottom: .25rem;
  margin-left: ${p => p.me ? '0' : '.5rem'};
  margin-right: ${p => p.me ? '.5rem' : '0'};
  display: flex;
  align-items: center;
  gap: .5rem;
`;

const Timestamp = styled.span`
  font-size: .65rem;
  font-weight: 400;
  opacity: 0.7;
`;

const Bubble = styled.div<{me?: boolean}>`
  padding: .6rem .75rem;
  border-radius: .5rem;
  background: ${p => p.me ? p.theme.main : p.theme.baseHover};
  color: ${p => p.me ? '#fff' : p.theme.text};
  font-size: .95rem;
  line-height: 1.4;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  word-wrap: break-word;
`;

const System = styled.div`
  align-self: center;
  font-size: .85rem;
  opacity: .7;
  margin: .25rem 0 .5rem;
`;

const InputBar = styled.form`
  display: flex;
  gap: .5rem;
  border-top: 1px solid ${props => props.theme.baseHover};
  padding: .5rem;
`;

const TextInput = styled.textarea`
  flex: 1;
  resize: none;
  border: 1px solid ${props => props.theme.baseHover};
  background: ${props => props.theme.base};
  color: ${props => props.theme.text};
  border-radius: .375rem;
  padding: .6rem .7rem;
  min-height: 2.5rem;
  max-height: 7rem;
  font-size: .95rem;
  line-height: 1.35;
  &:focus { outline: 2px solid ${props => props.theme.sub}; outline-offset: 2px; background: #fff; }
`;

const Send = styled.button<{disabled?: boolean}>`
  background: ${p => p.disabled ? '#cfd8cf' : p.theme.main};
  color: #fff;
  border: none;
  border-radius: .375rem;
  padding: 0 1rem;
  font-weight: 800;
  min-width: 5.5rem;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  transition: background .2s ease;
  &:hover { background: ${p => p.disabled ? '#cfd8cf' : p.theme.mainHover}; }
`;


type Msg = { id: string; sender: string; text: string; ts: number };
function ChatScreen() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);

  // roomId 가져오기
  useEffect(() => {
    const rId = (location.state as any)?.roomId;
    if (rId) setRoomId(rId);
    setLoading(false);
  }, [location.state]);

  // 방 멤버 정보 가져오기
  useEffect(() => {
    if (!roomId) return;
    
    const fetchRoomMembers = async () => {
      try {
        const { data: roomData } = await supabase
          .from('rooms')
          .select('members')
          .eq('id', roomId)
          .single();
          
        if (roomData && roomData.members) {
          let members = [];
          try {
            if (typeof roomData.members === 'string') {
              members = JSON.parse(roomData.members);
            } else if (Array.isArray(roomData.members)) {
              members = roomData.members;
            }
          } catch (e) {
            members = [];
          }
          setRoomMembers(members);
        }
      } catch (error) {
        console.warn('Failed to fetch room members:', error);
      }
    };
    
    fetchRoomMembers();
  }, [roomId]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    
    console.log('Setting up realtime subscription for room:', roomId);
    
    const subscription = supabase
      .channel(`chat-room-${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chats',
        filter: `room_id=eq.${roomId}`
      }, payload => {
        console.log('New message received:', payload.new);
        const msg = payload.new;
        setMsgs(prev => {
          // 중복 메시지 방지
          const exists = prev.find(m => m.id === msg.id);
          if (exists) return prev;
          
          return [...prev, {
            id: msg.id,
            sender: msg.username,
            text: msg.message,
            ts: new Date(msg.created_at).getTime()
          }];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, payload => {
        console.log('Room updated:', payload.new);
        const roomData = payload.new;
        if (roomData.members) {
          let members = [];
          try {
            if (typeof roomData.members === 'string') {
              members = JSON.parse(roomData.members);
            } else if (Array.isArray(roomData.members)) {
              members = roomData.members;
            }
          } catch (e) {
            members = [];
          }
          setRoomMembers(members);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    // 기존 메시지 불러오기
    (async () => {
      console.log('Loading existing messages for room:', roomId);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
        
      console.log('Existing messages:', { data, error });
      
      if (data) {
        setMsgs(data.map((msg: any) => ({
          id: msg.id,
          sender: msg.username,
          text: msg.message,
          ts: new Date(msg.created_at).getTime()
        })));
      }
    })();
    
    return () => { 
      console.log('Cleaning up subscription');
      supabase.removeChannel(subscription); 
    };
  }, [roomId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // 메시지 전송 및 온도 증가
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || !roomId) return;
    
    console.log('Sending message:', { roomId, username: user.username, message: trimmed });
    
    // 즉시 UI에 메시지 추가 (낙관적 업데이트)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: user.username,
      text: trimmed,
      ts: Date.now()
    };
    
    setMsgs(prev => [...prev, tempMessage]);
    setText("");
    
    // 메시지 저장
    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          room_id: roomId,
          username: user.username,
          message: trimmed
        }
      ])
      .select()
      .single();
      
    console.log('Message insert result:', { data, error });
    
    if (error) {
      console.error('Failed to send message:', error);
      // 실패 시 임시 메시지 제거하고 텍스트 복원
      setMsgs(prev => prev.filter(m => m.id !== tempMessage.id));
      setText(trimmed);
      return;
    }
    
    // 성공 시 임시 메시지를 실제 메시지로 교체
    if (data) {
      setMsgs(prev => prev.map(m => 
        m.id === tempMessage.id 
          ? {
              id: data.id,
              sender: data.username,
              text: data.message,
              ts: new Date(data.created_at).getTime()
            }
          : m
      ));
    }
    
    // 온도 5도 증가
    try {
      const { data: tempData, error: tempError } = await supabase
        .from('profiles')
        .select('temperature')
        .eq('username', user.username)
        .single();
        
      if (tempData) {
        await supabase
          .from('profiles')
          .update({ temperature: (tempData.temperature || 0) + 5 })
          .eq('username', user.username);
      }
    } catch (e) {
      console.error('Temperature update failed:', e);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); send(); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return <ChatScreenDiv>
    {loading && (
      <Overlay role="status" aria-live="polite">
        <OverlayCard>
          <Dot />
          <Dot />
          <Dot />
          <Message>나와 같은 대답을 한 사람들과 대회해보세요</Message>
        </OverlayCard>
      </Overlay>
    )}
    {!loading && (
      <Shell>
        <Header>
          <TitleRow>
            <Title>채팅</Title>
            <RoomTag>{roomId ? `${roomId.slice(0, 8)}...` : ''}</RoomTag>
          </TitleRow>
          
          <MembersRow>
            {roomMembers.map((member) => {
              const isMe = member === user?.username;
              // 이름의 첫 글자를 아바타로 사용
              const initial = isMe ? '나' : (member.charAt(0).toUpperCase());
              
              return (
                <ProfileAvatar key={member} isMe={isMe}>
                  {initial}
                  <OnlineIndicator />
                  <MemberName>{isMe ? '나' : member}</MemberName>
                </ProfileAvatar>
              );
            })}
            <MemberCount>{roomMembers.length}명 참여</MemberCount>
          </MembersRow>
        </Header>
        <Board>
          <Messages>
            {msgs.map((m, index) => {
              const isMe = m.sender === user?.username;
              const prevMsg = index > 0 ? msgs[index - 1] : null;
              const showUsername = !prevMsg || prevMsg.sender !== m.sender;
              
              // 시간 포맷팅
              const formatTime = (timestamp: number) => {
                const date = new Date(timestamp);
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? '오후' : '오전';
                const displayHours = hours % 12 || 12;
                return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
              };
              
              return (
                <BubbleRow key={m.id} me={isMe}>
                  <MessageContainer me={isMe}>
                    {showUsername && (
                      <Username me={isMe}>
                        <span>{isMe ? '나' : m.sender}</span>
                        <Timestamp>{formatTime(m.ts)}</Timestamp>
                      </Username>
                    )}
                    <Bubble me={isMe}>{m.text}</Bubble>
                  </MessageContainer>
                </BubbleRow>
              );
            })}
            <div ref={endRef} />
          </Messages>
          <InputBar onSubmit={onSubmit}>
            <TextInput value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)" />
            <Send type="submit" disabled={!text.trim()}>전송</Send>
          </InputBar>
        </Board>
      </Shell>
    )}
  </ChatScreenDiv>;
}

export default ChatScreen;