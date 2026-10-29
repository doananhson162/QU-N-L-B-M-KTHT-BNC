import React, { useState } from 'react';
import { excelService, ParsedSheetInfo, ColumnMapping } from '../../services/excelService';
import { Asset, Station, UserProfile } from '../../types/pump';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Table,
  ArrowRight,
  ShieldCheck,
  Download,
  Database
} from 'lucide-react';

interface ExcelImportViewProps {
  currentAssets: Asset[];
  stations: Station[];
  currentUser: UserProfile;
  onBulkImport: (assets: Asset[], mode: 'append' | 'replace') => { imported: number; duplicates: number };
  onResetDefaults: () => void;
}

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({
  currentAssets,
  stations,
  currentUser,
  onBulkImport,
  onResetDefaults
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheets, setSheets] = useState<ParsedSheetInfo[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [mapping, setMapping] = useState<ColumnMapping>({
    code: '',
    name: '',
    station: '',
    locationDetail: '',
    category: '',
    purpose: '',
    brand: '',
    model: '',
    powerKw: '',
    impellerStage: '',
    origin: '',
    importYear: '',
    useYear: '',
    techSpecs: '',
    status: '',
    notes: ''
  });

  const [previewRecords, setPreviewRecords] = useState<Partial<Asset>[]>([]);
  const [duplicateCodes, setDuplicateCodes] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const activeSheet = sheets.find(s => s.sheetName === selectedSheetName);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsLoading(true);
    setImportResult(null);

    try {
      const { sheets: parsedSheets } = await excelService.readWorkbook(uploadedFile);
      setSheets(parsedSheets);
      if (parsedSheets.length > 0) {
        // Prefer sheet PL2 if present
        const defaultSheet = parsedSheets.find(s => s.sheetName.includes('PL2') || s.sheetName.includes('Danh mục')) || parsedSheets[0];
        setSelectedSheetName(defaultSheet.sheetName);
        const suggested = excelService.suggestMapping(defaultSheet.columns);
        setMapping(suggested);
        generatePreview(defaultSheet, suggested);
      }
    } catch (err: any) {
      alert('Không thể đọc file Excel: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    const s = sheets.find(item => item.sheetName === sheetName);
    if (s) {
      const suggested = excelService.suggestMapping(s.columns);
      setMapping(suggested);
      generatePreview(s, suggested);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    if (activeSheet) {
      generatePreview(activeSheet, updated);
    }
  };

  const generatePreview = (sheet: ParsedSheetInfo, currentMap: ColumnMapping) => {
    const existingCodeSet = new Set(currentAssets.map(a => a.code.toUpperCase()));
    const duplicates: string[] = [];

    const parsed: Partial<Asset>[] = sheet.sampleData.map((row) => {
      const rawCode = String(row[currentMap.code] || `BOM-${sheet.sheetName}-${row.__sourceRow}`).trim();
      const code = rawCode.toUpperCase();
      if (existingCodeSet.has(code)) {
        duplicates.push(code);
      }

      // Find matching station id
      const stationRaw = String(row[currentMap.station] || sheet.sheetName).toLowerCase();
      const matchedStation = stations.find(st => 
        stationRaw.includes(st.name.toLowerCase()) || 
        stationRaw.includes(st.code.toLowerCase()) ||
        st.name.toLowerCase().includes(stationRaw)
      );

      const rawPower = parseFloat(String(row[currentMap.powerKw] || '0').replace(',', '.')) || 0;

      return {
        id: 'ast-import-' + Math.random().toString(36).substring(2, 8),
        code,
        name: String(row[currentMap.name] || `Bơm ${sheet.sheetName} dòng ${row.__sourceRow}`).trim(),
        stationId: matchedStation?.id || stations[0]?.id || 'st-khac',
        locationDetail: String(row[currentMap.locationDetail] || '').trim(),
        category: String(row[currentMap.category] || 'Bơm ly tâm trục ngang').trim(),
        purpose: String(row[currentMap.purpose] || 'Cấp nước').trim(),
        brand: String(row[currentMap.brand] || 'Chưa xác định').trim(),
        model: String(row[currentMap.model] || 'N/A').trim(),
        powerKw: rawPower,
        impellerStage: (row[currentMap.impellerStage] ? 'Có' : 'Chưa xác định') as any,
        origin: String(row[currentMap.origin] || '').trim(),
        importYear: parseInt(row[currentMap.importYear]) || undefined,
        useYear: parseInt(row[currentMap.useYear]) || undefined,
        techSpecs: String(row[currentMap.techSpecs] || '').trim(),
        status: 'active',
        isStandby: false,
        logHistory: String(row[currentMap.notes] || '').trim(),
        sourceSheet: sheet.sheetName,
        sourceRow: row.__sourceRow,
        updatedBy: currentUser.name
      };
    });

    setPreviewRecords(parsed);
    setDuplicateCodes(duplicates);
  };

  const handleExecuteImport = (mode: 'append' | 'replace') => {
    if (previewRecords.length === 0) {
      alert('Không có bản ghi nào để nhập.');
      return;
    }

    if (mode === 'replace') {
      if (!window.confirm('CẢNH BÁO: Chế độ "Ghi đè toàn bộ" sẽ thay thế danh mục hiện tại bằng dữ liệu sheet này. Bạn có chắc chắn không?')) {
        return;
      }
    }

    const res = onBulkImport(previewRecords as Asset[], mode);
    setImportResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Phân hệ trung tâm quan trọng nhất
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Nhập dữ liệu & Đối chiếu file Excel KTHT BNC
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phân tích cấu trúc workbook “THIẾT BỊ BƠM BỘ PHẬN KTHT - 2026.xlsx”, ánh xạ các sheet PL2, THIẾT BỊ ĐI SỬA 2026, các trạm và kiểm tra trùng lặp.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => excelService.exportAssetsToExcel(currentAssets, stations)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất đối chiếu hiện tại</span>
            </button>
            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Khôi phục lại bộ dữ liệu chuẩn 2026"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Khôi phục dữ liệu mẫu chuẩn BNC</span>
            </button>
          </div>
        </div>

        {/* Upload Drop Zone */}
        <div className="mt-4 p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-xl transition-all text-center">
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">
              {file ? `Đã chọn file: ${file.name}` : 'Nhấn vào đây để tải lên file Excel “THIẾT BỊ BƠM BỘ PHẬN KTHT - 2026.xlsx”'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ định dạng .xlsx, .xls · Hệ thống sẽ đọc toàn bộ sheets và phân tích cột tự động
            </p>
          </label>
        </div>
      </div>

      {/* Sheets Detected Section */}
      {sheets.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              Các Sheet tìm thấy trong file ({sheets.length} sheets)
            </h3>
            <span className="text-xs text-slate-500">
              Chọn sheet để xem trước và thiết lập ánh xạ cột:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {sheets.map(s => {
              const isSelected = s.sheetName === selectedSheetName;
              return (
                <button
                  key={s.sheetName}
                  onClick={() => handleSheetChange(s.sheetName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{s.sheetName}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {s.rowCount} dòng
                  </span>
                </button>
              );
            })}
          </div>

          {/* Column Mapping Section for selected sheet */}
          {activeSheet && (
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Phương án ánh xạ cột (Column Mapping) cho sheet: <span className="text-blue-700 font-mono">{activeSheet.sheetName}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống đã tự động gợi ý các cột tương ứng. Bạn có thể kiểm tra và điều chỉnh bên dưới:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã thiết bị / Mã bơm *</label>
                  <select
                    value={mapping.code}
                    onChange={(e) => handleMappingChange('code', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium"
                  >
                    <option value="">-- Tự động tạo mã --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
                  <select
                    value={mapping.name}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium"
                  >
                    <option value="">-- Chọn cột --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model / Mã hiệu</label>
                  <select
                    value={mapping.model}
                    onChange={(e) => handleMappingChange('model', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="">-- Không có --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Công suất (kW)</label>
                  <select
                    value={mapping.powerKw}
                    onChange={(e) => handleMappingChange('powerKw', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-blue-700"
                  >
                    <option value="">-- Không có --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thương hiệu / Hãng</label>
                  <select
                    value={mapping.brand}
                    onChange={(e) => handleMappingChange('brand', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="">-- Không có --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vị trí lắp đặt</label>
                  <select
                    value={mapping.locationDetail}
                    onChange={(e) => handleMappingChange('locationDetail', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="">-- Không có --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạm / Khu vực</label>
                  <select
                    value={mapping.station}
                    onChange={(e) => handleMappingChange('station', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="">-- Dùng tên sheet --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhật ký / Lịch sử</label>
                  <select
                    value={mapping.notes}
                    onChange={(e) => handleMappingChange('notes', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="">-- Không có --</option>
                    {activeSheet.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          {previewRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900">Bản xem trước dữ liệu (Preview):</span>
                  <span className="text-slate-500">
                    {previewRecords.length} dòng dữ liệu · Phát hiện <span className={`font-bold ${duplicateCodes.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{duplicateCodes.length}</span> mã đã tồn tại trong hệ thống.
                  </span>
                </div>

                {/* Import Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExecuteImport('append')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Nhập an toàn (Bỏ qua mã trùng)</span>
                  </button>
                  <button
                    onClick={() => handleExecuteImport('replace')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <span>Ghi đè danh mục</span>
                  </button>
                </div>
              </div>

              {/* Duplicate alert if any */}
              {duplicateCodes.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Các mã sau đã có trong hệ thống: <span className="font-mono font-bold">{duplicateCodes.slice(0, 5).join(', ')}</span> {duplicateCodes.length > 5 ? `và ${duplicateCodes.length - 5} mã khác` : ''}. Khi chọn "Nhập an toàn", các mã này sẽ được giữ nguyên dữ liệu gốc, không ghi đè mất mát.
                  </span>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Nhập dữ liệu thành công!</div>
                    <div>
                      Đã nạp <span className="font-bold">{importResult.imported}</span> thiết bị mới vào cơ sở dữ liệu. Bỏ qua <span className="font-bold">{importResult.duplicates}</span> bản ghi trùng mã để bảo vệ lịch sử.
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold sticky top-0">
                      <th className="py-2.5 px-3">Dòng Excel</th>
                      <th className="py-2.5 px-3">Mã thiết bị</th>
                      <th className="py-2.5 px-3">Tên thiết bị</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3 text-right">Công suất (kW)</th>
                      <th className="py-2.5 px-3">Hãng</th>
                      <th className="py-2.5 px-3">Vị trí</th>
                      <th className="py-2.5 px-3">Kiểm tra trùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewRecords.slice(0, 20).map((r, idx) => {
                      const isDup = r.code && duplicateCodes.includes(r.code);
                      return (
                        <tr key={idx} className={isDup ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            #{r.sourceRow}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                            {r.code}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {r.name}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {r.model}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                            {r.powerKw} kW
                          </td>
                          <td className="py-2 px-3">{r.brand}</td>
                          <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{r.locationDetail || '---'}</td>
                          <td className="py-2 px-3">
                            {isDup ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Trùng mã ({r.code})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Mới hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel Sheet Structure Architecture Explanation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Đề xuất cấu trúc dữ liệu theo file “THIẾT BỊ BƠM BỘ PHẬN KTHT - 2026.xlsx”
        </h3>
        <p className="text-slate-600">
          Sau khi khảo sát các phân hệ dữ liệu, bảng ánh xạ quan hệ của ứng dụng được thiết kế tương thích tuyệt đối với cấu trúc các sheet:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">1. Sheet PL2 & Danh mục trạm</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Ánh xạ vào bảng <strong>assets</strong> và <strong>stations</strong>. Lưu đầy đủ cột áp H, lưu lượng Q, số tầng cánh, năm nhập kho và năm đưa vào sử dụng.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">2. Sheets Sửa chữa 2026</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Ánh xạ vào bảng <strong>repair_orders</strong>. Tự động tính số ngày thiết bị nằm ngoài vận hành, theo dõi nhà thầu Đức Phát, Toàn Cầu và cảnh báo quá hạn.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">3. Sheet PL1- KH BT & Hư hỏng</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Ánh xạ vào bảng <strong>maintenance_plans</strong> và <strong>disposal_records</strong>. Đánh dấu nhãn năm gốc 2022 để bảo tồn lịch sử và hỗ trợ kế hoạch 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
