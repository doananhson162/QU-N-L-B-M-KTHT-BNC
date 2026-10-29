import React, { useState } from 'react';
import { Asset, Station, RepairOrder, MaintenancePlan, InventoryTransaction, DisposalRecord, UserProfile } from '../../types/pump';
import { excelService } from '../../services/excelService';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  Archive,
  Layers,
  Building
} from 'lucide-react';

interface ReportsViewProps {
  assets: Asset[];
  stations: Station[];
  repairs: RepairOrder[];
  maintenancePlans: MaintenancePlan[];
  inventory: InventoryTransaction[];
  disposalRecords: DisposalRecord[];
  currentUser: UserProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  assets,
  stations,
  repairs,
  maintenancePlans,
  inventory,
  disposalRecords,
  currentUser
}) => {
  const [reportType, setReportType] = useState<string>('station_summary');
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('2026');

  // Filtered assets by station
  const targetAssets = selectedStation === 'all'
    ? assets
    : assets.filter(a => a.stationId === selectedStation);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCurrentReport = () => {
    if (reportType === 'repairs_active' || reportType === 'repairs_overdue') {
      excelService.exportRepairsToExcel(repairs, stations);
    } else if (reportType.includes('maintenance')) {
      excelService.exportMaintenanceToExcel(maintenancePlans, stations);
    } else {
      excelService.exportAssetsToExcel(targetAssets, stations);
    }
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Báo cáo & Thống kê kỹ thuật hạ tầng BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu thực tế từ 15 trạm bơm, phiếu sửa chữa và kế hoạch bảo trì năm 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrentReport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel báo cáo</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs no-print">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Chọn mẫu báo cáo chuyên đề:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-900"
          >
            <option value="station_summary">1. Báo cáo tổng hợp thiết bị theo 15 trạm</option>
            <option value="status_summary">2. Báo cáo cơ cấu tình trạng hoạt động</option>
            <option value="power_summary">3. Báo cáo theo nhóm công suất & chủng loại</option>
            <option value="repairs_active">4. Danh sách thiết bị đang gửi sửa ngoài</option>
            <option value="repairs_overdue">5. Danh sách sửa chữa quá hạn cam kết</option>
            <option value="maintenance_month">6. Kế hoạch bảo trì định kỳ tháng</option>
            <option value="warehouse_spares">7. Báo cáo tồn kho thiết bị dự phòng & điều chuyển</option>
            <option value="disposal_summary">8. Danh sách thiết bị hư hỏng, chờ thanh lý</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Lọc phạm vi trạm / khu vực:</label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="all">Toàn bộ 15 trạm tại Bà Nà Hills</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Năm báo cáo:</label>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="2026">Năm vận hành 2026</option>
            <option value="all">Toàn bộ dữ liệu lịch sử</option>
          </select>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Official Header for PDF/Print */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                SUN WORLD BÀ NÀ HILLS
              </div>
              <div className="text-base font-black text-slate-900 uppercase">
                BỘ PHẬN KỸ THUẬT HẠ TẦNG – BNC
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Hệ thống quản lý, giám sát và bảo trì thiết bị bơm - motor
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-800">Biểu mẫu báo cáo kỹ thuật</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{todayStr}</div>
              <div className="text-[11px] text-slate-500">Người lập: <span className="font-bold text-slate-900">{currentUser.name}</span></div>
            </div>
          </div>

          <div className="text-center mt-6">
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              {reportType === 'station_summary' && 'BÁO CÁO TỔNG HỢP THIẾT BỊ BƠM THEO 15 TRẠM KỸ THUẬT'}
              {reportType === 'status_summary' && 'BÁO CÁO CƠ CẤU TÌNH TRẠNG VẬN HÀNH THIẾT BỊ'}
              {reportType === 'power_summary' && 'BÁO CÁO PHÂN BỔ THEO NHÓM CÔNG SUẤT VÀ CHỦNG LOẠI'}
              {reportType === 'repairs_active' && 'BÁO CÁO THEO DÕI THIẾT BỊ ĐANG SỬA CHỮA XƯỞNG NGOÀI NĂM 2026'}
              {reportType === 'repairs_overdue' && 'CẢNH BÁO TIẾN ĐỘ: DANH SÁCH THIẾT BỊ SỬA CHỮA QUÁ HẠN'}
              {reportType === 'maintenance_month' && 'BÁO CÁO TIẾN ĐỘ THỰC HIỆN KẾ HOẠCH BẢO TRÌ ĐỊNH KỲ'}
              {reportType === 'warehouse_spares' && 'BÁO CÁO TỒN KHO THIẾT BỊ DỰ PHÒNG & ĐIỀU CHUYỂN'}
              {reportType === 'disposal_summary' && 'HỒ SƠ THIẾT BỊ HƯ HỎNG & ĐỀ XUẤT THANH LÝ'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Phạm vi: {selectedStation === 'all' ? 'Toàn bộ hệ thống kỹ thuật BNC' : stations.find(s => s.id === selectedStation)?.name} · Thời điểm kết xuất: {new Date().toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Dynamic Report Content Body */}

        {/* 1. Station Summary Report */}
        {reportType === 'station_summary' && (
          <div className="space-y-4">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Mã trạm</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tên trạm / Khu vực</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Tổng máy</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Đang dùng</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Dự phòng</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Đang sửa</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Hư hỏng</th>
                  <th className="py-2.5 px-3 text-right">Tổng kW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stations.map((st, idx) => {
                  const stAssets = assets.filter(a => a.stationId === st.id);
                  const activeCount = stAssets.filter(a => a.status === 'active').length;
                  const standbyCount = stAssets.filter(a => a.status === 'standby' || a.isStandby).length;
                  const repCount = stAssets.filter(a => a.status === 'repairing').length;
                  const damCount = stAssets.filter(a => a.status === 'damaged').length;
                  const totalKw = stAssets.reduce((sum, a) => sum + (a.powerKw || 0), 0);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">{st.code}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold tabular-nums">{stAssets.length}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-emerald-700 tabular-nums">{activeCount}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-blue-700 tabular-nums">{standbyCount}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-amber-700 tabular-nums">{repCount}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-red-700 tabular-nums">{damCount}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">{totalKw.toFixed(1)} kW</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase border-r border-slate-300">Tổng cộng toàn hệ thống</td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">{assets.length}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 border-r border-slate-300">{assets.filter(a => a.status === 'active').length}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-800 border-r border-slate-300">{assets.filter(a => a.status === 'standby' || a.isStandby).length}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800 border-r border-slate-300">{assets.filter(a => a.status === 'repairing').length}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-800 border-r border-slate-300">{assets.filter(a => a.status === 'damaged').length}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{assets.reduce((sum, a) => sum + (a.powerKw || 0), 0).toFixed(1)} kW</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 2. Active Repairs Report */}
        {(reportType === 'repairs_active' || reportType === 'repairs_overdue') && (
          <div className="space-y-4">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Mã phiếu</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Mã thiết bị</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Đơn vị sửa chữa</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Lý do hư hỏng</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Ngày gửi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Hạn bàn giao</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Chi phí (VNĐ)</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {repairs
                  .filter(r => reportType === 'repairs_overdue' ? (new Date(r.expectedReturnDate) < new Date() && r.status !== 'inspected') : true)
                  .map((r, idx) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">{r.orderCode}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{r.assetCode}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{r.repairVendor}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs">{r.failureReason}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">{r.sentDate}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-[11px] text-blue-800">{r.expectedReturnDate}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">{r.repairCost?.toLocaleString('vi-VN') || 0}</td>
                      <td className="py-2 px-3 text-center font-semibold text-[11px]">{r.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Maintenance Month Report */}
        {reportType === 'maintenance_month' && (
          <div className="space-y-4">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Mã BT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Thiết bị</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nội dung bảo dưỡng</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Người phụ trách</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 font-mono">Ngày dự kiến</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Kết quả kiểm tra</th>
                  <th className="py-2.5 px-3 text-center">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {maintenancePlans.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">{m.taskCode}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">{m.assetCode}</td>
                    <td className="py-2 px-3 border-r border-slate-200 max-w-sm">{m.title}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{m.assignee}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">{m.scheduledDate}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{m.inspectionResults || 'Chưa thực hiện'}</td>
                    <td className="py-2 px-3 text-center font-semibold text-[11px]">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Disposal Summary Report */}
        {reportType === 'disposal_summary' && (
          <div className="space-y-4">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Mã thiết bị</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tên & Model</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Công suất</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Hiện tượng hư hỏng</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Phương án xử lý</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Người phụ trách</th>
                  <th className="py-2.5 px-3 text-center">Giai đoạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {disposalRecords.map((d, idx) => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">{d.assetCode}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">{d.assetName} ({d.model})</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">{d.powerKw} kW</td>
                    <td className="py-2 px-3 border-r border-slate-200 max-w-sm">{d.damageDescription}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">{d.proposedAction === 'scrap' ? 'Đề xuất thanh lý' : 'Đề xuất sửa'}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{d.assignee}</td>
                    <td className="py-2 px-3 text-center font-semibold text-[11px]">{d.disposalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures block for official reporting */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase">NGƯỜI LẬP BÁO CÁO</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div className="mt-14 font-semibold text-slate-900">{currentUser.name}</div>
          </div>
          <div>
            <div className="font-bold text-slate-800 uppercase">TỔ TRƯỞNG VẬN HÀNH</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký và xác nhận thông số)</div>
            <div className="mt-14 font-semibold text-slate-900">Lê Quang Huy</div>
          </div>
          <div>
            <div className="font-bold text-slate-800 uppercase">TRƯỞNG BỘ PHẬN KTHT</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký duyệt và chỉ đạo)</div>
            <div className="mt-14 font-semibold text-slate-900">Đoàn Anh Sơn</div>
          </div>
        </div>
      </div>
    </div>
  );
};
