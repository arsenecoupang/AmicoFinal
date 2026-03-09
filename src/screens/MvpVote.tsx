// * MVP 투표 시스템 - 채팅방 참여자들이 서로를 평가하는 핵심 기능
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";

// * 스타일드 컴포넌트 정의
const Container = styled.div`
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Card = styled.section`
  background: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 900;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Btn = styled.button<{ variant?: "primary" | "danger" }>`
  background: ${(p) => (p.variant === "danger" ? "#e74c3c" : "#A8C686")};
  color: #fff;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  box-shadow: 0 6px 18px rgba(168, 198, 134, 0.12);
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
`;

const CandidateCard = styled.label<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.selected ? p.theme.main : p.theme.baseHover)};
  background: ${(p) => (p.selected ? p.theme.mainHover : "#fff")};
  color: ${(p) => (p.selected ? "#fff" : p.theme.text)};
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const Avatar = styled.div<{ isMe?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${(p) => p.theme.baseHover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-right: 0.75rem;
`;

const RankBadge = styled.div<{ rank?: number }>`
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
  background: ${(p) =>
		p.rank === 1
			? "#D4AF37"
			: p.rank === 2
				? "#c0c0c0"
				: p.rank === 3
					? "#cd7f32"
					: p.theme.baseHover};
`;

const ProgressBar = styled.div`
  height: 36px;
  border-radius: 8px;
  background: ${(p) => p.theme.baseHover};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${(p) => p.pct}%;
  background: ${(p) => p.theme.main};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
  color: #fff;
  font-weight: 800;
  transition: width 0.4s ease;
`;

// * 타입 정의
interface Room {
	id: string;
	members: string[] | string;
	created_at?: string;
}

interface Profile {
	id: string;
	username: string;
	realname?: string;
}

function MvpVote() {
	// * 상태 관리 - 사용자 인증, 후보자 데이터, 투표 상태 등
	const { user, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	const [candidates, setCandidates] = useState<Profile[]>([]);
	const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
		null,
	);
	const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userRoomIds, setUserRoomIds] = useState<string[]>([]);
	const [alreadyVoted, setAlreadyVoted] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	// * 데이터 로드 함수 - 사용자 권한, 참여 방, 후보자, 투표 현황 조회
	const fetchVoteData = useCallback(async () => {
		if (!user) return;

		setIsLoading(true);
		setError(null);

		try {
			// ? 관리자 권한 확인 (사용자의 email이나 특정 조건으로 판단)
			// ? 예: 특정 이메일이나 username으로 관리자 구분
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("username, email")
				.eq("id", user.id)
				.single();

			if (
				profile &&
				(profile.username === "admin" ||
					profile.email === "admin@test.com" ||
					user.email === "suhoocho1221@gmail.com") // 개발자 이메일 추가
			) {
				setIsAdmin(true);
			}

			// 1. 사용자가 참여한 방 찾기
			const { data: rooms, error: roomsError } = await supabase
				.from("rooms")
				.select("id, members");

			if (roomsError) throw roomsError;

			const participatedRooms = rooms.filter((r: any) => {
				try {
					const members = Array.isArray(r.members)
						? r.members
						: JSON.parse(r.members);
					return members.includes(user.username);
				} catch {
					return false;
				}
			});

			if (participatedRooms.length === 0) {
				setError("참여한 채팅방이 없습니다.");
				setIsLoading(false);
				return;
			}

			const roomIds = participatedRooms.map((r) => r.id);
			setUserRoomIds(roomIds);

			// 2. 모든 참여 방의 멤버(후보자) 목록 만들기
			const memberUsernames = new Set<string>();
			participatedRooms.forEach((r) => {
				const members = Array.isArray(r.members)
					? r.members
					: JSON.parse(r.members as string);
				members.forEach((m: string) => memberUsernames.add(m));
			});

			// 3. 후보자 프로필 정보 가져오기
			const { data: profiles, error: profilesError } = await supabase
				.from("profiles")
				.select("id, username, realname")
				.in("username", Array.from(memberUsernames));

			if (profilesError) throw profilesError;
			setCandidates(profiles || []);

			const { data: votes, error: votesError } = await supabase
				// 4. 현재 투표 현황 집계
				.from("votes")
				.select("candidate_id")
				.in("room_id", roomIds);

			if (votesError) throw votesError;

			const counts: Record<string, number> = {};
			if (votes) {
				votes.forEach((v) => {
					counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
				});
			}
			setVoteCounts(counts);

			// 5. 사용자의 기존 투표 확인
			const { data: myVote } = await supabase
				.from("votes")
				.select("candidate_id")
				.eq("voter_id", user.id)
				.in("room_id", roomIds)
				.limit(1)
				.single();

			if (myVote) {
				setSelectedCandidateId(myVote.candidate_id);
				setAlreadyVoted(true);
			}
		} catch (err: any) {
			setError("데이터를 불러오는 중 오류가 발생했습니다: " + err.message);
			console.error("MvpVote load error:", err);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	// ! useEffect - 인증 상태 변화 감지 및 데이터 로드
	useEffect(() => {
		if (!authLoading && !user) {
			navigate("/login");
		} else if (user) {
			fetchVoteData();
		}
	}, [user, authLoading, navigate, fetchVoteData]);

	// * 투표 제출 함수 - 새로운 투표 기록 생성 및 저장
	const handleVoteSubmit = async () => {
		if (
			!user ||
			!selectedCandidateId ||
			userRoomIds.length === 0 ||
			alreadyVoted
		)
			return;

		setIsLoading(true);
		try {
			// ? 새 투표 기록 (기존 투표 삭제 없이)
			const newVotes = userRoomIds.map((roomId) => ({
				id: uuidv4(),
				room_id: roomId,
				voter_id: user.id,
				candidate_id: selectedCandidateId,
			}));

			const { error: insertError } = await supabase
				.from("votes")
				.insert(newVotes);

			if (insertError) throw insertError;

			alert("투표가 성공적으로 제출되었습니다. 투표는 변경할 수 없습니다.");
			setAlreadyVoted(true);

			// 투표 현황 다시 불러오기
			fetchVoteData();
		} catch (err: any) {
			setError("투표 제출 중 오류가 발생했습니다: " + err.message);
			console.error("submitVote error", err);
		} finally {
			setIsLoading(false);
		}
	};

	// ! 관리자 전용 - 다음 사이클 시작 (모든 데이터 초기화)
	const handleNextCycle = async () => {
		try {
			setIsLoading(true);

			// todo 1. 모든 투표 기록 삭제
			const { error: deleteVotesError } = await supabase
				.from("votes")
				.delete()
				.neq("id", "00000000-0000-0000-0000-000000000000"); // 모든 투표 삭제

			if (deleteVotesError) {
				throw new Error("투표 기록 삭제 실패: " + deleteVotesError.message);
			}

			// todo 2. 모든 채팅 메시지 삭제
			const { error: deleteChatsError } = await supabase
				.from("chats")
				.delete()
				.not("id", "is", null); // 모든 채팅 삭제

			if (deleteChatsError) {
				throw new Error("채팅 기록 삭제 실패: " + deleteChatsError.message);
			}

			// todo 3. 모든 채팅방 삭제 (선택사항 - 방을 유지하고 싶다면 주석 처리)
			const { error: deleteRoomsError } = await supabase
				.from("chat_rooms")
				.delete()
				.neq("id", "00000000-0000-0000-0000-000000000000"); // 모든 방 삭제

			if (deleteRoomsError) {
				throw new Error("채팅방 삭제 실패: " + deleteRoomsError.message);
			}

			alert("시스템이 초기화되었습니다. 새로운 사이클이 시작됩니다!");

			// 홈으로 리다이렉트
			navigate("/home");
		} catch (err: any) {
			setError("다음 단계 진행 중 오류: " + err.message);
			console.error("Next cycle error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	// * MVP 확정 함수 - 투표 집계 후 최종 우승자 결정
	const handleFinalize = async () => {
		if (userRoomIds.length === 0) return;

		// eslint-disable-next-line no-restricted-globals
		const confirmed = confirm(
			"MVP를 확정하고 투표를 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
		);
		if (!confirmed) return;

		setIsLoading(true);
		try {
			const { data: votes, error: votesError } = await supabase
				.from("votes")
				.select("candidate_id")
				.in("room_id", userRoomIds);

			if (votesError || !votes || votes.length === 0) {
				alert("집계할 투표가 없습니다.");
				setIsLoading(false);
				return;
			}

			const tally: Record<string, number> = {};
			votes.forEach((v) => {
				tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1;
			});

			const winnerId = Object.keys(tally).reduce((a, b) =>
				tally[a] > tally[b] ? a : b,
			);

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("username, realname, temperature")
				.eq("id", winnerId)
				.single();

			if (profileError || !profile)
				throw new Error("MVP 프로필을 찾을 수 없습니다.");

			// 온도 업데이트
			const newTemp = (profile.temperature || 0) + 10;
			await supabase
				.from("profiles")
				.update({ temperature: newTemp })
				.eq("id", winnerId);

			// MVP 기록
			await supabase.from("mvp_history").insert([
				{
					room_id: userRoomIds[0], // 대표 방 ID
					mvp_id: winnerId,
					realname: profile.realname,
					date: new Date().toISOString().slice(0, 10),
				},
			]);

			alert(`최종 MVP는 ${profile.realname || profile.username}님입니다!`);

			// 다음 단계 진행 확인
			// eslint-disable-next-line no-restricted-globals
			const proceedNext = confirm(
				"투표가 확정되었습니다. 다음 단계(채팅방 정리 및 새 질문 생성)로 진행하시겠습니까?",
			);

			if (proceedNext) {
				await handleNextCycle();
			} else {
				navigate("/home");
			}
		} catch (err: any) {
			setError("결과 확정 중 오류가 발생했습니다: " + err.message);
			console.error("finalize error", err);
		} finally {
			setIsLoading(false);
		}
	};

	// * 로딩 상태 렌더링
	if (authLoading || isLoading) {
		return (
			<Container>
				<Card>투표 정보를 불러오는 중...</Card>
			</Container>
		);
	}

	// ! 에러 상태 렌더링
	if (error) {
		return (
			<Container>
				<Card>{error}</Card>
			</Container>
		);
	}

	// * 메인 투표 인터페이스 렌더링
	return (
		<Container>
			<h2>
				지난 채팅 MVP 투표
				{isAdmin && (
					<span
						style={{
							fontSize: "0.8rem",
							color: "#ff5722",
							marginLeft: "1rem",
							padding: "0.25rem 0.5rem",
							background: "#fff3e0",
							borderRadius: "4px",
						}}
					>
						관리자
					</span>
				)}
			</h2>
			<Card>
				<p>
					{alreadyVoted
						? "이미 투표를 완료했습니다. 투표는 변경할 수 없습니다."
						: "가장 즐거운 시간을 만들어준 멤버에게 투표하세요."}
				</p>
				{/* * 후보자 카드 목록 - 진행률과 투표 선택 인터페이스 */}
				<Grid>
					{candidates.map((c) => {
						const totalVotes = Object.values(voteCounts).reduce(
							(a, b) => a + b,
							0,
						);
						const pct =
							totalVotes === 0
								? 0
								: Math.round(((voteCounts[c.id] || 0) / totalVotes) * 100);
						const isSelected = selectedCandidateId === c.id;
						return (
							<CandidateCard key={c.id} selected={isSelected}>
								<div className="meta">
									<div style={{ fontWeight: 800 }}>
										{c.realname || c.username}
									</div>
									<div style={{ fontSize: 12, opacity: 0.8 }}>
										{voteCounts[c.id] || 0}표
									</div>
								</div>
								<ProgressBar>
									<ProgressFill pct={pct}>{pct}%</ProgressFill>
								</ProgressBar>
								<input
									type="radio"
									name="candidate"
									value={c.id}
									checked={isSelected}
									onChange={() => !alreadyVoted && setSelectedCandidateId(c.id)}
									disabled={alreadyVoted}
									style={{ display: "none" }}
								/>
							</CandidateCard>
						);
					})}
				</Grid>
				{/* * 액션 버튼들 - 투표 제출 및 관리자 기능 */}
				<Actions style={{ marginTop: "1rem" }}>
					<Btn
						onClick={handleVoteSubmit}
						disabled={!selectedCandidateId || isLoading || alreadyVoted}
					>
						{alreadyVoted ? "투표 완료" : "투표 제출"}
					</Btn>

					{/* ! 관리자 전용 버튼들 */}
					{isAdmin && (
						<>
							<Btn
								variant="danger"
								onClick={handleFinalize}
								disabled={isLoading}
								style={{ marginLeft: "0.5rem" }}
							>
								{isLoading ? "처리 중..." : "투표 결과 확정"}
							</Btn>
							<Btn
								onClick={handleNextCycle}
								disabled={isLoading}
								style={{
									marginLeft: "0.5rem",
									backgroundColor: "#ff9800",
									color: "white",
								}}
							>
								{isLoading ? "처리 중..." : "시스템 초기화"}
							</Btn>
						</>
					)}
				</Actions>
			</Card>
		</Container>
	);
}

export default MvpVote;
