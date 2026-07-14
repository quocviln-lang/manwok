import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Moon, Sun, User as UserIcon, LogOut, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../services/api";

import Sidebar from "../components/Sidebar";

function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, login } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Hồ sơ cá nhân</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative group w-24 h-24 rounded-full mb-4">
            <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-4xl font-bold shadow-inner overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user.fullName.charAt(0).toUpperCase()
              )}
            </div>
            {/* Overlay for uploading */}
            <div 
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-white text-xs font-medium">Đổi ảnh</span>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("image", file);
                  
                  // 1. Upload to Cloudinary
                  const uploadRes = await apiCall("/upload", {
                    method: "POST",
                    body: formData,
                  });
                  
                  if (uploadRes.success && uploadRes.data.url) {
                    const newAvatarUrl = uploadRes.data.url;
                    
                    // 2. Update user profile
                    const updateRes = await apiCall("/auth/me", {
                      method: "PATCH",
                      body: JSON.stringify({ avatar: newAvatarUrl }),
                    });
                    
                    if (updateRes.success) {
                      // 3. Update local context
                      login(localStorage.getItem("manwok_token") || "", updateRes.data.user);
                    }
                  }
                } catch (error) {
                  console.error("Lỗi tải ảnh:", error);
                  alert("Không thể tải ảnh lên. Vui lòng thử lại!");
                } finally {
                  setIsUploading(false);
                }
              }}
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vai trò</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user.systemRole || "Người dùng"}</p>
          </div>
          <button 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isUploading ? "Đang tải lên..." : "Cập nhật ảnh đại diện"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    navigate("/auth");
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col overflow-hidden">
      <header className="h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between shrink-0 z-50">
        <Link to="/" className="font-bold text-xl text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">
          Manwok
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
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
                
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileOpen(true);
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
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

export default MainLayout;
