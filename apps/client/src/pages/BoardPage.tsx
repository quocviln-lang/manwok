import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { ChevronLeft, MoreHorizontal, Plus, ImagePlus, BarChart2, KanbanSquare } from "lucide-react";
import { apiCall } from "../services/api";
import ListColumn from "../components/ListColumn";
import CardDetailModal from "../components/CardDetailModal";
import BoardSettingsModal from "../components/BoardSettingsModal";
import BoardCharts from "../components/BoardCharts";
import BoardFilter, { type FilterState } from "../components/BoardFilter";
import { socket } from "../services/socket";

export type CardType = {
  id: string;
  title: string;
  description: string | null;
  cover: string | null;
  startDate: string | null;
  dueDate: string | null;
  position: number;
  isCompleted: boolean;
  archived: boolean;
  _count?: {
    checklists: number;
    attachments: number;
    comments: number;
  };
  assignees?: {
    user: {
      id: string;
      fullName: string;
      avatar: string | null;
    }
  }[];
};

export type ListType = {
  id: string;
  title: string;
  position: number;
  color: string | null;
  archived: boolean;
  cards: CardType[];
};

type BoardType = {
  id: string;
  title: string;
  color: string;
  cover: string | null;
  workspaceId: string;
  visibility: "PRIVATE" | "WORKSPACE" | "PUBLIC";
  lists: ListType[];
};

