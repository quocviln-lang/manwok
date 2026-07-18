import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiCall } from "../services/api";
import { Plus, Users, Settings, Briefcase, Search, Layout, MoreHorizontal, Archive, Palette, Clock } from "lucide-react";
import CreateBoardModal from "../components/CreateBoardModal";
import WorkspaceSettingsModal from "../components/WorkspaceSettingsModal";
import { useAuth } from "../context/AuthContext";

type Board = {
  id: string;
  title: string;
  color: string;
  cover: string | null;
  archived: boolean;
  creatorId?: string | null;
  creator?: { id: string; fullName: string; avatar: string | null } | null;
  _count?: { lists: number };
  createdAt?: string;
  updatedAt?: string;
};

type WorkspaceActivity = {
  id: string;
  action: string;
  entityTitle: string | null;
  createdAt: string;
  user: { id: string; fullName: string; avatar: string | null };
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  boards: Board[];
  settings?: {
    visibility: "PRIVATE" | "PUBLIC";
    memberRestriction: "ANYONE" | "ADMIN_ONLY";
    boardCreationRestriction: "ANY_MEMBER" | "ADMIN_ONLY";
    boardDeletionRestriction: "ANY_MEMBER" | "ADMIN_ONLY";
  };
  members: { user: { id: string; fullName: string; email: string; avatar: string | null } }[];
};

const PRESET_COLORS = [
  "#0079BF", "#D29034", "#519839", "#B04632", 
  "#89609E", "#CD5A91", "#4BBF6B", "#00AECC", "#838C91"
];

