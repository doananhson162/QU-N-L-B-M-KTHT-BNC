import React, { useState } from 'react';
import { Asset, Station, RepairOrder, MaintenancePlan, PumpStatus, UserProfile } from '../../types/pump';
import {
  X,
  Cpu,
  MapPin,
  Activity,
  Calendar,
  Wrench,
  CalendarCheck,
  FileSpreadsheet,
  Edit,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: Asset;
  stations: Station[];
  repairs: RepairOrder[];
  maintenancePlans: MaintenancePlan[];
  currentUser: UserProfile;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onChangeStatus: (assetId: string, newStatus: PumpStatus, notes: string) => void;
  onDelete?: (assetId: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  stations,
  repairs,
  maintenancePlans,
  currentUser,
  onClose,
  onEdit,
  onChangeStatus,
  onDelete
}) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PumpStatus>(asset.status);
  const [statusReason, setStatusReason] = useState('');

  const station = stations.find(s => s.id === asset.stationId);
  const assetRepairs = repairs.filter(r => r.assetId === asset.id || r.assetCode === asset.code);
  const assetMaintenance = maintenancePlans.filter(m => m.assetId === asset.id || m.assetCode === asset.code);

  const statusMap: Record<PumpStatus, { label: string; color: string }> = {
    active: { label: 'Đang sử dụng', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    standby: { label: 'Dự phòng', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    repairing: { label: 'Đang sửa chữa', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    damaged: { label: 'Hư hỏng', color: 'bg-red-100 text-red-800 border-red-300' },
    pending_disposal: { label: 'Chờ thanh lý', color: 'bg-slate-200 text-slate-800 border-slate-300' },
    disposed: { label: 'Đã thanh lý', color: 'bg-slate-100 text-slate-500 border-slate-200 line-through' }
  };

  const handleApplyStatusChange = () => {
    if (!statusReason.trim()) {
      alert('Vui lòng nhập lý do chuyển trạng thái thiết bị.');
      return;
    }
    onChangeStatus(asset.id, targetStatus, statusReason);
    setShowStatusDialog(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  {asset.code}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${statusMap[asset.status].color}`}>
                  {statusMap[asset.status].label}
                </span>
                {asset.isStandby && (
                  <span className="text-[11px] bg-sky-900/60 text-sky-200 border border-sky-700 px-2 py-0.5 rounded">
                    Thiết bị dự phòng
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1">{asset.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors no-print"
              title="In hồ sơ kỹ thuật"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In hồ sơ</span>
            </button>
            <button
              onClick={() => onEdit(asset)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors no-print"
              title="Chỉnh sửa thông số"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-300 hover:text-red-100 hover:bg-red-950/60 border border-red-800/60 rounded-lg text-xs flex items-center gap-1.5 transition-colors no-print"
                title="Xóa thiết bị này"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors no-print"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-xs">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận xóa thiết bị</h3>
              <p className="text-slate-600 text-center mt-1">
                Bạn có chắc chắn muốn xóa thiết bị <strong className="font-mono text-red-600">{asset.code}</strong> - <strong>{asset.name}</strong> ({asset.model})?
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] leading-relaxed">
                Hệ thống sẽ lưu vết lịch sử xóa vào nhật ký kiểm toán.
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) {
                      onDelete(asset.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status Change Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl no-print">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-slate-600 font-medium">Trạng thái vận hành hiện tại:</span>
              <span className="font-bold text-slate-900">{statusMap[asset.status].label}</span>
            </div>
            <button
              onClick={() => setShowStatusDialog(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Chuyển trạng thái thiết bị
            </button>
          </div>

          {/* Change Status Modal Dialog if active */}
          {showStatusDialog && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 no-print">
              <div className="font-bold text-blue-900 text-sm">
                Xác nhận đổi trạng thái thiết bị: {asset.code}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Chọn trạng thái mới:
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as PumpStatus)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="active">Đang sử dụng (Vận hành chính thức)</option>
                    <option value="standby">Dự phòng (Sẵn sàng trong kho/trạm)</option>
                    <option value="repairing">Đang sửa chữa (Tháo đưa đi sửa)</option>
                    <option value="damaged">Hư hỏng (Chờ kiểm tra xử lý)</option>
                    <option value="pending_disposal">Chờ thanh lý (Không phục hồi được)</option>
                    <option value="disposed">Đã thanh lý (Đã xuất khỏi tài sản)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Lý do & ghi chú chuyển trạng thái: *
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Ví dụ: Đã test chạy thử đạt, bàn giao vận hành"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowStatusDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApplyStatusChange}
                  className="px-4 py-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </div>
          )}

          {/* Technical Specifications Grid */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200">
              Thông số kỹ thuật & Vị trí quản lý
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Trạm quản lý</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {station?.name || asset.stationId}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({station?.code})</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Vị trí lắp đặt chi tiết</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {asset.locationDetail || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Chủng loại thiết bị</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {asset.category}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Mục đích sử dụng</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {asset.purpose}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Hãng sản xuất / Thương hiệu</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {asset.brand}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Model / Mã hiệu</span>
                <span className="font-bold font-mono text-slate-900 text-xs mt-0.5 block">
                  {asset.model}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Công suất định mức</span>
                <span className="font-bold font-mono text-blue-700 text-sm mt-0.5 block tabular-nums">
                  {asset.powerKw} kW
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Tầng cánh</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {asset.impellerStage}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Xuất xứ</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {asset.origin || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Năm nhập kho / Sử dụng</span>
                <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                  {asset.importYear || '---'} / {asset.useYear || '---'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl col-span-2">
                <span className="text-slate-400 block text-[11px]">Thông số kỹ thuật chi tiết</span>
                <span className="font-medium text-slate-900 text-xs mt-0.5 block">
                  {asset.techSpecs || 'Chưa có thông số chi tiết'}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Log & Source Excel Lineage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Nhật ký vận hành & bảo trì thiết bị
              </h4>
              <div className="text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200 font-sans">
                {asset.logHistory || 'Chưa có nhật ký ghi nhận.'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Nguồn dữ liệu gốc Excel
                </h4>
                <div className="space-y-1.5 text-slate-600">
                  <div>Sheet nguồn: <span className="font-semibold text-slate-900">{asset.sourceSheet || 'Tạo trực tiếp trên app'}</span></div>
                  <div>Dòng Excel: <span className="font-mono font-semibold text-slate-900">{asset.sourceRow || '---'}</span></div>
                  <div>Người cập nhật gần nhất: <span className="font-semibold text-slate-900">{asset.updatedBy}</span></div>
                  <div>Thời gian cập nhật: <span className="font-mono text-slate-500">{new Date(asset.updatedAt).toLocaleString('vi-VN')}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                Lưu ý: Không xóa vĩnh viễn thiết bị đã có lịch sử sửa chữa hoặc bảo trì.
              </div>
            </div>
          </div>

          {/* Repair History Sub-table */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              Lịch sử các lần sửa chữa ({assetRepairs.length})
            </h3>
            {assetRepairs.length === 0 ? (
              <div className="py-4 text-slate-400 italic">Thiết bị chưa có phiếu sửa chữa nào.</div>
            ) : (
              <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Mã phiếu</th>
                      <th className="py-2.5 px-3">Lý do hư hỏng</th>
                      <th className="py-2.5 px-3">Đơn vị sửa chữa</th>
                      <th className="py-2.5 px-3">Ngày gửi / Hẹn trả</th>
                      <th className="py-2.5 px-3">Chi phí (VNĐ)</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assetRepairs.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{r.orderCode}</td>
                        <td className="py-2 px-3 max-w-xs truncate" title={r.failureReason}>{r.failureReason}</td>
                        <td className="py-2 px-3">{r.repairVendor}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">{r.sentDate} → {r.expectedReturnDate}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{r.repairCost ? r.repairCost.toLocaleString('vi-VN') : '---'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Periodic Maintenance History Sub-table */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Kế hoạch & Lịch sử bảo trì định kỳ ({assetMaintenance.length})
            </h3>
            {assetMaintenance.length === 0 ? (
              <div className="py-4 text-slate-400 italic">Chưa có lịch bảo trì cho thiết bị này.</div>
            ) : (
              <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Mã BT</th>
                      <th className="py-2.5 px-3">Nội dung</th>
                      <th className="py-2.5 px-3">Kế hoạch</th>
                      <th className="py-2.5 px-3">Người phụ trách</th>
                      <th className="py-2.5 px-3">Kết quả</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assetMaintenance.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{m.taskCode}</td>
                        <td className="py-2 px-3 max-w-sm truncate" title={m.title}>{m.title}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">{m.scheduledDate}</td>
                        <td className="py-2 px-3">{m.assignee}</td>
                        <td className="py-2 px-3 max-w-xs truncate text-slate-600">{m.inspectionResults || 'Chưa ghi nhận'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            m.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400">
            Mã định danh: <span className="font-mono">{asset.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition-colors"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
