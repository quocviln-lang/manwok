import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import { apiCall } from "../services/api";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

type Workspace = {
  id: string;
  name: string;
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await apiCall("/workspaces");
      if (res.success) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (error) {
      console.error("Failed to load workspaces", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <>
      <aside 
        className={`relative h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex-1 overflow-y-auto py-4">
          {/* Workspaces Section */}
          <div className="px-3 mb-2 flex items-center justify-between group">
            {!isCollapsed && <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Không gian làm việc</h2>}
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 ${isCollapsed ? 'mx-auto' : ''}`} 
              title="Tạo mới"
            >
              <Plus size={16} />
            </button>
          </div>

          <nav className="space-y-1 px-2">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Đang tải...</div>
            ) : workspaces.length === 0 ? (
              !isCollapsed && <div className="px-3 py-2 text-sm text-gray-500">Chưa có workspace nào</div>
            ) : (
              workspaces.map((ws) => (
                <a
                  key={ws.id}
                  href={`/w/${ws.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  title={ws.name}
                >
                  <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && <span className="font-medium truncate">{ws.name}</span>}
                </a>
              ))
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          {!isCollapsed && (
            <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Settings size={18} /> Cài đặt
            </button>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
      
      <CreateWorkspaceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkspaces}
      />
    </>
  );
}
