import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../services/api";
import { 
  Users, 
  Layout, 
  ListTodo,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  Shield,
  Lock,
  Unlock,
  Activity
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "workspaces">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "dashboard") fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "workspaces") fetchWorkspaces();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await apiCall("/admin/stats");
      if (res.success) setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall("/admin/users");
      if (res.success) setUsers(res.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall("/admin/workspaces");
      if (res.success) setWorkspaces(res.data.workspaces);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "SYSTEM_ADMIN" ? "SYSTEM_USER" : "SYSTEM_ADMIN";
    if (!window.confirm(`Bạn có chắc muốn cấp quyền ${newRole} cho người dùng này?`)) return;
    
    try {
      const res = await apiCall(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.success) {
        fetchUsers();
      }
    } catch (error) {
      alert("Lỗi đổi quyền");
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? "KHÓA" : "MỞ KHÓA";
    if (!window.confirm(`BẠN CÓ CHẮC MUỐN ${action} TÀI KHOẢN NÀY?`)) return;
    
    try {
      const res = await apiCall(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.success) {
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.message || `Lỗi ${action.toLowerCase()} tài khoản`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("BẠN CÓ CHẮC MUỐN XÓA TÀI KHOẢN NÀY? HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!")) return;
    try {
      const res = await apiCall(`/admin/users/${userId}`, { method: "DELETE" });
      if (res.success) {
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.message || "Lỗi xóa người dùng");
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!window.confirm("BẠN CÓ CHẮC MUỐN XÓA WORKSPACE NÀY?")) return;
    try {
      const res = await apiCall(`/admin/workspaces/${workspaceId}`, { method: "DELETE" });
      if (res.success) {
        fetchWorkspaces();
      }
    } catch (error: any) {
      alert(error.message || "Lỗi xóa workspace");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 font-sans">
      {/* Premium Sidebar */}
      <div className="w-72 bg-linear-to-b from-slate-900 to-slate-950 text-white flex flex-col shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-wide">Admin<span className="text-blue-400">Panel</span></h1>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === "dashboard" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Activity size={20} className={activeTab === "dashboard" ? "text-blue-400" : ""} /> Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === "users" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Users size={20} className={activeTab === "users" ? "text-purple-400" : ""} /> Người dùng
          </button>
          <button 
            onClick={() => setActiveTab("workspaces")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === "workspaces" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <BriefcaseIcon size={20} className={activeTab === "workspaces" ? "text-green-400" : ""} /> Workspaces
          </button>
        </div>
        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg">
                {user?.fullName.charAt(0)}
              </div>
            )}
            <div className="text-sm">
              <p className="font-semibold truncate max-w-[120px]">{user?.fullName}</p>
              <p className="text-xs text-slate-400">System Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-red-400 transition-colors" title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 bg-transparent flex items-center justify-between px-10 shrink-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            {activeTab === "dashboard" && "Dashboard Tổng quan"}
            {activeTab === "users" && "Quản lý Người dùng"}
            {activeTab === "workspaces" && "Quản lý Workspaces"}
          </h2>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-gray-600 dark:text-gray-300"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto px-10 pb-10 z-10">
          
          {activeTab === "dashboard" && stats && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Tổng người dùng" 
                  value={stats.stats.totalUsers} 
                  icon={<Users size={24} className="text-white" />} 
                  color="from-blue-500 to-cyan-400" 
                  shadow="shadow-blue-500/30"
                />
                <StatCard 
                  title="Tổng Workspaces" 
                  value={stats.stats.totalWorkspaces} 
                  icon={<BriefcaseIcon size={24} className="text-white" />} 
                  color="from-emerald-500 to-green-400" 
                  shadow="shadow-emerald-500/30"
                />
                <StatCard 
                  title="Tổng Bảng (Boards)" 
                  value={stats.stats.totalBoards} 
                  icon={<Layout size={24} className="text-white" />} 
                  color="from-purple-500 to-pink-400" 
                  shadow="shadow-purple-500/30"
                />
                <StatCard 
                  title="Tổng Task (Cards)" 
                  value={stats.stats.totalCards} 
                  icon={<ListTodo size={24} className="text-white" />} 
                  color="from-orange-500 to-yellow-400" 
                  shadow="shadow-orange-500/30"
                />
              </div>

              {/* Chart Section */}
              <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/20 dark:border-gray-700/50">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tăng trưởng người dùng</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Số người đăng ký mới trong 14 ngày qua</p>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.userGrowthChart} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        name="Tài khoản mới"
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/20 dark:border-gray-700/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-8 py-5">Người dùng</th>
                      <th className="px-6 py-5">Vai trò</th>
                      <th className="px-6 py-5">Trạng thái</th>
                      <th className="px-6 py-5">Ngày tham gia</th>
                      <th className="px-8 py-5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {isLoading ? (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className={`hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors ${!u.isActive ? 'opacity-70' : ''}`}>
                          <td className="px-8 py-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-sm ${!u.isActive ? 'bg-gray-200 text-gray-500 grayscale' : 'bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400'}`}>
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-bold text-[15px] ${!u.isActive ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{u.fullName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${u.systemRole === "SYSTEM_ADMIN" ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50'}`}>
                              {u.systemRole === "SYSTEM_ADMIN" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                              {u.systemRole === "SYSTEM_ADMIN" ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'}`}>
                              {u.isActive ? "Hoạt động" : "Bị khóa"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-end gap-2">
                              {u.isActive ? (
                                <button 
                                  onClick={() => handleToggleStatus(u.id, u.isActive)}
                                  disabled={u.id === user?.id}
                                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 dark:bg-gray-700 dark:hover:bg-orange-900/30 dark:text-gray-300 dark:hover:text-orange-400 rounded-xl transition-colors disabled:opacity-50"
                                  title="Khóa tài khoản"
                                >
                                  <Lock size={18} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleToggleStatus(u.id, u.isActive)}
                                  disabled={u.id === user?.id}
                                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-600 dark:bg-gray-700 dark:hover:bg-emerald-900/30 dark:text-gray-300 dark:hover:text-emerald-400 rounded-xl transition-colors disabled:opacity-50"
                                  title="Mở khóa tài khoản"
                                >
                                  <Unlock size={18} />
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleChangeRole(u.id, u.systemRole)}
                                disabled={u.id === user?.id}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 dark:bg-gray-700 dark:hover:bg-purple-900/30 dark:text-gray-300 dark:hover:text-purple-400 rounded-xl transition-colors disabled:opacity-50"
                                title="Đổi quyền"
                              >
                                <ShieldAlert size={18} />
                              </button>

                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user?.id}
                                className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white rounded-xl transition-colors disabled:opacity-50"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "workspaces" && (
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/20 dark:border-gray-700/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-8 py-5">Tên Workspace</th>
                      <th className="px-6 py-5">Chủ sở hữu</th>
                      <th className="px-6 py-5 text-center">Thành viên</th>
                      <th className="px-6 py-5 text-center">Bảng</th>
                      <th className="px-8 py-5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {isLoading ? (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td></tr>
                    ) : (
                      workspaces.map((w) => (
                        <tr key={w.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-8 py-5 font-bold text-gray-900 dark:text-white text-[15px]">
                            {w.name}
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-gray-900 dark:text-gray-100">{w.owner.fullName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{w.owner.email}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg font-bold text-sm">
                              {w._count.members}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex px-3 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 rounded-lg font-bold text-sm">
                              {w._count.boards}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => handleDeleteWorkspace(w.id)}
                              className="w-10 h-10 inline-flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white rounded-xl transition-colors"
                              title="Xóa Workspace"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// UI Components
function StatCard({ title, value, icon, color, shadow }: { title: string, value: number, icon: any, color: string, shadow: string }) {
  return (
    <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/20 dark:border-gray-700/50 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity -mr-10 -mt-10`}></div>
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${color} shadow-lg ${shadow} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">{title}</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}