const defaultFilterState: FilterState = {
  noMembers: false,
  assignedToMe: false,
  selectedMembers: [],
  completed: false,
  notCompleted: false,
  noDueDate: false,
  overdue: false,
  dueTomorrow: false,
  dueNextWeek: false,
};

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isMember, setIsMember] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("MEMBER");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [workspaceSettings, setWorkspaceSettings] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState<FilterState>(defaultFilterState);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "chart">("board");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBoard = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiCall(`/boards/${id}`);
      if (res.success) {
        setBoard(res.data.board);
        setIsMember(res.data.isMember !== false);
        setCurrentUserRole(res.data.currentUserRole || "MEMBER");
        setCurrentUserId(res.data.currentUserId || "");
        setWorkspaceSettings(res.data.workspaceSettings || null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchBoard();

    if (id) {
      socket.connect();
      socket.emit("joinBoard", id);

      const handleBoardUpdated = () => {
        fetchBoard();
      };

      socket.on("board:updated", handleBoardUpdated);

      return () => {
        socket.emit("leaveBoard", id);
        socket.off("board:updated", handleBoardUpdated);
      };
    }
  }, [fetchBoard, id]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!board) return;

    // Reordering lists
    if (type === "list") {
      const newLists = Array.from(board.lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);

      // Optimistic update
      setBoard({ ...board, lists: newLists });

      // Calculate new position
      const prev = newLists[destination.index - 1];
      const next = newLists[destination.index + 1];
      let newPosition: number;

      if (!prev) newPosition = (next?.position || 65535) / 2;
      else if (!next) newPosition = prev.position + 65535;
      else newPosition = (prev.position + next.position) / 2;

      // Update in DB
      removed.position = newPosition;
      await apiCall(`/lists/${removed.id}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ position: newPosition })
      });
      return;
    }

    // Reordering cards
    if (type === "card") {
      const sourceListIndex = board.lists.findIndex(l => l.id === source.droppableId);
      const destListIndex = board.lists.findIndex(l => l.id === destination.droppableId);
      
      const sourceList = board.lists[sourceListIndex];
      const destList = board.lists[destListIndex];
      
      const newSourceCards = Array.from(sourceList.cards);
      const newDestCards = source.droppableId === destination.droppableId 
        ? newSourceCards 
        : Array.from(destList.cards);

      const [removed] = newSourceCards.splice(source.index, 1);
      newDestCards.splice(destination.index, 0, removed);

      // Optimistic update
      const newLists = Array.from(board.lists);
      newLists[sourceListIndex] = { ...sourceList, cards: newSourceCards };
      if (source.droppableId !== destination.droppableId) {
        newLists[destListIndex] = { ...destList, cards: newDestCards };
      }

      setBoard({ ...board, lists: newLists });

      // Calculate new position
      const prev = newDestCards[destination.index - 1];
      const next = newDestCards[destination.index + 1];
      let newPosition: number;

      if (!prev) newPosition = (next?.position || 65535) / 2;
      else if (!next) newPosition = prev.position + 65535;
      else newPosition = (prev.position + next.position) / 2;

      removed.position = newPosition;
      
      // Update in DB
      await apiCall(`/cards/${removed.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({ 
          position: newPosition,
          listId: destination.droppableId !== source.droppableId ? destination.droppableId : undefined
        })
      });
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !board) return;
    
    try {
      const res = await apiCall(`/boards/${board.id}/lists`, {
        method: "POST",
        body: JSON.stringify({ title: newListTitle })
      });
      if (res.success) {
        setNewListTitle("");
        setIsAddingList(false);
        // Refresh board to get the new list with its cards array initialized
        fetchBoard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center text-gray-500">Đang tải bảng...</div>;
  }

  if (!board) {
    return <div className="h-screen w-full flex items-center justify-center text-red-500">Không tìm thấy Bảng</div>;
  }

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !board) return;

    setIsUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const uploadRes = await apiCall("/upload", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.success && uploadRes.data.url) {
        const updateRes = await apiCall(`/boards/${board.id}`, {
          method: "PATCH",
          body: JSON.stringify({ cover: uploadRes.data.url }),
        });
        
        if (updateRes.success) {
          fetchBoard();
        }
      }
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      alert("Không thể tải ảnh nền lên. Vui lòng thử lại!");
    } finally {
      setIsUploadingBg(false);
    }
  };

  const getFilteredBoard = () => {
    if (!board) return null;
    
    const hasActiveFilters = 
      filter.noMembers || filter.assignedToMe || filter.selectedMembers.length > 0 || 
      filter.completed || filter.notCompleted || 
      filter.noDueDate || filter.overdue || filter.dueTomorrow || filter.dueNextWeek;

    if (!hasActiveFilters) return board;

    const filteredLists = board.lists.map(list => {
      const filteredCards = list.cards.filter(card => {
        // Members filter
        const memberFiltersActive = filter.noMembers || filter.assignedToMe || filter.selectedMembers.length > 0;
        let memberMatch = !memberFiltersActive;
        if (memberFiltersActive) {
          const assignees = card.assignees || [];
          if (filter.noMembers && assignees.length === 0) memberMatch = true;
          if (filter.assignedToMe && assignees.some(a => a.user.id === currentUserId)) memberMatch = true;
          if (filter.selectedMembers.some(id => assignees.some(a => a.user.id === id))) memberMatch = true;
        }

        // Status filter
        const statusFiltersActive = filter.completed || filter.notCompleted;
        let statusMatch = !statusFiltersActive;
        if (statusFiltersActive) {
          if (filter.completed && card.isCompleted) statusMatch = true;
          if (filter.notCompleted && !card.isCompleted) statusMatch = true;
        }

        // Due date filter
        const dateFiltersActive = filter.noDueDate || filter.overdue || filter.dueTomorrow || filter.dueNextWeek;
        let dateMatch = !dateFiltersActive;
        if (dateFiltersActive) {
          if (filter.noDueDate && !card.dueDate) dateMatch = true;
          if (card.dueDate) {
            const dueDate = new Date(card.dueDate);
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfTomorrow = new Date(startOfToday);
            startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
            const endOfTomorrow = new Date(startOfTomorrow);
            endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
            const nextWeek = new Date(startOfToday);
            nextWeek.setDate(nextWeek.getDate() + 7);

            if (filter.overdue && dueDate < startOfToday) dateMatch = true;
            if (filter.dueTomorrow && dueDate >= startOfTomorrow && dueDate < endOfTomorrow) dateMatch = true;
            if (filter.dueNextWeek && dueDate >= endOfTomorrow && dueDate < nextWeek) dateMatch = true;
          }
        }

        return memberMatch && statusMatch && dateMatch;
      });
      return { ...list, cards: filteredCards };
    });

    return { ...board, lists: filteredLists };
  };

  const filteredBoard = getFilteredBoard();
  const hasActiveFilters = board !== filteredBoard;

  return (
    <div 
      className="h-screen flex flex-col relative transition-colors duration-300"
      style={{
        backgroundColor: board.color || "#3B82F6",
        backgroundImage: board.cover ? `url(${board.cover})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Board Header Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-40 h-14 px-4 flex items-center justify-between bg-black/30 backdrop-blur-sm text-white shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            to={`/w/${board.workspaceId}`} 
            className="flex items-center gap-1 p-1.5 px-3 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Rời khỏi bảng</span>
          </Link>
          
          <input 
            type="text"
            className="font-bold text-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-2 py-1 text-white placeholder-white/70 w-auto"
            defaultValue={board.title}
            onBlur={async (e) => {
              if (e.target.value !== board.title && e.target.value.trim() && isMember) {
                await apiCall(`/boards/${board.id}`, { method: "PATCH", body: JSON.stringify({ title: e.target.value }) });
                fetchBoard();
              } else {
                e.target.value = board.title;
              }
            }}
            disabled={!isMember}
          />

          {!isMember && (
            <button 
              onClick={async () => {
                try {
                  const res = await apiCall(`/boards/${board.id}/join-requests`, { method: "POST" });
                  if (res.success) alert("Đã gửi yêu cầu tham gia!");
                } catch (e: unknown) {
                  alert((e as Error).message || "Lỗi gửi yêu cầu");
                }
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              Yêu cầu tham gia
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleUploadBackground}
          />
          <button 
            onClick={() => !isUploadingBg && fileInputRef.current?.click()}
            disabled={isUploadingBg}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            title="Đổi ảnh nền"
          >
            {isUploadingBg ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImagePlus size={18} />
            )}
            <span className="hidden sm:inline">Đổi nền</span>
          </button>
          
          <div className="ml-2">
            <BoardFilter 
              workspaceId={board.workspaceId} 
              currentUserId={currentUserId}
              filter={filter} 
              setFilter={setFilter}
              onClearFilters={() => setFilter(defaultFilterState)}
            />
          </div>

          <div className="flex bg-black/20 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "board" ? "bg-white/30 text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <KanbanSquare size={16} />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "chart" ? "bg-white/30 text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <BarChart2 size={16} />
              <span className="hidden sm:inline">Biểu đồ</span>
            </button>
          </div>

          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1"
            title="Cài đặt bảng"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Canvas or Charts */}
      {viewMode === "board" ? (
        <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex items-start p-4 gap-4">
            <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" type="list" direction="horizontal">
              {(provided) => (
                <div 
                  className="flex items-start gap-4 h-full"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {filteredBoard?.lists.map((list, index) => (
                    <ListColumn 
                      key={list.id} 
                      list={list} 
                      index={index} 
                      onRefresh={fetchBoard}
                      onCardClick={(cardId) => setSelectedCardId(cardId)}
                      currentUserRole={currentUserRole}
                      isDragDisabled={hasActiveFilters}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add List Button */}
          {currentUserRole !== "MEMBER" && (
            <div className="shrink-0 w-72">
              {!isAddingList ? (
                <button 
                  onClick={() => setIsAddingList(true)}
                  className="w-full flex items-center gap-2 p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-md font-medium shadow-sm"
                >
                  <Plus size={20} /> Thêm danh sách khác
                </button>
              ) : (
              <form 
                onSubmit={handleAddList}
                className="w-full p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200"
              >
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Nhập tiêu đề danh sách..."
                  className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg outline-none bg-transparent dark:text-white"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Thêm
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle("");
                    }}
                    className="px-4 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="relative z-10 flex-1 bg-gray-50/95 dark:bg-gray-900/95 overflow-hidden flex flex-col">
          <BoardCharts lists={filteredBoard?.lists || []} />
        </div>
      )}
      
      {selectedCardId && (
        <CardDetailModal 
          cardId={selectedCardId}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedCardId(null)}
          onUpdate={fetchBoard}
        />
      )}

      {isSettingsModalOpen && board && (
        <BoardSettingsModal
          boardId={board.id}
          workspaceId={board.workspaceId}
          currentUserRole={currentUserRole}
          boardVisibility={board.visibility}
          workspaceSettings={workspaceSettings}
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdate={fetchBoard}
        />
      )}
    </div>
  );
}
