import { useState, useEffect, useRef } from "react";
import { X, AlignLeft, MessageSquare, Trash2, Users, Plus, Check, Calendar, Paperclip, CheckSquare, Image as ImageIcon, Smile, CheckCircle } from "lucide-react";
import { apiCall } from "../services/api";
import type { Checklist, Attachment, CommentReaction } from "../services/api";
import { useAuth } from "../context/AuthContext";

type User = {
  id: string;
  fullName: string;
  avatar: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  reactions: CommentReaction[];
};

type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  cover: string | null;
  startDate: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  archived: boolean;
  list: { 
    title: string;
    board: { workspaceId: string };
  };
  comments: Comment[];
  assignees: { user: User }[];
  checklists: Checklist[];
  attachments: Attachment[];
};

type CardDetailModalProps = {
  cardId: string;
  onClose: () => void;
  onUpdate: () => void; // Triggered to refresh the board when modal closes or card updates
  currentUserRole?: string;
};

const EMOJIS = ["👍", "❤️", "😂", "😲", "😢", "🙏"];

export default function CardDetailModal({ cardId, onClose, onUpdate, currentUserRole }: CardDetailModalProps) {
  const { user: currentUser } = useAuth();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");

  const [commentInput, setCommentInput] = useState("");
  
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  const fetchCardDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall(`/cards/${cardId}`);
      if (res.success) {
        setCard(res.data.card);
        setTitleInput(res.data.card.title);
        setDescInput(res.data.card.description || "");
        
        // Fetch workspace members for assignees
        const wsRes = await apiCall(`/workspaces/${res.data.card.list.board.workspaceId}`);
        if (wsRes.success) {
          setWorkspaceMembers(wsRes.data.workspace.members.map((m: { user: User }) => m.user));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target as Node)) {
        setIsAssignDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setTimeout(fetchCardDetails, 0);
    // eslint-disable-next-line
  }, [cardId]);

  const handleUpdateTitle = async () => {
    if (!titleInput.trim() || titleInput === card?.title) {
      setIsEditingTitle(false);
      setTitleInput(card?.title || "");
      return;
    }
    
    try {
      await apiCall(`/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleInput })
      });
      setCard((prev) => prev ? { ...prev, title: titleInput } : null);
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleUpdateDescription = async () => {
    try {
      await apiCall(`/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ description: descInput })
      });
      setCard((prev) => prev ? { ...prev, description: descInput } : null);
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditingDesc(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      await apiCall(`/cards/${cardId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentInput })
      });
      setCommentInput("");
      fetchCardDetails(); // Refetch to get the new comment with user details
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await apiCall(`/comments/${commentId}`, { method: "DELETE" });
      setCard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId)
        };
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddAssignee = async (userId: string) => {
    try {
      await apiCall(`/cards/${cardId}/assignees`, {
        method: "POST",
        body: JSON.stringify({ userId })
      });
      fetchCardDetails();
      setIsAssignDropdownOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    try {
      await apiCall(`/cards/${cardId}/assignees/${userId}`, {
        method: "DELETE"
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateCover = async (url: string | null) => {
    try {
      await apiCall(`/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ cover: url })
      });
      fetchCardDetails();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateDates = async (startDate: string | null, dueDate: string | null) => {
    try {
      await apiCall(`/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ startDate, dueDate })
      });
      fetchCardDetails();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };


  const handleCreateChecklist = async (title: string) => {
    try {
      await apiCall(`/cards/${cardId}/checklists`, {
        method: "POST",
        body: JSON.stringify({ title })
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa Checklist này?")) return;
    try {
      await apiCall(`/checklists/${id}`, { method: "DELETE" });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateChecklistItem = async (checklistId: string, content: string) => {
    try {
      await apiCall(`/checklists/${checklistId}/items`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    try {
      await apiCall(`/checklists/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted })
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await apiCall(`/checklists/items/${itemId}`, { method: "DELETE" });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateAttachment = async (url: string, name: string) => {
    try {
      await apiCall(`/cards/${cardId}/attachments`, {
        method: "POST",
        body: JSON.stringify({ url, name, type: "link" })
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đính kèm này?")) return;
    try {
      await apiCall(`/attachments/${id}`, { method: "DELETE" });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      await apiCall(`/comments/${commentId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji })
      });
      fetchCardDetails();
    } catch (error) {
      console.error(error);
    }
  };

  // Determine current user ID from local storage token or decode (For showing delete button on own comments)
  // Since we don't have user context easily here without a provider, we might just show delete for all and let API reject if not owner.
  // We can fetch current user info from an API or just show it. Let's just show it.

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"
      onClick={onClose}
    >
      <div 
        className="relative bg-gray-50 dark:bg-gray-900 w-full max-w-5xl min-h-[400px] rounded-xl shadow-2xl my-8 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {isLoading || !card ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
          <div className="relative group">
            {card.cover ? (
              <div 
                className="w-full h-32 sm:h-48 bg-cover bg-center shrink-0 relative"
                style={{ backgroundImage: `url(${card.cover})` }}
              >
                <button 
                  onClick={() => handleUpdateCover(null)}
                  className="absolute top-4 right-14 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all text-sm font-medium flex items-center gap-2"
                >
                  <X size={16} /> Gỡ ảnh bìa
                </button>
              </div>
            ) : (
              <div className="w-full h-12 bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    const url = prompt("Nhập URL ảnh bìa:");
                    if (url) handleUpdateCover(url);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <ImageIcon size={16} /> Thêm ảnh bìa
                </button>
              </div>
            )}
          </div>

            <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
              <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <AlignLeft size={24} />
              </div>
              <div className="flex-1">
                {!isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    {card.isCompleted && (
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded-full" title="Đã hoàn thành">
                        <CheckCircle size={20} />
                      </div>
                    )}
                    <h2 
                      onClick={() => setIsEditingTitle(true)}
                      className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 -ml-2 rounded-lg transition-colors flex-1"
                    >
                      {card.title}
                    </h2>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
                    autoFocus
                    className="w-full text-2xl font-bold px-2 py-1 -ml-2 border-2 border-blue-500 rounded-lg outline-none bg-white dark:bg-gray-800 dark:text-white"
                  />
                )}
                <p className="text-sm text-gray-500 mt-2 px-2 -ml-2">
                  Trong danh sách <span className="font-semibold underline underline-offset-2">{card.list.title}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Assignees & Dates Row */}
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            {/* Assignees */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="mt-1 text-gray-500 dark:text-gray-400">
                  <Users size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Thành viên</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {card.assignees.map((assignee) => (
                      <div 
                        key={assignee.user.id} 
                        className={`relative group w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm ${
                          (currentUserRole !== "MEMBER" || currentUser?.id === assignee.user.id) ? "cursor-pointer" : ""
                        }`}
                        title={assignee.user.fullName}
                        onClick={() => {
                          if (currentUserRole !== "MEMBER" || currentUser?.id === assignee.user.id) {
                            handleRemoveAssignee(assignee.user.id);
                          }
                        }}
                      >
                        {assignee.user.avatar ? (
                          <img src={assignee.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          assignee.user.fullName.charAt(0).toUpperCase()
                        )}
                        {(currentUserRole !== "MEMBER" || currentUser?.id === assignee.user.id) && (
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <X size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="relative" ref={assignDropdownRef}>
                      <button 
                        onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
                        title={currentUserRole === "MEMBER" ? "Thêm bản thân" : "Thêm thành viên"}
                      >
                        <Plus size={16} />
                      </button>
                      
                      {isAssignDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-10 py-1 max-h-48 overflow-y-auto">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành viên workspace</div>
                          {workspaceMembers.map(member => {
                            // MEMBER can only see themselves in the add list to add themselves
                            if (currentUserRole === "MEMBER" && member.id !== currentUser?.id) {
                              return null;
                            }
                            
                            const isAssigned = card.assignees.some(a => a.user.id === member.id);
                            return (
                              <button
                                key={member.id}
                                onClick={() => isAssigned ? handleRemoveAssignee(member.id) : handleAddAssignee(member.id)}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {member.avatar ? (
                                    <img src={member.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    member.fullName.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{member.fullName}</span>
                                {isAssigned && <Check size={14} className="text-blue-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="mt-1 text-gray-500 dark:text-gray-400">
                  <Calendar size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Ngày tháng</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Ngày bắt đầu</label>
                      <input 
                        type="date" 
                        value={card.startDate ? new Date(card.startDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => handleUpdateDates(e.target.value || null, card.dueDate)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Ngày kết thúc</label>
                      <input 
                        type="date" 
                        value={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => handleUpdateDates(card.startDate, e.target.value || null)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <AlignLeft size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mô tả</h3>
                  {!isEditingDesc && card.description && (
                    <button 
                      onClick={() => setIsEditingDesc(true)}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {!isEditingDesc ? (
                  <div 
                    onClick={() => setIsEditingDesc(true)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      card.description 
                        ? "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200" 
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {card.description ? (
                      <p className="whitespace-pre-wrap">{card.description}</p>
                    ) : (
                      <p>Thêm mô tả chi tiết hơn...</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="Thêm mô tả chi tiết hơn..."
                      className="w-full p-3 border-2 border-blue-500 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[120px] resize-y"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateDescription}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Lưu
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingDesc(false);
                          setDescInput(card.description || "");
                        }}
                        className="px-4 py-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklists */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <CheckSquare size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Checklist</h3>
                  <button 
                    onClick={() => {
                      const title = prompt("Tên Checklist:");
                      if (title) handleCreateChecklist(title);
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Thêm Checklist
                  </button>
                </div>
                
                <div className="space-y-6 mt-4">
                  {card.checklists?.map((checklist) => {
                    const total = checklist.items?.length || 0;
                    const completed = checklist.items?.filter(i => i.isCompleted).length || 0;
                    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
                    
                    return (
                      <div key={checklist.id}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{checklist.title}</h4>
                          <button 
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500 w-8">{percent}%</span>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {checklist.items?.map(item => (
                            <div key={item.id} className="flex items-start gap-2 group">
                              <input 
                                type="checkbox" 
                                checked={item.isCompleted}
                                onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                                className="mt-1 w-4 h-4 cursor-pointer"
                              />
                              <span className={`flex-1 text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                {item.content}
                              </span>
                              <button 
                                onClick={() => handleDeleteChecklistItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => {
                              const content = prompt("Thêm công việc nhỏ:");
                              if (content) handleCreateChecklistItem(checklist.id, content);
                            }}
                            className="text-sm text-gray-500 hover:text-blue-500 mt-2 flex items-center gap-1"
                          >
                            <Plus size={14} /> Thêm mục
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <Paperclip size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Đính kèm</h3>
                  <button 
                    onClick={() => {
                      const url = prompt("Nhập đường dẫn (URL):");
                      if (!url) return;
                      const name = prompt("Tên đính kèm:") || "Đính kèm";
                      handleCreateAttachment(url, name);
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Thêm đính kèm
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {card.attachments?.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center rounded-lg text-gray-500 shrink-0">
                        <Paperclip size={18} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:underline truncate block">
                          {attachment.name}
                        </a>
                        <span className="text-xs text-gray-500">
                          {new Date(attachment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-2 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

              </div>

              {/* Sidebar: Comments */}
              <div className="w-full md:w-[360px] shrink-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-8 md:pt-0 md:pl-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <MessageSquare size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bình luận</h3>
                
                {/* Add Comment */}
                <form onSubmit={handlePostComment} className="mb-6">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[80px] resize-y shadow-sm transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment(e);
                      }
                    }}
                  />
                  <div className="mt-2 flex justify-end">
                    <button 
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                      Gửi bình luận
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-4">
                  {card.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                        {comment.user.avatar ? (
                          <img src={comment.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          comment.user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {comment.user.fullName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString("vi-VN", {
                              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm relative group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                          {comment.content}
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm z-10"
                            title="Xóa bình luận"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Reactions and Actions */}
                        <div className="flex items-center gap-2 mt-1 px-1">
                          {/* Reaction Dropdown */}
                          <div className="relative">
                            <button 
                              onClick={() => setActiveReactionCommentId(activeReactionCommentId === comment.id ? null : comment.id)}
                              className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1 py-1"
                            >
                              <Smile size={14} /> Cảm xúc
                            </button>
                            
                            {activeReactionCommentId === comment.id && (
                              <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg p-1.5 flex gap-1 z-20">
                                {EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      handleToggleReaction(comment.id, emoji);
                                      setActiveReactionCommentId(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-lg transition-transform hover:scale-110"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reaction Badges */}
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(
                              comment.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                              <button 
                                key={emoji}
                                onClick={() => handleToggleReaction(comment.id, emoji)}
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded text-xs transition-colors"
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">{count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
