import {
  Asset,
  Station,
  RepairOrder,
  MaintenancePlan,
  InventoryTransaction,
  DisposalRecord,
  UserProfile,
  AuditLog,
  UserRole
} from '../types/pump';
import {
  INITIAL_USERS,
  INITIAL_STATIONS,
  INITIAL_ASSETS,
  INITIAL_REPAIR_ORDERS,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_DISPOSAL_RECORDS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'bnc_pumps_current_user',
  USERS: 'bnc_pumps_users',
  STATIONS: 'bnc_pumps_stations',
  ASSETS: 'bnc_pumps_assets',
  REPAIRS: 'bnc_pumps_repairs',
  MAINTENANCE: 'bnc_pumps_maintenance',
  INVENTORY: 'bnc_pumps_inventory',
  DISPOSAL: 'bnc_pumps_disposal',
  AUDIT: 'bnc_pumps_audit',
  INITIALIZED: 'bnc_pumps_initialized_v5',
  AUTH_STATUS: 'bnc_pumps_auth_status'
};

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized || initialized !== 'bnc_pumps_initialized_v5') {
      // Version 5 upgrade: clear old disposal records and ensure clean state
      localStorage.setItem(STORAGE_KEYS.DISPOSAL, JSON.stringify([]));
      
      let users = this.getUsers();
      users = users.filter(u => u.username !== 'hungnv' && u.username !== 'tritd' && !u.name.includes('Trần Đình Trí') && !u.name.includes('Nguyễn Văn Hùng'));
      if (!users.some(u => u.username?.toUpperCase() === 'KTHT@BNC')) {
        users.unshift(INITIAL_USERS[0]);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'bnc_pumps_initialized_v5');
    }
  }

  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(INITIAL_STATIONS));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(INITIAL_REPAIR_ORDERS));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE_PLANS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.DISPOSAL, JSON.stringify(INITIAL_DISPOSAL_RECORDS));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'bnc_pumps_initialized_v5');
    localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- CURRENT USER & AUTH ---
  public getCurrentUser(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return INITIAL_USERS[0];
    try {
      const parsed = JSON.parse(raw);
      if (parsed.username === 'hungnv' || parsed.username === 'tritd' || parsed.name?.includes('Trần Đình Trí') || parsed.name?.includes('Nguyễn Văn Hùng')) {
        return INITIAL_USERS[0];
      }
      return parsed;
    } catch {
      return INITIAL_USERS[0];
    }
  }

  public setCurrentUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.addAuditLog('Đổi tài khoản người dùng', 'system', user.id, `Đăng nhập quyền ${user.roleTitle}`);
    this.notify();
  }

  public getUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: UserProfile[] = raw ? JSON.parse(raw) : INITIAL_USERS;
    return users.filter(u => u.username !== 'hungnv' && u.username !== 'tritd' && !u.name.includes('Trần Đình Trí') && !u.name.includes('Nguyễn Văn Hùng'));
  }

  public deleteUser(userId: string): { success: boolean; message?: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'admin') {
      return { success: false, message: 'Chỉ có Quản trị viên (Admin) mới có quyền xóa nhân sự.' };
    }

    if (userId === currentUser.id) {
      return { success: false, message: 'Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình.' };
    }

    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Không tìm thấy tài khoản nhân sự cần xóa.' };
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    this.addAuditLog('Xóa nhân sự', 'system', targetUser.username || targetUser.email, `Quản trị viên ${currentUser.name} đã xóa tài khoản ${targetUser.name} (${targetUser.roleTitle})`);
    this.notify();
    return { success: true };
  }

  public addUser(userData: { name: string; username: string; email: string; role: UserRole; roleTitle: string; phone: string; password?: string }): { success: boolean; user?: UserProfile; message?: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'admin') {
      return { success: false, message: 'Chỉ có Quản trị viên (Admin) mới có quyền thêm nhân sự.' };
    }

    const users = this.getUsers();
    const exists = users.some(u => u.username?.toUpperCase() === userData.username.toUpperCase() || u.email.toUpperCase() === userData.email.toUpperCase());
    if (exists) {
      return { success: false, message: 'Tên đăng nhập hoặc email này đã tồn tại trong hệ thống!' };
    }

    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      name: userData.name.trim(),
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password || '123456',
      role: userData.role,
      roleTitle: userData.roleTitle,
      phone: userData.phone.trim()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.addAuditLog('Thêm nhân sự mới', 'system', newUser.username || newUser.email, `Quản trị viên ${currentUser.name} đã thêm tài khoản ${newUser.name} (${newUser.roleTitle})`);
    this.notify();
    return { success: true, user: newUser };
  }

  public isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH_STATUS) === 'true';
  }

  public login(usernameInput: string, passwordInput?: string): { success: boolean; user?: UserProfile; message?: string } {
    const users = this.getUsers();
    const normalized = usernameInput.trim().toUpperCase();
    
    // Support matching KTHT@BNC, username or email
    const found = users.find(u => 
      (u.username && u.username.toUpperCase() === normalized) ||
      (u.email && u.email.toUpperCase() === normalized) ||
      (normalized === 'KTHT@BNC' && (u.username?.toUpperCase() === 'KTHT@BNC' || u.id === 'user-ktht-bnc'))
    );

    if (!found) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!' };
    }

    // Verify password (default '123456' for KTHT@BNC or user password)
    const expectedPassword = found.password || '123456';
    if (!passwordInput || passwordInput !== expectedPassword) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!' };
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
    this.setCurrentUser(found);
    this.addAuditLog('Đăng nhập hệ thống', 'system', found.username || found.email, `Đăng nhập thành công với vai trò ${found.roleTitle}`);
    this.notify();
    return { success: true, user: found };
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
    this.addAuditLog('Đăng xuất hệ thống', 'system', this.getCurrentUser().name, 'Đăng xuất khỏi phiên làm việc');
    this.notify();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  }

  public addAuditLog(
    action: string,
    targetType: AuditLog['targetType'],
    targetId: string,
    details: string
  ) {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp,
      userName: user.name,
      action,
      targetType,
      targetId,
      details
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs.slice(0, 300))); // keep 300 logs
  }

  public deleteAuditLog(id: string) {
    const logs = this.getAuditLogs();
    const updated = logs.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    this.notify();
  }

  public clearAllAuditLogs() {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    this.notify();
  }

  // --- STATIONS ---
  public getStations(): Station[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STATIONS);
    return raw ? JSON.parse(raw) : INITIAL_STATIONS;
  }

  public saveStation(station: Station) {
    const stations = this.getStations();
    const idx = stations.findIndex(s => s.id === station.id);
    if (idx >= 0) {
      stations[idx] = station;
      this.addAuditLog('Cập nhật thông tin trạm', 'system', station.code, `Cập nhật trạm ${station.name}`);
    } else {
      stations.push(station);
      this.addAuditLog('Thêm mới trạm', 'system', station.code, `Thêm mới trạm ${station.name}`);
    }
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    this.notify();
  }

  // --- ASSETS ---
  public getAssets(): Asset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return raw ? JSON.parse(raw) : INITIAL_ASSETS;
  }

  public getAssetById(id: string): Asset | undefined {
    return this.getAssets().find(a => a.id === id);
  }

  public saveAsset(asset: Asset, isNew: boolean = false) {
    const assets = this.getAssets();
    const user = this.getCurrentUser();
    const now = new Date().toISOString();
    
    if (isNew) {
      asset.createdAt = now;
      asset.updatedAt = now;
      asset.updatedBy = user.name;
      assets.unshift(asset);
      this.addAuditLog('Thêm mới thiết bị', 'asset', asset.code, `Thêm thiết bị ${asset.name} (${asset.model})`);
    } else {
      const idx = assets.findIndex(a => a.id === asset.id);
      if (idx >= 0) {
        asset.updatedAt = now;
        asset.updatedBy = user.name;
        assets[idx] = asset;
        this.addAuditLog('Cập nhật thiết bị', 'asset', asset.code, `Cập nhật thông số ${asset.name}`);
      }
    }
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    this.notify();
  }

  public updateAssetStatus(assetId: string, newStatus: Asset['status'], notes?: string) {
    const assets = this.getAssets();
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const oldStatus = asset.status;
    asset.status = newStatus;
    asset.updatedAt = new Date().toISOString();
    asset.updatedBy = this.getCurrentUser().name;
    if (notes) {
      asset.logHistory = `${new Date().toLocaleDateString('vi-VN')}: [Chuyển trạng thái ${oldStatus} -> ${newStatus}] ${notes}\n` + (asset.logHistory || '');
    }
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    this.addAuditLog('Đổi trạng thái thiết bị', 'asset', asset.code, `Chuyển từ ${oldStatus} sang ${newStatus}. ${notes || ''}`);
    this.notify();
  }

  public deleteAsset(assetId: string): boolean {
    const assets = this.getAssets();
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return false;

    const remaining = assets.filter(a => a.id !== assetId);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(remaining));
    this.addAuditLog('Xóa thiết bị', 'asset', asset.code, `Xóa thiết bị ${asset.name} (${asset.model}) khỏi danh mục hệ thống`);
    this.notify();
    return true;
  }

  // --- REPAIR ORDERS ---
  public getRepairs(): RepairOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPAIRS);
    return raw ? JSON.parse(raw) : INITIAL_REPAIR_ORDERS;
  }

  public saveRepair(repair: RepairOrder, isNew: boolean = false) {
    const repairs = this.getRepairs();
    const now = new Date().toISOString();
    if (isNew) {
      repair.createdAt = now;
      repair.updatedAt = now;
      repairs.unshift(repair);
      this.addAuditLog('Tạo phiếu sửa chữa', 'repair', repair.orderCode, `Lập phiếu sửa ${repair.orderCode} cho ${repair.assetCode}`);
    } else {
      const idx = repairs.findIndex(r => r.id === repair.id);
      if (idx >= 0) {
        repair.updatedAt = now;
        repairs[idx] = repair;
        this.addAuditLog('Cập nhật phiếu sửa chữa', 'repair', repair.orderCode, `Cập nhật tiến độ ${repair.orderCode} - Trạng thái: ${repair.status}`);
      }
    }
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(repairs));
    this.notify();
  }

  public deleteRepair(id: string) {
    const list = this.getRepairs();
    const target = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(updated));
    if (target) {
      this.addAuditLog('Xóa phiếu sửa chữa', 'repair', target.orderCode, `Đã xóa phiếu sửa chữa ${target.orderCode} (${target.assetCode})`);
    }
    this.notify();
  }

  public clearAllRepairs() {
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify([]));
    this.addAuditLog('Xóa toàn bộ phiếu sửa chữa', 'repair', 'ALL', 'Đã xóa toàn bộ danh sách phiếu sửa chữa');
    this.notify();
  }

  // --- MAINTENANCE PLANS ---
  public getMaintenancePlans(): MaintenancePlan[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return raw ? JSON.parse(raw) : INITIAL_MAINTENANCE_PLANS;
  }

  public saveMaintenancePlan(plan: MaintenancePlan, isNew: boolean = false) {
    const plans = this.getMaintenancePlans();
    const now = new Date().toISOString();
    if (isNew) {
      plan.createdAt = now;
      plan.updatedAt = now;
      plans.unshift(plan);
      this.addAuditLog('Tạo kế hoạch bảo trì', 'maintenance', plan.taskCode, `Lập lịch ${plan.taskCode} cho ${plan.assetCode}`);
    } else {
      const idx = plans.findIndex(p => p.id === plan.id);
      if (idx >= 0) {
        plan.updatedAt = now;
        plans[idx] = plan;
        this.addAuditLog('Cập nhật bảo trì', 'maintenance', plan.taskCode, `Cập nhật kết quả ${plan.taskCode} (${plan.status})`);
      }
    }
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(plans));
    this.notify();
  }

  public deleteMaintenancePlan(id: string) {
    const list = this.getMaintenancePlans();
    const target = list.find(p => p.id === id);
    const updated = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(updated));
    if (target) {
      this.addAuditLog('Xóa kế hoạch bảo trì', 'maintenance', target.taskCode, `Đã xóa kế hoạch bảo trì ${target.taskCode} (${target.assetCode})`);
    }
    this.notify();
  }

  public clearAllMaintenancePlans() {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify([]));
    this.addAuditLog('Xóa toàn bộ kế hoạch bảo trì', 'maintenance', 'ALL', 'Đã xóa toàn bộ kế hoạch bảo trì định kỳ');
    this.notify();
  }

  // --- INVENTORY TRANSACTIONS ---
  public getInventory(): InventoryTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return raw ? JSON.parse(raw) : INITIAL_INVENTORY_TRANSACTIONS;
  }

  public saveInventoryTransaction(tx: InventoryTransaction) {
    const list = this.getInventory();
    list.unshift(tx);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list));
    this.addAuditLog('Giao dịch kho/điều chuyển', 'inventory', tx.transactionCode, `${tx.type === 'import' ? 'Nhập' : tx.type === 'export' ? 'Xuất' : 'Điều chuyển'} thiết bị ${tx.assetCode}`);
    this.notify();
  }

  public deleteInventoryTransaction(id: string) {
    const list = this.getInventory();
    const target = list.find(t => t.id === id);
    const updated = list.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
    if (target) {
      this.addAuditLog('Xóa giao dịch kho', 'inventory', target.transactionCode, `Đã xóa phiếu giao dịch kho ${target.transactionCode}`);
    }
    this.notify();
  }

  public clearAllInventoryTransactions() {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
    this.addAuditLog('Xóa toàn bộ giao dịch kho', 'inventory', 'ALL', 'Đã xóa toàn bộ lịch sử xuất nhập điều chuyển kho');
    this.notify();
  }

  // --- DISPOSAL RECORDS ---
  public getDisposalRecords(): DisposalRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPOSAL);
    return raw ? JSON.parse(raw) : INITIAL_DISPOSAL_RECORDS;
  }

  public saveDisposalRecord(record: DisposalRecord, isNew: boolean = false) {
    const records = this.getDisposalRecords();
    if (isNew) {
      record.createdAt = new Date().toISOString();
      records.unshift(record);
      this.addAuditLog('Lập hồ sơ hư hỏng/thanh lý', 'disposal', record.assetCode, `Lập hồ sơ thanh lý cho ${record.assetCode}`);
    } else {
      const idx = records.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        records[idx] = record;
        this.addAuditLog('Cập nhật hồ sơ thanh lý', 'disposal', record.assetCode, `Cập nhật trạng thái: ${record.disposalStatus}`);
      }
    }
    localStorage.setItem(STORAGE_KEYS.DISPOSAL, JSON.stringify(records));
    this.notify();
  }

  public deleteDisposalRecord(id: string) {
    const records = this.getDisposalRecords();
    const target = records.find(r => r.id === id);
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.DISPOSAL, JSON.stringify(updated));
    if (target) {
      this.addAuditLog('Xóa hồ sơ thanh lý', 'disposal', target.assetCode, `Đã xóa hồ sơ thanh lý thiết bị ${target.assetCode}`);
    }
    this.notify();
  }

  // --- BULK IMPORT FROM EXCEL ---
  public bulkImportAssets(newAssets: Asset[], mode: 'append' | 'replace'): { imported: number; duplicates: number } {
    let currentAssets = mode === 'replace' ? [] : this.getAssets();
    const existingCodes = new Set(currentAssets.map(a => a.code.toUpperCase()));
    let duplicates = 0;
    let imported = 0;

    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    for (const item of newAssets) {
      if (existingCodes.has(item.code.toUpperCase())) {
        duplicates++;
      } else {
        item.createdAt = now;
        item.updatedAt = now;
        item.updatedBy = user.name;
        currentAssets.push(item);
        existingCodes.add(item.code.toUpperCase());
        imported++;
      }
    }

    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(currentAssets));
    this.addAuditLog('Nhập dữ liệu Excel', 'asset', 'BULK_IMPORT', `Nhập thành công ${imported} thiết bị, phát hiện ${duplicates} mã trùng`);
    this.notify();
    return { imported, duplicates };
  }
}

export const storage = new StorageService();
