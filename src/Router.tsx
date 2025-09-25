import { createBrowserRouter } from "react-router-dom";
import Root from "./Root";
import MainScreen from "./screens/MainScreen";
import Login from "./screens/Login";
import NotFound from "./screens/NotFound";
import QuizScreen from "./screens/Quiz";
import ChatScreen from "./screens/Chat";
import MvpVoteScreen from "./screens/MvpVote";
import DbTest from "./debug/DbTest";
import DebugRealtime from "./screens/DebugRealtime";
import DebugDatabase from "./screens/DebugDatabase";

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
