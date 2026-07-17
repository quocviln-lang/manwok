import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../services/api";
import { 
  CheckCircle2, 
  Clock, 
  Layout, 
  ListTodo, 
  Camera,
  Calendar,
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import CardDetailModal from "../components/CardDetailModal";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await apiCall("/auth/dashboard");
      if (res.success) {
        setStats(res.data.stats);
        setUpcomingTasks(res.data.upcomingTasks);
        setChartData(res.data.activityChart);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiCall("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      });
      if (res.success) {
        login(localStorage.getItem("manwok_token") || "", res.data.user);
        setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Lỗi cập nhật thông tin" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
    }
    try {
      const res = await apiCall("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Lỗi đổi mật khẩu" });
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const uploadRes = await apiCall("/upload", {
        method: "POST",
        body: formData,
      });
      
      if (uploadRes.success && uploadRes.data.url) {
        const newAvatarUrl = uploadRes.data.url;
        const updateRes = await apiCall("/auth/me", {
          method: "PATCH",
          body: JSON.stringify({ avatar: newAvatarUrl }),
        });
        if (updateRes.success) {
          login(localStorage.getItem("manwok_token") || "", updateRes.data.user);
        }
      }
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      alert("Không thể tải ảnh lên. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 px-4 font-medium transition-colors relative ${
              activeTab === "dashboard" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Tổng quan
            {activeTab === "dashboard" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-4 px-4 font-medium transition-colors relative ${
              activeTab === "settings" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Cài đặt
            {activeTab === "settings" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ListTodo size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Task được giao</p>
                  <p className="text-2xl font-bold">{stats?.totalTasks || 0}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Đã hoàn thành</p>
                  <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Trễ hạn</p>
                  <p className="text-2xl font-bold">{stats?.overdueTasks || 0}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Layout size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Workspaces</p>
                  <p className="text-2xl font-bold">{stats?.workspacesCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Task hoàn thành 7 ngày qua</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return `${d.getDate()}/${d.getMonth()+1}`;
                        }}
                        className="text-xs"
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                        className="text-xs"
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* My Tasks List */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task của tôi</h3>
                  {upcomingTasks.length > 5 && (
                    <button 
                      onClick={() => setIsAllTasksModalOpen(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  {upcomingTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                      <CheckCircle2 size={40} className="mb-3 opacity-20" />
                      <p>Bạn không có task nào đang chờ</p>
                    </div>
                  ) : (
                    upcomingTasks.slice(0, 5).map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => setSelectedCardId(task.id)}
                          className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer transition-all hover:shadow-md bg-gray-50/50 dark:bg-gray-900/50 group"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{task.title}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="truncate max-w-[120px]">{task.list?.board?.title}</span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                                {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                                {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            {message.text && (
              <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}
            
            {/* Avatar Section */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col items-center">
              <div className="relative group w-32 h-32 rounded-full mb-4">
                <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-5xl font-bold shadow-inner overflow-hidden border-4 border-white dark:border-gray-800">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div 
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Camera className="text-white mb-1" size={24} />
                      <span className="text-white text-xs font-medium">Đổi ảnh</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleUploadAvatar}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="mt-4 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                Vai trò: {user.systemRole || "Người dùng"}
              </div>
            </div>

            {/* Profile Info Form */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Thông vị cá nhân</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/30">
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Đổi mật khẩu</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                    required
                    minLength={6}
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl font-medium transition-colors shadow-sm">
                    Đổi mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* All Tasks Modal */}
      {isAllTasksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tất cả Task của tôi</h2>
              <button 
                onClick={() => setIsAllTasksModalOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {upcomingTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <div 
                    key={task.id} 
                    onClick={() => {
                      setSelectedCardId(task.id);
                      setIsAllTasksModalOpen(false); // Close this modal to open card detail
                    }}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-gray-800 group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.list?.board?.title}</p>
                    </div>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {selectedCardId && (
        <CardDetailModal 
          onClose={() => setSelectedCardId(null)} 
          cardId={selectedCardId} 
          boardId={upcomingTasks.find(t => t.id === selectedCardId)?.list?.board?.id || ""} 
          onCardUpdated={() => {
            fetchDashboardStats(); // Refresh dashboard stats when a card is updated (e.g. marked complete)
          }}
        />
      )}
    </div>
  );
}
