import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          {/* Local user video */}
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        {/* Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/50 to-black/90"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 w-full py-6 px-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manwok</h1>
        </div>

        <div>
          {user ? (
            <button
              onClick={() => navigate(user.systemRole === "SYSTEM_ADMIN" ? "/admin" : "/dashboard")}
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base font-medium backdrop-blur-md border border-white/20 transition-all"
            >
              Vào không gian làm việc
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white text-sm sm:text-base font-medium transition-colors">Đăng nhập</Link>
              <Link to="/register" className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-medium shadow-lg shadow-blue-500/30 transition-all">
                Đăng ký <span className="hidden sm:inline">miễn phí</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-0 md:mt-[-80px]">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap size={16} className="text-blue-400" />
          <span className="text-sm font-semibold tracking-wide uppercase">Công cụ quản lý công việc tinh gọn</span>
        </div>

        <h2 className="text-5xl md:text-7xl font-extrabold text-white max-w-5xl tracking-tight leading-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
          Tổ chức công việc. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
            Đơn giản & Trực quan.
          </span>
        </h2>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 leading-relaxed">
          Tạo bảng Kanban, thêm danh sách và kéo thả thẻ công việc. Mọi thứ bạn cần để theo dõi tiến độ từ ý tưởng đến thực thi, không thừa thãi.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <button
            onClick={() => navigate(user ? (user.systemRole === "SYSTEM_ADMIN" ? "/admin" : "/dashboard") : "/register")}
            className="group px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-3"
          >
            {user ? "Vào Dashboard" : "Tạo Không gian làm việc"}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 text-gray-400 animate-in fade-in duration-1000 delay-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="font-medium">Bảng Kanban</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="font-medium">Kéo thả linh hoạt</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="font-medium">Mọi thứ theo thời gian thực</span>
          </div>
        </div>
      </main>

      {/* Decorative gradient blur at the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
