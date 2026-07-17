import HomePage from "../pages/HomePage";
import BoardPage from "../pages/BoardPage";
import AuthPage from "../pages/AuthPage";
import WorkspaceView from "../pages/WorkspaceView";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

import LandingPage from "../pages/LandingPage";

export const landingRoutes = [
  {
    path: "/",
    element: <LandingPage />,
  },
];

export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminPage />
      </AdminRoute>
    ),
  },
];

export const publicRoutes = [
  {
    path: "/dashboard",
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
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
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
