import React, { useState } from 'react';
import { DisposalRecord, Asset, UserProfile } from '../../types/pump';
import { storage } from '../../services/storage';
import {
  Trash2,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  DollarSign
} from 'lucide-react';

interface DisposalViewProps {
  records: DisposalRecord[];
  assets: Asset[];
  currentUser: UserProfile;
  onSaveRecord: (record: DisposalRecord, isNew: boolean) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const DisposalView: React.FC<DisposalViewProps> = ({
  records,
  assets,
  currentUser,
  onSaveRecord,
  onSelectAsset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DisposalRecord | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Approval form state
  const [approvalNotes, setApprovalNotes] = useState('');

  // New disposal form
  const [newRecord, setNewRecord] = useState<Partial<DisposalRecord>>({
    assetCode: assets[0]?.code || '',
    currentLocation: 'Kho Gia Long - Bãi phế liệu',
    formerPurpose: 'Cấp nước vận hành',
    damageDescription: '',
    cause: '',
    detectedDate: new Date().toISOString().slice(0, 10),
    proposedAction: 'scrap',
    disposalStatus: 'waiting_evaluation',
    assignee: currentUser.name
  });

  const filteredRecords = records.filter(r => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = r.assetCode.toLowerCase().includes(q) || r.assetName.toLowerCase().includes(q) || r.damageDescription.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && r.disposalStatus !== statusFilter) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.code === newRecord.assetCode);
    if (!targetAsset) return;

    const record: DisposalRecord = {
      id: 'disp-' + Date.now(),
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      powerKw: targetAsset.powerKw,
      model: targetAsset.model,
      currentLocation: newRecord.currentLocation || targetAsset.locationDetail,
      formerPurpose: newRecord.formerPurpose || targetAsset.purpose,
      damageDescription: newRecord.damageDescription || 'Hư hỏng nặng không thể khắc phục',
      cause: newRecord.cause || 'Hết khấu hao kỹ thuật',
      detectedDate: newRecord.detectedDate || new Date().toISOString().slice(0, 10),
      proposedAction: newRecord.proposedAction as any || 'scrap',
      disposalStatus: newRecord.disposalStatus as any || 'waiting_evaluation',
      assignee: newRecord.assignee || currentUser.name,
      notes: newRecord.notes,
      createdAt: new Date().toISOString()
    };

    onSaveRecord(record, true);
    setShowAddModal(false);
  };

  const handleApprove = () => {
    if (!selectedRecord) return;
    const updated: DisposalRecord = {
      ...selectedRecord,
      disposalStatus: 'approved',
      approvalDate: new Date().toISOString().slice(0, 10),
      approvedBy: currentUser.name,
      notes: `${selectedRecord.notes ? selectedRecord.notes + '\n' : ''}Phê duyệt thanh lý bởi ${currentUser.name}: ${approvalNotes}`
    };
    onSaveRecord(updated, false);
    setShowApproveModal(false);
    setSelectedRecord(null);
  };

  const handleMarkDisposed = (record: DisposalRecord) => {
    if (!window.confirm(`Xác nhận thiết bị ${record.assetCode} đã hoàn tất thủ tục hủy/bán thanh lý thực tế?`)) return;
    const updated: DisposalRecord = {
      ...record,
      disposalStatus: 'disposed',
      actualDisposalDate: new Date().toISOString().slice(0, 10)
    };
    onSaveRecord(updated, false);
  };

  const handleDeleteRecord = (id: string, code: string) => {
    if (!window.confirm(`Xác nhận xóa hồ sơ thanh lý của thiết bị ${code}? Hành động này không thể hoàn tác.`)) return;
    storage.deleteDisposalRecord(id);
  };

  const statusMap = {
    waiting_evaluation: { label: 'Hư hỏng chờ đánh giá', color: 'bg-amber-100 text-amber-800' },
    waiting_repair: { label: 'Chờ sửa chữa', color: 'bg-blue-100 text-blue-800' },
    in_repair: { label: 'Đang sửa chữa', color: 'bg-indigo-100 text-indigo-800' },
    cannot_repair: { label: 'Không sửa được', color: 'bg-red-100 text-red-800' },
    pending_approval: { label: 'Chờ duyệt thanh lý', color: 'bg-purple-100 text-purple-800' },
    approved: { label: 'Đã duyệt thanh lý', color: 'bg-slate-200 text-slate-800' },
    disposed: { label: 'Đã thanh lý thực tế', color: 'bg-slate-100 text-slate-500 line-through' }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Hồ sơ thiết bị hư hỏng & thủ tục thanh lý BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tích hợp từ sheet “Bơm hư hỏng - Thanh lý” · Quản lý thiết bị không thể phục hồi & kiểm soát thủ tục thanh lý
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lập hồ sơ hư hỏng mới</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Chưa có hồ sơ thiết bị hư hỏng hoặc chờ thanh lý
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
            Dữ liệu cũ ở sheet “Hư hỏng & chờ thanh lý” đã được dọn sạch hoàn toàn. Hiện tại không có thiết bị nào đang trong quy trình thanh lý. Bạn có thể bắt đầu lập hồ sơ khi có thiết bị hỏng tại các trạm hoặc kho.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-red-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lập hồ sơ hư hỏng mới</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter and stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Tổng hồ sơ</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{records.length}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] text-amber-800 block">Chờ đánh giá kỹ thuật</span>
              <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                {records.filter(r => r.disposalStatus === 'waiting_evaluation').length}
              </span>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[11px] text-purple-800 block">Chờ lãnh đạo duyệt</span>
              <span className="text-xl font-bold font-mono text-purple-700 tabular-nums">
                {records.filter(r => r.disposalStatus === 'pending_approval').length}
              </span>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-700 block">Đã thanh lý xuất sổ</span>
              <span className="text-xl font-bold font-mono text-slate-600 tabular-nums">
                {records.filter(r => r.disposalStatus === 'disposed').length}
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã thiết bị, tên, hiện tượng..."
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
                <option value="all">Tất cả giai đoạn thanh lý</option>
                <option value="waiting_evaluation">Hư hỏng chờ đánh giá</option>
                <option value="cannot_repair">Không sửa được</option>
                <option value="pending_approval">Chờ phê duyệt thanh lý</option>
                <option value="approved">Đã phê duyệt thanh lý</option>
                <option value="disposed">Đã thanh lý</option>
              </select>
            </div>
          </div>

