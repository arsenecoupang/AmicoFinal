import type { DefaultTheme } from "styled-components";

export const lightTheme: DefaultTheme = {
	base: "#F6F9F4",
	baseHover: "#E9F0E6",
	main: "#A8C686",
	mainHover: "#94B373",
	sub: "#6B8E23",
	subHover: "#587319",
	text: "#374151",
	textHover: "#1F2937",
	accent: "#D4A373",
	accentHover: "#BF8C5E",
};

export const greenTheme: DefaultTheme = {
	base: "#F8F8F8", // 흰색
	baseHover: "#E0E0E0", // 약간 어두운 흰색
	main: "#4A7C59", // 부드럽고 진한 초록색
	mainHover: "#3E684B", // 약간 어두운 초록색
	sub: "#4A7C59", // 메인과 동일
	subHover: "#3E684B", // 메인 호버와 동일
	text: "#374151", // 텍스트 색상 유지
	textHover: "#1F2937", // 텍스트 호버 색상 유지
	accent: "#4A7C59", // 메인과 동일
	accentHover: "#3E684B", // 메인 호버와 동일
};
