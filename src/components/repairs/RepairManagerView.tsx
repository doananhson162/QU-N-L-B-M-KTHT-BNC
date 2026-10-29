import React, { useState } from 'react';
import { RepairOrder, Asset, Station, RepairStatus, UserProfile } from '../../types/pump';
import { excelService } from '../../services/excelService';
import { storage } from '../../services/storage';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Edit,
  CheckSquare,
  Trash2
} from 'lucide-react';

interface RepairManagerViewProps {
  repairs: RepairOrder[];
  assets: Asset[];
  stations: Station[];
  currentUser: UserProfile;
  onSaveRepair: (repair: RepairOrder, isNew: boolean) => void;
  onAcceptInspection: (repair: RepairOrder, isOperational: boolean, newLocation: string, remarks: string) => void;
}

export const RepairManagerView: React.FC<RepairManagerViewProps> = ({
  repairs,
  assets,
  stations,
  currentUser,
  onSaveRepair,
  onAcceptInspection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRepair, setSelectedRepair] = useState<RepairOrder | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // New repair form state
  const [newOrder, setNewOrder] = useState<Partial<RepairOrder>>({
    orderCode: `SC-2026-${String(repairs.length + 1).padStart(3, '0')}`,
    assetCode: assets[0]?.code || '',
    repairVendor: 'Công ty TNHH Kỹ thuật Điện Cơ Đức Phát',
    preRemovalLocation: '',
    failureReason: '',
    symptoms: '',
    detectedDate: new Date().toISOString().slice(0, 10),
    removalDate: new Date().toISOString().slice(0, 10),
    sentDate: new Date().toISOString().slice(0, 10),
    handedBy: currentUser.name,
    expectedReturnDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    repairCost: 0,
    status: 'sent'
  });

  // Inspection form state
  const [inspectionResult, setInspectionResult] = useState('');
  const [newInstallLocation, setNewInstallLocation] = useState('');
  const [approveAsActive, setApproveAsActive] = useState(true);

  const calculateDaysOut = (repair: RepairOrder): number => {
    const start = new Date(repair.removalDate || repair.detectedDate).getTime();
    const end = repair.actualReturnDate ? new Date(repair.actualReturnDate).getTime() : new Date().getTime();
    const diff = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  const isOverdue = (repair: RepairOrder): boolean => {
    if (repair.status === 'inspected' || repair.status === 'received' || repair.status === 'unrepairable') return false;
    return new Date(repair.expectedReturnDate) < new Date();
  };

  const filteredRepairs = repairs.filter(r => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        r.orderCode.toLowerCase().includes(q) ||
        r.assetCode.toLowerCase().includes(q) ||
        r.assetName.toLowerCase().includes(q) ||
        r.repairVendor.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.code === newOrder.assetCode);
    if (!targetAsset) {
      alert('Vui lòng chọn thiết bị hợp lệ');
      return;
    }

    const created: RepairOrder = {
      id: 'rep-' + Date.now(),
      orderCode: newOrder.orderCode || `SC-${Date.now()}`,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      stationId: targetAsset.stationId,
      model: targetAsset.model,
      powerKw: targetAsset.powerKw,
      quantity: 1,
      preRemovalLocation: newOrder.preRemovalLocation || targetAsset.locationDetail,
      failureReason: newOrder.failureReason || 'Hư hỏng cần kiểm định xưởng ngoài',
      symptoms: newOrder.symptoms || '',
      detectedDate: newOrder.detectedDate || new Date().toISOString().slice(0, 10),
      removalDate: newOrder.removalDate,
      sentDate: newOrder.sentDate,
      handedBy: newOrder.handedBy || currentUser.name,
      repairVendor: newOrder.repairVendor || 'Xưởng ngoài',
      repairCost: Number(newOrder.repairCost) || 0,
      expectedReturnDate: newOrder.expectedReturnDate || new Date().toISOString().slice(0, 10),
      status: (newOrder.status as RepairStatus) || 'sent',
      notes: newOrder.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveRepair(created, true);
    setShowAddModal(false);
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;
    if (!inspectionResult.trim()) {
      alert('Vui lòng nhập kết quả kiểm tra & nghiệm thu kỹ thuật');
      return;
    }

    onAcceptInspection(selectedRepair, approveAsActive, newInstallLocation, inspectionResult);
    setShowInspectionModal(false);
    setSelectedRepair(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Theo dõi sửa chữa thiết bị bơm & motor BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tích hợp từ các sheet “THIẾT BỊ ĐI SỬA 2026” và “Bơm Hoả tiển sửa năm 2026”
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => excelService.exportRepairsToExcel(filteredRepairs, stations)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel phiếu sửa</span>
          </button>

          {repairs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách phiếu sửa chữa? Hành động này không thể hoàn tác.')) {
                  storage.clearAllRepairs();
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xóa toàn bộ dữ liệu sửa chữa"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Xóa toàn bộ phiếu</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập phiếu sửa chữa mới</span>
          </button>
        </div>
      </div>

      {/* KPI Overdue alert strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 block">Tổng phiếu sửa</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{repairs.length}</span>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-[11px] text-amber-800 block">Đang tại xưởng ngoài</span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {repairs.filter(r => r.status === 'in_repair' || r.status === 'sent').length}
          </span>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-[11px] text-red-800 block">Quá hạn cam kết</span>
          <span className="text-xl font-bold font-mono text-red-700 tabular-nums">
            {repairs.filter(isOverdue).length}
          </span>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-[11px] text-blue-800 block">Đã nhận về (chờ nghiệm thu)</span>
          <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            {repairs.filter(r => r.status === 'received').length}
          </span>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã phiếu, mã bơm, đơn vị sửa..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
          >
            <option value="all">Tất cả trạng thái sửa chữa</option>
            <option value="sent">Đã gửi sửa</option>
            <option value="in_repair">Đang sửa chữa</option>
            <option value="received">Đã nhận về kho (chưa nghiệm thu)</option>
            <option value="inspected">Đã nghiệm thu đưa vào dùng</option>
            <option value="unrepairable">Không sửa được / Đề xuất thanh lý</option>
          </select>
        </div>
      </div>

      {/* Repair Orders Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3">Mã phiếu</th>
                <th className="py-3 px-3">Thiết bị & Công suất</th>
                <th className="py-3 px-3">Đơn vị sửa chữa</th>
                <th className="py-3 px-3">Lý do hư hỏng</th>
                <th className="py-3 px-3 font-mono">Gửi / Hẹn trả</th>
                <th className="py-3 px-3 text-center">Ngày ngoài VH</th>
                <th className="py-3 px-3 text-right">Chi phí (VNĐ)</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-center w-28">Nghiệm thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Wrench className="w-9 h-9 text-slate-300 mb-2" />
                      <div className="text-sm font-semibold text-slate-700">Chưa có dữ liệu phiếu sửa chữa</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Bảng theo dõi sửa chữa đang trống để bạn nhập dữ liệu mới. Nhấn nút bên dưới để tạo phiếu đầu tiên.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo phiếu sửa chữa mới</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const overdue = isOverdue(r);
                  const daysOut = calculateDaysOut(r);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {r.orderCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-blue-900">{r.assetCode}</span>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-blue-700">{r.powerKw} kW</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{r.assetName}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {r.repairVendor}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate" title={r.failureReason}>
                        {r.failureReason}
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-[11px]">
                        <div>Gửi: {r.sentDate || '---'}</div>
                        <div className={`font-semibold ${overdue ? 'text-red-600' : 'text-slate-600'}`}>
                          Hẹn: {r.expectedReturnDate} {overdue && '⚠ Trễ!'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 tabular-nums">
                        {daysOut} ngày
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {r.repairCost ? r.repairCost.toLocaleString('vi-VN') : '0'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'inspected' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'received' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'unrepairable' ? 'bg-slate-200 text-slate-800' :
                          overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === 'inspected' ? 'Đã nghiệm thu' :
                           r.status === 'received' ? 'Đã nhận về kho' :
                           r.status === 'unrepairable' ? 'Không sửa được' :
                           overdue ? 'Quá hạn trả' : 'Đang sửa chữa'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.status === 'received' ? (
                            <button
                              onClick={() => {
                                setSelectedRepair(r);
                                setInspectionResult('');
                                setNewInstallLocation(r.preRemovalLocation);
                                setShowInspectionModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Nghiệm thu</span>
                            </button>
                          ) : r.status === 'in_repair' || r.status === 'sent' ? (
                            <button
                              onClick={() => {
                                // Fast mark as received
                                const updated: RepairOrder = {
                                  ...r,
                                  status: 'received',
                                  actualReturnDate: new Date().toISOString().slice(0, 10),
                                  receivedBy: currentUser.name
                                };
                                onSaveRepair(updated, false);
                              }}
                              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold text-[11px] cursor-pointer"
                            >
                              Báo nhận về
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Đã chốt</span>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa phiếu sửa chữa ${r.orderCode} của thiết bị ${r.assetCode}?`)) {
                                storage.deleteRepair(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title={`Xóa phiếu sửa ${r.orderCode}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Repair Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tạo phiếu gửi sửa chữa thiết bị</h3>
            <p className="text-slate-500 mb-4">Ghi nhận thông tin thiết bị tháo rời gửi xưởng ngoài</p>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã phiếu sửa chữa</label>
                  <input
                    type="text"
                    required
                    value={newOrder.orderCode}
                    onChange={(e) => setNewOrder({ ...newOrder, orderCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thiết bị cần sửa</label>
                  <select
                    value={newOrder.assetCode}
                    onChange={(e) => setNewOrder({ ...newOrder, assetCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.code}>{a.code} - {a.name} ({a.powerKw}kW)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đơn vị sửa chữa bên ngoài</label>
                <input
                  type="text"
                  required
                  value={newOrder.repairVendor}
                  onChange={(e) => setNewOrder({ ...newOrder, repairVendor: e.target.value })}
                  placeholder="VD: Cty Kỹ thuật Đức Phát, Toàn Cầu, Xưởng cơ điện..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do hư hỏng / Hiện tượng</label>
                <textarea
                  rows={2}
                  required
                  value={newOrder.failureReason}
                  onChange={(e) => setNewOrder({ ...newOrder, failureReason: e.target.value })}
                  placeholder="Mô tả sự cố (cháy cuộn, kẹt rác, rò phớt, gãy cốt...)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày gửi sửa</label>
                  <input
                    type="date"
                    value={newOrder.sentDate}
                    onChange={(e) => setNewOrder({ ...newOrder, sentDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày hẹn bàn giao</label>
                  <input
                    type="date"
                    required
                    value={newOrder.expectedReturnDate}
                    onChange={(e) => setNewOrder({ ...newOrder, expectedReturnDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chi phí dự toán sửa (VNĐ)</label>
                <input
                  type="number"
                  value={newOrder.repairCost}
                  onChange={(e) => setNewOrder({ ...newOrder, repairCost: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Tạo phiếu gửi sửa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspection & Acceptance Modal */}
      {showInspectionModal && selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
              <CheckSquare className="w-5 h-5" />
              <h3 className="text-base text-slate-900">Kiểm tra nghiệm thu sau sửa chữa</h3>
            </div>
            <p className="text-slate-500 mb-4">
              Phiếu: <span className="font-mono font-bold text-slate-800">{selectedRepair.orderCode}</span> · Thiết bị: <span className="font-mono font-bold text-blue-700">{selectedRepair.assetCode}</span>
            </p>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kết quả đo kiểm thử tải & thẩm định kỹ thuật <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  placeholder="Ví dụ: Đo điện trở cách điện Rcd > 50MΩ, chạy thử không tải 15 phút êm, dòng cân pha, phớt cơ khí kín nước..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vị trí lắp đặt / lưu kho sau nhận về:
                </label>
                <input
                  type="text"
                  value={newInstallLocation}
                  onChange={(e) => setNewInstallLocation(e.target.value)}
                  placeholder="VD: Trở về bệ số 1 trạm Miếu Bà / hoặc Kho dự phòng Gia Long"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-semibold text-slate-800">Quyết định chuyển trạng thái vận hành:</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="opDecision"
                    checked={approveAsActive}
                    onChange={() => setApproveAsActive(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Đạt nghiệm thu: Đưa vào hoạt động chính thức (Đang sử dụng)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="opDecision"
                    checked={!approveAsActive}
                    onChange={() => setApproveAsActive(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Đưa về kho dự phòng (Sẵn sàng thay thế)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Xác nhận nghiệm thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
