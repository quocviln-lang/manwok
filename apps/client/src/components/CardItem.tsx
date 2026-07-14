import { Draggable } from "@hello-pangea/dnd";
import { AlignLeft, MessageSquare } from "lucide-react";
import type { CardType } from "../pages/BoardPage";

type CardItemProps = {
  card: CardType;
  index: number;
  onClick: () => void;
};

export default function CardItem({ card, index, onClick }: CardItemProps) {
  // In a real app we'd fetch actual counts, but we mock them based on description/comments presence for now
  const hasDescription = !!card.description;
  const hasComments = false; // We can add this to the model later

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

          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {card.title}
          </p>

          {/* Card Badges */}
          {(hasDescription || hasComments) && (
            <div className="flex items-center gap-3 mt-3 text-gray-500 dark:text-gray-400">
              {hasDescription && (
                <div className="flex items-center">
                  <AlignLeft size={14} />
                </div>
              )}
              {hasComments && (
                <div className="flex items-center gap-1 text-xs">
                  <MessageSquare size={14} />
                  <span>2</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
