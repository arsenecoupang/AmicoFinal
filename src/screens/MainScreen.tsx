import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "styled-components";
import { useAuth } from "../AuthContext";
import { supabase } from "../db";
import { useStore } from "../Store";

const MainScreenDiv = styled.div`
  min-height: calc(100vh - 6.25rem);
  width: 100%;
  background: #f9f9f9;
  padding: 0;
`;

// Hero Section with Welcome Message
const HeroSection = styled.div`
  background: ${(props) => props.theme.main};
  color: white;
  padding: 2rem;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  margin: 0 0 1.5rem 0;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${(props) =>
		props.variant === "primary"
			? `
    background: white;
    color: ${props.theme.main};
    
    &:hover {
      background: #f5f5f5;
    }
  `
			: `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `}
`;

// Main Content Container
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

// Modern Card Design
const Card = styled.div<{ span?: number }>`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e5e5;

  ${(props) =>
		props.span &&
		`
    @media (min-width: 768px) {
      grid-column: span ${props.span};
    }
  `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${(props) => props.theme.main};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

// Temperature Display (Modern Approach)
const TempGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TempCard = styled.div<{ isPersonal?: boolean }>`
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  background: ${(props) =>
		props.isPersonal
			? `linear-gradient(135deg, ${props.theme.main} 0%, ${props.theme.mainHover} 100%)`
			: `linear-gradient(135deg, #64748b 0%, #475569 100%)`};
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(20px, -20px);
  }
`;

const TempValue = styled.div`
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 0.25rem;
`;

const TempLabel = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
`;

// List Items
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
`;

const ListItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ListItemRank = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(props) => props.theme.main};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ListItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ListItemName = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.text};
`;

const ListItemMeta = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.theme.text};
  opacity: 0.6;
