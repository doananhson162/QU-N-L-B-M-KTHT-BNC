export type PumpStatus = 
  | 'active'       // Đang sử dụng
  | 'standby'      // Dự phòng
  | 'repairing'    // Đang sửa chữa
  | 'damaged'      // Hư hỏng
  | 'pending_disposal' // Chờ thanh lý
  | 'disposed';    // Đã thanh lý

export type RepairStatus = 
  | 'pending_send'   // Chờ gửi sửa
  | 'sent'           // Đã gửi sửa
  | 'in_repair'      // Đang sửa chữa
  | 'pending_return' // Chờ nhận về
  | 'received'       // Đã nhận về (chưa nghiệm thu)
  | 'inspected'      // Đã kiểm tra và nghiệm thu
  | 'unrepairable';  // Không sửa được, đề xuất thanh lý

export type MaintenanceFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'operating_hours';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'postponed' | 'overdue';

export type UserRole = 'admin' | 'manager' | 'technician';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  roleTitle: string; // "Quản trị viên", "Quản lý / Trưởng bộ phận", "Kỹ thuật viên"
  avatar?: string;
  phone?: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  category: 'water_supply' | 'wastewater' | 'booster' | 'deep_well' | 'warehouse';
  description: string;
  elevation?: string; // Cao độ Bà Nà Hills
  manager: string;
  notes?: string;
}

export interface Asset {
  id: string;
  code: string;                // Mã bơm (e.g. BOM-DP-01, BOM-HT-02)
  name: string;                // Tên thiết bị (e.g. Bơm hỏa tiễn giếng 2, Bơm ly tâm trục ngang số 1)
  stationId: string;           // Trạm hoặc khu vực quản lý
  locationDetail: string;      // Vị trí lắp đặt chi tiết
  category: string;            // Chủng loại bơm (Hỏa tiễn, Trục đứng, Ly tâm trục ngang, Chìm nước thải...)
  purpose: string;             // Mục đích sử dụng (Cấp nước thô, Tăng áp đồi, Thoát nước, Bù áp PCCC...)
  brand: string;               // Thương hiệu (Grundfos, Ebara, Pentax, Tsurumi, Wilo...)
  model: string;               // Model (CR 32-4, SP 17-10...)
  powerKw: number;             // Công suất (kW)
  impellerStage: 'Có' | 'Không' | 'Chưa xác định'; // Tầng cánh
  origin: string;              // Xuất xứ (Ý, Đan Mạch, Nhật Bản, Trung Quốc...)
  importYear?: number;         // Năm nhập kho
  useYear?: number;            // Năm đưa vào sử dụng
  techSpecs: string;           // Thông số kỹ thuật chi tiết (H, Q, V, rpm)
  status: PumpStatus;          // Tình trạng hiện tại
  isStandby: boolean;          // Phân loại: Vận hành chính hay Dự phòng
  logHistory: string;          // Nhật ký thiết bị (nhiều dòng)
  imageUrl?: string;
  sourceSheet?: string;        // Tên sheet nguồn Excel
  sourceRow?: number;          // Số dòng trong Excel
  updatedBy: string;           // Người cập nhật gần nhất
  createdAt: string;
  updatedAt: string;
}

export interface RepairOrder {
  id: string;
  orderCode: string;           // Mã phiếu sửa chữa (e.g. SC-2026-001)
  assetId: string;             // ID thiết bị liên quan
  assetCode: string;
  assetName: string;
  stationId: string;
  model: string;
  powerKw: number;
  quantity: number;
  preRemovalLocation: string;  // Vị trí trước khi tháo
  failureReason: string;       // Lý do hư hỏng
  symptoms: string;            // Mô tả hiện tượng
  detectedDate: string;        // Ngày phát hiện hư hỏng
  removalDate?: string;        // Ngày tháo thiết bị
  sentDate?: string;           // Ngày gửi sửa
  handedBy?: string;           // Người bàn giao
  repairVendor: string;        // Đơn vị sửa chữa bên ngoài
  repairCost?: number;         // Chi phí sửa chữa (VNĐ)
  expectedReturnDate: string;  // Ngày dự kiến hoàn thành
  actualReturnDate?: string;   // Ngày thực tế nhận về
  receivedBy?: string;         // Người nhận thiết bị
  inspectionResult?: string;   // Kết quả kiểm tra sau sửa chữa
  status: RepairStatus;        // Trạng thái phiếu
  notes?: string;
  replacementAssetCode?: string; // Thiết bị lắp thay thế tạm thời (nếu có)
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlan {
  id: string;
  taskCode: string;            // Mã công việc (e.g. BT-2026-03)
  assetId: string;
  assetCode: string;
  assetName: string;
  stationId: string;
  title: string;               // Nội dung bảo trì
  frequency: MaintenanceFrequency;
  scheduledDate: string;       // Ngày dự kiến
  executedDate?: string;       // Ngày thực hiện
  assignee: string;            // Người phụ trách
  collaborators?: string;      // Nhân sự phối hợp
  materialsUsed?: string;      // Vật tư sử dụng
  inspectionResults?: string;  // Kết quả kiểm tra
  issuesFound?: string;        // Tồn tại phát hiện
  correctiveAction?: string;   // Hành động khắc phục
  status: MaintenanceStatus;
  yearOriginal?: number;       // Giữ thông tin năm gốc (ví dụ file 2022)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  transactionCode: string;     // Mã giao dịch (e.g. GD-2026-012)
  type: 'import' | 'export' | 'transfer'; // Nhập kho / Xuất kho / Điều chuyển
  assetId: string;
  assetCode: string;
  assetName: string;
  warehouseLocation: string;   // Vị trí lưu kho
  quantity: number;
  sender: string;              // Người giao
  receiver: string;            // Người nhận
  fromLocation: string;
  toLocation: string;
  reason: string;              // Lý do điều chuyển
  date: string;
  status: 'completed' | 'pending';
  notes?: string;
}

export interface DisposalRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  powerKw: number;
  model: string;
  currentLocation: string;
  formerPurpose: string;
  damageDescription: string;
  cause: string;
  detectedDate: string;
  proposedAction: 'evaluate' | 'repair' | 'scrap'; // Đề xuất
  disposalStatus: 
    | 'waiting_evaluation'    // Hư hỏng chờ đánh giá
    | 'waiting_repair'        // Chờ sửa chữa
    | 'in_repair'             // Đang sửa chữa
    | 'cannot_repair'         // Không sửa được
    | 'pending_approval'      // Chờ phê duyệt thanh lý
    | 'approved'              // Đã phê duyệt thanh lý
    | 'disposed';             // Đã thanh lý
  assignee: string;
  approvalDate?: string;
  approvedBy?: string;
  actualDisposalDate?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  targetType: 'asset' | 'repair' | 'maintenance' | 'inventory' | 'disposal' | 'system';
  targetId: string;
  details: string;
}
