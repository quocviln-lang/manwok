import { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus } from "lucide-react";
import type { ListType } from "../pages/BoardPage";
import { apiCall } from "../services/api";
import CardItem from "./CardItem";

type ListColumnProps = {
  list: ListType;
  index: number;
  onRefresh: () => void;
  onCardClick: (cardId: string) => void;
};

export default function ListColumn({ list, index, onRefresh, onCardClick }: ListColumnProps) {
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

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`shrink-0 w-72 max-h-full flex flex-col bg-gray-100 dark:bg-gray-900 rounded-xl shadow-sm transition-shadow ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500/50" : ""
            }`}
        >
          {/* List Header */}
          <div
            {...provided.dragHandleProps}
            className="p-3 flex items-center justify-between group cursor-grab active:cursor-grabbing"
          >
            <h3 className="font-bold text-gray-800 dark:text-gray-100 px-2 truncate">
              {list.title}
            </h3>
            <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Cards Droppable Area */}
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
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
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* List Footer (Add Card) */}
          <div className="p-2 pt-0 mt-2">
            {!isAddingCard ? (
              <button
                onClick={() => setIsAddingCard(true)}
                className="w-full flex items-center gap-2 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
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
        </div>
      )}
    </Draggable>
  );
}
