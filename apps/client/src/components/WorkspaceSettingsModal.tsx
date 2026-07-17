import { useState, useEffect } from "react";
import { X, Settings, Users, Shield, Trash2, Mail, Archive, RefreshCw } from "lucide-react";
import { apiCall } from "../services/api";

type User = {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
};

type WorkspaceMember = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: User;
};

type WorkspaceSettings = {
  visibility: "PRIVATE" | "PUBLIC";
  memberRestriction: "ANYONE" | "ADMIN_ONLY";
  boardCreationRestriction: "ANY_MEMBER" | "ADMIN_ONLY";
  boardDeletionRestriction: "ANY_MEMBER" | "ADMIN_ONLY";
};

type Board = {
  id: string;
  title: string;
  color: string;
  cover: string | null;
  archived: boolean;
};

type WorkspaceSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  workspaceDesc: string | null;
  workspaceSettings?: WorkspaceSettings;
  archivedBoards?: Board[];
  currentUserRole: string;
  onSuccess: () => void;
  defaultTab?: "general" | "permissions" | "members" | "archived";
};

export default function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  workspaceDesc,
  workspaceSettings,
  archivedBoards = [],
  currentUserRole,
  onSuccess,
  defaultTab = "general",
}: WorkspaceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "permissions" | "members" | "archived">(defaultTab);
  const [name, setName] = useState(workspaceName);
  const [description, setDescription] = useState(workspaceDesc || "");
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  
  const defaultSettings: WorkspaceSettings = {
    visibility: "PRIVATE",
    memberRestriction: "ANYONE",
    boardCreationRestriction: "ANY_MEMBER",
    boardDeletionRestriction: "ANY_MEMBER"
  };
  
  const [settings, setSettings] = useState<WorkspaceSettings>({ ...defaultSettings, ...workspaceSettings });

  const fetchMembers = async () => {
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/members`);
      if (res.success) {
        setMembers(res.data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (defaultTab === "members" || currentUserRole === "OWNER" || currentUserRole === "ADMIN") {
        // eslint-disable-next-line
        fetchMembers();
      }
    }
    // eslint-disable-next-line
  }, [isOpen, defaultTab, workspaceId, currentUserRole]);

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const res = await apiCall(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      });
      if (res.success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (key: keyof WorkspaceSettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      const res = await apiCall(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ settings: newSettings }),
      });
      if (res.success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      // Revert on failure
      setSettings(settings);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa Không gian làm việc này? Mọi bảng và dữ liệu sẽ bị mất vĩnh viễn!")) {
      try {
        setIsLoading(true);
        const res = await apiCall(`/workspaces/${workspaceId}`, { method: "DELETE" });
        if (res.success) {
          window.location.href = "/";
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsLoading(true);
      const res = await apiCall(`/workspaces/${workspaceId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.success) {
        alert("Đã gửi lời mời thành công!");
        setInviteEmail("");
      } else {
        alert(res.message || "Không thể mời thành viên");
      }
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/members/${memberId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (res.success) {
        fetchMembers();
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi không gian làm việc?")) {
      try {
        const res = await apiCall(`/workspaces/${workspaceId}/members/${memberId}`, {
          method: "DELETE",
        });
        if (res.success) {
          fetchMembers();
        } else {
          alert(res.message);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (!isOpen) return null;

  const isAdminOrOwner = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canDeleteBoard = isAdminOrOwner || workspaceSettings?.boardDeletionRestriction === "ANY_MEMBER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt Không gian làm việc</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex flex-col gap-2 overflow-y-auto">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "general" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Settings size={18} /> Cài đặt chung
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "permissions" 
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Shield size={18} /> Phân quyền
            </button>
            <button
              onClick={() => {
                setActiveTab("members");
                fetchMembers();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "members" 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Users size={18} /> Thành viên
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "archived" 
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Archive size={18} /> Bảng lưu trữ
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900">
            
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="max-w-xl animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Thông tin chung</h3>
                <form onSubmit={handleUpdateGeneral} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tên không gian làm việc
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isAdminOrOwner}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all disabled:opacity-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isAdminOrOwner}
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all disabled:opacity-50 resize-none"
                    />
                  </div>
                  {isAdminOrOwner && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  )}
                </form>

                {currentUserRole === "OWNER" && (
                  <div className="mt-12 pt-8 border-t border-red-100 dark:border-red-900/30">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <Trash2 size={20} /> Khu vực nguy hiểm
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      Xóa không gian làm việc này sẽ xóa vĩnh viễn tất cả các bảng, thẻ, và dữ liệu bên trong. Hành động này không thể hoàn tác.
                    </p>
                    <button
                      onClick={handleDeleteWorkspace}
                      disabled={isLoading}
                      className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Xóa Không gian làm việc
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === "permissions" && (
              <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chính sách hạn chế</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                  Quản lý quyền hạn và khả năng hiển thị của không gian làm việc.
                </p>

                <div className="space-y-4">
                  {/* Visibility */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Khả năng hiển thị</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ai có thể nhìn thấy không gian làm việc này</p>
                    </div>
                    <select
                      value={settings.visibility}
                      onChange={(e) => handleUpdateSettings("visibility", e.target.value)}
                      disabled={!isAdminOrOwner}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50"
                    >
                      <option value="PRIVATE">Riêng tư (Chỉ thành viên)</option>
                      <option value="PUBLIC">Công khai (Mọi người)</option>
                    </select>
                  </div>

                  {/* Membership Restriction */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Quyền mời thành viên</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ai có thể mời người mới tham gia</p>
                    </div>
                    <select
                      value={settings.memberRestriction}
                      onChange={(e) => handleUpdateSettings("memberRestriction", e.target.value)}
                      disabled={!isAdminOrOwner}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50"
                    >
                      <option value="ANYONE">Bất kỳ thành viên nào</option>
                      <option value="ADMIN_ONLY">Chỉ Quản trị viên</option>
                    </select>
                  </div>

                  {/* Board Creation Restriction */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Quyền tạo bảng</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ai có thể tạo bảng mới trong không gian</p>
                    </div>
                    <select
                      value={settings.boardCreationRestriction}
                      onChange={(e) => handleUpdateSettings("boardCreationRestriction", e.target.value)}
                      disabled={!isAdminOrOwner}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50"
                    >
                      <option value="ANY_MEMBER">Bất kỳ thành viên nào</option>
                      <option value="ADMIN_ONLY">Chỉ Quản trị viên</option>
                    </select>
                  </div>

                  {/* Board Deletion Restriction */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Quyền xóa bảng</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ai có thể xóa bảng khỏi không gian</p>
                    </div>
                    <select
                      value={settings.boardDeletionRestriction}
                      onChange={(e) => handleUpdateSettings("boardDeletionRestriction", e.target.value)}
                      disabled={!isAdminOrOwner}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50"
                    >
                      <option value="ANY_MEMBER">Bất kỳ thành viên nào</option>
                      <option value="ADMIN_ONLY">Chỉ Quản trị viên</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thành viên ({members.length})</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                  Những người có thể xem và cộng tác trong không gian làm việc này.
                </p>

                {(isAdminOrOwner || settings.memberRestriction === "ANYONE") && (
                  <form onSubmit={handleInvite} className="mb-8 flex gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email để mời..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isLoading ? "Đang gửi..." : "Mời"}
                    </button>
                  </form>
                )}

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        {member.user.avatar ? (
                          <img src={member.user.avatar} alt={member.user.fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {member.user.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {member.user.fullName}
                            {member.role === "OWNER" && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-sm">
                                Chủ sở hữu
                              </span>
                            )}
                            {member.role === "ADMIN" && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-2 py-0.5 rounded-sm">
                                Quản trị viên
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</div>
                        </div>
                      </div>

                      {isAdminOrOwner && member.role !== "OWNER" ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            disabled={currentUserRole === "ADMIN" && member.role === "ADMIN"} // Admins can't demote other admins
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 disabled:opacity-50"
                          >
                            <option value="MEMBER">Thành viên</option>
                            <option value="ADMIN">Quản trị viên</option>
                          </select>
                          
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={currentUserRole === "ADMIN" && member.role === "ADMIN"}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Xóa khỏi không gian"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium">
                          {member.role === "OWNER" ? "Chủ sở hữu" : member.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "archived" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bảng đã lưu trữ</h3>
                
                {archivedBoards.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    Không có bảng nào đang được lưu trữ
                  </div>
                ) : (
                  <div className="space-y-4">
                    {archivedBoards.map(board => (
                      <div key={board.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-lg shrink-0" 
                            style={{ 
                              backgroundColor: board.color || "#3B82F6",
                              backgroundImage: board.cover ? `url(${board.cover})` : "none",
                              backgroundSize: "cover"
                            }} 
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{board.title}</h4>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setIsLoading(true);
                              try {
                                await apiCall(`/boards/${board.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ archived: false })
                                });
                                onSuccess();
                              } catch (e) { console.error(e); }
                              finally { setIsLoading(false); }
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg transition-colors"
                          >
                            <RefreshCw size={16} /> Khôi phục
                          </button>
                          
                          {canDeleteBoard && (
                            <button
                              onClick={async () => {
                                if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bảng này? Dữ liệu không thể khôi phục!")) {
                                  setIsLoading(true);
                                  try {
                                    await apiCall(`/boards/${board.id}`, { method: "DELETE" });
                                    onSuccess();
                                  } catch (e) { console.error(e); }
                                  finally { setIsLoading(false); }
                                }
                              }}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} /> Xóa vĩnh viễn
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
