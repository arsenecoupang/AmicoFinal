import React, { useEffect, useState } from "react";
import { styled } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useStore } from "../Store";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";

const MainScreenDiv = styled.div`
  width: 100%;
  height: calc(100vh - 6.25rem);
  padding: 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-top: 4rem;
`;

const TempsRow = styled.div`
  max-width: 48rem;
  display: flex;
  gap: 1rem;
  width: 100%;
  @media (max-width: 48rem) {
    flex-direction: column;
  }
`;

const TempCard = styled.div`
  flex: 1;
  background: #fff;
  border: 1px solid ${(props) => props.theme.baseHover};
  border-radius: 0;
  box-shadow: 0 6px 18px rgba(168, 198, 134, 0.15);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(168, 198, 134, 0.18);
  }
`;

const TempTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: ${(props) => props.theme.text};
  letter-spacing: 0.01em;
`;

const Thermometer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
`;

const ThermoVisual = styled.div`
  position: relative;
  width: 40px;
  height: 140px;
`;

const ThermoTube = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 110px;
  background: linear-gradient(
    180deg,
    ${(props) => props.theme.baseHover} 0%,
    ${(props) => props.theme.baseHover} 100%
  );
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ThermoFill = styled.div<{ percent: number }>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: ${(props) => Math.max(0, Math.min(props.percent, 100))}%;
  background: linear-gradient(
    180deg,
    ${(props) => props.theme.main} 0%,
    ${(props) => props.theme.mainHover || props.theme.main} 100%
  );
  border-radius: 8px;
  transition: height 0.8s ease-in-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const ThermoBulb = styled.div`
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.main} 0%,
    ${(props) => props.theme.mainHover || props.theme.main} 100%
  );
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 3px solid ${(props) => props.theme.main};
`;

const ThermoMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ThermoPercent = styled.span`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${(props) => props.theme.text};
  line-height: 1;
`;

const ThermoHint = styled.span`
  font-size: 0.85rem;
  color: ${(props) => props.theme.text};
  opacity: 0.7;
`;

const ThermoTicks = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 110px;
  pointer-events: none;
`;

const ThermoTick = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: ${(props) => props.theme.text};
  opacity: 0.3;

  &:nth-child(1) {
    top: 0;
  }
  &:nth-child(2) {
    top: 22px;
  }
  &:nth-child(3) {
    top: 44px;
  }
  &:nth-child(4) {
    top: 66px;
  }
  &:nth-child(5) {
    top: 88px;
  }
  &:nth-child(6) {
    top: 110px;
  }
`;

const Section = styled.section`
  max-width: 48rem;
  width: 100%;
  background: #fff;
  border: 1px solid ${(props) => props.theme.baseHover};
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 4px 14px rgba(168, 198, 134, 0.12);
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: ${(props) => props.theme.text};
  letter-spacing: 0.01em;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  overflow-y: auto;
`;

const Row = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.theme.baseHover};
  border-radius: 0;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  transition: background 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: ${(props) => props.theme.baseHover};
    opacity: 0.8;
  }
`;

const CommunityAndQuiz = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 48rem;
  min-height: 400px;
  @media (max-width: 48rem) {
    flex-direction: column;
  }
`;

const Community = styled.div`
  flex: 4;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border: 1px solid ${(props) => props.theme.baseHover};
  border-radius: 0;
  padding: 1rem;
  box-shadow: 0 4px 14px rgba(168, 198, 134, 0.12);
  & > div.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
    flex-shrink: 0;
  }
  & > div.header h1 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
    color: ${(props) => props.theme.text};
  }
  & > div.header button {
    background: transparent;
    color: ${(props) => props.theme.accent};
    border: 1px solid ${(props) => props.theme.baseHover};
    border-radius: 0.25rem;
    padding: 0.4rem 0.65rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
  }
  & > div.header button:hover {
    background: ${(props) => props.theme.accent};
    color: #fff;
    transform: translateY(-1px);
  }
  & > div.content {
    background: #fff;
    border: 1px solid ${(props) => props.theme.baseHover};
    border-radius: 0;
    flex: 1;
    height: 100%;
    box-shadow: 0 4px 14px rgba(168, 198, 134, 0.12);
    overflow-y: auto;
    padding: 1rem;
  }
`;

