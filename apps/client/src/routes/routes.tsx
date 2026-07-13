import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";

export const publicRoutes = [
  {
    path: "/",
    element: <HomePage />,
  },
];

export const authRoutes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
];
