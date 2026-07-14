import HomePage from "../pages/HomePage";
import BoardPage from "../pages/BoardPage";
import AuthPage from "../pages/AuthPage";
import WorkspaceView from "../pages/WorkspaceView";
import ProtectedRoute from "../components/ProtectedRoute";

export const publicRoutes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/w/:id",
    element: (
      <ProtectedRoute>
        <WorkspaceView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/b/:id",
    element: (
      <ProtectedRoute>
        <BoardPage />
      </ProtectedRoute>
    ),
  },
];

export const authRoutes = [
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/register",
    element: <AuthPage />,
  },
];
