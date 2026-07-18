import { useState } from "react";
import { Link } from "react-router-dom";
import { apiCall } from "../services/api";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const res = await apiCall("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        setIsSuccess(true);
        setMessage(res.message || "Yêu cầu khôi phục mật khẩu đã được gửi!");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      else setError("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Quên Mật Khẩu</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isSuccess 
            ? "Kiểm tra email của bạn để nhận hướng dẫn."
            : "Nhập email của bạn và chúng tôi sẽ gửi liên kết khôi phục mật khẩu."}
        </p>
      </div>

      {isSuccess ? (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={40} />
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl text-center font-medium w-full">
            {message}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Nếu bạn không thấy email trong Hộp thư đến, vui lòng kiểm tra thư mục Spam hoặc Quảng cáo.
          </p>
          <Link
            to="/login"
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center mt-2"
          >
            Quay Lại Đăng Nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all focus:bg-white dark:focus:bg-gray-700 shadow-xs"
              placeholder="Địa chỉ Email"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 transition-all flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? "Đang xử lý..." : "Gửi Liên Kết"}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} className="mr-1" />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
