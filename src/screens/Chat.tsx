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
  align-items: center;
  justify-content: space-between;
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
  gap: .5rem;
`;

const BubbleRow = styled.div<{me?: boolean}>`
  display: flex;
  justify-content: ${p => p.me ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div<{me?: boolean}>`
  max-width: 70%;
  padding: .6rem .75rem;
  border-radius: .5rem;
  background: ${p => p.me ? p.theme.main : p.theme.baseHover};
  color: ${p => p.me ? '#fff' : p.theme.text};
  font-size: .95rem;
  line-height: 1.4;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
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

  // roomId 가져오기
  useEffect(() => {
    const rId = (location.state as any)?.roomId;
    if (rId) setRoomId(rId);
    setLoading(false);
  }, [location.state]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        setMsgs(prev => [...prev, {
          id: msg.id,
          sender: msg.user_id,
          text: msg.content,
          ts: new Date(msg.created_at).getTime()
        }]);
      })
      .subscribe();
    // 기존 메시지 불러오기
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (data) {
        setMsgs(data.map((msg: any) => ({
          id: msg.id,
          sender: msg.user_id,
          text: msg.content,
          ts: new Date(msg.created_at).getTime()
        })));
      }
    })();
    return () => { supabase.removeChannel(subscription); };
  }, [roomId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // 메시지 전송 및 온도 증가
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || !roomId) return;
    setText("");
    // 메시지 저장
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          room_id: roomId,
          user_id: user.username,
          content: trimmed
        }
      ]);
    // 온도 5도 증가
    try {
      await supabase.rpc('increment_temperature', { username: user.username, inc: 5 });
    } catch (e) {
      console.error('increment temp rpc failed', e);
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
          <Title>채팅</Title>
          <RoomTag>{roomId ? `방번호: ${roomId}` : ''}</RoomTag>
        </Header>
        <Board>
          <Messages>
            {msgs.map(m => (
              <BubbleRow key={m.id} me={m.sender === user?.username}>
                <Bubble me={m.sender === user?.username}>{m.text}</Bubble>
              </BubbleRow>
            ))}
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