export default function WorkspaceView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("MEMBER");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "permissions" | "members" | "archived">("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [openBoardMenuId, setOpenBoardMenuId] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [res, actRes] = await Promise.all([
        apiCall(`/workspaces/${id}`),
        apiCall(`/workspaces/${id}/activities`)
      ]);
      
      if (res.success) {
        setWorkspace(res.data.workspace);
        setCurrentUserRole(res.data.currentUserRole);
      }
      if (actRes.success) {
        setActivities(actRes.data.activities || []);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.board-menu')) {
        setOpenBoardMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleArchiveBoard = async (boardId: string) => {
    try {
      await apiCall(`/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true })
      });
      fetchWorkspace();
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeColor = async (boardId: string, color: string) => {
    try {
      await apiCall(`/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ color })
      });
      fetchWorkspace();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu workspace...</div>;
  }

  if (!workspace) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy Workspace</div>;
  }

  // Filter out archived boards for main view
  const activeBoards = workspace.boards.filter(b => !b.archived);

  // Filter boards by search query
  const filteredBoards = activeBoards.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split into My Boards and Other Boards
  const myBoards = filteredBoards.filter(b => b.creatorId === user?.id);
  const otherBoards = filteredBoards.filter(b => b.creatorId !== user?.id);

  const canCreateBoard = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || workspace.settings?.boardCreationRestriction === "ANY_MEMBER";
  const canDeleteBoard = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || workspace.settings?.boardDeletionRestriction === "ANY_MEMBER";

  const BoardCard = ({ board }: { board: Board }) => {
    const isOpen = openBoardMenuId === board.id;
    return (
      <div className="relative board-menu group">
        <Link
          to={`/b/${board.id}`}
          className="relative h-40 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between border border-gray-100 dark:border-gray-800"
          style={{
            backgroundColor: board.color || "#3B82F6", 
            backgroundImage: board.cover ? `url(${board.cover})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          
          <h3 className="relative z-10 text-white font-bold text-xl drop-shadow-lg pr-8">
            {board.title}
          </h3>
          
          <div className="relative z-10 flex items-end justify-between mt-auto">
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium drop-shadow-md">
              <Layout size={14} />
              <span>{board._count?.lists || 0} danh sách</span>
            </div>
            
            {board.creator && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-white/80 text-xs drop-shadow-md">Tạo bởi</span>
                {board.creator.avatar ? (
                  <img src={board.creator.avatar} alt={board.creator.fullName} className="w-6 h-6 rounded-full border border-white shadow-sm" title={board.creator.fullName} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold border border-white shadow-sm" title={board.creator.fullName}>
                    {board.creator.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Board Settings Toggle */}
        {canDeleteBoard && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setOpenBoardMenuId(isOpen ? null : board.id);
            }}
            className={`absolute top-3 right-3 z-20 p-1.5 rounded-md bg-black/20 hover:bg-black/40 text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${isOpen ? "opacity-100" : ""}`}
          >
            <MoreHorizontal size={18} />
          </button>
        )}

        {/* Board Settings Dropdown */}
        {isOpen && (
          <div className="absolute top-10 right-3 z-30 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2 px-2">
                <Palette size={14} /> Đổi màu
              </div>
              <div className="grid grid-cols-5 gap-1.5 px-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    className="w-full aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      handleChangeColor(board.id, color);
                      setOpenBoardMenuId(null);
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
            <button
              onClick={() => {
                handleArchiveBoard(board.id);
                setOpenBoardMenuId(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <Archive size={14} /> Lưu trữ
            </button>
          </div>
        )}
      </div>
    );
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "CREATE_BOARD": return "đã tạo bảng";
      case "DELETE_BOARD": return "đã xóa vĩnh viễn bảng";
      case "ARCHIVE_BOARD": return "đã lưu trữ bảng";
      case "RESTORE_BOARD": return "đã khôi phục bảng";
      case "INVITE_MEMBER": return "đã mời thành viên";
      case "REMOVE_MEMBER": return "đã xóa thành viên";
      default: return "đã thực hiện hoạt động";
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 pt-12">
      {/* Workspace Info Area */}
      <div className="px-4 md:px-8 relative mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div className="flex items-end gap-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-gray-50 dark:border-gray-900 shrink-0">
            <span className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-br from-blue-600 to-indigo-600">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {workspace.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl text-sm sm:text-base">
              {workspace.description || "Không có mô tả"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setActiveSettingsTab("members");
              setIsSettingsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <Users size={18} /> Thành viên ({workspace.members.length})
          </button>
          {currentUserRole !== "MEMBER" && (
            <button 
              onClick={() => {
                setActiveSettingsTab("general");
                setIsSettingsModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Settings size={18} /> Cài đặt
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* Toolbar: Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Briefcase size={24} className="text-blue-500" /> Bảng làm việc
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm bảng..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* My Boards */}
          {(myBoards.length > 0 || !searchQuery) && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Bảng do tôi tạo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {myBoards.map((board) => (
                  <BoardCard key={board.id} board={board} />
                ))}
                
                {/* Create New Board Button (only in My Boards section) */}
                {canCreateBoard && !searchQuery && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all gap-2 group shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 flex items-center justify-center transition-colors">
                      <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-medium text-lg">Tạo bảng mới</span>
                  </button>
                )}
              </div>
              {myBoards.length === 0 && searchQuery && (
                <p className="text-gray-500 italic mt-2">Không tìm thấy bảng nào do bạn tạo phù hợp.</p>
              )}
            </div>
          )}

          {/* Other Boards (Shared with me) */}
          {otherBoards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Bảng tôi tham gia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {otherBoards.map((board) => (
                  <BoardCard key={board.id} board={board} />
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state for search */}
          {myBoards.length === 0 && otherBoards.length === 0 && searchQuery && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 text-lg">Không tìm thấy bảng nào với từ khóa "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Activity Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm sticky top-6">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Clock size={18} className="text-gray-500" /> Hoạt động gần đây
              </h3>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có hoạt động nào</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shrink-0 overflow-hidden">
                        {act.user.avatar ? (
                          <img src={act.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          act.user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-800 dark:text-gray-200 leading-tight">
                          <span className="font-medium">{act.user.fullName}</span>{" "}
                          <span className="text-gray-600 dark:text-gray-400">{getActionText(act.action)}</span>{" "}
                          <span className="font-medium">"{act.entityTitle}"</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(act.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateBoardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspace.id}
        onSuccess={fetchWorkspace}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        workspaceDesc={workspace.description}
        workspaceSettings={workspace.settings}
        archivedBoards={workspace.boards.filter(b => b.archived)}
        currentUserRole={currentUserRole}
        onSuccess={fetchWorkspace}
        defaultTab={activeSettingsTab}
      />
    </div>
  );
}
