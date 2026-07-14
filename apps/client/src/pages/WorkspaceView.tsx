import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiCall } from "../services/api";
import { Plus, Users, Settings, Briefcase } from "lucide-react";
import CreateBoardModal from "../components/CreateBoardModal";

type Board = {
  id: string;
  title: string;
  color: string;
  cover: string | null;
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  boards: Board[];
  members: { user: { id: string; fullName: string; email: string; avatar: string | null } }[];
};

export default function WorkspaceView() {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await apiCall(`/workspaces/${id}`);
      if (res.success) {
        setWorkspace(res.data.workspace);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchWorkspace();
  }, [fetchWorkspace]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu workspace...</div>;
  }

  if (!workspace) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy Workspace</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex items-start justify-between mb-10 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {workspace.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {workspace.description || "Không có mô tả"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">
            <Users size={18} /> Thành viên ({workspace.members.length})
          </button>
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">
            <Settings size={18} /> Cài đặt
          </button>
        </div>
      </div>

      {/* Boards Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Briefcase size={20} className="text-blue-500" /> Các bảng của bạn
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workspace.boards.map((board) => (
          <Link
            key={board.id}
            to={`/b/${board.id}`}
            className="group relative h-28 rounded-xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden"
            style={{
              backgroundColor: board.color || "#3B82F6", // Fallback color
              backgroundImage: board.cover ? `url(${board.cover})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {/* Dark tint overlay for better text readability if there is an image */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            <h3 className="relative z-10 text-white font-bold text-lg truncate drop-shadow-md">
              {board.title}
            </h3>
          </Link>
        ))}

        {/* Create New Board Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={24} className="mb-1" />
          <span className="font-medium text-sm">Tạo bảng mới</span>
        </button>
      </div>

      <CreateBoardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspace.id}
        onSuccess={fetchWorkspace}
      />
    </div>
  );
}
