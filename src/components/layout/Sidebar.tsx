import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  MapPin,
  Warehouse,
  Wrench,
  CalendarCheck,
  History,
  Trash2,
  BarChart3,
  Users,
  Settings,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (key: string) => void;
  isOpen: boolean;
  onClose: () => void;
  repairsCount: number;
  maintenanceOverdueCount: number;
  disposalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpen,
  onClose,
  repairsCount,
  maintenanceOverdueCount,
  disposalCount
}) => {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard tổng quan', icon: LayoutDashboard },
    { key: 'assets', label: 'Danh mục thiết bị bơm', icon: Cpu },
    { key: 'stations', label: 'Quản lý vị trí và trạm', icon: MapPin },
    { key: 'warehouse', label: 'Thiết bị dự phòng & kho', icon: Warehouse },
    {
      key: 'repairs',
      label: 'Theo dõi sửa chữa',
      icon: Wrench,
      badge: repairsCount > 0 ? repairsCount : undefined,
      badgeColor: 'bg-amber-500'
    },
    {
      key: 'maintenance',
      label: 'Quản lý bảo trì định kỳ',
      icon: CalendarCheck,
      badge: maintenanceOverdueCount > 0 ? maintenanceOverdueCount : undefined,
      badgeColor: 'bg-red-500'
    },
    { key: 'history', label: 'Lịch sử vận hành & thay thế', icon: History },
    {
      key: 'disposal',
      label: 'Hư hỏng & Chờ thanh lý',
      icon: Trash2,
      badge: disposalCount > 0 ? disposalCount : undefined,
      badgeColor: 'bg-slate-500'
    },
    { key: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
    { key: 'excel-import', label: 'Nhập & Đối chiếu Excel', icon: FileSpreadsheet },
    { key: 'users', label: 'Người dùng & Phân quyền', icon: Users },
    { key: 'settings', label: 'Cài đặt hệ thống', icon: Settings }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center tracking-wider shadow-md">
              KTHT
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider uppercase">
                Bà Nà Hills
              </div>
              <div className="text-[11px] text-slate-400">Bộ phận Kỹ thuật Hạ tầng</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Hệ thống quản lý
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectMenu(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 shrink-0">
          <div className="font-medium text-slate-300">Dữ liệu nguồn Excel 2026</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            15 Trạm · Phiên bản v1.2.0
          </div>
        </div>
      </aside>
    </>
  );
};
