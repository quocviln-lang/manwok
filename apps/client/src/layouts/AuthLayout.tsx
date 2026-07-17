import { Outlet, Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function AuthLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Trang chủ
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <Outlet />
    </div>
  );
}

export default AuthLayout;
