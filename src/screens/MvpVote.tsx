import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../db";
import styled from "styled-components";
import { useAuth } from "../AuthContext";
import { v4 as uuidv4 } from "uuid";

const Container = styled.div`
  padding: 2rem;
  max-width: 640px;
  margin: 0 auto;
`;
const Card = styled.div`
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;
const Btn = styled.button`
  background: #a8c686;
  color: #fff;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
`;

const VoteCountProgressOutline = styled.div`
  background: linear-gradient(
    180deg,
    ${(props) => props.theme.baseHover} 0%,
    ${(props) => props.theme.baseHover} 100%
  );
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.2rem;
    border-radius: 8px;
`;

const VoteCountProgressFill = styled.div<{ width: number }>`
  background-color: ${(props) => props.theme.main};
  height: 100%;
  width: ${(props) => props.width}%;
  transition: width 0.3s ease;
  border-radius: 8px;
  transition: height 0.8s ease-in-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoomIds, setUserRoomIds] = useState<string[]>([]);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const fetchVoteData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
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

      // 4. 현재 투표 현황 집계
      const { data: votes, error: votesError } = await supabase
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchVoteData();
    }
  }, [user, authLoading, navigate, fetchVoteData]);

  const handleVoteSubmit = async () => {
    if (!user || !selectedCandidateId || userRoomIds.length === 0) return;

    setIsLoading(true);
    try {
      // 기존 투표 삭제
      await supabase
        .from("votes")
        .delete()
        .eq("voter_id", user.id)
        .in("room_id", userRoomIds);

      // 새 투표 기록
      const newVotes = userRoomIds.map((roomId) => ({
        id: uuidv4(), // Generate a new UUID for each vote
        room_id: roomId,
        voter_id: user.id,
        candidate_id: selectedCandidateId,
      }));
      const { error: insertError } = await supabase
        .from("votes")
        .insert(newVotes);

      if (insertError) throw insertError;

      alert("투표가 성공적으로 제출되었습니다.");
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

  const handleFinalize = async () => {
    if (userRoomIds.length === 0) return;

    const confirmed = window.confirm(
      "MVP를 확정하고 투표를 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다."
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
        tally[a] > tally[b] ? a : b
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
      navigate("/home");
    } catch (err: any) {
      setError("결과 확정 중 오류가 발생했습니다: " + err.message);
      console.error("finalize error", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Container>
        <Card>로딩 중...</Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card>{error}</Card>
      </Container>
    );
  }

  return (
    <Container>
      <h2>지난 채팅 MVP 투표</h2>
      <Card>
        <p>
          {alreadyVoted
            ? "투표를 변경할 수 있습니다."
            : "가장 즐거운 시간을 만들어준 멤버에게 투표하세요."}
        </p>
        <div>
          {candidates.map((c) => (
            <div key={c.id}>
              <div>{c.username || c.username}</div>
              <div>
                <VoteCountProgressOutline>
                  <VoteCountProgressFill
                    width={(() => {
                      const totalVotes = Object.values(voteCounts).reduce(
                        (a, b) => a + b,
                        0
                      );
                      return totalVotes === 0
                        ? 0
                        : Math.round(
                            ((voteCounts[c.id] || 0) / totalVotes) * 100
                          );
                    })()}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {voteCounts[c.id] || 0}표
                    </div>
                  </VoteCountProgressFill>
                </VoteCountProgressOutline>
                <input
                  type="radio"
                  name="candidate"
                  value={c.id}
                  checked={selectedCandidateId === c.id}
                  onChange={() => setSelectedCandidateId(c.id)}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "8px" }}>
          <Btn
            onClick={handleVoteSubmit}
            disabled={!selectedCandidateId || isLoading}
          >
            {alreadyVoted ? "투표 변경" : "투표 제출"}
          </Btn>
          {/* 관리자 기능은 일단 주석 처리 또는 조건부 렌더링 */}
          {/* <Btn onClick={handleFinalize} disabled={isLoading}>결과 확정 (관리자)</Btn> */}
        </div>
      </Card>
    </Container>
  );
}

export default MvpVote;
