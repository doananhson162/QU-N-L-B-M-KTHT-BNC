import React, { useState, useMemo } from 'react';
import { Asset, Station, RepairOrder, MaintenancePlan, PumpStatus, UserProfile } from '../../types/pump';
import { excelService } from '../../services/excelService';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetFormModal } from './AssetFormModal';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Printer,
  Eye,
  Edit,
  ArrowUpDown,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Archive,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface AssetListViewProps {
  assets: Asset[];
  stations: Station[];
  repairs: RepairOrder[];
  maintenancePlans: MaintenancePlan[];
  currentUser: UserProfile;
  initialFilters?: { stationId?: string; status?: PumpStatus };
  onSaveAsset: (assetData: Partial<Asset>, isNew: boolean) => void;
  onChangeStatus: (assetId: string, newStatus: PumpStatus, notes: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  stations,
  repairs,
  maintenancePlans,
  currentUser,
  initialFilters,
  onSaveAsset,
  onChangeStatus,
  onDeleteAsset
}) => {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>(initialFilters?.stationId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilters?.status || 'all');
  const [selectedPowerBand, setSelectedPowerBand] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'powerKw' | 'updatedAt'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const stationMap = useMemo(() => new Map(stations.map(s => [s.id, s])), [stations]);

  // Unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    assets.forEach(a => { if (a.brand) set.add(a.brand); });
    return Array.from(set).sort();
  }, [assets]);

  // Filtered & Sorted assets
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      // Search text in code, name, model, techSpecs
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.model.toLowerCase().includes(q) ||
          (item.locationDetail && item.locationDetail.toLowerCase().includes(q)) ||
          item.brand.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filter station
      if (selectedStation !== 'all' && item.stationId !== selectedStation) return false;

      // Filter status
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Filter brand
      if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;

      // Filter power band
      if (selectedPowerBand !== 'all') {
        if (selectedPowerBand === 'under5' && item.powerKw >= 5) return false;
        if (selectedPowerBand === '5to15' && (item.powerKw < 5 || item.powerKw > 15)) return false;
        if (selectedPowerBand === '15to30' && (item.powerKw < 15 || item.powerKw > 30)) return false;
        if (selectedPowerBand === 'over30' && item.powerKw <= 30) return false;
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'code') cmp = a.code.localeCompare(b.code);
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'powerKw') cmp = a.powerKw - b.powerKw;
      else if (sortBy === 'updatedAt') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [assets, searchTerm, selectedStation, selectedStatus, selectedBrand, selectedPowerBand, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    excelService.exportAssetsToExcel(filteredAssets, stations);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = (status: PumpStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Đang sử dụng</span>;
      case 'standby':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">Dự phòng</span>;
      case 'repairing':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">Đang sửa chữa</span>;
      case 'damaged':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">Hư hỏng</span>;
      case 'pending_disposal':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">Chờ thanh lý</span>;
      case 'disposed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 line-through">Đã thanh lý</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Danh mục thiết bị bơm & motor BNC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng hợp từ sheet PL2 và đối chiếu các trạm (Tổng {filteredAssets.length} / {assets.length} thiết bị)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Xuất file Excel đầy đủ"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors no-print"
            title="In / Lưu PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / PDF</span>
          </button>

          <button
            onClick={() => {
              setAssetToEdit(null);
              setShowFormModal(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã bơm, tên, model, vị trí..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Station Filter */}
          <div>
            <select
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
            >
              <option value="all">Tất cả trạm ({stations.length})</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="standby">Dự phòng</option>
              <option value="repairing">Đang sửa chữa</option>
              <option value="damaged">Hư hỏng</option>
              <option value="pending_disposal">Chờ thanh lý</option>
              <option value="disposed">Đã thanh lý</option>
            </select>
          </div>

          {/* Power Group Filter */}
          <div>
            <select
              value={selectedPowerBand}
              onChange={(e) => {
                setSelectedPowerBand(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
            >
              <option value="all">Mọi công suất</option>
              <option value="under5">&lt; 5 kW</option>
              <option value="5to15">5 – 15 kW</option>
              <option value="15to30">15 – 30 kW</option>
              <option value="over30">&gt; 30 kW</option>
            </select>
          </div>
        </div>

        {/* Clear Filters indicator if any active */}
        {(searchTerm || selectedStation !== 'all' || selectedStatus !== 'all' || selectedPowerBand !== 'all' || selectedBrand !== 'all') && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Đang áp dụng bộ lọc: Tìm thấy <span className="font-bold text-blue-700">{filteredAssets.length}</span> kết quả phù hợp.
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStation('all');
                setSelectedStatus('all');
                setSelectedPowerBand('all');
                setSelectedBrand('all');
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th
                  onClick={() => {
                    if (sortBy === 'code') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('code'); setSortOrder('asc'); }
                  }}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mã bơm</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortOrder('asc'); }
                  }}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tên thiết bị</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Trạm & Vị trí</th>
                <th className="py-3 px-3">Hãng / Model</th>
                <th
                  onClick={() => {
                    if (sortBy === 'powerKw') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('powerKw'); setSortOrder('asc'); }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Công suất</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Tầng cánh</th>
                <th className="py-3 px-3 text-center">Tình trạng</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy thiết bị nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset, index) => {
                  const station = stationMap.get(asset.stationId);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400 tabular-nums">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {asset.code}
                      </td>
                      <td className="py-3 px-3">
                        <div
                          onClick={() => setSelectedAsset(asset)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                        >
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {asset.category} · {asset.purpose}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {station?.name || asset.stationId}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {asset.locationDetail || 'Chưa ghi vị trí'}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{asset.brand}</div>
                        <div className="font-mono text-[11px] text-slate-500">{asset.model}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap tabular-nums">
                        {asset.powerKw} kW
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          asset.impellerStage === 'Có' ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {asset.impellerStage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {statusBadge(asset.status)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Xem chi tiết & lịch sử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAssetToEdit(asset);
                              setShowFormModal(true);
                            }}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                            title="Chỉnh sửa thông số & Xóa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAssetToDelete(asset)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 bg-white border border-slate-300 rounded text-xs font-semibold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>dòng / trang. Tổng số {filteredAssets.length} thiết bị.</span>
          </div>

          <div className="flex items-center gap-2 self-center sm:self-auto">
            <span className="text-slate-500 font-mono">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          stations={stations}
          repairs={repairs}
          maintenancePlans={maintenancePlans}
          currentUser={currentUser}
          onClose={() => setSelectedAsset(null)}
          onEdit={(a) => {
            setSelectedAsset(null);
            setAssetToEdit(a);
            setShowFormModal(true);
          }}
          onChangeStatus={onChangeStatus}
          onDelete={(id) => {
            onDeleteAsset(id);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Asset Form Modal (Add/Edit) */}
      {showFormModal && (
        <AssetFormModal
          assetToEdit={assetToEdit}
          stations={stations}
          onClose={() => {
            setShowFormModal(false);
            setAssetToEdit(null);
          }}
          onSave={onSaveAsset}
          onDelete={(id) => {
            onDeleteAsset(id);
            setShowFormModal(false);
            setAssetToEdit(null);
          }}
        />
      )}

      {/* Table Row Delete Confirmation Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận xóa thiết bị</h3>
            <p className="text-slate-600 text-center mt-1">
              Bạn có chắc chắn muốn xóa thiết bị <strong className="font-mono text-red-600">{assetToDelete.code}</strong> - <strong>{assetToDelete.name}</strong> ({assetToDelete.model})?
            </p>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] leading-relaxed">
              Thiết bị sẽ bị gỡ bỏ khỏi danh mục và hệ thống ghi lại nhật ký kiểm toán hành động này.
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAsset(assetToDelete.id);
                  setAssetToDelete(null);
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
    </div>
  );
};
