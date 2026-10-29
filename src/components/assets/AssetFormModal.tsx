import React, { useState, useEffect } from 'react';
import { Asset, Station, PumpStatus } from '../../types/pump';
import { X, Save, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';

interface AssetFormModalProps {
  assetToEdit?: Asset | null;
  stations: Station[];
  onClose: () => void;
  onSave: (assetData: Partial<Asset>, isNew: boolean) => void;
  onDelete?: (assetId: string) => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  assetToEdit,
  stations,
  onClose,
  onSave,
  onDelete
}) => {
  const isNew = !assetToEdit;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    stationId: stations[0]?.id || '',
    locationDetail: '',
    category: 'Bơm ly tâm trục ngang',
    purpose: 'Cấp nước sinh hoạt',
    brand: 'Grundfos',
    model: '',
    powerKw: 7.5,
    impellerStage: 'Có' as 'Có' | 'Không' | 'Chưa xác định',
    origin: 'Ý',
    importYear: 2023,
    useYear: 2023,
    techSpecs: '',
    status: 'active' as PumpStatus,
    isStandby: false,
    logHistory: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        code: assetToEdit.code,
        name: assetToEdit.name,
        stationId: assetToEdit.stationId,
        locationDetail: assetToEdit.locationDetail || '',
        category: assetToEdit.category,
        purpose: assetToEdit.purpose,
        brand: assetToEdit.brand,
        model: assetToEdit.model,
        powerKw: assetToEdit.powerKw,
        impellerStage: assetToEdit.impellerStage,
        origin: assetToEdit.origin || '',
        importYear: assetToEdit.importYear || 2023,
        useYear: assetToEdit.useYear || 2023,
        techSpecs: assetToEdit.techSpecs || '',
        status: assetToEdit.status,
        isStandby: assetToEdit.isStandby,
        logHistory: assetToEdit.logHistory || ''
      });
    }
  }, [assetToEdit]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) errs.code = 'Mã bơm là bắt buộc (ví dụ: BOM-DP-01)';
    if (!formData.name.trim()) errs.name = 'Tên thiết bị là bắt buộc';
    if (!formData.stationId) errs.stationId = 'Vui lòng chọn trạm quản lý';
    if (!formData.model.trim()) errs.model = 'Model thiết bị là bắt buộc';
    if (Number(formData.powerKw) <= 0) errs.powerKw = 'Công suất phải lớn hơn 0 kW';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      powerKw: Number(formData.powerKw),
      importYear: Number(formData.importYear) || undefined,
      useYear: Number(formData.useYear) || undefined,
      id: assetToEdit ? assetToEdit.id : 'ast-' + Date.now()
    }, isNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold">
              {isNew ? 'Thêm mới thiết bị bơm / motor' : `Chỉnh sửa thông số: ${assetToEdit?.code}`}
            </h2>
            <p className="text-xs text-slate-400">
              Bộ phận Kỹ thuật Hạ tầng Bà Nà Hills · BNC
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mã thiết bị */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mã bơm / Thiết bị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: BOM-HT-05, BOM-DPP-03"
                className={`w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-semibold text-slate-900 ${
                  errors.code ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.code && <p className="text-[11px] text-red-500 mt-1">{errors.code}</p>}
            </div>

            {/* Tên thiết bị */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Bơm hỏa tiễn giếng GK-03 Đập Pháp"
                className={`w-full p-2.5 bg-slate-50 border rounded-lg font-medium text-slate-900 ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Trạm quản lý */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Trạm / Khu vực <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                ))}
              </select>
            </div>

            {/* Vị trí chi tiết */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vị trí lắp đặt chi tiết
              </label>
              <input
                type="text"
                value={formData.locationDetail}
                onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
                placeholder="VD: Bệ số 1 - Buồng bơm ngầm"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            {/* Chủng loại bơm */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chủng loại bơm</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Bơm hỏa tiễn">Bơm hỏa tiễn (Giếng khoan sâu)</option>
                <option value="Bơm trục đứng">Bơm trục đứng đa tầng cánh</option>
                <option value="Bơm ly tâm trục ngang">Bơm ly tâm trục ngang</option>
                <option value="Bơm chìm nước thải">Bơm chìm nước thải</option>
                <option value="Bơm định lượng">Bơm định lượng hóa chất</option>
                <option value="Motor điện rời">Motor điện rời</option>
                <option value="Tầng cánh / Buồng bơm">Tầng cánh / Buồng bơm thay thế</option>
              </select>
            </div>

            {/* Mục đích sử dụng */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mục đích sử dụng</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="VD: Cấp nước thô, Tăng áp đồi, Bơm bù áp PCCC"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            {/* Thương hiệu */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thương hiệu / Hãng</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Grundfos">Grundfos (Đan Mạch)</option>
                <option value="Ebara">Ebara (Ý / Nhật)</option>
                <option value="Pentax">Pentax (Ý)</option>
                <option value="Tsurumi">Tsurumi (Nhật Bản)</option>
                <option value="Franklin Electric">Franklin Electric (Mỹ)</option>
                <option value="Wilo">Wilo (Đức)</option>
                <option value="CNP">CNP (Trung Quốc)</option>
                <option value="Khác">Hãng khác...</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Model / Mã hiệu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="VD: CR 32-4, SP 17-10, 3M 50-200"
                className={`w-full p-2.5 bg-slate-50 border rounded-lg font-mono text-slate-900 ${
                  errors.model ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.model && <p className="text-[11px] text-red-500 mt-1">{errors.model}</p>}
            </div>

            {/* Công suất (kW) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Công suất (kW) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.powerKw}
                onChange={(e) => setFormData({ ...formData, powerKw: parseFloat(e.target.value) || 0 })}
                className={`w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold text-slate-900 ${
                  errors.powerKw ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.powerKw && <p className="text-[11px] text-red-500 mt-1">{errors.powerKw}</p>}
            </div>

            {/* Tầng cánh */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tầng cánh</label>
              <select
                value={formData.impellerStage}
                onChange={(e) => setFormData({ ...formData, impellerStage: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Có">Có (Đa tầng cánh)</option>
                <option value="Không">Không (Đơn tầng cánh)</option>
                <option value="Chưa xác định">Chưa xác định</option>
              </select>
            </div>

            {/* Xuất xứ */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Xuất xứ</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="VD: Ý, Đan Mạch, Nhật Bản"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            {/* Năm nhập / Năm sử dụng */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm nhập kho</label>
                <input
                  type="number"
                  value={formData.importYear}
                  onChange={(e) => setFormData({ ...formData, importYear: parseInt(e.target.value) || 2023 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm sử dụng</label>
                <input
                  type="number"
                  value={formData.useYear}
                  onChange={(e) => setFormData({ ...formData, useYear: parseInt(e.target.value) || 2023 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Tình trạng ban đầu */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tình trạng thiết bị</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PumpStatus })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
              >
                <option value="active">Đang sử dụng</option>
                <option value="standby">Dự phòng</option>
                <option value="repairing">Đang sửa chữa</option>
                <option value="damaged">Hư hỏng</option>
                <option value="pending_disposal">Chờ thanh lý</option>
              </select>
            </div>

            {/* Phân loại vận hành */}
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.isStandby}
                  onChange={(e) => setFormData({ ...formData, isStandby: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Là thiết bị dự phòng (thay thế lưu kho)</span>
              </label>
            </div>
          </div>

          {/* Chi tiết thông số kỹ thuật */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Thông số kỹ thuật chi tiết (Cột áp H, Lưu lượng Q, Điện áp...)
            </label>
            <input
              type="text"
              value={formData.techSpecs}
              onChange={(e) => setFormData({ ...formData, techSpecs: e.target.value })}
              placeholder="VD: H=65m, Q=30m3/h, Điện áp 380V/50Hz, 2900rpm"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          {/* Nhật ký thiết bị */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nhật ký thiết bị (ghi chép ban đầu / lịch sử)
            </label>
            <textarea
              rows={3}
              value={formData.logHistory}
              onChange={(e) => setFormData({ ...formData, logHistory: e.target.value })}
              placeholder="Ghi chú nhật ký nhiều dòng..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div>
              {!isNew && assetToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Xóa thiết bị này khỏi hệ thống"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Xóa thiết bị</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isNew ? 'Lưu thiết bị' : 'Cập nhật thông số'}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && assetToEdit && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-xs">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận xóa thiết bị</h3>
              <p className="text-slate-600 text-center mt-1">
                Bạn có chắc chắn muốn xóa thiết bị <strong className="font-mono text-red-600">{assetToEdit.code}</strong> - <strong>{assetToEdit.name}</strong> ({assetToEdit.model})?
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] leading-relaxed">
                Lưu ý: Thiết bị sau khi xóa sẽ được gỡ khỏi danh mục và hệ thống sẽ tự động lưu lại nhật ký truy vết người thực hiện xóa.
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete && assetToEdit) {
                      onDelete(assetToEdit.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }
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
    </div>
  );
};
