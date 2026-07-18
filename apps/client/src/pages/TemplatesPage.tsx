import { useState } from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import CreateBoardModal from "../components/CreateBoardModal";
import { useNavigate } from "react-router-dom";

export default function TemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const navigate = useNavigate();

  const templates = [
    {
      id: "kanban-basic",
      title: "Kanban cơ bản",
      description: "Gồm 3 danh sách: Cần làm, Đang làm, Đã xong. Phù hợp cho quản lý công việc và dự án đơn giản.",
      color: "#0079BF"
    },
    {
      id: "agile",
      title: "Quản lý dự án Agile",
      description: "Các danh sách quy trình chuẩn: Backlog, Sprint, Đang làm, Chờ review, Hoàn thành.",
      color: "#D29034"
    },
    {
      id: "crm",
      title: "CRM Cơ bản",
      description: "Theo dõi quy trình bán hàng: Khách hàng mới, Đang liên hệ, Thương lượng, Đã chốt.",
      color: "#519839"
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <LayoutTemplate className="text-blue-500" size={32} />
          Bảng mẫu
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bắt đầu nhanh chóng với các mẫu bảng được thiết kế sẵn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-32 flex items-center justify-center" style={{ backgroundColor: tpl.color }}>
              <div className="w-24 h-16 border-2 border-white/40 rounded flex gap-1 p-1.5">
                <div className="w-1/3 h-full bg-white/30 rounded-sm"></div>
                {tpl.id === "kanban-basic" && (
                  <>
                    <div className="w-1/3 h-2/3 bg-white/30 rounded-sm"></div>
                    <div className="w-1/3 h-1/2 bg-white/30 rounded-sm"></div>
                  </>
                )}
                {tpl.id === "agile" && (
                  <>
                    <div className="w-1/4 h-3/4 bg-white/30 rounded-sm"></div>
                    <div className="w-1/4 h-1/2 bg-white/30 rounded-sm"></div>
                    <div className="w-1/4 h-2/3 bg-white/30 rounded-sm"></div>
                  </>
                )}
                {tpl.id === "crm" && (
                  <>
                    <div className="w-1/3 h-1/2 bg-white/30 rounded-sm"></div>
                    <div className="w-1/3 h-4/5 bg-white/30 rounded-sm"></div>
                  </>
                )}
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{tpl.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 h-10">{tpl.description}</p>
              <button
                onClick={() => {
                  setSelectedTemplate(tpl.id);
                  setIsModalOpen(true);
                }}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Sử dụng mẫu này
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <CreateBoardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialTemplate={selectedTemplate}
          onSuccess={() => {
            navigate("/dashboard");
          }}
        />
      )}
    </div>
  );
}
