import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';


export type StoreUser = {
  id: number;
  username: string; // 실명 아이디(로그인 계정)
  nickname: string; // 별명
  temp: number;     // 나의 온도 (0~100)
  revealed?: boolean; // MVP로 실명 공개 여부
};

export type MvpRecord = { id: string; date: string; userId: number; roomLabel: string };
export type Participation = { date: string; userId: number; roomLabel: string };
export type Vote = { date: string; roomLabel: string; voter: string; candidateUserId: number };

type StoreState = {
  users: StoreUser[];
  mvpHistory: MvpRecord[];
  classTemp: number;
  ranking: StoreUser[];
  // actions
  ensureUser: (username: string, nickname?: string) => StoreUser;
  addMessage: (username: string) => void; // 참여도 기반 소폭 상승
  awardMvp: (userId: number, roomLabel: string) => void; // +20, 기록, 실명 공개
  recordParticipation: (username: string, roomLabel: string, date?: string) => void;
  getCandidates: (date: string, roomLabel?: string) => StoreUser[];
  voteMvp: (date: string, roomLabel: string, voter: string, candidateUserId: number) => void;
  hasVoted: (date: string, roomLabel: string, voter: string) => boolean;
  getMvpTally: (date: string, roomLabel: string) => { userId: number; count: number }[];
  finalizeMvp: (date: string, roomLabel: string) => StoreUser | null;
};

const KEY = 'app-store-v1';

function load(): { users: StoreUser[]; mvpHistory: MvpRecord[]; participation: Participation[]; votes: Vote[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function save(data: { users: StoreUser[]; mvpHistory: MvpRecord[]; participation: Participation[]; votes: Vote[] }) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialUsers: StoreUser[] = [];
  const persisted = load();

  const [users, setUsers] = useState<StoreUser[]>(persisted?.users ?? initialUsers);
  const [mvpHistory, setMvpHistory] = useState<MvpRecord[]>(persisted?.mvpHistory ?? []);
  const [participation, setParticipation] = useState<Participation[]>(persisted?.participation ?? []);
  const [votes, setVotes] = useState<Vote[]>(persisted?.votes ?? []);

  useEffect(() => { save({ users, mvpHistory, participation, votes }); }, [users, mvpHistory, participation, votes]);

  const ensureUser = (username: string, nickname?: string): StoreUser => {
    let u = users.find(x => x.username === username);
    if (u) return u;
    const maxId = users.reduce((m, x) => Math.max(m, x.id), 0);
    u = { id: maxId + 1, username, nickname: nickname ?? username, temp: 50 };
    setUsers(prev => [...prev, u!]);
    return u;
  };

  const addMessage = (username: string) => {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, temp: Math.min(100, u.temp + 0.5) } : u));
  };

  const awardMvp = (userId: number, roomLabel: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, temp: Math.min(100, u.temp + 20), revealed: true } : u));
    const rec: MvpRecord = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), userId, roomLabel };
    setMvpHistory(prev => [rec, ...prev].slice(0,50));
  };

  const recordParticipation = (username: string, roomLabel: string, date?: string) => {
    const u = ensureUser(username);
    const d = date ?? new Date().toISOString().slice(0,10);
    setParticipation(prev => {
      const exists = prev.some(p => p.userId === u.id && p.date === d && p.roomLabel === roomLabel);
      if (exists) return prev;
      return [...prev, { userId: u.id, date: d, roomLabel }];
    });
  };

  const getCandidates = (date: string, roomLabel?: string): StoreUser[] => {
    const setIds = new Set(participation.filter(p => p.date === date && (!roomLabel || p.roomLabel === roomLabel)).map(p => p.userId));
    return users.filter(u => setIds.has(u.id));
  };

  const voteMvp = (date: string, roomLabel: string, voter: string, candidateUserId: number) => {
    const v = { date, roomLabel, voter, candidateUserId } as Vote;
    setVotes(prev => {
      const already = prev.some(x => x.date === date && x.roomLabel === roomLabel && x.voter === voter);
      if (already) return prev;
      return [...prev, v];
    });
  };

  const hasVoted = (date: string, roomLabel: string, voter: string) => votes.some(v => v.date === date && v.roomLabel === roomLabel && v.voter === voter);

  const getMvpTally = (date: string, roomLabel: string) => {
    const map = new Map<number, number>();
    votes.filter(v => v.date === date && v.roomLabel === roomLabel).forEach(v => {
      map.set(v.candidateUserId, (map.get(v.candidateUserId) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([userId, count]) => ({ userId, count })).sort((a,b) => b.count - a.count);
  };

  const finalizeMvp = (date: string, roomLabel: string): StoreUser | null => {
    // 이미 발표되었는지 검사
    const exists = mvpHistory.some(h => h.date === date && h.roomLabel === roomLabel);
    if (exists) {
      const last = mvpHistory.find(h => h.date === date && h.roomLabel === roomLabel)!;
      return users.find(u => u.id === last.userId) ?? null;
    }
    const tally = getMvpTally(date, roomLabel);
    if (!tally.length) return null;
    const top = tally[0];
    const winner = users.find(u => u.id === top.userId) ?? null;
    if (winner) awardMvp(winner.id, roomLabel);
    return winner;
  };

  const classTemp = useMemo(() => {
    if (!users.length) return 0;
    const sum = users.reduce((s, u) => s + u.temp, 0);
    return Math.round((sum / users.length) * 10) / 10;
  }, [users]);

  const ranking = useMemo(() => {
    return [...users].sort((a,b) => b.temp - a.temp);
  }, [users]);

  const value: StoreState = { users, mvpHistory, classTemp, ranking, ensureUser, addMessage, awardMvp, recordParticipation, getCandidates, voteMvp, hasVoted, getMvpTally, finalizeMvp };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
