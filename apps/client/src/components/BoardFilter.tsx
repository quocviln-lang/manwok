import { useState, useEffect, useRef } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { apiCall } from "../services/api";

export type FilterState = {
  noMembers: boolean;
  assignedToMe: boolean;
  selectedMembers: string[];
  
  completed: boolean;
  notCompleted: boolean;
  
  noDueDate: boolean;
  overdue: boolean;
  dueTomorrow: boolean;
  dueNextWeek: boolean;
};

type BoardFilterProps = {
  workspaceId: string;
  currentUserId: string;
  filter: FilterState;
  setFilter: (f: FilterState | ((prev: FilterState) => FilterState)) => void;
  onClearFilters: () => void;
};

export default function BoardFilter({ workspaceId, currentUserId, filter, setFilter, onClearFilters }: BoardFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<{ id: string; user: { id: string; fullName: string; avatar: string | null } }[]>([]);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && members.length === 0) {
      apiCall(`/workspaces/${workspaceId}/members`).then(res => {
        if (res.success) {
          setMembers(res.data.members);
        }
      });
    }
  }, [isOpen, workspaceId, members.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = 
    filter.noMembers || 
    filter.assignedToMe || 
    filter.selectedMembers.length > 0 || 
    filter.completed || 
    filter.notCompleted || 
    filter.noDueDate || 
    filter.overdue || 
    filter.dueTomorrow || 
    filter.dueNextWeek;

  const toggleFilter = (key: keyof FilterState, value?: string) => {
    setFilter(prev => {
      if (key === 'selectedMembers') {
        const current = prev.selectedMembers;
        if (current.includes(value)) {
          return { ...prev, selectedMembers: current.filter(id => id !== value) };
        } else {
          return { ...prev, selectedMembers: [...current, value] };
        }
      }
      return { ...prev, [key]: !prev[key as keyof FilterState] };
    });
  };

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          hasActiveFilters ? "bg-blue-500/20 text-blue-100 hover:bg-blue-500/30" : "bg-black/20 text-white hover:bg-white/20"
        }`}
      >
        <Filter size={16} />
        <span className="hidden sm:inline">Lọc</span>
        {hasActiveFilters && (
          <span className="flex items-center justify-center w-5 h-5 ml-1 text-xs bg-blue-600 text-white rounded-full">
            {Object.values(filter).filter(v => v === true || (Array.isArray(v) && v.length > 0)).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 text-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center flex-1">Lọc thẻ</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-md">
              <X size={16} />
            </button>
          </div>
          
          <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Thành viên */}
            <div className="mb-4">
              <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Thành viên</h4>
              
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.noMembers} onChange={() => toggleFilter("noMembers")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-200">Không có thành viên</span>
                </div>
              </label>
              
              {currentUserId && (
                <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                  <input type="checkbox" checked={filter.assignedToMe} onChange={() => toggleFilter("assignedToMe")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Các thẻ đã chỉ định cho tôi</span>
                  </div>
                </label>
              )}

              <div className="mt-1">
                <button 
                  onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200"
                >
                  <span className="ml-7">Chọn thành viên</span>
                  <ChevronDown size={14} className={`transform transition-transform ${isMemberDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isMemberDropdownOpen && (
                  <div className="mt-1 ml-7 pl-2 border-l border-gray-200 dark:border-gray-600 space-y-1">
                    {members.filter(m => m.user.id !== currentUserId).map(member => (
                      <label key={member.user.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filter.selectedMembers.includes(member.user.id)} 
                          onChange={() => toggleFilter("selectedMembers", member.user.id)} 
                          className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-3.5 h-3.5" 
                        />
                        <div className="flex items-center gap-2">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                              {member.user.fullName[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-700 dark:text-gray-200 text-xs">{member.user.fullName}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trạng thái thẻ */}
            <div className="mb-4">
              <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Trạng thái thẻ</h4>
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.completed} onChange={() => toggleFilter("completed")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <span className="text-gray-700 dark:text-gray-200">Đã đánh dấu hoàn thành</span>
              </label>
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.notCompleted} onChange={() => toggleFilter("notCompleted")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <span className="text-gray-700 dark:text-gray-200">Không được đánh dấu là đã hoàn thành</span>
              </label>
            </div>

            {/* Ngày hết hạn */}
            <div>
              <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngày hết hạn</h4>
              
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.noDueDate} onChange={() => toggleFilter("noDueDate")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  Không có ngày hết hạn
                </div>
              </label>
              
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.overdue} onChange={() => toggleFilter("overdue")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-red-100 text-red-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Quá hạn
                </div>
              </label>

              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.dueTomorrow} onChange={() => toggleFilter("dueTomorrow")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-yellow-100 text-yellow-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Sẽ hết hạn vào ngày mai
                </div>
              </label>

              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <input type="checkbox" checked={filter.dueNextWeek} onChange={() => toggleFilter("dueNextWeek")} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-4 h-4" />
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Sẽ hết hạn vào tuần sau
                </div>
              </label>
            </div>
            
          </div>
          
          {hasActiveFilters && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button 
                onClick={onClearFilters}
                className="w-full py-1.5 text-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Xóa các bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
