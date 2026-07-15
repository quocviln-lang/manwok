import { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { AlignLeft, MessageSquare, Paperclip, CheckSquare, Clock, CheckCircle, MoreHorizontal, Copy, Archive } from "lucide-react";
import { apiCall } from "../services/api";
import type { CardType } from "../pages/BoardPage";

type CardItemProps = {
  card: CardType;
  index: number;
  onClick: () => void;
  onRefresh: () => void;
  currentUserRole?: string;
};

export default function CardItem({ card, index, onClick, onRefresh, currentUserRole }: CardItemProps) {
  // In a real app we'd fetch actual counts, but we mock them based on description/comments presence for now
  const hasDescription = !!card.description;
  const countComments = card._count?.comments || 0;
  const countAttachments = card._count?.attachments || 0;
  const countChecklists = card._count?.checklists || 0;
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(false);
    try {
      await apiCall(`/cards/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted: !card.isCompleted })
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleCopyCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(false);
    try {
      await apiCall(`/cards/${card.id}/copy`, { method: "POST" });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleArchiveCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(false);
    if (!confirm("Lưu trữ thẻ này?")) return;
    try {
      await apiCall(`/cards/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true })
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? "shadow-xl rotate-2 ring-2 ring-blue-500 z-50" : ""
            }`}
          onClick={onClick}
        >
          {/* Cover Image if exists */}
          {card.cover && (
            <div
              className="h-24 -mx-3 -mt-3 mb-3 rounded-t-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${card.cover})` }}
            />
          )}

          {/* Title and Settings row */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">
              {card.title}
            </p>
            
            {/* Settings button & dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                className={`p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-all ${isSettingsOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <MoreHorizontal size={16} />
              </button>
              
              {isSettingsOpen && (
                <div 
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 z-50 py-1 overflow-hidden"
                  onClick={e => e.stopPropagation()} // Prevent card click
                >
                  <button
                    onClick={handleToggleComplete}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <CheckCircle size={14} className={card.isCompleted ? "text-green-500" : "text-gray-400"} />
                    <span className={card.isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}>
                      {card.isCompleted ? "Đánh dấu chưa làm" : "Đánh dấu hoàn thành"}
                    </span>
                  </button>
                  {currentUserRole !== "MEMBER" && (
                    <button
                      onClick={handleCopyCard}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <Copy size={14} className="text-gray-400" />
                      Sao chép thẻ
                    </button>
                  )}
                  {currentUserRole !== "MEMBER" && (
                    <button
                      onClick={handleArchiveCard}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-800 mt-1 pt-2"
                    >
                      <Archive size={14} />
                      Lưu trữ thẻ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card Badges */}
          {/* Card Badges */}
          {(hasDescription || countComments > 0 || countAttachments > 0 || countChecklists > 0 || card.dueDate || card.isCompleted) && (
            <div className="flex flex-wrap items-center gap-3 mt-3 text-gray-500 dark:text-gray-400">
              {card.isCompleted && (
                <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" title="Đã hoàn thành">
                  <CheckCircle size={12} />
                  <span>Hoàn thành</span>
                </div>
              )}
              {card.dueDate && !card.isCompleted && (
                <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <Clock size={12} />
                  <span>{new Date(card.dueDate).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {hasDescription && (
                <div className="flex items-center" title="Có mô tả">
                  <AlignLeft size={14} />
                </div>
              )}
              {countChecklists > 0 && (
                <div className="flex items-center gap-1 text-xs" title="Checklist">
                  <CheckSquare size={14} />
                  <span>{countChecklists}</span>
                </div>
              )}
              {countAttachments > 0 && (
                <div className="flex items-center gap-1 text-xs" title="Đính kèm">
                  <Paperclip size={14} />
                  <span>{countAttachments}</span>
                </div>
              )}
              {countComments > 0 && (
                <div className="flex items-center gap-1 text-xs" title="Bình luận">
                  <MessageSquare size={14} />
                  <span>{countComments}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
