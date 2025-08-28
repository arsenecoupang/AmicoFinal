import React, { useMemo } from 'react';
import { styled } from 'styled-components';
import { useStore } from '../Store';
import { useAuth } from '../AuthContext';

const Wrap = styled.div`
  min-height: calc(100vh - 6.25rem);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: ${p => p.theme.base};
  gap: 1rem;
`;

const Panel = styled.section`
  width: 100%;
  max-width: 48rem;
  background: #fff;
  border: 1px solid ${p => p.theme.baseHover};
  border-radius: .5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 1rem;
`;

const Title = styled.h1`
  margin: 0 0 .5rem 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: ${p => p.theme.text};
`;

const Row = styled.div`
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Button = styled.button`
  background: ${p => p.theme.main};
  color: #fff;
  border: none;
  border-radius: .25rem;
  padding: .5rem .75rem;
  font-weight: 800;
  cursor: pointer;
  &:hover { background: ${p => p.theme.mainHover}; }
  &:disabled { background: #cfd8cf; cursor: not-allowed; }
`;

const List = styled.ul`
  list-style: none;
  padding: 0; margin: .75rem 0 0 0;
  display: flex; flex-direction: column; gap: .5rem;
`;

const Item = styled.li`
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid ${p => p.theme.baseHover};
  border-radius: .375rem;
  padding: .5rem .75rem;
`;

export default function MvpVoteScreen() {
  const { users, getCandidates, voteMvp, hasVoted, getMvpTally, finalizeMvp } = useStore();
  const { user } = useAuth();

  const today = new Date();
  const y = new Date(today.getTime() - 24*60*60*1000);
  const dateStr = y.toISOString().slice(0,10);

  const roomLabels = useMemo(() => {
    return ['전체'];
  }, []);
  const room = roomLabels[0];

  const candidates = useMemo(() => getCandidates(dateStr, room === '전체' ? undefined : room), [getCandidates, dateStr, room]);
  const tally = getMvpTally(dateStr, room);

  const voter = user?.username ?? 'guest';
  const already = hasVoted(dateStr, room, voter);

  const handleVote = (uid: number) => {
    if (!voter) return;
    voteMvp(dateStr, room, voter, uid);
  };

  const handleFinalize = () => {
    finalizeMvp(dateStr, room);
  };

  const winner = tally.length ? users.find(u => u.id === tally[0].userId) : null;

  return (
    <Wrap>
      <Panel>
        <Title>전날 MVP 투표</Title>
        <Row>
          <span>날짜: {dateStr}</span>
          <span>방: {room}</span>
        </Row>
        <List>
          {candidates.length === 0 && <Item><span>어제 참여한 후보가 없습니다.</span></Item>}
          {candidates.map(c => (
            <Item key={c.id}>
              <span>{c.nickname}</span>
              <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                <span style={{opacity:.7, fontSize:'.9rem'}}>득표: {tally.find(t => t.userId === c.id)?.count ?? 0}</span>
                <Button onClick={() => handleVote(c.id)} disabled={already}>투표</Button>
              </div>
            </Item>
          ))}
        </List>
        <Row style={{marginTop:'.75rem', justifyContent:'space-between'}}>
          <span style={{opacity:.8}}>이미 투표했나요? {already ? '예' : '아니오'}</span>
          <Button onClick={handleFinalize} disabled={!candidates.length}>MVP 발표</Button>
        </Row>
        {winner && (
          <div style={{marginTop:'.75rem', padding:'.5rem .75rem', border:'1px solid #e5e7eb', borderRadius:'.375rem'}}>
            <strong>오늘의 MVP</strong>: 실명 공개 {winner.username}
          </div>
        )}
      </Panel>
    </Wrap>
  );
}
