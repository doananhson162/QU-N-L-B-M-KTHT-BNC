import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types/pump';
import { storage } from '../../services/storage';
import {
  Users,
  Shield,
  UserCheck,
  Wrench,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface UserManagerViewProps {
  currentUser: UserProfile;
}

export const UserManagerView: React.FC<UserManagerViewProps> = ({ currentUser }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(storage.getUsers());
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'technician' as UserRole,
    roleTitle: 'Kỹ thuật viên Vận hành & Sửa chữa',
    phone: ''
  });

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setUsersList(storage.getUsers());
    });
    return () => unsub();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    let roleTitle = 'Kỹ thuật viên Vận hành & Sửa chữa';
    if (role === 'admin') roleTitle = 'Quản trị viên Hệ thống (Admin)';
    else if (role === 'manager') roleTitle = 'Quản lý Bộ phận Kỹ thuật';

    setNewUser(prev => ({
      ...prev,
      role,
      roleTitle
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.email.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ họ tên, tên đăng nhập và email!' });
      return;
    }

    const res = storage.addUser({
      name: newUser.name.trim(),
      username: newUser.username.trim(),
      email: newUser.email.trim(),
      password: newUser.password || '123456',
      role: newUser.role,
      roleTitle: newUser.roleTitle,
      phone: newUser.phone.trim() || 'Chưa cập nhật'
    });

    if (res.success) {
      setFeedback({ type: 'success', message: `Đã thêm thành công nhân sự ${newUser.name}!` });
      setShowAddModal(false);
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'technician',
        roleTitle: 'Kỹ thuật viên Vận hành & Sửa chữa',
        phone: ''
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Thêm nhân sự thất bại.' });
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    const res = storage.deleteUser(userToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', message: `Đã xóa nhân sự "${userToDelete.name}" thành công!` });
      setUserToDelete(null);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Không thể xóa nhân sự.' });
    }
  };

  const roleMatrices = [
    {
      feature: 'Xem danh mục bơm & trạng thái vận hành',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Thêm mới & chỉnh sửa thông số kỹ thuật bơm',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Lập phiếu gửi sửa chữa xưởng ngoài',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Kiểm tra & Nghiệm thu sau sửa chữa',
      admin: true,
      manager: true,
      technician: false
    },
    {
      feature: 'Lập kế hoạch bảo trì định kỳ',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Báo cáo hoàn tất công việc bảo trì',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Lập phiếu điều chuyển kho & xuất dự phòng',
      admin: true,
      manager: true,
      technician: true
    },
    {
      feature: 'Phê duyệt hồ sơ thanh lý thiết bị',
      admin: true,
      manager: true,
      technician: false
    },
    {
      feature: 'Xóa nhân sự & phân quyền tài khoản',
      admin: true,
      manager: false,
      technician: false
    },
    {
      feature: 'Nhập & Đối chiếu dữ liệu file Excel',
      admin: true,
      manager: true,
      technician: false
    },
    {
      feature: 'Cài đặt hệ thống & Khôi phục sao lưu',
      admin: true,
      manager: false,
      technician: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alert feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Quản lý người dùng & Phân quyền nhân sự (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách nhân sự Bộ phận KTHT · Admin có quyền thêm và xóa nhân sự khỏi hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân sự mới</span>
            </button>
          )}

          <div className="text-xs px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Đang đăng nhập: {currentUser.roleTitle}</span>
          </div>
        </div>
      </div>

      {/* Users List Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>Danh sách nhân sự hiện tại ({usersList.length})</span>
          </h3>
          {isAdmin && (
            <span className="text-[11px] text-slate-500 italic">
              * Quản trị viên (Admin) có quyền xóa tài khoản của các nhân sự khác
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {usersList.map((u) => {
            const isMe = u.id === currentUser.id;
            const canDelete = isAdmin && !isMe;

            return (
              <div
                key={u.id}
                className={`p-4 rounded-xl border bg-white shadow-xs transition-all relative flex flex-col justify-between ${
                  isMe ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isMe ? (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Tài khoản của bạn
                        </span>
                      ) : canDelete ? (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={`Xóa nhân sự ${u.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                    <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>

                    <div className="mt-2 text-[11px] font-semibold flex items-center gap-1.5 text-slate-700">
                      {u.role === 'admin' ? (
                        <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : u.role === 'manager' ? (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{u.roleTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono text-slate-600 font-medium">{u.phone || 'Chưa cập nhật'}</span>
                  </span>

                  {canDelete && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="text-red-600 hover:text-red-700 font-semibold text-[11px] hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Ma trận phân quyền chi tiết (Row Level Security & Quyền hạn)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy định rõ trách nhiệm không tự cấp quyền Admin hoặc tự phê duyệt nghiệm thu vượt thẩm quyền
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Chức năng & Nghiệp vụ kỹ thuật</th>
                <th className="py-3 px-4 text-center w-36">
                  Admin (Quản trị)
                </th>
                <th className="py-3 px-4 text-center w-36">
                  Quản lý (Trưởng BP)
                </th>
                <th className="py-3 px-4 text-center w-40">
                  Nhân viên Kỹ thuật
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {roleMatrices.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {m.feature}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {m.admin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {m.manager ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {m.technician ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Xác nhận xóa tài khoản nhân sự?
            </h3>
            <p className="text-slate-500 text-center mb-4">
              Hành động này sẽ xóa quyền truy cập của nhân sự khỏi hệ thống quản lý BNC.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Họ và tên:</span>
                <span className="font-bold text-slate-900">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-mono text-slate-800">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Vai trò:</span>
                <span className="font-semibold text-blue-700">{userToDelete.roleTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Số điện thoại:</span>
                <span className="font-mono text-slate-700">{userToDelete.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm shadow-red-600/20 transition-colors cursor-pointer"
              >
                Xác nhận xóa nhân sự
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Thêm nhân sự kỹ thuật mới</h3>
                <p className="text-slate-500 mt-0.5">Cấp tài khoản truy cập hệ thống quản lý bơm BNC</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Ví dụ: annv"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mật khẩu truy cập
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mặc định: 123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email công tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ví dụ: annv.ktht@banahills.sunworld.vn"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân quyền vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="technician">Kỹ thuật viên Vận hành</option>
                    <option value="manager">Quản lý (Trưởng BP)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="Ví dụ: 0905.123.456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  Thêm nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
