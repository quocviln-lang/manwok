import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiCall } from "../services/api";
import { LayoutDashboard, Users, Plus } from "lucide-react";
import CreateWorkspaceModal from "../components/CreateWorkspaceModal";

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
    // eslint-disable-next-line
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Các không gian làm việc của bạn</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Tạo mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bạn chưa tham gia không gian làm việc nào.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2 font-medium"
          >
            <Plus size={20} /> Tạo mới ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <Link 
              key={ws.id} 
              to={`/w/${ws.id}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {ws.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">
                {ws.description || "Không có mô tả"}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
                <div className="flex items-center gap-1.5">
                  <Users size={16} />
                  <span>{ws._count.members} thành viên</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LayoutDashboard size={16} />
                  <span>{ws._count.boards} bảng</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWorkspaces} 
      />
    </div>
  );
}
