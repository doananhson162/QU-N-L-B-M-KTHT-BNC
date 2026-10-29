import * as XLSX from 'xlsx';
import { Asset, RepairOrder, MaintenancePlan, Station } from '../types/pump';

export interface ParsedSheetInfo {
  sheetName: string;
  rowCount: number;
  columns: string[];
  sampleData: Record<string, any>[];
}

export interface ColumnMapping {
  code: string;
  name: string;
  station: string;
  locationDetail: string;
  category: string;
  purpose: string;
  brand: string;
  model: string;
  powerKw: string;
  impellerStage: string;
  origin: string;
  importYear: string;
  useYear: string;
  techSpecs: string;
  status: string;
  notes: string;
}

export const excelService = {
  /**
   * Parse an uploaded Excel file and return metadata and samples for all sheets
   */
  async readWorkbook(file: File): Promise<{ workbook: XLSX.WorkBook; sheets: ParsedSheetInfo[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets: ParsedSheetInfo[] = [];

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!rawJson || rawJson.length === 0) continue;

            // Detect header row (first non-empty row with strings)
            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(rawJson.length, 6); i++) {
              const row = rawJson[i];
              if (Array.isArray(row) && row.filter(cell => typeof cell === 'string' && cell.trim().length > 1).length >= 3) {
                headerRowIndex = i;
                break;
              }
            }

            const headerRow = rawJson[headerRowIndex] || [];
            const columns = headerRow.map((c: any, idx: number) => (c ? String(c).trim() : `Cột_${idx + 1}`));

            const dataRows = rawJson.slice(headerRowIndex + 1);
            const sampleData: Record<string, any>[] = [];

            dataRows.forEach((row, rowIdx) => {
              if (!Array.isArray(row) || row.every(c => c === undefined || c === null || c === '')) return;
              const record: Record<string, any> = { __sourceRow: headerRowIndex + 1 + rowIdx + 1 };
              columns.forEach((col: string, colIdx: number) => {
                record[col] = row[colIdx] ?? '';
              });
              sampleData.push(record);
            });

            sheets.push({
              sheetName,
              rowCount: sampleData.length,
              columns,
              sampleData: sampleData.slice(0, 50) // preview first 50
            });
          }

          resolve({ workbook, sheets });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Suggest best column mappings based on typical Vietnamese header names
   */
  suggestMapping(columns: string[]): ColumnMapping {
    const findMatch = (keywords: string[]): string => {
      for (const col of columns) {
        const lower = col.toLowerCase();
        if (keywords.some(k => lower.includes(k.toLowerCase()))) {
          return col;
        }
      }
      return '';
    };

    return {
      code: findMatch(['mã bơm', 'mã thiết bị', 'mã số', 'mã tb', 'id']),
      name: findMatch(['tên thiết bị', 'tên bơm', 'tên máy', 'chủng loại']),
      station: findMatch(['trạm', 'khu vực', 'vị trí trạm']),
      locationDetail: findMatch(['vị trí lắp đặt', 'vị trí', 'nơi đặt', 'điểm lắp']),
      category: findMatch(['chủng loại bơm', 'loại bơm', 'loại thiết bị']),
      purpose: findMatch(['mục đích sử dụng', 'mục đích', 'công năng', 'chức năng']),
      brand: findMatch(['thương hiệu', 'hãng sản xuất', 'hãng', 'nhãn hiệu']),
      model: findMatch(['model', 'mã hiệu', 'kiểu']),
      powerKw: findMatch(['công suất', 'kw', 'p(kw)', 'power']),
      impellerStage: findMatch(['tầng cánh', 'cánh', 'số tầng']),
      origin: findMatch(['xuất xứ', 'nước sản xuất', 'quốc gia']),
      importYear: findMatch(['năm nhập', 'năm nhập kho', 'năm mua']),
      useYear: findMatch(['năm sử dụng', 'năm đưa vào', 'năm vận hành']),
      techSpecs: findMatch(['thông số kỹ thuật', 'thông số', 'cột áp', 'lưu lượng', 'specs']),
      status: findMatch(['tình trạng', 'trạng thái', 'hiện trạng']),
      notes: findMatch(['nhật ký', 'ghi chú', 'lịch sử', 'nội dung']),
    };
  },

  /**
   * Export all asset data to Excel
   */
  exportAssetsToExcel(assets: Asset[], stations: Station[]) {
    const stationMap = new Map(stations.map(s => [s.id, s.name]));

    const rows = assets.map((a, idx) => ({
      'STT': idx + 1,
      'Mã thiết bị': a.code,
      'Tên thiết bị': a.name,
      'Trạm / Khu vực': stationMap.get(a.stationId) || a.stationId,
      'Vị trí chi tiết': a.locationDetail,
      'Chủng loại': a.category,
      'Mục đích sử dụng': a.purpose,
      'Hãng sản xuất': a.brand,
      'Model': a.model,
      'Công suất (kW)': a.powerKw,
      'Tầng cánh': a.impellerStage,
      'Xuất xứ': a.origin,
      'Năm nhập kho': a.importYear || '',
      'Năm sử dụng': a.useYear || '',
      'Tình trạng': a.status === 'active' ? 'Đang sử dụng'
        : a.status === 'standby' ? 'Dự phòng'
        : a.status === 'repairing' ? 'Đang sửa chữa'
        : a.status === 'damaged' ? 'Hư hỏng'
        : a.status === 'pending_disposal' ? 'Chờ thanh lý'
        : 'Đã thanh lý',
      'Phân loại vận hành': a.isStandby ? 'Dự phòng' : 'Vận hành chính',
      'Thông số kỹ thuật': a.techSpecs,
      'Nhật ký thiết bị': a.logHistory,
      'Sheet nguồn': a.sourceSheet || '',
      'Dòng nguồn': a.sourceRow || '',
      'Người cập nhật': a.updatedBy,
      'Ngày cập nhật': new Date(a.updatedAt).toLocaleDateString('vi-VN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh mục thiết bị bơm BNC');
    
    // Auto column width
    const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length * 1.5, 14) }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `DANH_MUC_BOM_KTHT_BNC_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export Repair tracking to Excel
   */
  exportRepairsToExcel(repairs: RepairOrder[], stations: Station[]) {
    const stationMap = new Map(stations.map(s => [s.id, s.name]));
    const rows = repairs.map((r, idx) => ({
      'STT': idx + 1,
      'Mã phiếu': r.orderCode,
      'Mã bơm': r.assetCode,
      'Tên thiết bị': r.assetName,
      'Trạm': stationMap.get(r.stationId) || r.stationId,
      'Công suất (kW)': r.powerKw,
      'Model': r.model,
      'Đơn vị sửa chữa': r.repairVendor,
      'Lý do hư hỏng': r.failureReason,
      'Ngày tháo': r.removalDate || '',
      'Ngày gửi sửa': r.sentDate || '',
      'Ngày hẹn trả': r.expectedReturnDate,
      'Ngày thực tế nhận': r.actualReturnDate || '',
      'Chi phí (VNĐ)': r.repairCost || 0,
      'Trạng thái': r.status === 'in_repair' ? 'Đang sửa chữa'
        : r.status === 'pending_return' ? 'Chờ nhận về'
        : r.status === 'received' ? 'Đã nhận về (chờ nghiệm thu)'
        : r.status === 'inspected' ? 'Đã nghiệm thu'
        : r.status === 'unrepairable' ? 'Không sửa được'
        : 'Chờ gửi',
      'Kết quả kiểm tra': r.inspectionResult || '',
      'Ghi chú': r.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sửa chữa thiết bị 2026');
    XLSX.writeFile(workbook, `THEO_DOI_SUA_CHUA_BNC_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export Maintenance schedule to Excel
   */
  exportMaintenanceToExcel(plans: MaintenancePlan[], stations: Station[]) {
    const stationMap = new Map(stations.map(s => [s.id, s.name]));
    const rows = plans.map((p, idx) => ({
      'STT': idx + 1,
      'Mã công việc': p.taskCode,
      'Mã bơm': p.assetCode,
      'Tên thiết bị': p.assetName,
      'Trạm': stationMap.get(p.stationId) || p.stationId,
      'Nội dung bảo trì': p.title,
      'Tần suất': p.frequency === 'monthly' ? 'Hàng tháng'
        : p.frequency === 'quarterly' ? 'Hàng quý'
        : p.frequency === 'biannual' ? '6 tháng'
        : 'Hàng năm',
      'Ngày dự kiến': p.scheduledDate,
      'Ngày thực hiện': p.executedDate || '',
      'Người phụ trách': p.assignee,
      'Phối hợp': p.collaborators || '',
      'Trạng thái': p.status === 'completed' ? 'Hoàn thành'
        : p.status === 'overdue' ? 'Quá hạn'
        : p.status === 'in_progress' ? 'Đang thực hiện'
        : 'Chưa thực hiện',
      'Kết quả': p.inspectionResults || '',
      'Tồn tại': p.issuesFound || '',
      'Khắc phục': p.correctiveAction || '',
      'Hồ sơ gốc năm': p.yearOriginal || 2026
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kế hoạch bảo trì BNC');
    XLSX.writeFile(workbook, `KE_HOACH_BAO_TRI_BNC_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
};
