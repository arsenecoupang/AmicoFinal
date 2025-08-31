import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../db';
import styled from 'styled-components';
import { useAuth } from '../AuthContext';

const Container = styled.div`padding:2rem; max-width:640px; margin:0 auto;`;
const Card = styled.div`background:#fff;padding:1rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06);`;
const Btn = styled.button`background:#A8C686;color:#fff;padding:.6rem 1rem;border:none;border-radius:6px;cursor:pointer;font-weight:700;`;

interface Room {
  id: string;
  members: string[] | string;
  created_at?: string;
}
function MvpVote() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<{[username: string]: string}>({});
  const [userRooms, setUserRooms] = useState<Room[]>([]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  // 사용자가 참여한 모든 방과 후보자, 기존 투표 집계 로드
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // 테스트/운영 모두 안전하게: 모든 방에서 사용자가 포함된 방을 찾음
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id, members, created_at')
          .order('created_at', { ascending: false });

        if (!rooms) return;

        const participated: Room[] = rooms.filter((r: any) => {
          try {
            const members = r.members ? (Array.isArray(r.members) ? r.members : JSON.parse(r.members)) : [];
            return members.includes(user.username);
          } catch (e) {
            return false;
          }
        });

        setUserRooms(participated);

        // 후보자 집합
        const memberSet = new Set<string>();
        participated.forEach(r => {
          const members = r.members ? (Array.isArray(r.members) ? r.members : JSON.parse(r.members as string)) : [];
          members.forEach((m: string) => memberSet.add(m));
        });
        const unique = Array.from(memberSet);
        setAllMembers(unique);

        // username -> profile id 매핑
        if (unique.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', unique);
          const map: {[k:string]: string} = {};
          if (profiles) profiles.forEach((p:any) => { if (p?.username && p?.id) map[p.username] = p.id; });
          setMemberProfiles(map);

          // 기존 투표 집계 (참여한 모든 방)
          const roomIds = participated.map(r => r.id);
          if (roomIds.length > 0) {
            const { data: votes } = await supabase
              .from('votes')
              .select('candidate_id')
              .in('room_id', roomIds);

            const tally: Record<string, number> = {};
            if (votes) {
              votes.forEach((v: any) => {
                // candidate_id(UUID) -> username
                const username = Object.keys(map).find(k => map[k] === v.candidate_id);
                if (username) tally[username] = (tally[username] || 0) + 1;
              });
            }
            setCounts(tally);
          }
        }
      } catch (e) {
        console.error('MvpVote load error:', e);
      }
    })();
  }, [user]);

  if (authLoading) return <Container><Card>로딩 중...</Card></Container>;
  if (!user) return null;

  // 투표 제출: 사용자의 모든 참여 방에 대해 투표를 기록(기존 삭제 후 추가)
  const submitVote = async () => {
    if (!user || !selected || userRooms.length === 0) return;
    setLoading(true);
    try {
      const { data: me } = await supabase.from('profiles').select('id').eq('username', user.username).single();
      const voterId = me?.id;
      const candidateId = memberProfiles[selected];
      if (!voterId || !candidateId) throw new Error('프로필 ID를 찾을 수 없습니다.');

      const roomIds = userRooms.map(r => r.id);

      // 기존 투표 제거
      await supabase.from('votes').delete().eq('voter_id', voterId).in('room_id', roomIds);

      // 모든 참여 방에 동일한 투표 기록 (테스트용으로 간단히 처리)
      const inserts = roomIds.map(id => ({ room_id: id, voter_id: voterId, candidate_id: candidateId }));
      await supabase.from('votes').insert(inserts);

      // 집계 새로고침
      const { data: votes } = await supabase.from('votes').select('candidate_id').in('room_id', roomIds);
      const newCounts: Record<string, number> = {};
      if (votes) votes.forEach((v:any) => {
        const username = Object.keys(memberProfiles).find(k => memberProfiles[k] === v.candidate_id);
        if (username) newCounts[username] = (newCounts[username] || 0) + 1;
      });
      setCounts(newCounts);
      alert('투표가 제출되었습니다.');
    } catch (e:any) {
      console.error('submitVote error', e);
      alert('투표 중 오류가 발생했습니다: ' + (e.message || e));
    }
    setLoading(false);
  };

  // 관리자 전용: 전체 집계로 MVP 확정
  const finalize = async () => {
    if (userRooms.length === 0) return;
    try {
      const roomIds = userRooms.map(r => r.id);
      const { data: votes } = await supabase.from('votes').select('candidate_id').in('room_id', roomIds);
      if (!votes || votes.length === 0) { alert('투표가 없습니다.'); return; }

      const tallyId: Record<string, number> = {};
      votes.forEach((v:any) => { tallyId[v.candidate_id] = (tallyId[v.candidate_id] || 0) + 1; });
      let winnerId = Object.keys(tallyId)[0];
      let max = tallyId[winnerId];
      Object.entries(tallyId).forEach(([k, v]) => { if (v > max) { max = v; winnerId = k; } });

      const { data: profile } = await supabase.from('profiles').select('username, realname').eq('id', winnerId).single();
      if (!profile) { alert('MVP 프로필을 찾을 수 없습니다.'); return; }

      // 온도 업데이트: 현재 값 읽고 +10
      try {
        const { data: tempRow } = await supabase.from('profiles').select('temperature').eq('id', winnerId).single();
        const newTemp = (tempRow?.temperature || 0) + 10;
        await supabase.from('profiles').update({ temperature: newTemp }).eq('id', winnerId);
      } catch (e) {
        console.error('MVP temperature update failed:', e);
      }

      // 기록 남기기
      const mainRoomId = userRooms[0]?.id;
      await supabase.from('mvp_history').insert([{ room_id: mainRoomId, mvp_id: winnerId, realname: profile.realname, date: new Date().toISOString().slice(0,10) }]);

      alert(`MVP: ${profile.username} (${profile.realname ?? '실명 없음'})`);
      navigate('/home');
    } catch (e:any) {
      console.error('finalize error', e);
      alert('결과 확정 중 오류가 발생했습니다: ' + (e.message || e));
    }
  };

  if (userRooms.length === 0) return <Container><Card>참여한 채팅방이 없습니다.</Card></Container>;

  return (
    <Container>
      <h2>지난 채팅 멤버 중 MVP 투표</h2>
      <Card>
        <p>참여한 방: {userRooms.length}개</p>
        <div>
          {allMembers.map((m) => (
            <div key={m} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid #eee'}}>
              <div>{m}</div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <div style={{fontWeight:700}}>{counts[m] || 0}표</div>
                <input type="radio" name="candidate" value={m} checked={selected===m} onChange={() => setSelected(m)} />
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'1rem',display:'flex',gap:'8px'}}>
          <Btn onClick={submitVote} disabled={loading || !selected}>투표 제출</Btn>
          <Btn onClick={finalize}>결과 확정 (관리자)</Btn>
        </div>
      </Card>
    </Container>
  );
}

export default MvpVote;

