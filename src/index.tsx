import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "./AuthContext";
import GlobalStyle from "./components/GlobalStyle";
import router from "./Router";
import { StoreProvider } from "./Store";
import { lightTheme } from "./theme";

// Sentry 초기화 (에러 추적 및 성능 모니터링)
Sentry.init({
	dsn: process.env.REACT_APP_SENTRY_DSN, // 환경변수로 설정
	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.replayIntegration(),
	],
	// 성능 모니터링
	tracesSampleRate: 1.0,
	// 세션 리플레이 (10% 샘플링)
	replaysSessionSampleRate: 0.1,
	// 에러 발생 시 100% 리플레이
	replaysOnErrorSampleRate: 1.0,
});

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);
root.render(
	<React.StrictMode>
		<StoreProvider>
			<AuthProvider>
				<ThemeProvider theme={lightTheme}>
					<GlobalStyle />
					<RouterProvider router={router} />
				</ThemeProvider>
			</AuthProvider>
		</StoreProvider>
	</React.StrictMode>,
);
