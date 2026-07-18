import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Home, LayoutTemplate, Briefcase, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { apiCall } from "../services/api";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

type Workspace = {
  id: string;
  name: string;
};
type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

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
    // We wrap in setTimeout to avoid the synchronous setState warning from react-compiler/linter
    const timer = setTimeout(() => {
      fetchWorkspaces();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWorkspaces]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        className={`
          tour-sidebar flex flex-col transition-all duration-300
          /* Desktop styles */
          lg:relative lg:translate-x-0 lg:h-full lg:border-r lg:border-gray-200 lg:dark:border-gray-800
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          /* Mobile styles (Drawer) */
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 shadow-2xl lg:shadow-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
          {/* Main Navigation Section */}
          <nav className="px-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive("/dashboard") 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Trang chủ"
            >
              <Home size={18} className={isActive("/") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"} />
              {!isCollapsed && <span>Trang chủ</span>}
            </Link>
            
            <Link
              to="/templates"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive("/templates") 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Bảng mẫu"
            >
              <LayoutTemplate size={18} className={isActive("/templates") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"} />
              {!isCollapsed && <span>Bảng mẫu</span>}
            </Link>
          </nav>

          {/* Divider */}
          <div className="px-4">
            <div className="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>
          </div>

          {/* Workspaces Section */}
          <div className="flex-1">
            <div className="px-3 mb-2 flex items-center justify-between group">
              {!isCollapsed ? (
                <button 
                  onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 uppercase tracking-wider transition-colors flex-1 text-left"
                >
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isWorkspaceOpen ? "" : "-rotate-90"}`} />
                  Các không gian làm việc
                </button>
              ) : (
                <div className="mx-auto text-gray-400" title="Không gian làm việc">
                  <Briefcase size={16} />
                </div>
              )}
              
              {!isCollapsed && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 rounded-md text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                  title="Tạo Workspace mới"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {(!isCollapsed ? isWorkspaceOpen : true) && (
              <nav className="space-y-1 px-3 mt-2">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Đang tải...</div>
                ) : workspaces.length === 0 ? (
                  !isCollapsed && <div className="px-3 py-2 text-sm text-gray-500 italic">Chưa có không gian nào</div>
                ) : (
                  workspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      to={`/w/${ws.id}`}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                        isActive(`/w/${ws.id}`)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={ws.name}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isActive(`/w/${ws.id}`)
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50"
                      }`}>
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      {!isCollapsed && <span className="truncate">{ws.name}</span>}
                    </Link>
                  ))
                )}
                
                {isCollapsed && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex justify-center p-2 mt-2 rounded-md text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    title="Tạo Workspace mới"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </nav>
            )}
          </div>
        </div>

        {/* Footer Toggle (Desktop Only) */}
        <div className="hidden lg:flex p-4 border-t border-gray-200 dark:border-gray-800 justify-center items-center bg-gray-50/50 dark:bg-gray-900/50">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-center items-center p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title={isCollapsed ? "Phóng to" : "Thu gọn"}
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
