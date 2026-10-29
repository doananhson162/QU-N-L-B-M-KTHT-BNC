import React, { useState } from 'react';
import { MaintenancePlan, Asset, Station, MaintenanceStatus, MaintenanceFrequency, UserProfile } from '../../types/pump';
import { excelService } from '../../services/excelService';
import { storage } from '../../services/storage';
import {
  CalendarCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  FileSpreadsheet,
  Search,
  Filter,
  CheckSquare,
  Wrench,
  Edit,
  History,
  Trash2
} from 'lucide-react';

interface MaintenanceManagerViewProps {
  plans: MaintenancePlan[];
  assets: Asset[];
  stations: Station[];
  currentUser: UserProfile;
  onSavePlan: (plan: MaintenancePlan, isNew: boolean) => void;
}

export const MaintenanceManagerView: React.FC<MaintenanceManagerViewProps> = ({
  plans,
  assets,
  stations,
  currentUser,
  onSavePlan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // New plan state
  const [newPlan, setNewPlan] = useState<Partial<MaintenancePlan>>({
    taskCode: `BT-2026-${String(plans.length + 1).padStart(3, '0')}`,
    assetCode: assets[0]?.code || '',
    title: '',
    frequency: 'monthly',
    scheduledDate: new Date().toISOString().slice(0, 10),
    assignee: currentUser.name,
    collaborators: '',
    materialsUsed: '',
    status: 'pending',
    yearOriginal: 2026
  });

  // Complete plan report state
  const [executionReport, setExecutionReport] = useState({
    executedDate: new Date().toISOString().slice(0, 10),
    materialsUsed: '',
    inspectionResults: '',
    issuesFound: '',
    correctiveAction: ''
  });

  const filteredPlans = plans.filter(p => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        p.taskCode.toLowerCase().includes(q) ||
        p.assetCode.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.assignee.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (frequencyFilter !== 'all' && p.frequency !== frequencyFilter) return false;
    if (yearFilter !== 'all' && String(p.yearOriginal || 2026) !== yearFilter) return false;
    return true;
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.code === newPlan.assetCode);
    if (!targetAsset) {
      alert('Vui lòng chọn thiết bị');
      return;
    }
    const created: MaintenancePlan = {
      id: 'mt-' + Date.now(),
      taskCode: newPlan.taskCode || `BT-${Date.now()}`,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      stationId: targetAsset.stationId,
      title: newPlan.title || 'Bảo dưỡng định kỳ',
      frequency: (newPlan.frequency as MaintenanceFrequency) || 'monthly',
      scheduledDate: newPlan.scheduledDate || new Date().toISOString().slice(0, 10),
      assignee: newPlan.assignee || currentUser.name,
      collaborators: newPlan.collaborators,
      materialsUsed: newPlan.materialsUsed,
      status: (newPlan.status as MaintenanceStatus) || 'pending',
      yearOriginal: 2026,
      notes: newPlan.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSavePlan(created, true);
    setShowAddModal(false);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const updated: MaintenancePlan = {
      ...selectedPlan,
      status: 'completed',
      executedDate: executionReport.executedDate,
      materialsUsed: executionReport.materialsUsed || selectedPlan.materialsUsed,
      inspectionResults: executionReport.inspectionResults,
      issuesFound: executionReport.issuesFound,
      correctiveAction: executionReport.correctiveAction,
      updatedAt: new Date().toISOString()
    };
    onSavePlan(updated, false);
    setShowCompleteModal(false);
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Quản lý kế hoạch bảo trì định kỳ thiết bị bơm BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi bảo trì hàng tháng, quý, năm và lưu trữ kế hoạch gốc 2022 từ sheet “PL1- KH BT”
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => excelService.exportMaintenanceToExcel(filteredPlans, stations)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel lịch bảo trì</span>
          </button>

          {plans.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách kế hoạch bảo trì? Hành động này không thể hoàn tác.')) {
                  storage.clearAllMaintenancePlans();
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xóa toàn bộ dữ liệu kế hoạch bảo trì"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Xóa toàn bộ kế hoạch</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập kế hoạch bảo trì mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block">Tổng công việc</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{plans.length}</span>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[11px] text-emerald-800 block">Đã hoàn thành</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {plans.filter(p => p.status === 'completed').length}
          </span>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-[11px] text-blue-800 block">Kế hoạch đang chờ</span>
          <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            {plans.filter(p => p.status === 'pending').length}
          </span>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-[11px] text-red-800 block">Quá hạn bảo trì</span>
          <span className="text-xl font-bold font-mono text-red-700 tabular-nums">
            {plans.filter(p => p.status === 'overdue').length}
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã BT, bơm, người phụ trách..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="all">Tất cả tình trạng</option>
            <option value="pending">Chưa thực hiện / Đang chờ</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="overdue">Quá hạn thực hiện</option>
          </select>
        </div>

        <div>
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="all">Mọi tần suất bảo trì</option>
            <option value="monthly">Hàng tháng</option>
            <option value="quarterly">Hàng quý (3 tháng)</option>
            <option value="biannual">6 tháng</option>
            <option value="annual">Hàng năm</option>
          </select>
        </div>

        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium text-blue-900"
          >
            <option value="all">Tất cả các năm dữ liệu</option>
            <option value="2026">Kế hoạch hiệu lực năm 2026</option>
            <option value="2022">Hồ sơ gốc năm 2022 (từ PL1- KH BT)</option>
          </select>
        </div>
      </div>

      {/* Maintenance Plans Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3">Mã BT</th>
                <th className="py-3 px-3">Thiết bị</th>
                <th className="py-3 px-3">Nội dung bảo trì</th>
                <th className="py-3 px-3">Tần suất</th>
                <th className="py-3 px-3 font-mono">Ngày dự kiến</th>
                <th className="py-3 px-3">Người phụ trách</th>
                <th className="py-3 px-3 text-center">Năm gốc</th>
                <th className="py-3 px-3 text-center">Tình trạng</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <CalendarCheck className="w-9 h-9 text-slate-300 mb-2" />
                      <div className="text-sm font-semibold text-slate-700">Chưa có kế hoạch bảo trì định kỳ</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Bảng quản lý bảo trì đang trống để bạn thiết lập kế hoạch mới. Nhấn nút bên dưới để tạo lịch bảo trì đầu tiên.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm kế hoạch bảo trì</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {p.taskCode}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{p.assetCode}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{p.assetName}</div>
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <div className="font-medium text-slate-900 line-clamp-2" title={p.title}>
                        {p.title}
                      </div>
                      {p.materialsUsed && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Vật tư: {p.materialsUsed}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {p.frequency === 'monthly' ? 'Hàng tháng' :
                         p.frequency === 'quarterly' ? 'Hàng quý' :
                         p.frequency === 'biannual' ? '6 tháng' : 'Hàng năm'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap text-[11px]">
                      <div className={p.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-700'}>
                        {p.scheduledDate} {p.status === 'overdue' && '⚠ Quá hạn'}
                      </div>
                      {p.executedDate && (
                        <div className="text-emerald-700 text-[10px]">
                          Xong: {p.executedDate}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      {p.assignee}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        p.yearOriginal === 2022 ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {p.yearOriginal || 2026}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        p.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status === 'completed' ? 'Hoàn thành' :
                         p.status === 'overdue' ? 'Quá hạn' :
                         p.status === 'in_progress' ? 'Đang làm' : 'Đang chờ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.status !== 'completed' ? (
                          <button
                            onClick={() => {
                              setSelectedPlan(p);
                              setExecutionReport({
                                executedDate: new Date().toISOString().slice(0, 10),
                                materialsUsed: p.materialsUsed || '',
                                inspectionResults: '',
                                issuesFound: '',
                                correctiveAction: ''
                              });
                              setShowCompleteModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Báo cáo xong</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã lưu
                          </span>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận xóa kế hoạch bảo trì ${p.taskCode} của thiết bị ${p.assetCode}?`)) {
                              storage.deleteMaintenancePlan(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title={`Xóa kế hoạch ${p.taskCode}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Maintenance Report Modal */}
      {showCompleteModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cập nhật kết quả bảo trì hoàn tất</h3>
            <p className="text-slate-500 mb-4">
              Công việc: <span className="font-mono font-bold text-slate-800">{selectedPlan.taskCode}</span> ({selectedPlan.assetCode})
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày thực hiện thực tế</label>
                <input
                  type="date"
                  required
                  value={executionReport.executedDate}
                  onChange={(e) => setExecutionReport({ ...executionReport, executedDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vật tư & phụ tùng đã dùng</label>
                <input
                  type="text"
                  value={executionReport.materialsUsed}
                  onChange={(e) => setExecutionReport({ ...executionReport, materialsUsed: e.target.value })}
                  placeholder="VD: 100g mỡ SKF, 01 gioăng O-ring, băng keo cách điện..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kết quả đo đạc & kiểm tra</label>
                <textarea
                  rows={2}
                  required
                  value={executionReport.inspectionResults}
                  onChange={(e) => setExecutionReport({ ...executionReport, inspectionResults: e.target.value })}
                  placeholder="VD: Rcd > 60MΩ, dòng chạy êm 28A, nhiệt độ vỏ 45°C..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tồn tại phát hiện (nếu có)</label>
                <input
                  type="text"
                  value={executionReport.issuesFound}
                  onChange={(e) => setExecutionReport({ ...executionReport, issuesFound: e.target.value })}
                  placeholder="VD: Rỉ sét nhẹ chân đế bệ máy"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hành động khắc phục</label>
                <input
                  type="text"
                  value={executionReport.correctiveAction}
                  onChange={(e) => setExecutionReport({ ...executionReport, correctiveAction: e.target.value })}
                  placeholder="VD: Đã đánh rỉ và sơn lót chống gỉ mạ kẽm"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Lưu kết quả hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Lập kế hoạch bảo trì mới</h3>
            <p className="text-slate-500 mb-4">Lên lịch bảo trì định kỳ năm 2026</p>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã công việc</label>
                  <input
                    type="text"
                    required
                    value={newPlan.taskCode}
                    onChange={(e) => setNewPlan({ ...newPlan, taskCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thiết bị bảo trì</label>
                  <select
                    value={newPlan.assetCode}
                    onChange={(e) => setNewPlan({ ...newPlan, assetCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung bảo trì chi tiết</label>
                <textarea
                  rows={2}
                  required
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  placeholder="VD: Kiểm tra phớt cơ khí, đo điện trở cách điện, tra mỡ SKF..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tần suất</label>
                  <select
                    value={newPlan.frequency}
                    onChange={(e) => setNewPlan({ ...newPlan, frequency: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="monthly">Hàng tháng</option>
                    <option value="quarterly">Hàng quý (3 tháng)</option>
                    <option value="biannual">6 tháng</option>
                    <option value="annual">Hàng năm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày dự kiến</label>
                  <input
                    type="date"
                    required
                    value={newPlan.scheduledDate}
                    onChange={(e) => setNewPlan({ ...newPlan, scheduledDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người phụ trách</label>
                  <input
                    type="text"
                    required
                    value={newPlan.assignee}
                    onChange={(e) => setNewPlan({ ...newPlan, assignee: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhân sự phối hợp</label>
                  <input
                    type="text"
                    value={newPlan.collaborators}
                    onChange={(e) => setNewPlan({ ...newPlan, collaborators: e.target.value })}
                    placeholder="VD: KTV Huy, Tổ cơ điện"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Lưu kế hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
