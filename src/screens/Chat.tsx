import React, { useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";

// Modern full-height chat layout
const ChatScreenDiv = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.base};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  max-width: 1600px;
  margin: 0 auto;

  @media (min-width: 1024px) {
    border-left: 1px solid ${({ theme }) => theme.baseHover};
    border-right: 1px solid ${({ theme }) => theme.baseHover};
  }
`;

// Chat header inspired by Discord/Slack
const ChatHeader = styled.header`
  background: ${({ theme }) => theme.base};
  border-bottom: 1px solid ${({ theme }) => theme.baseHover};
  padding: clamp(0.75rem, 2vw, 1.25rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;

  @media (min-width: 768px) {
    min-height: 64px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RoomTitle = styled.h1`
  margin: 0;
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const RoomId = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: monospace;
`;

// Member avatars - more modern
const MembersList = styled.div`
  display: flex;
  align-items: center;
  gap: -2px;
`;

const MemberAvatar = styled.div<{ isMe?: boolean }>`
  width: clamp(32px, 5vw, 36px);
  height: clamp(32px, 5vw, 36px);
  border-radius: 50%;
  background: ${(p) => (p.isMe ? p.theme.main : p.theme.sub)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  font-weight: 600;
  color: ${({ theme }) => theme.base};
  border: 2px solid ${({ theme }) => theme.base};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: -2px;
  z-index: 1;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const MemberCount = styled.span`
  margin-left: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

// Selection banner
const SelectionBanner = styled.div`
  background: ${({ theme }) => theme.main};
  color: ${({ theme }) => theme.base};
  padding: clamp(0.75rem, 2vw, 1.25rem);
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  flex-wrap: wrap;

  .content {
    flex: 1;
    min-width: 0;
  }

  .topic {
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.9;
    margin-bottom: 0.25rem;
  }

  .selection {
    font-size: 1rem;
    font-weight: 700;
  }

  .guide {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.8;
  }
`;

// Chat messages area
const ChatContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  min-height: 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1rem);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    border: 2px solid #f1f5f9;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Message group (like Discord)
const MessageGroup = styled.div<{ isMe?: boolean }>`
  display: flex;
  gap: 0.75rem;
  flex-direction: ${(props) => (props.isMe ? "row-reverse" : "row")};
  align-items: flex-end;
`;

const MessageAvatar = styled.div<{ isMe?: boolean }>`
  width: clamp(36px, 5vw, 40px);
  height: clamp(36px, 5vw, 40px);
  border-radius: 50%;
  background: ${(p) => (p.isMe ? p.theme.main : p.theme.sub)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  font-weight: 500;
  color: ${({ theme }) => theme.base};
  border: 2px solid ${({ theme }) => theme.base};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const MessageContent = styled.div<{ isMe?: boolean }>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
`;

const MessageTextsWrapper = styled.div<{ isMe?: boolean }>`
  max-width: min(100%, 650px);
  position: relative;
  margin-bottom: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.isMe ? "flex-end" : "flex-start")};

  background: ${(p) => (p.isMe ? p.theme.main : "#f3f4f6")};
  color: ${(p) => (p.isMe ? p.theme.base : p.theme.text)};
  padding: 0.7rem 1.1rem;
  border-radius: 1.25rem;
  border-bottom-right-radius: ${(p) => (p.isMe ? "0.3rem" : "1.25rem")};
  border-bottom-left-radius: ${(p) => (p.isMe ? "1.25rem" : "0.3rem")};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  margin-left: ${(p) => (p.isMe ? "auto" : "0")};
  margin-right: ${(p) => (p.isMe ? "0" : "auto")};

  &::after {
    content: "";
    position: absolute;
    ${(p) =>
      p.isMe
        ? `right: -10px; border-left: 12px solid ${p.theme.main};`
        : `left: -10px; border-right: 12px solid #f3f4f6;`}
    top: 18px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    ${(p) => (p.isMe ? "border-right: none;" : "border-left: none;")}
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.1rem;
  padding-left: 2px;
`;

const MessageUsername = styled.span<{ isMe?: boolean }>`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${(p) => (p.isMe ? p.theme.main : "#4b5563")};
  opacity: 0.85;
  margin-right: 0.3rem;
`;

const MessageTimestamp = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
`;

const MessageText = styled.div<{ isMe?: boolean }>`
  color: ${(p) => (p.isMe ? p.theme.base : p.theme.text)};
  font-size: 1.02rem;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  letter-spacing: -0.2px;
  padding: 0;
`;

// Input area
const InputContainer = styled.div`
  padding: clamp(0.75rem, 2vw, 1.25rem);
  background: ${({ theme }) => theme.base};
  border-top: 1px solid ${({ theme }) => theme.baseHover};
  position: sticky;
  bottom: 0;
`;

const InputForm = styled.form`
  display: flex;
  align-items: end;
  gap: 0.75rem;
  background: ${({ theme }) => theme.base};
  border: 1px solid ${({ theme }) => theme.baseHover};
  border-radius: 20px;
  padding: 0.875rem 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

  &:focus-within {
    border-color: ${({ theme }) => theme.main};
    background: ${({ theme }) => theme.base};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.main}1A`};
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 24px;
  max-height: 120px;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  background: ${(p) => (p.disabled ? p.theme.baseHover : p.theme.main)};
  color: ${({ theme }) => theme.base};
  border: none;
  border-radius: 18px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  font-size: 0.9375rem;
  letter-spacing: -0.2px;
  font-size: 0.875rem;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// Loading and empty states
