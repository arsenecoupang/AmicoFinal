import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../db";
import styled from "styled-components";
import { useAuth } from "../AuthContext";

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

interface Room {
  id: string;
  members: string[] | string;
  created_at: string;
}

function MvpVote() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<{
    [username: string]: string;
  }>({});
  const [userRooms, setUserRooms] = useState<Room[]>([]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // 사용자가 참여한 모든 방의 멤버들 로드
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        console.log("Loading user rooms and members...");

        // 사용자가 참여한 모든 방 찾기 (어제/오늘 방 중에서)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const today = new Date();

        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, members, created_at")
          .gte("created_at", yesterday.toISOString())
          .lte("created_at", today.toISOString());

        console.log("All recent rooms:", rooms);

        if (!rooms) return;

        // 사용자가 참여한 방들 필터링
        const participatedRooms = rooms.filter((room) => {
          const members = room.members
            ? Array.isArray(room.members)
              ? room.members
              : JSON.parse(room.members)
            : [];
          return members.includes(user.username);
        });

        console.log("User participated rooms:", participatedRooms);

        // 모든 참여 방의 멤버들 수집 (중복 제거)
        const allMembersSet = new Set<string>();

        participatedRooms.forEach((room) => {
          const members = room.members
            ? Array.isArray(room.members)
              ? room.members
              : JSON.parse(room.members)
            : [];
          members.forEach((member: string) => allMembersSet.add(member));
        });

        const uniqueMembers = Array.from(allMembersSet);
        setAllMembers(uniqueMembers);
        setUserRooms(participatedRooms); // Room 객체 전체를 저장

        console.log("All unique members:", uniqueMembers);

        // 멤버들의 profile ID 가져오기
        if (uniqueMembers.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("username", uniqueMembers);

          const profileMap: { [username: string]: string } = {};
          if (profiles) {
            profiles.forEach((p) => (profileMap[p.username] = p.id));
          }
          setMemberProfiles(profileMap);

          // 기존 투표 현황 로드 (모든 참여 방에서)
          const roomIds = participatedRooms.map((room) => room.id);
          if (roomIds.length > 0) {
            const { data: votes } = await supabase
              .from("votes")
              .select("candidate_id")
              .in("room_id", roomIds);

            console.log("All votes:", votes);
            const c: Record<string, number> = {};
            if (votes)
              votes.forEach((r: any) => {
                // candidate_id가 UUID이므로 username으로 변환 필요
                const username = Object.keys(profileMap).find(
                  (key) => profileMap[key] === r.candidate_id
                );
                if (username) {
                  c[username] = (c[username] || 0) + 1;
                }
              });
            setCounts(c);
          }
        }
      } catch (err) {
        console.error("Error loading user rooms/members:", err);
      }
    })();
  }, [user]); // 로딩 중이거나 인증되지 않은 경우
  if (authLoading)
    return (
      <Container>
        <Card>로딩 중...</Card>
      </Container>
    );
  if (!user) return null; // 리디렉션 중

  const submitVote = async () => {
    if (!user || !selected || userRooms.length === 0) return;
    setLoading(true);
    try {
      // 현재 사용자의 profile ID 가져오기
      const { data: voterProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", user.username)
        .single();
      const voterId = voterProfile?.id;
      const candidateId = memberProfiles[selected];

      if (!voterId || !candidateId) {
        alert("프로필 정보를 찾을 수 없습니다.");
        return;
      }

      // 모든 참여 방에서 기존 투표 제거 후 새 투표 추가
      await supabase
        .from("votes")
        .delete()
        .eq("voter_id", voterId)
        .in("room_id", userRooms);

      // 가장 최근 방에 투표 (또는 모든 방에 투표하려면 userRooms.forEach 사용)
      const latestRoomId = userRooms[userRooms.length - 1];
      await supabase
        .from("votes")
        .insert([
          {
            room_id: latestRoomId,
            voter_id: voterId,
            candidate_id: candidateId,
          },
        ]);

      // refresh counts
      const { data: votes } = await supabase
        .from("votes")
        .select("candidate_id")
        .in("room_id", userRooms);
      const c: Record<string, number> = {};
      if (votes)
        votes.forEach((r: any) => {
          const username = Object.keys(memberProfiles).find(
            (key) => memberProfiles[key] === r.candidate_id
          );
          if (username) {
            c[username] = (c[username] || 0) + 1;
          }
        });
      setCounts(c);
      alert("투표가 완료되었습니다.");
    } catch (e: any) {
      console.error("투표 오류:", e);
      alert("투표 중 오류가 발생했습니다: " + (e.message || "알 수 없는 오류"));
    }
    setLoading(false);
  };

  const finalize = async () => {
    if (userRooms.length === 0) return;

    // 모든 참여 방에서 투표 집계
    const allVotes: any[] = [];
    for (const room of userRooms) {
      const { data: votes } = await supabase
        .from("votes")
        .select("candidate_id")
        .eq("room_id", room.id);
      if (votes) {
        allVotes.push(...votes);
      }
    }

    if (allVotes.length === 0) {
      alert("투표가 없습니다.");
      return;
    }

    const tally: Record<string, number> = {};
    allVotes.forEach((v: any) => {
      const id = v.candidate_id;
      tally[id] = (tally[id] || 0) + 1;
    });

    let winnerId = Object.keys(tally)[0];
    let max = tally[winnerId];
    Object.entries(tally).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        winnerId = k;
      }
    });

    // UUID로 실제 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, realname")
      .eq("id", winnerId)
      .single();

    if (!profile) {
      alert("MVP 프로필을 찾을 수 없습니다.");
      return;
    }

    // MVP 온도 10도 증가
    try {
      const { data: tempData } = await supabase
        .from("profiles")
        .select("temperature")
        .eq("id", winnerId)
        .single();

      if (tempData) {
        await supabase
          .from("profiles")
          .update({ temperature: (tempData.temperature || 0) + 10 })
          .eq("id", winnerId);
      }
    } catch (e) {
      console.error("MVP temperature update failed:", e);
    }

    // 첫 번째 방에 MVP 기록 (또는 별도 테이블 구조 필요)
    const mainRoomId = userRooms[0]?.id;
    await supabase.from("mvp_history").insert([
      {
        room_id: mainRoomId,
        mvp_id: winnerId,
        realname: profile.realname,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);

    alert(
      `MVP: ${profile.username} (${
        profile.realname ?? "실명 없음"
      }) - 온도 10도 상승!`
    );
    navigate("/home");
  };

  if (userRooms.length === 0)
    return (
      <Container>
        <Card>참여한 채팅방이 없습니다.</Card>
      </Container>
    );

  return (
    <Container>
      <h2>지난 채팅 멤버 중 MVP 투표</h2>
      <Card>
        <p>참여한 방: {userRooms.length}개</p>
        <div>
          {allMembers.map((m: string) => (
            <div
              key={m}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: ".5rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>{m}</div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <div style={{ fontWeight: 700 }}>{counts[m] || 0}표</div>
                <input
                  type="radio"
                  name="candidate"
                  value={m}
                  checked={selected === m}
                  onChange={() => setSelected(m)}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "8px" }}>
          <Btn onClick={submitVote} disabled={loading || !selected}>
            투표 제출
          </Btn>
          <Btn onClick={finalize}>결과 확정 (관리자)</Btn>
        </div>
      </Card>
    </Container>
  );
}

export default MvpVote;
