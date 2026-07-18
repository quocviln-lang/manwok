import { useState, useRef, useEffect } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus, Copy, Archive, Palette } from "lucide-react";
import type { ListType } from "../pages/BoardPage";
import { apiCall } from "../services/api";
import CardItem from "./CardItem";

const LIST_COLORS = [
  { name: "Mặc định", value: null, bgClass: "bg-gray-100 dark:bg-gray-900" },
  { name: "Đỏ", value: "red", bgClass: "bg-red-50 dark:bg-red-900/20" },
  { name: "Cam", value: "orange", bgClass: "bg-orange-50 dark:bg-orange-900/20" },
  { name: "Vàng", value: "yellow", bgClass: "bg-yellow-50 dark:bg-yellow-900/20" },
  { name: "Xanh lá", value: "green", bgClass: "bg-green-50 dark:bg-green-900/20" },
  { name: "Xanh dương", value: "blue", bgClass: "bg-blue-50 dark:bg-blue-900/20" },
  { name: "Tím", value: "purple", bgClass: "bg-purple-50 dark:bg-purple-900/20" },
];

type ListColumnProps = {
  list: ListType;
  index: number;
  onRefresh: () => void;
  onCardClick: (cardId: string) => void;
  currentUserRole?: string;
  isDragDisabled?: boolean;
};

export default function ListColumn({ list, index, onRefresh, onCardClick, currentUserRole, isDragDisabled = false }: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      const res = await apiCall(`/lists/${list.id}/cards`, {
        method: "POST",
        body: JSON.stringify({ title: newCardTitle })
      });
      if (res.success) {
        setNewCardTitle("");
        setIsAddingCard(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleCopyList = async () => {
    setIsSettingsOpen(false);
    try {
      await apiCall(`/lists/${list.id}/copy`, { method: "POST" });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleArchiveList = async () => {
    setIsSettingsOpen(false);
    if (!confirm("Bạn có chắc muốn lưu trữ danh sách này?")) return;
    try {
      await apiCall(`/lists/${list.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true })
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleChangeColor = async (color: string | null) => {
    try {
      await apiCall(`/lists/${list.id}`, {
        method: "PATCH",
        body: JSON.stringify({ color })
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const currentBgClass = LIST_COLORS.find(c => c.value === list.color)?.bgClass || LIST_COLORS[0].bgClass;

  return (
    <Draggable draggableId={list.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`h-full max-h-full flex flex-col rounded-xl shadow-sm transition-all ${currentBgClass} ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500/50 scale-[1.02] z-50" : ""
            }`}
        >
          {/* List Header */}
          <div
            {...provided.dragHandleProps}
            className="p-3 flex items-center justify-between group cursor-grab active:cursor-grabbing"
          >
            <input
              className="font-bold text-gray-800 dark:text-gray-100 px-2 truncate bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded py-1 w-full mr-2"
              defaultValue={list.title}
              onBlur={async (e) => {
                if (e.target.value !== list.title && e.target.value.trim()) {
                  await apiCall(`/lists/${list.id}`, { method: "PATCH", body: JSON.stringify({ title: e.target.value }) });
                  onRefresh();
                } else {
                  e.target.value = list.title;
                }
              }}
            />
            
            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-opacity ${isSettingsOpen ? 'opacity-100 bg-gray-200 dark:bg-gray-800' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <MoreHorizontal size={18} />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 z-50 py-2">
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                      <Palette size={14} />
                      MÀU SẮC
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LIST_COLORS.map(c => (
                        <button
                          key={c.name}
                          title={c.name}
                          onClick={() => handleChangeColor(c.value)}
                          className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 transition-transform hover:scale-110 ${c.bgClass} ${list.color === c.value ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                  
                    {/* Role Management for OWNER/ADMIN */}
                    {currentUserRole !== "MEMBER" && (
                      <button
                        onClick={handleCopyList}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Copy size={16} className="text-gray-400" />
                        Sao chép danh sách
                      </button>
                    )}
                    {currentUserRole !== "MEMBER" && (
                      <button
                        onClick={handleArchiveList}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Archive size={16} />
                        Lưu trữ danh sách
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          {/* Cards Droppable Area */}
          <Droppable droppableId={list.id} type="card" isDropDisabled={isDragDisabled}>
            {(provided: any, snapshot: any) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-[10px] space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
              >
                {list.cards?.map((card, index) => (
                  <CardItem 
                    key={card.id} 
                    card={card} 
                    index={index} 
                    onClick={() => onCardClick(card.id)}
                    onRefresh={onRefresh}
                    currentUserRole={currentUserRole}
                    isDragDisabled={isDragDisabled}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* List Footer (Add Card) */}
          {currentUserRole !== "MEMBER" && (
            <div className="p-2 pt-0 mt-2">
              {!isAddingCard ? (
                <button
                  onClick={() => setIsAddingCard(true)}
                  className={`w-full flex items-center gap-2 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm ${index === 0 ? 'tour-add-card' : ''}`}
                >
                  <Plus size={18} /> Thêm thẻ
                </button>
              ) : (
                <form
                  onSubmit={handleAddCard}
                  className="w-full animate-in fade-in zoom-in-95 duration-200"
                >
                  <textarea
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thẻ..."
                    className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm resize-none min-h-[70px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddCard(e);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCard(false);
                        setNewCardTitle("");
                      }}
                      className="px-4 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