const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin: 0;
  color: #64748b;
  font-weight: 500;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 3rem 1rem;
  text-align: center;

  .title {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    margin-bottom: 0.75rem;
  }

  .subtitle {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.text};
    opacity: 0.7;
    max-width: 280px;
  }
`;

type Msg = { id: string; sender: string; text: string; ts: number };

function ChatScreen() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Initialize room data
  useEffect(() => {
    const state = location.state as any;

    // localStorage에서 퀴즈 결과 확인
    const storedQuizResult = localStorage.getItem("quizResult");

    if (state?.roomId) {
      setRoomId(state.roomId);
      setQuestion(state.question);
      setSelectedOption(state.selectedOption);
    } else if (storedQuizResult) {
      // localStorage에서 정보 복원
      try {
        const quizData = JSON.parse(storedQuizResult);
        setRoomId(quizData.roomId);
        setQuestion(quizData.question);
        setSelectedOption(quizData.selectedOption);
      } catch (e) {
        console.error("Failed to parse stored quiz result:", e);
        // 선택지가 없으면 quiz로 리다이렉트
        navigate("/quiz");
        return;
      }
    } else {
      // 선택지가 없으면 quiz로 리다이렉트
      navigate("/quiz");
      return;
    }

    setLoading(false);
  }, [location.state, navigate]);

  // Fetch room members
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomMembers = async () => {
      try {
        const { data: roomData } = await supabase
          .from("rooms")
          .select("members")
          .eq("id", roomId)
          .single();

        if (roomData && roomData.members) {
          let members = [];
          try {
            if (typeof roomData.members === "string") {
              members = JSON.parse(roomData.members);
            } else if (Array.isArray(roomData.members)) {
              members = roomData.members;
            }
          } catch (e) {
            console.error("Failed to parse members:", e);
            members = [];
          }
          setRoomMembers(members);
        } else {
          setRoomMembers([]);
        }
      } catch (error) {
        console.warn("Failed to fetch room members:", error);
        setRoomMembers([]);
      }
    };

    fetchRoomMembers();
  }, [roomId]);

  // Load existing messages
  useEffect(() => {
    if (!roomId || roomMembers.length === 0) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (data) {
        const filteredData = data.filter((msg: any) =>
          roomMembers.includes(msg.username)
        );

        setMsgs(
          filteredData.map((msg: any) => ({
            id: msg.id,
            sender: msg.username,
            text: msg.message,
            ts: new Date(msg.created_at).getTime(),
          }))
        );
      }
    };

    loadMessages();
  }, [roomId, roomMembers]);

  // Realtime message subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel("public:chats")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
        },
        (payload) => {
          const msg = payload.new;
          if (msg.room_id !== roomId) return;

          setMsgs((prev) => {
            const exists = prev.find((m) => m.id === msg.id);
            if (exists) return prev;

            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.sender === msg.username &&
                m.text === msg.message
            );

            if (tempIdx !== -1) {
              const newMsgs = [...prev];
              newMsgs[tempIdx] = {
                id: msg.id,
                sender: msg.username,
                text: msg.message,
                ts: new Date(msg.created_at).getTime(),
              };
              return newMsgs;
            }

            return [
              ...prev,
              {
                id: msg.id,
                sender: msg.username,
                text: msg.message,
                ts: new Date(msg.created_at).getTime(),
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Send message
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || !roomId) return;

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const tempMessage = {
      id: tempId,
      sender: user.username,
      text: trimmed,
      ts: Date.now(),
    };

    setMsgs((prev) => [...prev, tempMessage]);
    setText("");

    try {
      const { error } = await supabase.from("chats").insert([
        {
          room_id: roomId,
          username: user.username,
          message: trimmed,
        },
      ]);

      if (error) {
        console.error("Failed to send message:", error);
        setMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setText(trimmed);
        return;
      }

      // Update temperature
      try {
        const { data: tempData } = await supabase
          .from("profiles")
          .select("temperature")
          .eq("username", user.username)
          .single();

        if (tempData) {
          await supabase
            .from("profiles")
            .update({ temperature: (tempData.temperature || 0) + 2 })
            .eq("username", user.username);
        }
      } catch (e) {
        console.error("Temperature update failed:", e);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group consecutive messages by sender
  // 메시지 그룹핑을 제거하여, 전송할 때마다 항상 새로운 말풍선이 생성되도록 변경
  const groupMessages = (messages: Msg[]) => {
    return messages.map((msg) => [msg]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <LoadingOverlay>
        <LoadingCard>
          <LoadingSpinner />
          <LoadingText>채팅방에 연결하는 중...</LoadingText>
        </LoadingCard>
      </LoadingOverlay>
    );
  }

  const filteredMsgs = msgs.filter((m) => roomMembers.includes(m.sender));
  const messageGroups = groupMessages(filteredMsgs);

  return (
    <ChatScreenDiv>
      <ChatHeader>
        <HeaderLeft>
          <RoomTitle>채팅</RoomTitle>
          {roomId && <RoomId>{roomId.slice(0, 8)}...</RoomId>}
        </HeaderLeft>
        <HeaderRight>
          <MembersList>
            {roomMembers.map((member) => {
              const isMe = member === user?.username;
              const initial = isMe ? "나" : member.charAt(0).toUpperCase();

              return (
                <MemberAvatar
                  key={member}
                  isMe={isMe}
                  title={isMe ? "나" : member}
                >
                  {initial}
                </MemberAvatar>
              );
            })}
          </MembersList>
          <MemberCount>{roomMembers.length}명 참여</MemberCount>
        </HeaderRight>
      </ChatHeader>

      {question && selectedOption && (
        <SelectionBanner>
          <div className="content">
            <div className="topic">주제: {question}</div>
            <div className="selection">나의 선택: {selectedOption}</div>
            <div className="guide">
              주제와 관련된 내용으로 대화를 이어가 주세요.
            </div>
          </div>
        </SelectionBanner>
      )}

      <ChatContent>
        <MessagesContainer>
          {roomMembers.length === 0 && (
            <EmptyState>
              <div className="title">멤버 정보를 불러오는 중...</div>
            </EmptyState>
          )}

          {roomMembers.length > 0 && messageGroups.length === 0 && (
            <EmptyState>
              <div className="title">대화를 시작해보세요!</div>
              <div className="subtitle">
                첫 번째 메시지를 보내서 대화를 시작해보세요.
              </div>
            </EmptyState>
          )}

          {messageGroups.map((group, groupIndex) => {
            const firstMsg = group[0];
            const currentUsername = user?.username?.toLowerCase().trim();
            const senderUsername = firstMsg.sender?.toLowerCase().trim();
            const isMe = !!(
              currentUsername &&
              senderUsername &&
              currentUsername === senderUsername
            );
            const initial = isMe
              ? "나"
              : firstMsg.sender.charAt(0).toUpperCase();
            return (
              <MessageGroup key={`group-${groupIndex}`} isMe={isMe}>
                <MessageAvatar isMe={isMe}>{initial}</MessageAvatar>
                <MessageContent isMe={isMe}>
                  <MessageHeader>
                    <MessageUsername isMe={isMe}>
                      {isMe ? user?.username || "나" : firstMsg.sender}
                    </MessageUsername>
                    <MessageTimestamp>
                      {formatTime(firstMsg.ts)}
                    </MessageTimestamp>
                  </MessageHeader>
                  <MessageTextsWrapper isMe={isMe}>
                    {group.map((msg) => (
                      <MessageText key={msg.id} isMe={isMe}>
                        {msg.text}
                      </MessageText>
                    ))}
                  </MessageTextsWrapper>
                </MessageContent>
              </MessageGroup>
            );
          })}
          <div ref={endRef} />
        </MessagesContainer>

        <InputContainer>
          <InputForm onSubmit={handleSubmit}>
            <MessageInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={1}
            />
            <SendButton type="submit" disabled={!text.trim()}>
              전송
            </SendButton>
          </InputForm>
        </InputContainer>
      </ChatContent>
    </ChatScreenDiv>
  );
}

export default ChatScreen;
