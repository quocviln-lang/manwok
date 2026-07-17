import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiCall } from "../services/api";
import { LayoutDashboard, Users, Plus, ArrowRight, Sparkles } from "lucide-react";
import CreateWorkspaceModal from "../components/CreateWorkspaceModal";
import { useAuth } from "../context/AuthContext";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
    boards: number;
  };
};

export default function HomePage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiCall("/workspaces");
      if (res.success) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Welcome Banner */}
      <div className="max-w-7xl mx-auto px-8 pt-12 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400 font-medium text-sm">
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            {getGreeting()}, {user?.fullName?.split(" ").pop() || "bạn"}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Chào mừng bạn trở lại không gian làm việc.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
        >
          <Plus size={20} /> 
          Tạo Workspace mới
        </button>
      </div>

      {/* Workspaces Section */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" />
            Các Không gian làm việc
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Bạn chưa có Workspace nào</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Không gian làm việc (Workspace) là nơi tập hợp các bảng công việc và thành viên trong đội nhóm của bạn.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full transition-all flex items-center gap-2 font-bold shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 mx-auto"
            >
              <Plus size={20} /> Tạo Workspace đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="group min-h-[220px] rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col items-center justify-center gap-4 transition-all py-8"
            >
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 rounded-full flex items-center justify-center transition-colors">
                <Plus size={28} />
              </div>
              <span className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Tạo mới Workspace
              </span>
            </button>

            {/* Workspace Cards */}
            {workspaces.map((ws) => (
              <Link 
                key={ws.id} 
                to={`/w/${ws.id}`}
                className="group relative min-h-[220px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all flex flex-col"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="text-blue-500" size={20} />
                </div>
                
                <div className="flex items-start mb-4">
                  <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {ws.name}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-2 flex-1">
                  {ws.description || "Không có mô tả chi tiết cho không gian làm việc này."}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <span>{ws._count.members}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-indigo-500" />
                    <span>{ws._count.boards} bảng</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWorkspaces} 
      />
    </div>
  );
}
