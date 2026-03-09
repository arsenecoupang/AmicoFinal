import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { styled } from "styled-components";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";

// Modern full-height chat layout
const ChatScreenDiv = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
`;

// Chat header inspired by Discord/Slack
const ChatHeader = styled.header`
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;
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
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) => (p.isMe ? "#3b82f6" : "#64748b")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  border: 2px solid #ffffff;
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
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: #ffffff;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;

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
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

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
const MessageGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const MessageAvatar = styled.div<{ isMe?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(p) => (p.isMe ? "#3b82f6" : "#64748b")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const MessageUsername = styled.span<{ isMe?: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(p) => (p.isMe ? "#3b82f6" : "#1f2937")};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const MessageTimestamp = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
`;

const MessageText = styled.div`
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

// Input area
const InputContainer = styled.div`
  padding: 1rem 1.25rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
`;

const InputForm = styled.form`
  display: flex;
  align-items: end;
  gap: 0.75rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #3b82f6;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  background: ${(p) => (p.disabled ? "#e5e7eb" : "#3b82f6")};
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
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

  .emoji {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
    color: #64748b;
    max-width: 280px;
  }
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
	const [question, setQuestion] = useState<string | null>(null);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);

	// Initialize room data
	useEffect(() => {
		const state = location.state as any;
		if (state?.roomId) setRoomId(state.roomId);
		if (state?.question) setQuestion(state.question);
		if (state?.selectedOption) setSelectedOption(state.selectedOption);
		setLoading(false);
	}, [location.state]);

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
					roomMembers.includes(msg.username),
				);

				setMsgs(
					filteredData.map((msg: any) => ({
						id: msg.id,
						sender: msg.username,
						text: msg.message,
						ts: new Date(msg.created_at).getTime(),
					})),
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
								m.text === msg.message,
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
				},
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
	const groupMessages = (messages: Msg[]) => {
		const groups: Msg[][] = [];
		let currentGroup: Msg[] = [];

		messages.forEach((msg, index) => {
			const prevMsg = messages[index - 1];
			const timeDiff = prevMsg ? msg.ts - prevMsg.ts : 0;
			const shouldGroup =
				prevMsg && prevMsg.sender === msg.sender && timeDiff < 5 * 60 * 1000; // Group if within 5 minutes

			if (shouldGroup) {
				currentGroup.push(msg);
			} else {
				if (currentGroup.length > 0) {
					groups.push(currentGroup);
				}
				currentGroup = [msg];
			}
		});

		if (currentGroup.length > 0) {
			groups.push(currentGroup);
		}

		return groups;
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
							<div className="emoji">⏳</div>
							<div className="title">멤버 정보를 불러오는 중...</div>
						</EmptyState>
					)}

					{roomMembers.length > 0 && messageGroups.length === 0 && (
						<EmptyState>
							<div className="emoji">💬</div>
							<div className="title">대화를 시작해보세요!</div>
							<div className="subtitle">
								첫 번째 메시지를 보내서 대화를 시작해보세요.
							</div>
						</EmptyState>
					)}

					{messageGroups.map((group, groupIndex) => {
						const firstMsg = group[0];
						const isMe = firstMsg.sender === user?.username;
						const initial = isMe
							? "나"
							: firstMsg.sender.charAt(0).toUpperCase();

						return (
							<MessageGroup key={`group-${groupIndex}`}>
								<MessageAvatar isMe={isMe}>{initial}</MessageAvatar>
								<MessageContent>
									<MessageHeader>
										<MessageUsername isMe={isMe}>
											{isMe ? "나" : firstMsg.sender}
										</MessageUsername>
										<MessageTimestamp>
											{formatTime(firstMsg.ts)}
										</MessageTimestamp>
									</MessageHeader>
									{group.map((msg) => (
										<MessageText key={msg.id}>{msg.text}</MessageText>
									))}
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
