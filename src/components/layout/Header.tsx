import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types/pump';
import { storage } from '../../services/storage';
import {
  Bell,
  Search,
  Menu,
  Shield,
  UserCheck,
  Wrench,
  AlertTriangle,
  Clock,
  ExternalLink,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  onToggleSidebar: () => void;
  activeMenu: string;
  onNavigate: (menuKey: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onToggleSidebar,
  activeMenu,
  onNavigate,
  onLogout
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const users = storage.getUsers();
  const repairs = storage.getRepairs();
  const maintenance = storage.getMaintenancePlans();

  // Compute urgent alerts
  const overdueRepairs = repairs.filter(
    r => r.status === 'in_repair' && new Date(r.expectedReturnDate) < new Date()
  );
  const overdueMaintenance = maintenance.filter(m => m.status === 'overdue');
  const alertCount = overdueRepairs.length + overdueMaintenance.length;

  const handleSelectRole = (user: UserProfile) => {
    storage.setCurrentUser(user);
    setShowRoleMenu(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile Toggle + Title + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
            BNC
          </div>
          <div>
            <h1 className="text-sm lg:text-base font-bold text-slate-900 leading-tight">
              QUẢN LÝ BƠM KỸ THUẬT HẠ TẦNG – BNC
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hệ thống quản lý tài sản kỹ thuật & bảo trì Bà Nà Hills
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions: Quick Alert Drawer + User Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Reference link to Báo cáo KTHT */}
        <a
          href="https://bao-cao-ktht-sable.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Xem hệ thống Báo cáo KTHT tham chiếu"
        >
          <span>Cổng Báo cáo KTHT</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Cảnh báo thiết bị & tiến độ"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-600">
                  Cảnh báo hệ thống ({alertCount})
                </span>
                <span className="text-[11px] text-slate-400">Thời gian thực</span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {overdueRepairs.length === 0 && overdueMaintenance.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Không có cảnh báo trễ hạn nào.
                  </div>
                ) : (
                  <>
                    {overdueRepairs.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setShowNotifMenu(false);
                          onNavigate('repairs');
                        }}
                        className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs cursor-pointer hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Quá hạn sửa chữa: {r.assetCode}
                          </span>
                          <span className="text-[11px] font-mono text-amber-700">Hẹn: {r.expectedReturnDate}</span>
                        </div>
                        <p className="text-slate-600 mt-1 line-clamp-1">{r.repairVendor} - {r.failureReason}</p>
                      </div>
                    ))}
                    {overdueMaintenance.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setShowNotifMenu(false);
                          onNavigate('maintenance');
                        }}
                        className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-red-900">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-red-600" />
                            Bảo trì quá hạn: {m.taskCode}
                          </span>
                          <span className="text-[11px] font-mono text-red-700">{m.scheduledDate}</span>
                        </div>
                        <p className="text-slate-600 mt-1 line-clamp-1">{m.title} ({m.assetCode})</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[11px]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-slate-800 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-2.5 h-2.5 text-blue-600 inline" />
                ) : currentUser.role === 'manager' ? (
                  <UserCheck className="w-2.5 h-2.5 text-emerald-600 inline" />
                ) : (
                  <Wrench className="w-2.5 h-2.5 text-amber-600 inline" />
                )}
                <span>{currentUser.roleTitle}</span>
              </div>
            </div>
          </button>

          {/* Role selector dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Đổi người dùng để kiểm tra phân quyền (RLS)
                </p>
              </div>
              <div className="mt-1 space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectRole(u)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      u.id === currentUser.id
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.roleTitle}</div>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                        Đang dùng
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {onLogout && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Đăng xuất hệ thống</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direct Logout Icon button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
