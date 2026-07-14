import { useState, useEffect } from "react";
import { X, AlignLeft, MessageSquare, Trash2 } from "lucide-react";
import { apiCall } from "../services/api";

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
};

type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  cover: string | null;
  list: { title: string };
  comments: Comment[];
  assignees: { user: User }[];
};

type CardDetailModalProps = {
  cardId: string;
  onClose: () => void;
  onUpdate: () => void; // Triggered to refresh the board when modal closes or card updates
};

export default function CardDetailModal({ cardId, onClose, onUpdate }: CardDetailModalProps) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");

  const [commentInput, setCommentInput] = useState("");

  const fetchCardDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall(`/cards/${cardId}`);
      if (res.success) {
        setCard(res.data.card);
        setTitleInput(res.data.card.title);
        setDescInput(res.data.card.description || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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



  // Determine current user ID from local storage token or decode (For showing delete button on own comments)
  // Since we don't have user context easily here without a provider, we might just show delete for all and let API reject if not owner.
  // We can fetch current user info from an API or just show it. Let's just show it.

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"
      onClick={onClose}
    >
      <div 
        className="relative bg-gray-50 dark:bg-gray-900 w-full max-w-2xl min-h-[400px] rounded-xl shadow-2xl my-8 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out flex flex-col"
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
            {card.cover && (
              <div 
                className="w-full h-32 sm:h-48 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${card.cover})` }}
              />
            )}

            <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                <AlignLeft size={24} />
              </div>
              <div className="flex-1">
                {!isEditingTitle ? (
                  <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 -ml-2 rounded-lg transition-colors"
                  >
                    {card.title}
                  </h2>
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

          {/* Comments */}
          <div>
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
                            className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm"
                            title="Xóa bình luận"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
