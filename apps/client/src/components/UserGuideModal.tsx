import { X, BookOpen, CheckCircle, Search, Layout, Users } from "lucide-react";
import { useEffect, useState } from "react";

type UserGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "board" | "card" | "team">("overview");

  // Đóng modal khi bấm phím Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-3xl sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-linear-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sổ tay Hướng dẫn</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Khám phá cách làm việc hiệu quả với Manwok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex sm:flex-col p-4 gap-2 overflow-x-auto sm:overflow-y-auto whitespace-nowrap scrollbar-hide">
            <NavButton 
              active={activeTab === "overview"} 
              onClick={() => setActiveTab("overview")} 
              icon={<Search size={18} />} 
              label="1. Tổng quan cơ bản" 
            />
            <NavButton 
              active={activeTab === "board"} 
              onClick={() => setActiveTab("board")} 
              icon={<Layout size={18} />} 
              label="2. Tạo Bảng & Danh sách" 
            />
            <NavButton 
              active={activeTab === "card"} 
              onClick={() => setActiveTab("card")} 
              icon={<CheckCircle size={18} />} 
              label="3. Quản lý Công việc" 
            />
            <NavButton 
              active={activeTab === "team"} 
              onClick={() => setActiveTab("team")} 
              icon={<Users size={18} />} 
              label="4. Làm việc nhóm" 
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cấu trúc của Manwok</h3>
                <p>Manwok được tổ chức theo mô hình phân cấp, giúp bạn quản lý từ vĩ mô đến vi mô dễ dàng:</p>
                <ul className="space-y-3 mt-4">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <strong>Không gian làm việc (Workspace):</strong> Là ngôi nhà chung của một đội nhóm hoặc một dự án lớn. Chứa nhiều Bảng công việc bên trong.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <strong>Bảng (Board):</strong> Một dự án cụ thể hoặc một quy trình công việc (Ví dụ: Thiết kế Website, Quản lý Content...).
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <strong>Danh sách (List):</strong> Các cột trong một Bảng, thường đại diện cho một trạng thái của công việc (Ví dụ: Cần làm, Đang làm, Đã xong).
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">4</span>
                    <div>
                      <strong>Thẻ (Card):</strong> Từng đầu việc chi tiết nhỏ nhất.
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "board" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tạo Bảng mới nhanh chóng</h3>
                <p>Bảng là nơi bạn tổ chức trực quan các đầu việc.</p>
                
                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mt-6">Cách tạo bảng:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Ở thanh điều hướng bên trái (hoặc nút giữa màn hình Trang chủ), bấm vào biểu tượng dấu <strong>(+) Tạo Bảng mới</strong>.</li>
                  <li>Nhập tên Bảng (Ví dụ: Kế hoạch Marketing tháng 8).</li>
                  <li>Nếu bạn không muốn tự nghĩ ra các cột, hãy chọn một <strong>Mẫu Bảng (Template)</strong> có sẵn ở mục lựa chọn.</li>
                  <li>Bấm nút <strong>Tạo mới</strong>.</li>
                </ol>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                  <strong className="flex items-center gap-2 mb-1">
                    <Layout size={16} /> Mẹo nhỏ:
                  </strong>
                  Bạn có thể đổi màu nền hoặc ảnh nền cho Bảng bằng cách bấm vào biểu tượng bảng màu hoặc hình ảnh ở góc trên cùng của Bảng nhé.
                </div>
              </div>
            )}

            {activeTab === "card" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quản lý Thẻ Công Việc</h3>
                <p>Các thẻ (Card) có thể được kéo thả linh hoạt giữa các danh sách để cập nhật tiến độ.</p>
                
                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mt-4">Các thao tác với Thẻ:</h4>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong>Tạo thẻ:</strong> Bấm nút <em>+ Thêm thẻ</em> ở dưới cùng của một danh sách, gõ tên và nhấn Enter.</li>
                  <li><strong>Kéo thả:</strong> Nhấn giữ chuột trái vào một thẻ và kéo sang cột khác để đổi trạng thái của công việc.</li>
                  <li><strong>Mở chi tiết thẻ:</strong> Bấm trực tiếp vào thẻ. Một hộp thoại sẽ hiện ra cho phép bạn:
                    <ul className="list-[circle] pl-5 mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Thêm mô tả chi tiết cho công việc.</li>
                      <li>Đặt hạn chót (Deadline).</li>
                      <li>Phân công việc cho một hoặc nhiều thành viên khác.</li>
                      <li>Bình luận và trao đổi trực tiếp trên thẻ.</li>
                      <li>Thêm tệp đính kèm (Hình ảnh, tài liệu...).</li>
                    </ul>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mời đồng nghiệp làm việc chung</h3>
                <p>Manwok phát huy tối đa sức mạnh khi làm việc nhóm.</p>
                
                <div className="space-y-4 mt-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <Users size={18} className="text-blue-500" />
                      Mời vào Không gian làm việc
                    </h4>
                    <p className="text-sm">Vào Không gian làm việc của bạn (Biểu tượng ngôi nhà ở Sidebar) {'->'} Chọn mục <strong>Thành viên</strong> {'->'} Bấm <strong>Mời thành viên</strong> và nhập Email của đồng nghiệp. Họ sẽ có quyền truy cập vào tất cả các Bảng công khai trong Không gian đó.</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <Layout size={18} className="text-purple-500" />
                      Mời trực tiếp vào Bảng
                    </h4>
                    <p className="text-sm">Bấm vào Bảng {'->'} Tìm nút <strong>Thành viên / Yêu cầu tham gia</strong> ở góc trên bên phải. Tính năng này phù hợp khi Bảng của bạn là Bảng Riêng tư (Private) nhưng bạn vẫn muốn thêm một vài thành viên nhất định.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component cho các nút điều hướng bên trái
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 sm:w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm font-medium ${
        active 
          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
      }`}
    >
      <span className={active ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}>
        {icon}
      </span>
      {label}
    </button>
  );
}