      {/* Disposal Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3">Mã thiết bị</th>
                <th className="py-3 px-3">Tên & Thông số</th>
                <th className="py-3 px-3">Vị trí hiện tại</th>
                <th className="py-3 px-3">Tình trạng hư hỏng & Nguyên nhân</th>
                <th className="py-3 px-3">Phương án đề xuất</th>
                <th className="py-3 px-3">Người phụ trách</th>
                <th className="py-3 px-3 text-center">Trạng thái hồ sơ</th>
                <th className="py-3 px-3 text-center w-28">Phê duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có hồ sơ hư hỏng nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const targetAsset = assets.find(a => a.code === r.assetCode);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {r.assetCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{r.assetName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {r.model} · {r.powerKw} kW
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {r.currentLocation}
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-semibold text-slate-800">{r.damageDescription}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Nguyên nhân: {r.cause}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">
                          {r.proposedAction === 'scrap' ? 'Thanh lý phế liệu' : 'Sửa chữa phục hồi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <div>{r.assignee}</div>
                        {r.approvedBy && (
                          <div className="text-[10px] text-emerald-700 font-semibold">Duyệt: {r.approvedBy}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusMap[r.disposalStatus]?.color || 'bg-slate-100'}`}>
                          {statusMap[r.disposalStatus]?.label || r.disposalStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.disposalStatus === 'pending_approval' && (currentUser.role === 'admin' || currentUser.role === 'manager') ? (
                            <button
                              onClick={() => {
                                setSelectedRecord(r);
                                setApprovalNotes('');
                                setShowApproveModal(true);
                              }}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Phê duyệt</span>
                            </button>
                          ) : r.disposalStatus === 'approved' ? (
                            <button
                              onClick={() => handleMarkDisposed(r)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <span>Xuất sổ</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">---</span>
                          )}

                          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                            <button
                              onClick={() => handleDeleteRecord(r.id, r.assetCode)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Xóa hồ sơ thanh lý này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </>
  )}

      {/* Add Disposal Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Lập hồ sơ thiết bị hư hỏng / đề xuất thanh lý</h3>
            <p className="text-slate-500 mb-4">Ghi nhận tình trạng hư hỏng thiết bị không thể phục hồi</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn thiết bị hư hỏng</label>
                <select
                  value={newRecord.assetCode}
                  onChange={(e) => setNewRecord({ ...newRecord, assetCode: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.code}>{a.code} - {a.name} ({a.powerKw}kW)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả chi tiết tình trạng hư hỏng</label>
                <textarea
                  rows={2}
                  required
                  value={newRecord.damageDescription}
                  onChange={(e) => setNewRecord({ ...newRecord, damageDescription: e.target.value })}
                  placeholder="VD: Gãy trục, cháy stato, thủng buồng bơm do cát bào mòn..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nguyên nhân hư hỏng</label>
                <input
                  type="text"
                  required
                  value={newRecord.cause}
                  onChange={(e) => setNewRecord({ ...newRecord, cause: e.target.value })}
                  placeholder="VD: Tuổi thọ > 8 năm, nguồn nước nhiều cát, quá tải điện..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vị trí tập kết hiện tại</label>
                  <input
                    type="text"
                    value={newRecord.currentLocation}
                    onChange={(e) => setNewRecord({ ...newRecord, currentLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phương án đề xuất</label>
                  <select
                    value={newRecord.proposedAction}
                    onChange={(e) => setNewRecord({ ...newRecord, proposedAction: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="scrap">Đề xuất thanh lý phế liệu</option>
                    <option value="repair">Đề xuất sửa chữa phục hồi</option>
                    <option value="evaluate">Chờ hội đồng đánh giá thêm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái hồ sơ ban đầu</label>
                <select
                  value={newRecord.disposalStatus}
                  onChange={(e) => setNewRecord({ ...newRecord, disposalStatus: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="waiting_evaluation">Hư hỏng chờ đánh giá</option>
                  <option value="cannot_repair">Không sửa được (Chuyển duyệt)</option>
                  <option value="pending_approval">Chờ phê duyệt thanh lý</option>
                </select>
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
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                >
                  Tạo hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Disposal Modal */}
      {showApproveModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Phê duyệt thanh lý tài sản</h3>
            <p className="text-slate-500 mb-3">
              Thiết bị: <span className="font-mono font-bold text-slate-800">{selectedRecord.assetCode}</span> - {selectedRecord.assetName}
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-3">
              Hành động này xác nhận tài sản không còn khả năng phục hồi kinh tế kỹ thuật và đồng ý cho phép bộ phận KTHT lập biên bản thanh lý.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ý kiến phê duyệt của Lãnh đạo:</label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ví dụ: Đồng ý thanh lý theo đề xuất của Tổ cơ điện. Giao phòng tài chính thu hồi phế liệu..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold"
              >
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
