import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiCall } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");

  // States for Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // States for Register
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.success) {
        login(res.data.token, res.data.user);
        navigate("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Đăng nhập thất bại");
      else setError("Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName: regFullName, email: regEmail, password: regPassword }),
      });
      if (res.success) {
        login(res.data.token, res.data.user);
        navigate("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Đăng ký thất bại");
      else setError("Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl h-[550px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl relative overflow-hidden flex transition-colors duration-300">
      
      {/* ================= REGISTER FORM (Appears on Right) ================= */}
      <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-12 transition-all duration-700 ease-in-out ${isLogin ? 'opacity-0 z-10 translate-x-0' : 'opacity-100 z-50 translate-x-full'}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Tạo Tài Khoản</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sử dụng email của bạn để đăng ký</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {error && !isLogin && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <input
            type="text"
            value={regFullName}
            onChange={(e) => setRegFullName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Họ và tên"
          />
          <input
            type="email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Email"
          />
          <input
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Mật khẩu"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center mt-4"
          >
            {isLoading ? "Đang xử lý..." : "ĐĂNG KÝ"}
          </button>
        </form>
      </div>


      {/* ================= LOGIN FORM (Appears on Left) ================= */}
      <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-12 transition-all duration-700 ease-in-out ${isLogin ? 'opacity-100 z-50 translate-x-0' : 'opacity-0 z-10 translate-x-full'}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Đăng Nhập</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sử dụng tài khoản Manwok của bạn</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {error && isLogin && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Email"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Mật khẩu"
          />

          <div className="text-right">
            <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center mt-4"
          >
            {isLoading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
          </button>
        </form>
      </div>


      {/* ================= OVERLAY (Sliding Image Panel) ================= */}
      <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-100 ${isLogin ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Background Image inside Overlay */}
        <div 
          className={`relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out bg-cover bg-center text-white ${isLogin ? 'translate-x-0' : 'translate-x-1/2'}`}
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')" }}
        >
          {/* Overlay Dark Tint */}
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px]" />

          {/* Left/Right Text Panels inside Background */}
          <div className="absolute inset-0 flex">
            
            {/* Left side text (Visible when Registering) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ${isLogin ? 'translate-x-[-20%]' : 'translate-x-0'}`}>
              <h2 className="text-4xl font-bold mb-4">Chào mừng trở lại!</h2>
              <p className="mb-8 text-blue-50">Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn.</p>
              <button 
                onClick={() => { setError(""); setIsLogin(true); }}
                className="border-2 border-white rounded-full px-12 py-3 hover:bg-white hover:text-blue-900 transition-all font-bold tracking-wider"
              >
                ĐĂNG NHẬP
              </button>
            </div>

            {/* Right side text (Visible when Logging in) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ${isLogin ? 'translate-x-0' : 'translate-x-[20%]'}`}>
              <h2 className="text-4xl font-bold mb-4">Bạn là người mới?</h2>
              <p className="mb-8 text-blue-50">Đăng ký ngay tài khoản để bắt đầu hành trình quản lý dự án tuyệt vời cùng Manwok.</p>
              <button 
                onClick={() => { setError(""); setIsLogin(false); }}
                className="border-2 border-white rounded-full px-12 py-3 hover:bg-white hover:text-blue-900 transition-all font-bold tracking-wider"
              >
                ĐĂNG KÝ
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
