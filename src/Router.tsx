import { createBrowserRouter } from "react-router-dom";
import DbTest from "./debug/DbTest";
import Root from "./Root";
import ChatScreen from "./screens/Chat";
import DebugDatabase from "./screens/DebugDatabase";
import DebugRealtime from "./screens/DebugRealtime";
import Login from "./screens/Login";
import MainScreen from "./screens/MainScreen";
import MvpVoteScreen from "./screens/MvpVote";
import NotFound from "./screens/NotFound";
import QuizScreen from "./screens/Quiz";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />,
		children: [
			{
				path: "",
				element: <Login />,
			},
			{ path: "/home", element: <MainScreen /> },
			{ path: "/quiz", element: <QuizScreen /> },
			{ path: "/mvp", element: <MvpVoteScreen /> },
			{
				path: "/chat",
				element: <ChatScreen />,
			},
			{
				path: "/debug/db",
				element: <DbTest />,
			},
			{
				path: "/debug/realtime",
				element: <DebugRealtime />,
			},
			{
				path: "/debug/database",
				element: <DebugDatabase />,
			},
		],
		errorElement: <NotFound />,
	},
]);

export default router;