`;

const ListItemValue = styled.span`
  font-weight: 700;
  color: ${(props) => props.theme.main};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: ${(props) => props.theme.text};
  opacity: 0.6;

  .message {
    font-size: 0.875rem;
    margin-top: 0.5rem;
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
	const [recentMvps, setRecentMvps] = useState<any[]>([]); // 최근 3일 MVP
	const [classComparison, setClassComparison] = useState<any[]>([]); // 학급별 온도 비교

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

	// 최근 3일간 MVP 데이터 가져오기
	useEffect(() => {
		const fetchRecentMvps = async () => {
			try {
				const threeDaysAgo = new Date();
				threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
				const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

				const { data: mvps } = await supabase
					.from("mvp_votes")
					.select(
						`
            id,
            created_at,
            room_id,
            profiles!mvp_votes_winner_id_fkey (
              username,
              realname
            )
          `,
					)
					.gte("created_at", threeDaysAgoStr)
					.order("created_at", { ascending: false });

				if (mvps) {
					setRecentMvps(mvps);
				}
			} catch (error) {
				console.error("Error fetching recent MVPs:", error);
				setRecentMvps([]);
			}
		};

		fetchRecentMvps();
	}, []);

	// 학급별 온도 비교 데이터 가져오기
	useEffect(() => {
		const fetchClassComparison = async () => {
			try {
				const { data: profiles } = await supabase
					.from("profiles")
					.select("class, temperature")
					.not("class", "is", null);

				if (profiles) {
					// 학급별 평균 온도 계산
					const classMap = new Map();
					profiles.forEach((profile) => {
						const className = profile.class || "미지정";
						const temp = profile.temperature || 0;

						if (!classMap.has(className)) {
							classMap.set(className, { total: 0, count: 0 });
						}

						const classData = classMap.get(className);
						classData.total += temp;
						classData.count += 1;
					});

					const comparison = Array.from(classMap.entries())
						.map(([className, data]) => ({
							className,
							avgTemp: Math.round(data.total / data.count),
							memberCount: data.count,
						}))
						.sort((a, b) => b.avgTemp - a.avgTemp);

					setClassComparison(comparison);
				}
			} catch (error) {
				console.error("Error fetching class comparison:", error);
				setClassComparison([]);
			}
		};

		fetchClassComparison();
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
						})),
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
					},
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
			{/* Hero Section */}
			<HeroSection>
				<WelcomeTitle>안녕하세요, {user?.username || "사용자"}님!</WelcomeTitle>
				<WelcomeSubtitle>
					반친구들과 연결되어 다양한 이야기를 만나보세요.
				</WelcomeSubtitle>
				<QuickActions>
					<ActionButton variant="primary" onClick={navigateToQuiz}>
						오늘의 퀴즈
					</ActionButton>
					<ActionButton variant="secondary" onClick={() => navigate("/chat")}>
						채팅방 입장
					</ActionButton>
					<ActionButton variant="secondary" onClick={navigateToMvp}>
						MVP 투표
					</ActionButton>
				</QuickActions>
			</HeroSection>

			{/* Main Content */}
			<ContentContainer>
				{/* Left Column - Main Content */}
				<div>
					{/* Temperature Cards */}
					<Card span={2}>
						<CardHeader>
							<CardTitle>
								<CardIcon>T</CardIcon>
								학급 온도계
							</CardTitle>
						</CardHeader>
						<TempGrid>
							<TempCard>
								<TempValue>{classTempVal}°C</TempValue>
								<TempLabel>학급 평균</TempLabel>
							</TempCard>
							<TempCard isPersonal>
								<TempValue>{myTempVal}°C</TempValue>
								<TempLabel>나의 온도</TempLabel>
							</TempCard>
						</TempGrid>
					</Card>

					{/* Rankings */}
					<Card>
						<CardHeader>
							<CardTitle>
								<CardIcon>R</CardIcon>
								온도 랭킹 TOP 5
							</CardTitle>
						</CardHeader>
						<ListContainer>
							{ranking.length === 0 ? (
								<EmptyState>
									<div className="message">아직 랭킹 데이터가 없습니다</div>
								</EmptyState>
							) : (
								ranking.slice(0, 5).map((u, idx) => (
									<ListItem key={u.id}>
										<ListItemLeft>
											<ListItemRank>{idx + 1}</ListItemRank>
											<ListItemInfo>
												<ListItemName>{u.nickname}</ListItemName>
												<ListItemMeta>학급 멤버</ListItemMeta>
											</ListItemInfo>
										</ListItemLeft>
										<ListItemValue>{u.temp}°C</ListItemValue>
									</ListItem>
								))
							)}
						</ListContainer>
					</Card>

					{/* Class Comparison */}
					<Card>
						<CardHeader>
							<CardTitle>
								<CardIcon>C</CardIcon>
								학급별 온도 비교
							</CardTitle>
						</CardHeader>
						<ListContainer>
							{classComparison.length === 0 ? (
								<EmptyState>
									<div className="message">학급 데이터를 불러오는 중...</div>
								</EmptyState>
							) : (
								classComparison.map((classData, idx) => (
									<ListItem key={classData.className}>
										<ListItemLeft>
											<ListItemRank>{idx + 1}</ListItemRank>
											<ListItemInfo>
												<ListItemName>{classData.className}</ListItemName>
												<ListItemMeta>{classData.memberCount}명</ListItemMeta>
											</ListItemInfo>
										</ListItemLeft>
										<ListItemValue>{classData.avgTemp}°C</ListItemValue>
									</ListItem>
								))
							)}
						</ListContainer>
					</Card>
				</div>

				{/* Right Column - MVP History */}
				<Card>
					<CardHeader>
						<CardTitle>
							<CardIcon>M</CardIcon>
							MVP 명예의 전당
						</CardTitle>
					</CardHeader>
					<ListContainer>
						{recentMvps.length === 0 ? (
							<EmptyState>
								<div className="message">최근 3일간 MVP 기록이 없습니다</div>
							</EmptyState>
						) : (
							recentMvps.map((mvp) => (
								<ListItem key={mvp.id}>
									<ListItemInfo>
										<ListItemName>
											{mvp.profiles?.realname ||
												mvp.profiles?.username ||
												"unknown"}
										</ListItemName>
										<ListItemMeta>
											{new Date(mvp.created_at).toLocaleDateString()} ·{" "}
											{mvp.room_id?.slice(0, 8)}...
										</ListItemMeta>
									</ListItemInfo>
								</ListItem>
							))
						)}
					</ListContainer>
				</Card>
			</ContentContainer>
		</MainScreenDiv>
	);
}

export default MainScreen;
