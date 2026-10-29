import React, { useState } from 'react';
import { Asset, InventoryTransaction, Station, UserProfile } from '../../types/pump';
import { storage } from '../../services/storage';
import {
  Warehouse,
  Archive,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Trash2
} from 'lucide-react';

interface WarehouseViewProps {
  assets: Asset[];
  stations: Station[];
  inventory: InventoryTransaction[];
  currentUser: UserProfile;
  onSaveTransaction: (tx: InventoryTransaction) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  assets,
  stations,
  inventory,
  currentUser,
  onSaveTransaction,
  onSelectAsset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Filter spare assets (in warehouse or marked as standby)
  const spareAssets = assets.filter(a => a.status === 'standby' || a.isStandby || a.stationId === 'st-dp-phong' || a.stationId === 'st-kho-gl');

  const filteredSpares = spareAssets.filter(a => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.model.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedWarehouse !== 'all' && a.stationId !== selectedWarehouse) return false;
    return true;
  });

  // Transfer transaction form
  const [transferForm, setTransferForm] = useState<Partial<InventoryTransaction>>({
    transactionCode: `GD-2026-${String(inventory.length + 1).padStart(3, '0')}`,
    type: 'transfer',
    assetCode: spareAssets[0]?.code || '',
    sender: currentUser.name,
    receiver: '',
    fromLocation: 'Kho Bơm Kỹ thuật Trung tâm',
    toLocation: 'Trạm Đập Pháp',
    reason: 'Điều chuyển thay thế máy hư hỏng',
    quantity: 1,
    date: new Date().toISOString().slice(0, 10),
    warehouseLocation: 'Kho Gia Long'
  });

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.code === transferForm.assetCode);
    if (!targetAsset) {
      alert('Vui lòng chọn thiết bị');
      return;
    }

    const tx: InventoryTransaction = {
      id: 'inv-' + Date.now(),
      transactionCode: transferForm.transactionCode || `GD-${Date.now()}`,
      type: transferForm.type as any,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      warehouseLocation: transferForm.warehouseLocation || 'Kho Gia Long',
      quantity: 1,
      sender: transferForm.sender || currentUser.name,
      receiver: transferForm.receiver || 'Kỹ thuật viên ca trực',
      fromLocation: transferForm.fromLocation || 'Kho dự phòng',
      toLocation: transferForm.toLocation || 'Trạm lắp đặt',
      reason: transferForm.reason || 'Điều chuyển vận hành',
      date: transferForm.date || new Date().toISOString().slice(0, 10),
      status: 'completed',
      notes: transferForm.notes
    };

    onSaveTransaction(tx);
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            Quản lý thiết bị dự phòng & kho bơm BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tồn kho máy bơm dự phòng, motor, buồng cánh và lịch sử phiếu nhập / xuất / điều chuyển
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Lập phiếu điều chuyển / xuất kho</span>
        </button>
      </div>

      {/* Spare Pumps Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Danh sách thiết bị bơm sẵn sàng dự phòng ({filteredSpares.length} máy)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bơm dự phòng..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="all">Tất cả kho lưu trữ</option>
              <option value="st-dp-phong">Kho Bơm Kỹ thuật (T-DP)</option>
              <option value="st-kho-gl">Kho Gia Long (T-KGL)</option>
            </select>
          </div>
        </div>

        {/* Spares Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3">Mã bơm</th>
                <th className="py-2.5 px-3">Tên thiết bị</th>
                <th className="py-2.5 px-3">Vị trí lưu kho</th>
                <th className="py-2.5 px-3">Hãng / Model</th>
                <th className="py-2.5 px-3 text-right">Công suất</th>
                <th className="py-2.5 px-3 text-center">Tình trạng kiểm định</th>
                <th className="py-2.5 px-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSpares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Không có thiết bị dự phòng nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredSpares.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {asset.code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{asset.name}</div>
                      <div className="text-[11px] text-slate-500">{asset.category}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {asset.locationDetail || 'Kho trung tâm'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold">{asset.brand}</span> · <span className="font-mono text-slate-500">{asset.model}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 tabular-nums">
                      {asset.powerKw} kW
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Sẵn sàng lắp đặt
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded font-medium text-xs"
                      >
                        Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Movements Log */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Nhật ký phiếu giao dịch nhập / xuất / điều chuyển ({inventory.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận đầy đủ nguồn điều chuyển, thiết bị thay thế và người chịu trách nhiệm
            </p>
          </div>

          {inventory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử phiếu giao dịch kho và điều chuyển? Hành động này không thể hoàn tác.')) {
                  storage.clearAllInventoryTransactions();
                }
              }}
              className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              title="Xóa toàn bộ dữ liệu giao dịch kho"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ giao dịch</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl mt-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Mã phiếu</th>
                <th className="py-2.5 px-3">Loại giao dịch</th>
                <th className="py-2.5 px-3">Mã & Tên thiết bị</th>
                <th className="py-2.5 px-3">Từ vị trí → Đến vị trí</th>
                <th className="py-2.5 px-3">Lý do điều chuyển</th>
                <th className="py-2.5 px-3">Người giao / nhận</th>
                <th className="py-2.5 px-3 font-mono text-right">Ngày GD</th>
                <th className="py-2.5 px-3 text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Archive className="w-8 h-8 text-slate-300 mb-2" />
                      <div className="text-sm font-semibold text-slate-700">Chưa có giao dịch kho / điều chuyển</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Lịch sử nhập, xuất và điều chuyển thiết bị dự phòng đang sẵn sàng để bạn nhập dữ liệu mới.
                      </p>
                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lập phiếu điều chuyển / xuất kho mới</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inventory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {tx.transactionCode}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'import' ? 'bg-emerald-100 text-emerald-800' :
                      tx.type === 'export' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tx.type === 'import' ? <ArrowDownLeft className="w-3 h-3" /> :
                       tx.type === 'export' ? <ArrowUpRight className="w-3 h-3" /> :
                       <ArrowRightLeft className="w-3 h-3" />}
                      {tx.type === 'import' ? 'Nhập kho' : tx.type === 'export' ? 'Xuất kho' : 'Điều chuyển'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-900">{tx.assetCode}</span>
                    <span className="text-slate-500 ml-1">({tx.assetName})</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {tx.fromLocation} → <span className="text-blue-700 font-bold">{tx.toLocation}</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-slate-600" title={tx.reason}>
                    {tx.reason}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div>Giao: {tx.sender}</div>
                    <div className="text-[11px] text-slate-500">Nhận: {tx.receiver}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right whitespace-nowrap text-slate-500">
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (window.confirm(`Xác nhận xóa phiếu giao dịch kho ${tx.transactionCode}?`)) {
                          storage.deleteInventoryTransaction(tx.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title={`Xóa phiếu ${tx.transactionCode}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Lập phiếu điều chuyển / xuất thiết bị</h3>
            <p className="text-slate-500 mb-4">Ghi nhận điều phối bơm dự phòng đến trạm có sự cố</p>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    required
                    value={transferForm.transactionCode}
                    onChange={(e) => setTransferForm({ ...transferForm, transactionCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại giao dịch</label>
                  <select
                    value={transferForm.type}
                    onChange={(e) => setTransferForm({ ...transferForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="transfer">Điều chuyển giữa các trạm</option>
                    <option value="export">Xuất kho lắp đặt mới</option>
                    <option value="import">Nhập kho lưu trữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thiết bị cần chuyển</label>
                <select
                  value={transferForm.assetCode}
                  onChange={(e) => setTransferForm({ ...transferForm, assetCode: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.code}>{a.code} - {a.name} ({a.powerKw}kW)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Từ vị trí</label>
                  <input
                    type="text"
                    required
                    value={transferForm.fromLocation}
                    onChange={(e) => setTransferForm({ ...transferForm, fromLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đến vị trí nhận</label>
                  <input
                    type="text"
                    required
                    value={transferForm.toLocation}
                    onChange={(e) => setTransferForm({ ...transferForm, toLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người giao</label>
                  <input
                    type="text"
                    required
                    value={transferForm.sender}
                    onChange={(e) => setTransferForm({ ...transferForm, sender: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người nhận</label>
                  <input
                    type="text"
                    required
                    value={transferForm.receiver}
                    onChange={(e) => setTransferForm({ ...transferForm, receiver: e.target.value })}
                    placeholder="VD: KTV Trực ca trạm..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chuyển</label>
                <textarea
                  rows={2}
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="VD: Lắp thay thế khẩn cấp cho máy bơm số 1 bị kẹt cát..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Xác nhận lập phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
