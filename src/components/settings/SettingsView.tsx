import React, { useRef } from 'react';
import { storage } from '../../services/storage';
import { UserProfile } from '../../types/pump';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: UserProfile;
  onResetDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onResetDefaults }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const backupData = {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      exportedBy: currentUser.name,
      stations: storage.getStations(),
      assets: storage.getAssets(),
      repairs: storage.getRepairs(),
      maintenance: storage.getMaintenancePlans(),
      inventory: storage.getInventory(),
      disposal: storage.getDisposalRecords(),
      audit: storage.getAuditLogs()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAO_LUU_QUAN_LY_BOM_BNC_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.assets && json.stations) {
          localStorage.setItem('bnc_pumps_stations', JSON.stringify(json.stations));
          localStorage.setItem('bnc_pumps_assets', JSON.stringify(json.assets));
          if (json.repairs) localStorage.setItem('bnc_pumps_repairs', JSON.stringify(json.repairs));
          if (json.maintenance) localStorage.setItem('bnc_pumps_maintenance', JSON.stringify(json.maintenance));
          if (json.inventory) localStorage.setItem('bnc_pumps_inventory', JSON.stringify(json.inventory));
          if (json.disposal) localStorage.setItem('bnc_pumps_disposal', JSON.stringify(json.disposal));
          if (json.audit) localStorage.setItem('bnc_pumps_audit', JSON.stringify(json.audit));

          storage.addAuditLog('Phục hồi dữ liệu', 'system', 'BACKUP_RESTORE', `Phục hồi file backup từ ${json.exportedBy || 'tệp tin'}`);
          alert('Phục hồi dữ liệu sao lưu thành công!');
          window.location.reload();
        } else {
          alert('Tệp tin không đúng định dạng sao lưu của hệ thống.');
        }
      } catch (err: any) {
        alert('Lỗi giải mã file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Cài đặt hệ thống & Hướng dẫn triển khai Supabase / Vercel
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý cơ sở dữ liệu sao lưu, đồng bộ hóa và hướng dẫn từng bước dành cho người không chuyên lập trình
        </p>
      </div>

      {/* Backup and Restore Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-blue-600" />
          Sao lưu & Phục hồi cơ sở dữ liệu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              1. Tải bản sao lưu JSON
            </div>
            <p className="text-slate-500">
              Xuất toàn bộ 8 bảng dữ liệu: thiết bị, trạm, sửa chữa, bảo trì, kho và lịch sử ra 1 tệp tin an toàn.
            </p>
            <button
              onClick={handleExportBackup}
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải file sao lưu (.json)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              2. Phục hồi từ file sao lưu
            </div>
            <p className="text-slate-500">
              Khôi phục lại toàn bộ dữ liệu máy bơm khi đổi máy tính hoặc đồng bộ từ quản trị viên khác.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn file để phục hồi</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              3. Khôi phục dữ liệu mẫu chuẩn
            </div>
            <p className="text-slate-500">
              Nạp lại 20 thiết bị bơm mẫu chuẩn của 15 trạm BNC cùng phiếu sửa chữa và bảo trì năm 2026.
            </p>
            <button
              onClick={onResetDefaults}
              className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Khôi phục dữ liệu gốc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step by Step Guide for Lovable / Supabase / Vercel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Hướng dẫn triển khai từng bước (Dành cho người không biết lập trình)
            </h3>
            <p className="text-slate-500 text-[11px]">
              Chỉ rõ các thao tác cần thực hiện trên Supabase và Vercel khi cần đưa ứng dụng vào vận hành chính thức
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Giai đoạn hiện tại (Đã sẵn sàng hoạt động ngay lập tức)</span>
            </div>
            <p className="text-slate-700 mt-1 leading-relaxed">
              Ứng dụng hiện đang lưu trữ tự động trên trình duyệt (LocalStorage) với đầy đủ 100% chức năng: tra cứu 15 trạm, theo dõi sửa chữa ngoài, lập lịch bảo trì định kỳ, nhập file Excel, và xuất báo cáo PDF chuẩn BNC. Bạn có thể sử dụng ngay để nhập liệu và in ấn mà chưa cần cấu hình phức tạp.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Khi nào cần cấu hình Supabase? (Để nhiều người cùng nhập liệu từ xa)</span>
            </div>
            <div className="text-slate-600 mt-1 space-y-1.5 leading-relaxed">
              <p>Khi bạn muốn kỹ thuật viên ở trên đỉnh Bà Nà và quản lý ở văn phòng cùng mở ứng dụng trên điện thoại và thấy dữ liệu cập nhật theo thời gian thực:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Truy cập <strong>supabase.com</strong>, nhấn <em>Start your project</em> và tạo 1 Project mới miễn phí đặt tên <strong>bnc-pumps</strong>.</li>
                <li>Hệ thống đã chuẩn bị sẵn cấu trúc 8 bảng quan hệ (assets, stations, repair_orders, maintenance_plans, inventory, disposal, profiles, audit_logs) và cơ chế bảo mật RLS.</li>
                <li>Bạn chỉ cần sao chép <code>Project URL</code> và <code>Anon Key</code> đưa vào cấu hình môi trường.</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Khi nào cần thao tác trên Vercel? (Để có tên miền riêng dễ nhớ)</span>
            </div>
            <div className="text-slate-600 mt-1 space-y-1.5 leading-relaxed">
              <p>Để nhân viên truy cập theo đường dẫn giống như ứng dụng tham chiếu <code>https://bao-cao-ktht-sable.vercel.app/</code>:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Truy cập <strong>vercel.com</strong>, đăng nhập tài khoản.</li>
                <li>Nhấn <em>Add New... → Project</em> và chọn liên kết với kho lưu trữ mã nguồn này.</li>
                <li>Nhấn <em>Deploy</em>. Vercel sẽ tự động xây dựng và cấp đường link chạy trực tiếp trên web cho bạn.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
