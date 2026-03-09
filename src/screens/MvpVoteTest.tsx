import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../db";

const Container = styled.div`padding:2rem; max-width:880px; margin:0 auto;`;
const Card = styled.div`background:#fff;padding:1rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06);`;
const Btn = styled.button`background:#A8C686;color:#fff;padding:.5rem 1rem;border:none;border-radius:6px;cursor:pointer;margin-right:.5rem;`;

export default function MvpVoteTest() {
	const [profiles, setProfiles] = useState<any[]>([]);
	const [rooms, setRooms] = useState<any[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
	const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
		null,
	);
	const [status, setStatus] = useState("");

	useEffect(() => {
		(async () => {
			const { data: p } = await supabase
				.from("profiles")
				.select("id,username,realname");
			setProfiles(p || []);
			const { data: r } = await supabase.from("rooms").select("id,members");
			setRooms(r || []);
		})();
	}, []);

	const simulateVote = async () => {
		if (!selectedProfile || !selectedCandidate)
			return setStatus("프로필과 후보를 선택하세요");
		try {
			setStatus("투표 중...");
			// 선택한 프로필의 id, 선택 후보의 id를 찾아서 votes에 insert
			const voterId = profiles.find((p) => p.username === selectedProfile)?.id;
			const candidateId = profiles.find(
				(p) => p.username === selectedCandidate,
			)?.id;
			if (!voterId || !candidateId)
				return setStatus("프로필 ID를 찾을 수 없음");

			// 방 id는 임의로 rooms[0] 사용
			const roomId = rooms[0]?.id || "test_room_auto";
			const { data: insData, error: insErr } = await supabase
				.from("votes")
				.insert([
					{ room_id: roomId, voter_id: voterId, candidate_id: candidateId },
				]);
			if (insErr) {
				console.error("insert vote error:", insErr, insData);
				setStatus("투표 실패: " + (insErr.message || JSON.stringify(insErr)));
			} else {
				setStatus("투표 성공");
			}
		} catch (e: any) {
			setStatus("오류: " + (e.message || e));
		}
	};

	const loadCounts = async () => {
		try {
			const roomIds = rooms.map((r) => r.id);
			const resp: any = await supabase.from("votes").select("candidate_id");
			const votes = resp.data;
			const votesErr = resp.error;
			if (votesErr) {
				console.error("votes select error:", votesErr);
				setStatus(
					"votes 로드 실패: " + (votesErr.message || JSON.stringify(votesErr)),
				);
				return;
			}
			const tally: any = {};
			if (votes)
				votes.forEach(
					(v: any) =>
						(tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1),
				);
			setStatus(JSON.stringify(tally, null, 2));
		} catch (e: any) {
			setStatus("로드 오류: " + (e.message || e));
		}
	};

	return (
		<Container>
			<h2>MVP 투표 테스트 도구</h2>
			<Card>
				<div style={{ display: "flex", gap: 16 }}>
					<div style={{ flex: 1 }}>
						<h4>프로필</h4>
						<select
							style={{ width: "100%" }}
							value={selectedProfile || ""}
							onChange={(e) => setSelectedProfile(e.target.value || null)}
						>
							<option value="">-- 선택 --</option>
							{profiles.map((p) => (
								<option key={p.id} value={p.username}>
									{p.username} ({p.realname || ""})
								</option>
							))}
						</select>

						<h4 style={{ marginTop: 12 }}>후보</h4>
						<select
							style={{ width: "100%" }}
							value={selectedCandidate || ""}
							onChange={(e) => setSelectedCandidate(e.target.value || null)}
						>
							<option value="">-- 선택 --</option>
							{profiles.map((p) => (
								<option key={p.id} value={p.username}>
									{p.username}
								</option>
							))}
						</select>

						<div style={{ marginTop: 12 }}>
							<Btn onClick={simulateVote}>시뮬레이션 투표</Btn>
							<Btn onClick={loadCounts}>집계 로드</Btn>
						</div>
					</div>
					<div style={{ flex: 1 }}>
						<h4>방 목록</h4>
						<pre style={{ whiteSpace: "pre-wrap" }}>
							{JSON.stringify(rooms, null, 2)}
						</pre>
					</div>
				</div>

				<div style={{ marginTop: 12 }}>
					<h4>상태</h4>
					<pre style={{ whiteSpace: "pre-wrap" }}>{status}</pre>
				</div>
			</Card>
		</Container>
	);
}
