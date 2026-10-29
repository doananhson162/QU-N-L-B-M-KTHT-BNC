import React, { useState } from 'react';
import { Asset, Station, RepairOrder, MaintenancePlan, DisposalRecord } from '../../types/pump';
import {
  Cpu,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  Archive,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart2,
  Zap,
  MapPin,
  CalendarCheck
} from 'lucide-react';

interface DashboardViewProps {
  assets: Asset[];
  stations: Station[];
  repairs: RepairOrder[];
  maintenancePlans: MaintenancePlan[];
  disposalRecords: DisposalRecord[];
  onNavigate: (menuKey: string, filterState?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assets,
  stations,
  repairs,
  maintenancePlans,
  disposalRecords,
  onNavigate
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Filter assets by station if selected
  const filteredAssets = selectedStation === 'all'
    ? assets
    : assets.filter(a => a.stationId === selectedStation);

  // Compute live KPIs
  const totalAssets = filteredAssets.length;
  const activeAssets = filteredAssets.filter(a => a.status === 'active').length;
  const standbyAssets = filteredAssets.filter(a => a.status === 'standby' || a.isStandby).length;
  const damagedAssets = filteredAssets.filter(a => a.status === 'damaged').length;
  const repairingAssets = filteredAssets.filter(a => a.status === 'repairing').length;
  const pendingDisposalAssets = filteredAssets.filter(a => a.status === 'pending_disposal').length;

  const activeRepairsCount = repairs.filter(r => r.status === 'in_repair' || r.status === 'sent').length;
  const overdueRepairs = repairs.filter(
    r => (r.status === 'in_repair' || r.status === 'sent') && new Date(r.expectedReturnDate) < new Date()
  );

  const pendingMaintenance = maintenancePlans.filter(m => m.status === 'pending').length;
  const overdueMaintenance = maintenancePlans.filter(m => m.status === 'overdue').length;
  const completedMaintenance = maintenancePlans.filter(m => m.status === 'completed').length;

  // Station distribution
  const stationCounts = stations.map(st => ({
    station: st,
    count: assets.filter(a => a.stationId === st.id).length
  })).sort((a, b) => b.count - a.count);

  // Power distribution
  const powerGroups = {
    under5: filteredAssets.filter(a => a.powerKw < 5).length,
    from5to15: filteredAssets.filter(a => a.powerKw >= 5 && a.powerKw <= 15).length,
    from15to30: filteredAssets.filter(a => a.powerKw > 15 && a.powerKw <= 30).length,
    over30: filteredAssets.filter(a => a.powerKw > 30).length,
  };

  const maxStationCount = Math.max(...stationCounts.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-xl border border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Trung tâm kiểm soát vận hành & kỹ thuật hạ tầng
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Tổng quan hệ thống bơm Bà Nà Hills
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời gian thực {assets.length} thiết bị tại 15 trạm, kế hoạch bảo trì và tiến độ sửa chữa ngoài.
          </p>
        </div>

        {/* Station Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Lọc theo trạm:</span>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          >
            <option value="all">Tất cả 15 Trạm / Khu vực</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip - 8 Key Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Tổng bơm */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Tổng thiết bị</span>
            <Cpu className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Bơm & Motor</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
          </div>
        </div>

        {/* 2. Đang sử dụng */}
        <div
          onClick={() => onNavigate('assets', { status: 'active' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Đang sử dụng</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {activeAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0}% tải</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
          </div>
        </div>

        {/* 3. Dự phòng */}
        <div
          onClick={() => onNavigate('warehouse')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Dự phòng</span>
            <Archive className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {standbyAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Sẵn sàng thay</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
          </div>
        </div>

        {/* 4. Đang sửa chữa */}
        <div
          onClick={() => onNavigate('repairs')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Gửi sửa chữa</span>
            <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {repairingAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Tại xưởng ngoài</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
          </div>
        </div>

        {/* 5. Hư hỏng */}
        <div
          onClick={() => onNavigate('assets', { status: 'damaged' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-red-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Đang hư hỏng</span>
            <AlertCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-600 tabular-nums">
            {damagedAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Cần khắc phục</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
          </div>
        </div>

        {/* 6. Chờ thanh lý */}
        <div
          onClick={() => onNavigate('disposal')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Chờ thanh lý</span>
            <Archive className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-700 tabular-nums">
            {pendingDisposalAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Đã thẩm định</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
          </div>
        </div>

        {/* 7. Đến hạn bảo trì */}
        <div
          onClick={() => onNavigate('maintenance', { status: 'pending' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Đến hạn BT</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {pendingMaintenance}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Kế hoạch tháng</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
          </div>
        </div>

        {/* 8. Bảo trì quá hạn */}
        <div
          onClick={() => onNavigate('maintenance', { status: 'overdue' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-red-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">BT quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-600 tabular-nums">
            {overdueMaintenance}
          </div>
          <div className="mt-1 text-[10px] text-red-600 font-semibold flex items-center justify-between">
            <span>Khẩn cấp!</span>
            <ArrowRight className="w-3 h-3 text-red-600" />
          </div>
        </div>
      </div>

      {/* Urgent Warning Banner if Overdue items exist */}
      {(overdueRepairs.length > 0 || overdueMaintenance > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950">
                Cảnh báo tiến độ kỹ thuật: Có {overdueRepairs.length} thiết bị quá hạn nhận về từ xưởng ngoài & {overdueMaintenance} công việc bảo trì trễ tiến độ!
              </div>
              <div className="text-amber-800 mt-0.5">
                Vui lòng liên hệ đơn vị sửa chữa và chỉ đạo kỹ thuật viên hoàn tất phiếu bảo trì.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('repairs')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium whitespace-nowrap self-start sm:self-center transition-colors"
          >
            Xử lý ngay
          </button>
        </div>
      )}

      {/* Main Charts & Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Station Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Phân bổ thiết bị theo 15 Trạm / Khu vực
              </h3>
            </div>
            <button
              onClick={() => onNavigate('stations')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Xem chi tiết trạm →
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {stationCounts.slice(0, 10).map(({ station, count }) => {
              const pct = Math.round((count / maxStationCount) * 100);
              return (
                <div
                  key={station.id}
                  onClick={() => onNavigate('assets', { stationId: station.id })}
                  className="group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                      {station.name} <span className="text-slate-400 font-normal">({station.code})</span>
                    </span>
                    <span className="font-mono text-slate-600 font-semibold tabular-nums">
                      {count} thiết bị
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full group-hover:bg-blue-700 transition-all duration-300"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Status Structure & Power Groups */}
        <div className="space-y-6">
          {/* Status breakdown card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Cơ cấu tình trạng thiết bị
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Đang sử dụng
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {activeAssets} ({totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Dự phòng sẵn sàng
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {standbyAssets} ({totalAssets > 0 ? Math.round((standbyAssets / totalAssets) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Gửi sửa chữa
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {repairingAssets}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Hư hỏng tại trạm
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {damagedAssets}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Chờ thanh lý
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {pendingDisposalAssets}
                </span>
              </div>
            </div>
          </div>

          {/* Power group breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Nhóm công suất động cơ (kW)
            </h3>
            <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 font-medium">&lt; 5 kW</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {powerGroups.under5} máy
                </div>
                <div className="text-[10px] text-slate-400">Bơm tưới & định lượng</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 font-medium">5 – 15 kW</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {powerGroups.from5to15} máy
                </div>
                <div className="text-[10px] text-slate-400">Tăng áp & hỏa tiễn</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 font-medium">15 – 30 kW</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {powerGroups.from15to30} máy
                </div>
                <div className="text-[10px] text-slate-400">Cấp nước thô hồ đập</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 font-medium">&gt; 30 kW</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {powerGroups.over30} máy
                </div>
                <div className="text-[10px] text-slate-400">Trạm tổng Đập Mới</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Progress & Offsite Repairs overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active off-site repairs table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              Thiết bị đang gửi xưởng ngoài sửa chữa ({repairs.filter(r => r.status === 'in_repair' || r.status === 'received').length})
            </h3>
            <button
              onClick={() => onNavigate('repairs')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {repairs.slice(0, 4).map((r) => {
              const isOverdue = (r.status === 'in_repair' || r.status === 'sent') && new Date(r.expectedReturnDate) < new Date();
              return (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono text-blue-700">{r.assetCode}</span>
                      <span>·</span>
                      <span className="line-clamp-1">{r.assetName}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Đơn vị: <span className="font-medium text-slate-700">{r.repairVendor}</span> · Gửi: {r.sentDate}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : r.status === 'received'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isOverdue ? 'Quá hạn hẹn' : r.status === 'received' ? 'Đã nhận về' : 'Đang sửa'}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Hẹn: {r.expectedReturnDate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance Progress & Schedule */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Tiến độ bảo trì định kỳ
            </h3>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Mở lịch bảo trì →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-700">Tỷ lệ hoàn thành công việc</span>
                <span className="font-mono text-emerald-700">
                  {completedMaintenance} / {maintenancePlans.length} ({maintenancePlans.length > 0 ? Math.round((completedMaintenance / maintenancePlans.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${maintenancePlans.length > 0 ? (completedMaintenance / maintenancePlans.length) * 100 : 0}%` }}
                  title="Hoàn thành"
                />
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${maintenancePlans.length > 0 ? (pendingMaintenance / maintenancePlans.length) * 100 : 0}%` }}
                  title="Đang chờ / Chưa thực hiện"
                />
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${maintenancePlans.length > 0 ? (overdueMaintenance / maintenancePlans.length) * 100 : 0}%` }}
                  title="Quá hạn"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hoàn thành ({completedMaintenance})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Chưa làm ({pendingMaintenance})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Quá hạn ({overdueMaintenance})
                </span>
              </div>
            </div>

            {/* Next upcoming maintenance task */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Công việc bảo trì kế tiếp
              </div>
              {maintenancePlans.find(m => m.status === 'pending') ? (
                (() => {
                  const nextTask = maintenancePlans.find(m => m.status === 'pending')!;
                  return (
                    <div className="mt-1">
                      <div className="font-bold text-slate-900">{nextTask.title}</div>
                      <div className="text-slate-600 mt-0.5 flex items-center justify-between">
                        <span>Thiết bị: {nextTask.assetCode}</span>
                        <span className="font-mono text-blue-700">Hạn: {nextTask.scheduledDate}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mt-1 text-slate-500">Đã hoàn thành toàn bộ kế hoạch hiện tại.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
