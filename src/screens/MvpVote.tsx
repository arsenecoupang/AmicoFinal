import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../db';
import styled from 'styled-components';
import { useAuth } from '../AuthContext';

const Container = styled.div`padding:2rem; max-width:640px; margin:0 auto;`;
const Card = styled.div`background:#fff;padding:1rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06);`;
const Btn = styled.button`background:#A8C686;color:#fff;padding:.6rem 1rem;border:none;border-radius:6px;cursor:pointer;font-weight:700;`;

function MvpVote() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roomId = (location.state as any)?.roomId as string | undefined;
  const [members, setMembers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const { data: room } = await supabase.from('rooms').select('members').eq('id', roomId).single();
      const m = room?.members ? (Array.isArray(room.members) ? room.members : JSON.parse(room.members)) : [];
      setMembers(m);
  // load current vote counts (aggregate in JS)
  const { data: votes } = await supabase.from('votes').select('candidate_id').eq('room_id', roomId);
  const c: Record<string, number> = {};
  if (votes) votes.forEach((r:any) => { const id = r.candidate_id; c[id] = (c[id] || 0) + 1; });
  setCounts(c);
    })();
  }, [roomId]);

  const submitVote = async () => {
    if (!user || !roomId || !selected) return;
    setLoading(true);
    try {
      // remove any existing vote by this voter in this room
      await supabase.from('votes').delete().eq('room_id', roomId).eq('voter_id', user.username);
      await supabase.from('votes').insert([{ room_id: roomId, voter_id: user.username, candidate_id: selected }]);
  // refresh counts
  const { data: votes } = await supabase.from('votes').select('candidate_id').eq('room_id', roomId);
  const c: Record<string, number> = {};
  if (votes) votes.forEach((r:any) => { const id = r.candidate_id; c[id] = (c[id] || 0) + 1; });
  setCounts(c);
      alert('투표가 완료되었습니다.');
    } catch (e:any) { alert(e.message || '오류'); }
    setLoading(false);
  };

  const finalize = async () => {
    if (!roomId) return;
    // compute winner
  const { data: votes } = await supabase.from('votes').select('candidate_id').eq('room_id', roomId);
  if (!votes || votes.length === 0) { alert('투표가 없습니다.'); return; }
  const tally: Record<string, number> = {};
  votes.forEach((v:any) => { const id = v.candidate_id; tally[id] = (tally[id] || 0) + 1; });
  let winner = Object.keys(tally)[0];
  let max = tally[winner];
  Object.entries(tally).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
    // get realname
    const { data: profile } = await supabase.from('profiles').select('realname,id').eq('username', winner).maybeSingle();
    const realname = profile?.realname || null;
    await supabase.from('mvp_history').insert([{ room_id: roomId, mvp_id: winner, realname, date: new Date().toISOString().slice(0,10) }]);
    alert(`MVP: ${winner} (${realname ?? '실명 없음'})`);
    navigate('/home');
  };

  if (!roomId) return <Container><Card>유효한 방 정보가 없습니다.</Card></Container>;

  return <Container>
    <h2>지난 채팅 멤버 중 MVP 투표</h2>
    <Card>
      <p>방: {roomId}</p>
      <div>
        {members.map(m => (
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
  </Container>;

}

export default MvpVote;
