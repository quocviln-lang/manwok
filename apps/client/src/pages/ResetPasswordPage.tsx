import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCall } from "../services/api";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!token) {
      setError("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiCall("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
      else setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center text-red-500 font-medium">
        Lỗi: Không tìm thấy Token xác thực trong đường link!
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Mật Khẩu Mới</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isSuccess 
            ? "Mật khẩu của bạn đã được thay đổi."
            : "Vui lòng nhập mật khẩu mới cho tài khoản của bạn."}
        </p>
      </div>

      {isSuccess ? (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={40} />
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl text-center font-medium w-full">
            Đổi mật khẩu thành công!
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center mt-2"
          >
            Đến Trang Đăng Nhập
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4 relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all focus:bg-white dark:focus:bg-gray-700 shadow-xs"
                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all focus:bg-white dark:focus:bg-gray-700 shadow-xs"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 transition-all flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0 mt-6"
          >
            {isLoading ? "Đang xử lý..." : "Lưu Mật Khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