const QuizPanel = styled.div`
  flex: 6;
  background-color: #fff;
  box-shadow: 0 2px 16px rgba(168, 198, 134, 0.1);
  border-radius: 0;
  padding: 2.5rem 2rem;
  border: 1px solid ${(props) => props.theme.baseHover};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  h2 {
    margin: 0;
    font-size: 1.2rem;
    color: ${(props) => props.theme.text};
  }
  p {
    margin: 0 0 0.5rem 0;
    color: ${(props) => props.theme.text};
    opacity: 0.85;
  }
`;

const PrimaryButton = styled.button`
  background: ${(props) => props.theme.main};
  color: #fff;
  border: none;
  border-radius: 0.25rem;
  padding: 0.65rem 0.9rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(168, 198, 134, 0.18);
  transition: background 0.2s ease, transform 0.1s ease;
  &:hover {
    background: ${(props) => props.theme.mainHover};
    transform: translateY(-1px);
  }
`;

// const InfoText = styled.p`
//   margin: 0 0 1rem 0;
//   color: ${(props) => props.theme.text};
//   opacity: 0.7;
//   font-size: 0.9rem;
// `;

function MainScreen() {
  const { users, mvpHistory } = useStore();
  const { user, loading } = useAuth();

  const me = user ? users.find((u) => u.username === user.username) : null;

  const [classTempVal, setClassTempVal] = useState<number>(0);
  const [myTempVal, setMyTempVal] = useState<number>(0);
  const [ranking, setRanking] = useState<any[]>([]); // DB 기반 랭킹
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latestRoom, setLatestRoom] = useState<string | null>(null);

  const navigate = useNavigate();

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    // if (!user) navigate("/login");
    console.log("user in MainScreen:", user);
  }, [user, navigate]);

  // 가장 최근 방 찾기
  useEffect(() => {
    const findLatestRoom = async () => {
      try {
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(1);

        if (rooms && rooms.length > 0) {
          setLatestRoom(rooms[0].id);
        }
      } catch (error) {
        console.error("Error finding latest room:", error);
      }
    };

    findLatestRoom();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
    console.log("user in MainScreen:", user);
  }, [user, navigate]);

  // fetch temps, ranking and subscribe to changes
  useEffect(() => {
    let channel: any;
    async function fetchTempsAndRanking() {
      try {
        // 온도 평균
        const { data } = await supabase
          .from("profiles")
          .select("temperature, username, realname, id")
          .order("temperature", { ascending: false });
        if (data && data.length) {
          const temps = data.map((p: any) => Number(p.temperature || 0));
          const avg =
            temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
          setClassTempVal(Math.max(0, Math.min(100, Math.round(avg))));
          // 랭킹 - 별명만 사용
          setRanking(
            data.map((p: any) => ({
              id: p.id,
              username: p.username,
              nickname: p.realname || p.username, // realname을 별명으로 사용
              temp: Math.max(0, Math.min(100, Math.round(p.temperature || 0))),
            }))
          );
        } else {
          setClassTempVal(0);
          setRanking([]);
        }
        if (user) {
          const { data: meData } = await supabase
            .from("profiles")
            .select("temperature")
            .eq("username", user.username)
            .maybeSingle();
          const t = meData?.temperature ?? 0;
          setMyTempVal(Math.max(0, Math.min(100, Math.round(t))));
        }
      } catch (e) {
        console.error("fetch temps/ranking error", e);
      }
    }
    fetchTempsAndRanking();

    // realtime subscription to profiles changes
    try {
      channel = supabase
        .channel("public:profiles")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            fetchTempsAndRanking();
          }
        )
        .subscribe();
    } catch (e) {
      // ignore
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f8f8",
        }}
      >
        <img
          src="/amico_logo_app_iconfh.png"
          alt="amico logo"
          style={{ width: "120px", marginBottom: "2rem" }}
        />
        <span style={{ color: "#7cae4c", fontWeight: 700, fontSize: "1.2rem" }}>
          로딩 중...
        </span>
      </div>
    );
  }

  const navigateToQuiz = () => navigate("/quiz");

  // MVP 투표 가능 시간 체크 (테스트용으로 항상 true)
  const isMvpVotingTime = () => {
    return true; // 테스트용으로 시간 제한 해제
    // const hour = currentTime.getHours();
    // return hour >= 18 && hour < 21;
  };

  // MVP 투표로 이동
  const navigateToMvp = () => {
    if (latestRoom) {
      navigate("/mvp", { state: { roomId: latestRoom } });
    } else {
      // 테스트용 기본 roomId 사용
      navigate("/mvp?roomId=92f60cb9-cfea-4b6d-8f5e-b0d5730eb975");
    }
  };

  return (
    <MainScreenDiv>
      <TempsRow>
        <TempCard>
          <TempTitle>학급 온도</TempTitle>
          <Thermometer>
            <ThermoVisual>
              <ThermoTube>
                <ThermoFill percent={classTempVal} />
              </ThermoTube>
              <ThermoBulb />
              <ThermoTicks>
                {[0, 20, 40, 60, 80, 100].map((p) => (
                  <ThermoTick
                    key={`class-${p}`}
                    style={{ top: `${110 - (110 * p) / 100}px` }}
                  />
                ))}
              </ThermoTicks>
            </ThermoVisual>
            <ThermoMeta>
              <ThermoPercent>{classTempVal}°C</ThermoPercent>
              <ThermoHint>전체 평균</ThermoHint>
            </ThermoMeta>
          </Thermometer>
        </TempCard>
        <TempCard>
          <TempTitle>나의 온도</TempTitle>
          <Thermometer>
            <ThermoVisual>
              <ThermoTube>
                <ThermoFill percent={myTempVal} />
              </ThermoTube>
              <ThermoBulb />
              <ThermoTicks>
                {[0, 20, 40, 60, 80, 100].map((p) => (
                  <ThermoTick
                    key={`my-${p}`}
                    style={{ top: `${110 - (110 * p) / 100}px` }}
                  />
                ))}
              </ThermoTicks>
            </ThermoVisual>
            <ThermoMeta>
              <ThermoPercent>{myTempVal}°C</ThermoPercent>
              <ThermoHint>
                {me ? `별명 ${me.nickname}` : "로그인 필요"}
              </ThermoHint>
            </ThermoMeta>
          </Thermometer>
        </TempCard>
      </TempsRow>

      <CommunityAndQuiz>
        <Community>
          <div className="header">
            <h1>MVP 히스토리</h1>
          </div>
          <div className="content">
            <List>
              {mvpHistory.length === 0 && (
                <Row>
                  <span>아직 MVP 기록이 없습니다.</span>
                </Row>
              )}
              {mvpHistory.map((rec) => {
                const u = users.find((x) => x.id === rec.userId);
                const name = u
                  ? u.revealed
                    ? u.username
                    : u.nickname
                  : "unknown";
                return (
                  <Row key={rec.id}>
                    <span>
                      {rec.date} · {rec.roomLabel}
                    </span>
                    <strong>{name}</strong>
                  </Row>
                );
              })}
            </List>
          </div>
        </Community>
        <QuizPanel>
          <h2>일일 퀴즈</h2>
          <p>매일 새로운 밸런스 게임이 제공돼요!</p>
          <PrimaryButton onClick={navigateToQuiz}>퀴즈 시작</PrimaryButton>

          {/* MVP 투표 버튼 */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e5e5e5",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.1rem",
                fontWeight: "700",
              }}
            >
              MVP 투표
            </h3>
            {isMvpVotingTime() ? (
              <>
                <p
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.9rem",
                    opacity: "0.85",
                  }}
                >
                  테스트 모드: 언제든 투표 가능!
                </p>
                <PrimaryButton
                  onClick={navigateToMvp}
                  style={{ background: "#FF6B6B", fontSize: "0.9rem" }}
                >
                  MVP 투표하기
                </PrimaryButton>
              </>
            ) : (
              <p style={{ margin: "0", fontSize: "0.9rem", opacity: "0.6" }}>
                테스트 모드: 언제든 투표 가능!
                <br />
                현재 시간:{" "}
                {currentTime.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </QuizPanel>
      </CommunityAndQuiz>

      <Section>
        <SectionTitle>온도 랭킹</SectionTitle>
        <List>
          {ranking.length === 0 && (
            <Row>
              <span>아직 온도 랭킹 데이터가 없습니다.</span>
            </Row>
          )}
          {ranking.map((u, idx) => (
            <Row key={u.id}>
              <span>
                {idx + 1}. {u.nickname}
              </span>
              <strong>{u.temp}°C</strong>
            </Row>
          ))}
        </List>
      </Section>
    </MainScreenDiv>
  );
}

export default MainScreen;
