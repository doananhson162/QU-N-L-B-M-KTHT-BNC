import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import {
  Asset,
  Station,
  RepairOrder,
  MaintenancePlan,
  InventoryTransaction,
  DisposalRecord,
  UserProfile,
  PumpStatus
} from './types/pump';

import { LoginView } from './components/auth/LoginView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AssetListView } from './components/assets/AssetListView';
import { StationManagerView } from './components/stations/StationManagerView';
import { WarehouseView } from './components/warehouse/WarehouseView';
import { RepairManagerView } from './components/repairs/RepairManagerView';
import { MaintenanceManagerView } from './components/maintenance/MaintenanceManagerView';
import { DisposalView } from './components/disposal/DisposalView';
import { ReportsView } from './components/reports/ReportsView';
import { ExcelImportView } from './components/excel/ExcelImportView';
import { HistoryView } from './components/history/HistoryView';
import { UserManagerView } from './components/users/UserManagerView';
import { SettingsView } from './components/settings/SettingsView';
import { AssetDetailModal } from './components/assets/AssetDetailModal';
import { AssetFormModal } from './components/assets/AssetFormModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storage.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live state from storage
  const [assets, setAssets] = useState<Asset[]>(storage.getAssets());
  const [stations, setStations] = useState<Station[]>(storage.getStations());
  const [repairs, setRepairs] = useState<RepairOrder[]>(storage.getRepairs());
  const [maintenance, setMaintenance] = useState<MaintenancePlan[]>(storage.getMaintenancePlans());
  const [inventory, setInventory] = useState<InventoryTransaction[]>(storage.getInventory());
  const [disposal, setDisposal] = useState<DisposalRecord[]>(storage.getDisposalRecords());
  const [auditLogs, setAuditLogs] = useState(storage.getAuditLogs());

  // Cross-view selection modals
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [showAssetFormModal, setShowAssetFormModal] = useState(false);

  // Filters passed from dashboard cards
  const [assetFilters, setAssetFilters] = useState<{ stationId?: string; status?: PumpStatus }>({});

  // Sync state on storage updates
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setIsAuthenticated(storage.isAuthenticated());
      setCurrentUser(storage.getCurrentUser());
      setAssets(storage.getAssets());
      setStations(storage.getStations());
      setRepairs(storage.getRepairs());
      setMaintenance(storage.getMaintenancePlans());
      setInventory(storage.getInventory());
      setDisposal(storage.getDisposalRecords());
      setAuditLogs(storage.getAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  // Navigation with optional filter payload
  const handleNavigate = (menuKey: string, filterPayload?: any) => {
    setActiveMenu(menuKey);
    if (menuKey === 'assets' && filterPayload) {
      setAssetFilters(filterPayload);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    storage.logout();
    setIsAuthenticated(false);
  };

  // Asset Handlers
  const handleSaveAsset = (assetData: Partial<Asset>, isNew: boolean) => {
    storage.saveAsset(assetData as Asset, isNew);
  };

  const handleDeleteAsset = (assetId: string) => {
    storage.deleteAsset(assetId);
    if (selectedAssetForModal && selectedAssetForModal.id === assetId) {
      setSelectedAssetForModal(null);
    }
    if (assetToEdit && assetToEdit.id === assetId) {
      setAssetToEdit(null);
      setShowAssetFormModal(false);
    }
  };

  const handleChangeStatus = (assetId: string, newStatus: PumpStatus, notes: string) => {
    storage.updateAssetStatus(assetId, newStatus, notes);
    if (selectedAssetForModal && selectedAssetForModal.id === assetId) {
      setSelectedAssetForModal({ ...selectedAssetForModal, status: newStatus });
    }
  };

  const handleSaveRepair = (repair: RepairOrder, isNew: boolean) => {
    storage.saveRepair(repair, isNew);
    // If repair was created and asset status is active, optionally update asset to 'repairing'
    if ((isNew && repair.status === 'in_repair') || repair.status === 'sent') {
      const target = assets.find(a => a.id === repair.assetId || a.code === repair.assetCode);
      if (target && target.status !== 'repairing') {
        storage.updateAssetStatus(target.id, 'repairing', `Gửi sửa chữa theo phiếu ${repair.orderCode}`);
      }
    }
  };

  const handleAcceptInspection = (
    repair: RepairOrder,
    isOperational: boolean,
    newLocation: string,
    remarks: string
  ) => {
    const updatedRepair: RepairOrder = {
      ...repair,
      status: 'inspected',
      inspectionResult: remarks,
      actualReturnDate: repair.actualReturnDate || new Date().toISOString().slice(0, 10),
      receivedBy: currentUser.name,
      updatedAt: new Date().toISOString()
    };
    storage.saveRepair(updatedRepair, false);

    // Update target asset
    const target = assets.find(a => a.id === repair.assetId || a.code === repair.assetCode);
    if (target) {
      const newStatus: PumpStatus = isOperational ? 'active' : 'standby';
      storage.updateAssetStatus(
        target.id,
        newStatus,
        `Nghiệm thu sau sửa chữa (Phiếu ${repair.orderCode}): ${remarks}. Vị trí mới: ${newLocation}`
      );
      if (newLocation && newLocation !== target.locationDetail) {
        storage.saveAsset({ ...target, locationDetail: newLocation, status: newStatus }, false);
      }
    }
  };

  const handleSaveMaintenancePlan = (plan: MaintenancePlan, isNew: boolean) => {
    storage.saveMaintenancePlan(plan, isNew);
  };

  const handleSaveInventoryTransaction = (tx: InventoryTransaction) => {
    storage.saveInventoryTransaction(tx);
  };

  const handleSaveDisposalRecord = (record: DisposalRecord, isNew: boolean) => {
    storage.saveDisposalRecord(record, isNew);
    if (isNew) {
      const target = assets.find(a => a.code === record.assetCode);
      if (target && target.status !== 'pending_disposal') {
        storage.updateAssetStatus(target.id, 'pending_disposal', `Lập hồ sơ thanh lý: ${record.damageDescription}`);
      }
    } else if (record.disposalStatus === 'disposed') {
      const target = assets.find(a => a.code === record.assetCode);
      if (target && target.status !== 'disposed') {
        storage.updateAssetStatus(target.id, 'disposed', `Đã thanh lý thực tế`);
      }
    }
  };

  const handleBulkImport = (newAssets: Asset[], mode: 'append' | 'replace') => {
    return storage.bulkImportAssets(newAssets, mode);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu của 15 trạm BNC?')) {
      storage.resetToDefaults();
    }
  };

  // If not authenticated, render Login view
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Badge calculations
  const activeRepairsCount = repairs.filter(r => r.status === 'in_repair' || r.status === 'sent').length;
  const maintenanceOverdueCount = maintenance.filter(m => m.status === 'overdue').length;
  const disposalCount = disposal.filter(d => d.disposalStatus === 'pending_approval' || d.disposalStatus === 'waiting_evaluation').length;

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        repairsCount={activeRepairsCount}
        maintenanceOverdueCount={maintenanceOverdueCount}
        disposalCount={disposalCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeMenu={activeMenu}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {activeMenu === 'dashboard' && (
            <DashboardView
              assets={assets}
              stations={stations}
              repairs={repairs}
              maintenancePlans={maintenance}
              disposalRecords={disposal}
              onNavigate={handleNavigate}
            />
          )}

          {activeMenu === 'assets' && (
            <AssetListView
              assets={assets}
              stations={stations}
              repairs={repairs}
              maintenancePlans={maintenance}
              currentUser={currentUser}
              initialFilters={assetFilters}
              onSaveAsset={handleSaveAsset}
              onChangeStatus={handleChangeStatus}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeMenu === 'stations' && (
            <StationManagerView
              stations={stations}
              assets={assets}
              repairs={repairs}
              maintenancePlans={maintenance}
              onSelectAsset={(a) => setSelectedAssetForModal(a)}
              onAddStation={(st) => storage.saveStation(st)}
            />
          )}

          {activeMenu === 'warehouse' && (
            <WarehouseView
              assets={assets}
              stations={stations}
              inventory={inventory}
              currentUser={currentUser}
              onSaveTransaction={handleSaveInventoryTransaction}
              onSelectAsset={(a) => setSelectedAssetForModal(a)}
            />
          )}

          {activeMenu === 'repairs' && (
            <RepairManagerView
              repairs={repairs}
              assets={assets}
              stations={stations}
              currentUser={currentUser}
              onSaveRepair={handleSaveRepair}
              onAcceptInspection={handleAcceptInspection}
            />
          )}

          {activeMenu === 'maintenance' && (
            <MaintenanceManagerView
              plans={maintenance}
              assets={assets}
              stations={stations}
              currentUser={currentUser}
              onSavePlan={handleSaveMaintenancePlan}
            />
          )}

          {activeMenu === 'history' && (
            <HistoryView logs={auditLogs} />
          )}

          {activeMenu === 'disposal' && (
            <DisposalView
              records={disposal}
              assets={assets}
              currentUser={currentUser}
              onSaveRecord={handleSaveDisposalRecord}
              onSelectAsset={(a) => setSelectedAssetForModal(a)}
            />
          )}

          {activeMenu === 'reports' && (
            <ReportsView
              assets={assets}
              stations={stations}
              repairs={repairs}
              maintenancePlans={maintenance}
              inventory={inventory}
              disposalRecords={disposal}
              currentUser={currentUser}
            />
          )}

          {activeMenu === 'excel-import' && (
            <ExcelImportView
              currentAssets={assets}
              stations={stations}
              currentUser={currentUser}
              onBulkImport={handleBulkImport}
              onResetDefaults={handleResetDefaults}
            />
          )}

          {activeMenu === 'users' && (
            <UserManagerView currentUser={currentUser} />
          )}

          {activeMenu === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
      </div>

      {/* Global Asset Detail Modal */}
      {selectedAssetForModal && (
        <AssetDetailModal
          asset={selectedAssetForModal}
          stations={stations}
          repairs={repairs}
          maintenancePlans={maintenance}
          currentUser={currentUser}
          onClose={() => setSelectedAssetForModal(null)}
          onEdit={(a) => {
            setSelectedAssetForModal(null);
            setAssetToEdit(a);
            setShowAssetFormModal(true);
          }}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDeleteAsset}
        />
      )}

      {/* Global Asset Form Modal */}
      {showAssetFormModal && (
        <AssetFormModal
          assetToEdit={assetToEdit}
          stations={stations}
          onClose={() => {
            setShowAssetFormModal(false);
            setAssetToEdit(null);
          }}
          onSave={handleSaveAsset}
          onDelete={handleDeleteAsset}
        />
      )}
    </div>
  );
}
