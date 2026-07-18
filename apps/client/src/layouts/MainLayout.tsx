import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Moon, Sun, User as UserIcon, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/Sidebar";
import NotificationMenu from "../components/NotificationMenu";
import OnboardingTour from "../components/OnboardingTour";
import UserGuideModal from "../components/UserGuideModal";
import { BookOpen, Menu } from "lucide-react";

// ProfileModal removed, using ProfilePage instead

function MainLayout() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col overflow-hidden">
      <header className="h-14 px-3 sm:px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <Link to="/dashboard" className="font-bold text-xl text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">
            Manwok
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsUserGuideOpen(true)}
            className="tour-help-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 transition-colors tooltip-trigger"
            title="Sổ tay Hướng dẫn"
          >
            <BookOpen size={20} />
          </button>
          
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <NotificationMenu />
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="tour-profile w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() || "U"
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                
                {user?.systemRole === "SYSTEM_ADMIN" && (
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/admin");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 transition-colors font-medium"
                  >
                    ⚙️ Quản trị hệ thống
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <UserIcon size={16} /> Hồ sơ cá nhân
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar mobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      <OnboardingTour />
      <UserGuideModal isOpen={isUserGuideOpen} onClose={() => setIsUserGuideOpen(false)} />
    </div>
  );
}

export default MainLayout;
