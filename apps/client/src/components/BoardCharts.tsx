import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ListType } from "../pages/BoardPage";

type BoardChartsProps = {
  lists: ListType[];
};

export default function BoardCharts({ lists }: BoardChartsProps) {
  // Extract all cards
  const allCards = lists.flatMap((list) => list.cards);

  // 1. Due Date Stats
  let completed = 0;
  let expiringSoon = 0; // <= 2 days
  let expiringLater = 0; // > 2 days
  let overdue = 0;
  let noDueDate = 0;

  const now = new Date();
  
  allCards.forEach((card) => {
    if (card.isCompleted) {
      completed++;
    } else if (!card.dueDate) {
      noDueDate++;
    } else {
      const dueDate = new Date(card.dueDate);
      if (dueDate < now) {
        overdue++;
      } else {
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) {
          expiringSoon++;
        } else {
          expiringLater++;
        }
      }
    }
  });

  const dueDateData = [
    { name: "Hoàn tất", value: completed },
    { name: "Sắp hết hạn", value: expiringSoon },
    { name: "Hết hạn sau", value: expiringLater },
    { name: "Quá hạn", value: overdue },
    { name: "Không có ngày hết hạn", value: noDueDate },
  ];

  // 2. Member Stats
  const memberCounts: Record<string, number> = {};
  let unassigned = 0;

  allCards.forEach((card) => {
    if (!card.assignees || card.assignees.length === 0) {
      unassigned++;
    } else {
      card.assignees.forEach((assignee) => {
        const name = assignee.user.fullName;
        memberCounts[name] = (memberCounts[name] || 0) + 1;
      });
    }
  });

  const memberData = Object.entries(memberCounts).map(([name, count]) => ({
    name: name.length > 15 ? name.substring(0, 15) + "..." : name,
    value: count,
  }));
  memberData.push({ name: "Không được giao", value: unassigned });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Số thẻ mỗi ngày hết hạn</h3>
            <button className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <span className="text-xl leading-none">...</span>
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dueDateData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Số thẻ mỗi thành viên</h3>
            <button className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <span className="text-xl leading-none">...</span>
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#27272a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
