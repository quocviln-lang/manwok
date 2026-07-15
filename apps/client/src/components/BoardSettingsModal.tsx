import { useState, useEffect, useCallback } from "react";
import { X, Activity as ActivityIcon, Archive, Users, RefreshCw } from "lucide-react";
import { apiCall, type Activity } from "../services/api";
import type { ListType, CardType } from "../pages/BoardPage";

type BoardSettingsModalProps = {
  boardId: string;
  workspaceId: string;
  currentUserRole: string;
  onClose: () => void;
  onUpdate: () => void;
};

export default function BoardSettingsModal({ boardId, workspaceId, currentUserRole, onClose, onUpdate }: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"activity" | "archived" | "share">("activity");
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [archivedLists, setArchivedLists] = useState<ListType[]>([]);
  const [archivedCards, setArchivedCards] = useState<CardType[]>([]);
  const [members, setMembers] = useState<{ id: string; role: string; user: { fullName: string; avatar: string | null } }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiCall(`/boards/${boardId}/activities`);
      if (res.success) setActivities(res.data.activities);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  const fetchArchived = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiCall(`/boards/${boardId}/archived`);
      if (res.success) {
        setArchivedLists(res.data.lists);
        setArchivedCards(res.data.cards);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/members`);
      if (res.success) setMembers(res.data.members);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "activity") fetchActivities();
      if (activeTab === "archived") fetchArchived();
      if (activeTab === "share") fetchMembers();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchActivities, fetchArchived, fetchMembers]);

  const handleRestoreList = async (listId: string) => {
    try {
      await apiCall(`/lists/${listId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: false })
      });
      fetchArchived();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreCard = async (cardId: string) => {
    try {
      const res = await apiCall(`/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: false })
      });
      if (res.success) {
        setArchivedCards(prev => prev.filter(c => c.id !== cardId));
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn danh sách này?")) return;
    try {
      const res = await apiCall(`/lists/${listId}`, { method: "DELETE" });
      if (res.success) {
        setArchivedLists(prev => prev.filter(l => l.id !== listId));
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn thẻ này?")) return;
    try {
      const res = await apiCall(`/cards/${cardId}`, { method: "DELETE" });
      if (res.success) {
        setArchivedCards(prev => prev.filter(c => c.id !== cardId));
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.success) {
        alert("Đã gửi lời mời!");
        setInviteEmail("");
      }
    } catch (error: unknown) {
      alert((error as Error).message || "Không thể gửi lời mời");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      });
      if (res.success) {
        fetchMembers();
      }
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message || "Lỗi cập nhật quyền");
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi Workspace?")) return;
    try {
      const res = await apiCall(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE"
      });
      if (res.success) {
        fetchMembers();
      }
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message || "Lỗi xóa thành viên");
    }
  };

  const renderActivityText = (act: Activity) => {
    const actor = act.user.fullName;
    const target = act.entityTitle ? `"${act.entityTitle}"` : "một mục";
    
    switch (act.action) {
      case "CREATE_CARD": return <span><b>{actor}</b> đã thêm thẻ {target}</span>;
      case "CREATE_LIST": return <span><b>{actor}</b> đã thêm danh sách {target}</span>;
      case "MOVE_CARD": return <span><b>{actor}</b> đã di chuyển thẻ {target}</span>;
      case "ARCHIVE_CARD": return <span><b>{actor}</b> đã lưu trữ thẻ {target}</span>;
      case "RESTORE_CARD": return <span><b>{actor}</b> đã khôi phục thẻ {target}</span>;
      case "ARCHIVE_LIST": return <span><b>{actor}</b> đã lưu trữ danh sách {target}</span>;
      case "RESTORE_LIST": return <span><b>{actor}</b> đã khôi phục danh sách {target}</span>;
      case "COMPLETE_CARD": return <span><b>{actor}</b> đã đánh dấu hoàn thành thẻ {target}</span>;
      case "INCOMPLETE_CARD": return <span><b>{actor}</b> đã đánh dấu chưa làm thẻ {target}</span>;
      default: return <span><b>{actor}</b> đã thực hiện hành động {act.action} trên {target}</span>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"
      onClick={onClose}
    >
      <div 
        className="relative bg-gray-50 dark:bg-gray-900 w-full max-w-2xl min-h-[500px] rounded-xl shadow-2xl my-8 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cài đặt bảng</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "activity" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <ActivityIcon size={16} /> Hoạt động
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "archived" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <Archive size={16} /> Mục lưu trữ
          </button>
          <button
            onClick={() => setActiveTab("share")}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "share" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <Users size={16} /> Chia sẻ
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === "activity" && (
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Chưa có hoạt động nào được ghi lại.</p>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                        {act.user.avatar ? (
                          <img src={act.user.avatar} alt={act.user.fullName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                            {act.user.fullName[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div>{renderActivityText(act)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(act.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "archived" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Danh sách đã lưu trữ ({archivedLists.length})</h3>
                    {archivedLists.length === 0 ? (
                      <p className="text-sm text-gray-500">Không có danh sách nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {archivedLists.map(list => (
                          <div key={list.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{list.title}</span>
                            {currentUserRole !== "MEMBER" && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleRestoreList(list.id)}
                                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded"
                                >
                                  <RefreshCw size={14} /> Khôi phục
                                </button>
                                <button 
                                  onClick={() => handleDeleteList(list.id)}
                                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                                >
                                  Xóa vĩnh viễn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Thẻ đã lưu trữ ({archivedCards.length})</h3>
                    {archivedCards.length === 0 ? (
                      <p className="text-sm text-gray-500">Không có thẻ nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {archivedCards.map(card => (
                          <div key={card.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">{card.title}</div>
                              {/* Notice: we had to include 'list' when querying archivedCards to display this */}
                              <div className="text-xs text-gray-500">Nằm trong danh sách: {(card as CardType & { list?: { title: string } }).list?.title}</div>
                            </div>
                            {currentUserRole !== "MEMBER" && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleRestoreCard(card.id)}
                                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded"
                                >
                                  <RefreshCw size={14} /> Khôi phục
                                </button>
                                <button 
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                                >
                                  Xóa vĩnh viễn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "share" && (
                <div>
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex justify-between items-center">
                    <span>Chia sẻ link bảng cho mọi người. Nhớ kiểm tra quyền Bảng.</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Đã copy link!");
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap ml-4"
                    >
                      Copy Link
                    </button>
                  </div>
                  
                  <form onSubmit={handleInvite} className="mb-6 flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Nhập email để mời vào Workspace..." 
                      className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isInviting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isInviting ? "Đang gửi..." : "Mời"}
                    </button>
                  </form>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Thành viên Workspace ({members.length})</h3>
                  <div className="space-y-3">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} alt={member.user.fullName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                              {member.user.fullName[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">{member.user.fullName}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </div>

                        {/* Role Management for OWNER/ADMIN */}
                        {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                          <div className="flex items-center gap-2">
                            {member.role !== "OWNER" && (
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                              </select>
                            )}
                            
                            {member.role !== "OWNER" && (
                              <button 
                                onClick={() => handleKickMember(member.id)}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded text-sm"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
