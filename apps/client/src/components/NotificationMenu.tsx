import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import { apiCall, type AppNotification } from "../services/api";

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await apiCall("/notifications");
        if (res.success) {
          setNotifications(res.data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const refreshNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiCall("/notifications");
      if (res.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await apiCall(`/notifications/${id}/read`, { method: "PATCH" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await apiCall(`/notifications/read-all`, { method: "PATCH" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRespond = async (notificationId: string, type: string, relatedId: string, accept: boolean) => {
    try {
      if (type === "WORKSPACE_INVITE") {
        // Find workspaceId from somewhere? Actually the endpoint is /workspaces/:id/invites/:inviteId/respond
        // Wait, relatedId is the inviteId, we don't have workspaceId in the notification.
        // Wait! The endpoint is /workspaces/:id/invites/:inviteId/respond. 
        // We can just add a global route /invites/:inviteId/respond OR we can just pass any ID for workspaceId since we look up by inviteId anyway.
        // Let's modify the route on backend later, but for now we can just assume we use the first part of relatedId?
        // Actually, relatedId is just inviteId. The backend controller `respondToInvite` doesn't even use `req.params.id` (workspaceId), it only uses `inviteId`.
        // Let's call a new global route or just dummy workspaceId.
        await apiCall(`/workspaces/dummy/invites/${relatedId}/respond`, { method: "POST", body: JSON.stringify({ accept }) });
      } else if (type === "BOARD_JOIN_REQUEST") {
        await apiCall(`/boards/dummy/join-requests/${relatedId}/respond`, { method: "POST", body: JSON.stringify({ accept }) });
      }
      
      handleMarkAsRead(notificationId);
      // Remove or mark as handled
      refreshNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) refreshNotifications(); // Refresh on open
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Check size={14} /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {isLoading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                  <Bell size={24} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Bạn không có thông báo nào.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${n.read ? 'opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                >
                  <div className={`mt-1 shrink-0 cursor-pointer ${n.read ? 'text-gray-400' : 'text-blue-500'}`} onClick={() => !n.read && handleMarkAsRead(n.id)}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm cursor-pointer ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}`} onClick={() => !n.read && handleMarkAsRead(n.id)}>
                      {n.message}
                    </p>
                    
                    {(!n.read && n.relatedId && (n.type === "WORKSPACE_INVITE" || n.type === "BOARD_JOIN_REQUEST")) && (
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRespond(n.id, n.type, n.relatedId!, true); }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md font-medium transition-colors"
                        >
                          Chấp nhận
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRespond(n.id, n.type, n.relatedId!, false); }}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-md font-medium transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1 cursor-pointer" onClick={() => !n.read && handleMarkAsRead(n.id)}>
                      {new Date(n.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)] cursor-pointer" onClick={() => handleMarkAsRead(n.id)}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
