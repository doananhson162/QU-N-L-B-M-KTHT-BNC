import React, { useState } from 'react';
import { AuditLog } from '../../types/pump';
import { storage } from '../../services/storage';
import { History, Search, Filter, Clock, User, ShieldCheck, Activity, Trash2 } from 'lucide-react';

interface HistoryViewProps {
  logs: AuditLog[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (targetTypeFilter !== 'all' && log.targetType !== targetTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Nhật ký truy vết & Lịch sử thay đổi hệ thống (Audit Log)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu giữ toàn bộ thời gian, người thực hiện, hành động cập nhật thiết bị, sửa chữa và nghiệm thu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Tổng số: <span className="font-bold text-slate-800">{logs.length}</span> sự kiện
          </div>

          {logs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử vận hành & thay thế (Audit Log)? Hành động này không thể hoàn tác.')) {
                  storage.clearAllAuditLogs();
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xóa toàn bộ lịch sử nhật ký"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Xóa toàn bộ lịch sử</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hành động, người thực hiện, mã thiết bị..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
          >
            <option value="all">Tất cả phân hệ</option>
            <option value="asset">Thiết bị bơm (Assets)</option>
            <option value="repair">Phiếu sửa chữa (Repairs)</option>
            <option value="maintenance">Kế hoạch bảo trì (Maintenance)</option>
            <option value="inventory">Kho & Điều chuyển (Inventory)</option>
            <option value="disposal">Hồ sơ thanh lý (Disposal)</option>
            <option value="system">Hệ thống (System)</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <History className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Chưa có bản ghi lịch sử vận hành & thay thế</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Hệ thống sẽ tự động ghi lại toàn bộ thao tác thêm mới, sửa chữa, thay thế và bảo trì thiết bị bơm khi bạn thao tác.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                {/* Dot */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{log.action}</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {log.targetId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('Xác nhận xóa sự kiện nhật ký này?')) {
                          storage.deleteAuditLog(log.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Xóa bản ghi này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {log.details}
                </p>

                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    {log.userName}
                  </span>
                  <span>·</span>
                  <span className="uppercase text-[10px] tracking-wider text-slate-400">
                    Phân hệ: {log.targetType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
