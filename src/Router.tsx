import {createBrowserRouter} from "react-router-dom";
import Root from "./Root";
import MainScreen from "./screens/MainScreen";
import Login from "./screens/Login";
import NotFound from "./screens/NotFound";
import QuizScreen from "./screens/Quiz";
import ChatScreen from "./screens/Chat";
import MvpVoteScreen from "./screens/MvpVote";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path:"",
                element: <Login/>,
            },
            {path:"/home",
            element: <MainScreen/>,
            },
            {path:"/quiz",
                element: <QuizScreen/>,
            },
            {path:"/mvp",
                element: <MvpVoteScreen/>,
            },
            {
                path:"/chat",
                element: <ChatScreen/>
            },
            ],
            errorElement: <NotFound />,

    }
]);

export default router;