import React, { useState } from 'react';
import { Station, Asset, RepairOrder, MaintenancePlan, PumpStatus } from '../../types/pump';
import {
  MapPin,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Archive,
  ChevronRight,
  Filter,
  Plus,
  CalendarCheck,
  History,
  Building
} from 'lucide-react';

interface StationManagerViewProps {
  stations: Station[];
  assets: Asset[];
  repairs: RepairOrder[];
  maintenancePlans: MaintenancePlan[];
  onSelectAsset: (asset: Asset) => void;
  onAddStation: (station: Station) => void;
}

export const StationManagerView: React.FC<StationManagerViewProps> = ({
  stations,
  assets,
  repairs,
  maintenancePlans,
  onSelectAsset,
  onAddStation
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddStationModal, setShowAddStationModal] = useState(false);

  // New Station Form State
  const [newStation, setNewStation] = useState({
    code: '',
    name: '',
    category: 'water_supply' as Station['category'],
    elevation: '',
    manager: '',
    description: '',
    notes: ''
  });

  const activeStation = stations.find(s => s.id === selectedStationId) || stations[0];

  // Assets belonging to active station
  const stationAssets = assets.filter(a => a.stationId === activeStation?.id);

  // Filtered within station
  const filteredStationAssets = stationAssets.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  // Station stats
  const totalInStation = stationAssets.length;
  const activeCount = stationAssets.filter(a => a.status === 'active').length;
  const standbyCount = stationAssets.filter(a => a.status === 'standby' || a.isStandby).length;
  const damagedCount = stationAssets.filter(a => a.status === 'damaged').length;
  const repairingCount = stationAssets.filter(a => a.status === 'repairing').length;

  // Station repairs
  const stationRepairs = repairs.filter(r => r.stationId === activeStation?.id);

  // Station maintenance
  const stationMaintenance = maintenancePlans.filter(m => m.stationId === activeStation?.id);

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name.trim() || !newStation.code.trim()) {
      alert('Vui lòng nhập mã trạm và tên trạm');
      return;
    }
    const created: Station = {
      ...newStation,
      id: 'st-' + Date.now()
    };
    onAddStation(created);
    setSelectedStationId(created.id);
    setShowAddStationModal(false);
    setNewStation({ code: '', name: '', category: 'water_supply', elevation: '', manager: '', description: '', notes: '' });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Quản lý trạm bơm & khu vực kỹ thuật Bà Nà Hills
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            15 Trạm / Phân khu kỹ thuật phục vụ toàn bộ hệ thống cấp thoát nước và xử lý nước thải
          </p>
        </div>

        <button
          onClick={() => setShowAddStationModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm trạm mới</span>
        </button>
      </div>

      {/* 2-Column Layout: Station selector on left (or grid on mobile), Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Station List */}
        <div className="lg:col-span-1 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 max-h-[780px] overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Danh sách 15 trạm ({stations.length})
          </div>
          {stations.map(st => {
            const count = assets.filter(a => a.stationId === st.id).length;
            const isSelected = st.id === selectedStationId;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStationId(st.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-[10px] px-1 rounded ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {st.code}
                    </span>
                    <span className="truncate">{st.name}</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {st.elevation || 'Khu vực kỹ thuật'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Station Details View */}
        <div className="lg:col-span-3 space-y-5">
          {activeStation && (
            <>
              {/* Station Info Banner */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {activeStation.code}
                        </span>
                        <span className="text-xs text-blue-600 font-semibold">
                          {activeStation.elevation || 'Bà Nà Hills'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {activeStation.name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 text-right">
                    <div>Người phụ trách trạm: <span className="font-semibold text-slate-800">{activeStation.manager}</span></div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{activeStation.description}</div>
                  </div>
                </div>

                {/* 5 Status metric tiles within this station */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Tổng thiết bị</span>
                    <span className="text-xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
                      {totalInStation}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] text-emerald-800 block">Đang sử dụng</span>
                    <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
                      {activeCount}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-[11px] text-blue-800 block">Dự phòng</span>
                    <span className="text-xl font-bold font-mono text-blue-700 mt-1 block tabular-nums">
                      {standbyCount}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[11px] text-amber-800 block">Đang sửa chữa</span>
                    <span className="text-xl font-bold font-mono text-amber-700 mt-1 block tabular-nums">
                      {repairingCount}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-[11px] text-red-800 block">Hư hỏng</span>
                    <span className="text-xl font-bold font-mono text-red-700 mt-1 block tabular-nums">
                      {damagedCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset table within this station with local filters */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-sm text-slate-900">
                      Danh sách máy bơm tại {activeStation.name} ({filteredStationAssets.length})
                    </h4>
                  </div>

                  {/* Local filters */}
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="all">Mọi trạng thái</option>
                      <option value="active">Đang sử dụng</option>
                      <option value="standby">Dự phòng</option>
                      <option value="repairing">Đang sửa chữa</option>
                      <option value="damaged">Hư hỏng</option>
                    </select>
                  </div>
                </div>

                {/* Sub table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3">Mã bơm</th>
                        <th className="py-2.5 px-3">Tên thiết bị</th>
                        <th className="py-2.5 px-3">Vị trí lắp đặt</th>
                        <th className="py-2.5 px-3">Model & Hãng</th>
                        <th className="py-2.5 px-3 text-right">Công suất</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStationAssets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Không có thiết bị nào trong trạm khớp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredStationAssets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {asset.code}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {asset.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {asset.locationDetail || '---'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold">{asset.brand}</span> · <span className="font-mono text-slate-500">{asset.model}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 tabular-nums">
                              {asset.powerKw} kW
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                asset.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                asset.status === 'standby' ? 'bg-blue-100 text-blue-800' :
                                asset.status === 'repairing' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {asset.status === 'active' ? 'Đang dùng' :
                                 asset.status === 'standby' ? 'Dự phòng' :
                                 asset.status === 'repairing' ? 'Đang sửa' : 'Hư hỏng'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
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

              {/* Station Repairs & Maintenance summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Repair History */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    Lịch sử sửa chữa tại trạm ({stationRepairs.length})
                  </h4>
                  <div className="mt-2 divide-y divide-slate-100 text-xs">
                    {stationRepairs.length === 0 ? (
                      <div className="py-4 text-slate-400 italic">Không có phiếu sửa chữa nào.</div>
                    ) : (
                      stationRepairs.map(r => (
                        <div key={r.id} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-800">{r.assetCode} - {r.repairVendor}</div>
                            <div className="text-[11px] text-slate-500">{r.failureReason}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-slate-500">{r.sentDate}</span>
                            <div className="text-[10px] font-semibold text-amber-700">{r.status}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Station Maintenance Schedule */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Kế hoạch bảo trì trạm ({stationMaintenance.length})
                  </h4>
                  <div className="mt-2 divide-y divide-slate-100 text-xs">
                    {stationMaintenance.length === 0 ? (
                      <div className="py-4 text-slate-400 italic">Chưa có kế hoạch bảo trì.</div>
                    ) : (
                      stationMaintenance.map(m => (
                        <div key={m.id} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-800">{m.taskCode} ({m.assetCode})</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{m.title}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-blue-700">{m.scheduledDate}</span>
                            <div className="text-[10px] font-semibold text-emerald-700">{m.status}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Station Modal */}
      {showAddStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Thêm trạm / khu vực quản lý mới</h3>
            <p className="text-slate-500 mb-4">Mở rộng danh mục các trạm kỹ thuật tại Bà Nà Hills</p>

            <form onSubmit={handleCreateStation} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã trạm (VD: T-NEW, T-KHO)</label>
                <input
                  type="text"
                  required
                  value={newStation.code}
                  onChange={(e) => setNewStation({ ...newStation, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên trạm / Khu vực</label>
                <input
                  type="text"
                  required
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  placeholder="VD: Trạm bơm Măng Cau, Trạm Nắng Thủy Tinh"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cao độ / Vị trí</label>
                <input
                  type="text"
                  value={newStation.elevation}
                  onChange={(e) => setNewStation({ ...newStation, elevation: e.target.value })}
                  placeholder="VD: Cao độ 1.350m"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Người phụ trách trạm</label>
                <input
                  type="text"
                  value={newStation.manager}
                  onChange={(e) => setNewStation({ ...newStation, manager: e.target.value })}
                  placeholder="VD: Kỹ sư Nguyễn Văn A"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả chức năng</label>
                <textarea
                  rows={2}
                  value={newStation.description}
                  onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
                  placeholder="Mô tả nhiệm vụ cấp nước hoặc thoát nước của trạm..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStationModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Lưu trạm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
