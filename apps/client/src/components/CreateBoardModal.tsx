import { useState, useEffect } from "react";
import Modal from "./Modal";
import { apiCall } from "../services/api";

type CreateBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  initialTemplate?: string;
  onSuccess: () => void;
};

// Preset colors like Trello
const PRESET_COLORS = [
  "#0079BF", "#D29034", "#519839", "#B04632", 
  "#89609E", "#CD5A91", "#4BBF6B", "#00AECC", "#838C91"
];

export default function CreateBoardModal({ isOpen, onClose, workspaceId, initialTemplate, onSuccess }: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [template, setTemplate] = useState("blank");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || "");
  const [workspaces, setWorkspaces] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFetchingWorkspaces, setIsFetchingWorkspaces] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (initialTemplate) setTemplate(initialTemplate);
        else setTemplate("blank");
      }, 0);
      
      if (!workspaceId) {
        setIsFetchingWorkspaces(true);
        apiCall("/workspaces").then(res => {
          if (res.success && res.data.workspaces) {
            setWorkspaces(res.data.workspaces);
            if (res.data.workspaces.length > 0) {
              setSelectedWorkspaceId(res.data.workspaces[0].id);
            }
          }
        }).finally(() => setIsFetchingWorkspaces(false));
      } else {
        setSelectedWorkspaceId(workspaceId);
      }
    }
  }, [isOpen, workspaceId, initialTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await apiCall(`/workspaces/${selectedWorkspaceId}/boards`, {
        method: "POST",
        body: JSON.stringify({ 
          title, 
          color: selectedColor,
          template: template === "blank" ? undefined : template
        }),
      });
      
      if (res.success) {
        setTitle("");
        setSelectedColor(PRESET_COLORS[0]);
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Tạo Bảng thất bại");
      else setError("Tạo Bảng thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Bảng Mới">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        
        {/* Color preview header */}
        <div 
          className="w-full h-24 rounded-lg shadow-inner transition-colors duration-300 flex items-center justify-center"
          style={{ backgroundColor: selectedColor }}
        >
           {/* Mock Board Icon */}
           <div className="w-16 h-10 border-2 border-white/40 rounded flex gap-1 p-1">
             <div className="w-1/3 h-full bg-white/30 rounded-sm"></div>
             <div className="w-1/3 h-2/3 bg-white/30 rounded-sm"></div>
             <div className="w-1/3 h-1/2 bg-white/30 rounded-sm"></div>
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tiêu đề bảng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ví dụ: Dự án phát triển Website..."
          />
        </div>

        {!workspaceId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Không gian làm việc <span className="text-red-500">*</span>
            </label>
            {isFetchingWorkspaces ? (
              <div className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
                Đang tải...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="w-full px-4 py-2.5 rounded-lg border border-red-300 bg-red-50 text-red-600 text-sm">
                Bạn cần tạo Không gian làm việc trước khi tạo Bảng.
              </div>
            ) : (
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="tour-modal-templates">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mẫu bảng
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="blank">Bảng trống (Không dùng mẫu)</option>
            <option value="kanban-basic">Kanban cơ bản (Cần làm, Đang làm, Đã xong)</option>
            <option value="agile">Dự án Agile (Backlog, Sprint, Review...)</option>
            <option value="crm">CRM (Khách hàng mới, Đang liên hệ...)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Màu sắc nền
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-8 rounded hover:opacity-90 transition-all ${selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800 scale-110' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim() || (!workspaceId && workspaces.length === 0)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang tạo..." : "Tạo Mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
