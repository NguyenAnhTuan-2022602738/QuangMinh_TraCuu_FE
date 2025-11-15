import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './PromotionManagement.css';
import { fetchPromotionBanner, updatePromotionBanner } from '../services/api';

const DEFAULT_BANNER = {
    title: 'Ưu đãi khuyến mãi đặc biệt',
    subtitle: 'Giảm ngay 15% cho toàn bộ đơn hàng từ 5 triệu đồng trở lên khi đặt hàng trong tháng này. Ưu đãi áp dụng cho tất cả nhóm khách hàng và được hỗ trợ giao hàng nhanh.',
    backgroundImageUrl: '',
    isActive: true,
    overlayOpacity: 0.55,
    textAlignment: 'left',
    primaryAction: {
        label: 'Xem sản phẩm ưu đãi',
        link: '/catalog'
    },
    secondaryAction: {
        label: 'Tra cứu mã giảm giá',
        link: '/search'
    },
    badgeText: 'Hot Deal',
    highlightValue: '15%',
    highlightNote: 'Giảm trực tiếp'
};

const ALIGNMENT_OPTIONS = [
    { value: 'left', label: 'Canh trái' },
    { value: 'center', label: 'Canh giữa' },
    { value: 'right', label: 'Canh phải' }
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Creates a deep clone of the default banner configuration.
const createDefaultBannerState = () => JSON.parse(JSON.stringify(DEFAULT_BANNER));

// Component enabling administrators to configure the homepage promotion banner.
const PromotionManagement = () => {
    const [formState, setFormState] = useState(() => createDefaultBannerState());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [metadata, setMetadata] = useState({ updatedAt: null, lastUpdatedBy: '' });

    const normalizedOverlay = useMemo(() => {
        const value = Number(formState.overlayOpacity);
        if (Number.isNaN(value)) {
            return DEFAULT_BANNER.overlayOpacity;
        }
        return Math.min(Math.max(value, 0), 0.95);
    }, [formState.overlayOpacity]);

    const previewCardClasses = useMemo(() => {
        const classes = ['promo-card'];
        if (formState.backgroundImageUrl) {
            classes.push('promo-card--with-image');
        }
        if (formState.textAlignment) {
            classes.push(`promo-card--align-${formState.textAlignment}`);
        }
        return classes.join(' ');
    }, [formState.backgroundImageUrl, formState.textAlignment]);

    const previewCardStyle = useMemo(() => {
        if (!formState.backgroundImageUrl) {
            return {};
        }
        return {
            backgroundImage: `linear-gradient(rgba(0,0,0,${normalizedOverlay}), rgba(0,0,0,${normalizedOverlay})), url(${formState.backgroundImageUrl})`
        };
    }, [formState.backgroundImageUrl, normalizedOverlay]);

    // Loads promotion banner data from the server.
    const loadPromotion = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await fetchPromotionBanner();
            if (!data) {
                setFormState(createDefaultBannerState());
                return;
            }

            const sanitizedBanner = {
                title: data.title || DEFAULT_BANNER.title,
                subtitle: data.subtitle || DEFAULT_BANNER.subtitle,
                backgroundImageUrl: data.backgroundImageUrl || '',
                isActive: data.isActive !== undefined ? data.isActive : DEFAULT_BANNER.isActive,
                overlayOpacity: typeof data.overlayOpacity === 'number' ? data.overlayOpacity : DEFAULT_BANNER.overlayOpacity,
                textAlignment: data.textAlignment || DEFAULT_BANNER.textAlignment,
                primaryAction: {
                    ...DEFAULT_BANNER.primaryAction,
                    ...(data.primaryAction || {})
                },
                secondaryAction: {
                    ...DEFAULT_BANNER.secondaryAction,
                    ...(data.secondaryAction || {})
                },
                badgeText: data.badgeText || DEFAULT_BANNER.badgeText,
                highlightValue: data.highlightValue || DEFAULT_BANNER.highlightValue,
                highlightNote: data.highlightNote || DEFAULT_BANNER.highlightNote
            };

            setFormState(sanitizedBanner);

            setMetadata({
                updatedAt: data.updatedAt || null,
                lastUpdatedBy: data.lastUpdatedBy || 'admin'
            });
        } catch (err) {
            console.error('Load promotion banner failed:', err);
            setError('Không thể tải dữ liệu banner khuyến mãi. Đang hiển thị cấu hình mặc định.');
            setFormState(createDefaultBannerState());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPromotion();
    }, [loadPromotion]);

    // Handles changes for basic input fields.
    const handleInputChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : name === 'overlayOpacity' ? parseFloat(value) : value
        }));
    }, []);

    // Handles changes for nested action objects.
    const handleActionChange = useCallback((actionKey, field, value) => {
        setFormState(prev => ({
            ...prev,
            [actionKey]: {
                ...prev[actionKey],
                [field]: value
            }
        }));
    }, []);

    // Converts an uploaded image into a base64 string and stores it in state.
    const handleImageUpload = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormState(prev => ({
                ...prev,
                backgroundImageUrl: reader.result
            }));
            setSuccess('Đã tải ảnh lên thành công. Đừng quên lưu thay đổi.');
            setError('');
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    }, []);

    // Clears the background image from the form state.
    const handleClearImage = useCallback(() => {
        setFormState(prev => ({
            ...prev,
            backgroundImageUrl: ''
        }));
    }, []);

    // Resets the form back to default banner values.
    const handleResetToDefault = useCallback(() => {
        setFormState(createDefaultBannerState());
        setSuccess('Đã khôi phục nội dung mặc định. Nhấn lưu để áp dụng.');
        setError('');
    }, []);

    // Submits banner changes to the API.
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const adminToken = localStorage.getItem('adminToken');
            if (!adminToken) {
                setError('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
                return;
            }

            const payload = {
                title: formState.title,
                subtitle: formState.subtitle,
                backgroundImageUrl: formState.backgroundImageUrl,
                isActive: Boolean(formState.isActive),
                overlayOpacity: normalizedOverlay,
                textAlignment: formState.textAlignment,
                primaryAction: {
                    label: formState.primaryAction?.label || '',
                    link: formState.primaryAction?.link || ''
                },
                secondaryAction: {
                    label: formState.secondaryAction?.label || '',
                    link: formState.secondaryAction?.link || ''
                },
                badgeText: formState.badgeText,
                highlightValue: formState.highlightValue,
                highlightNote: formState.highlightNote
            };

            const response = await updatePromotionBanner(payload, adminToken);
            if (response?.promotion) {
                const updated = response.promotion;
                setFormState({
                    title: updated.title || DEFAULT_BANNER.title,
                    subtitle: updated.subtitle || DEFAULT_BANNER.subtitle,
                    backgroundImageUrl: updated.backgroundImageUrl || '',
                    isActive: updated.isActive !== undefined ? updated.isActive : DEFAULT_BANNER.isActive,
                    overlayOpacity: typeof updated.overlayOpacity === 'number' ? updated.overlayOpacity : DEFAULT_BANNER.overlayOpacity,
                    textAlignment: updated.textAlignment || DEFAULT_BANNER.textAlignment,
                    primaryAction: {
                        ...DEFAULT_BANNER.primaryAction,
                        ...(updated.primaryAction || {})
                    },
                    secondaryAction: {
                        ...DEFAULT_BANNER.secondaryAction,
                        ...(updated.secondaryAction || {})
                    },
                    badgeText: updated.badgeText || DEFAULT_BANNER.badgeText,
                    highlightValue: updated.highlightValue || DEFAULT_BANNER.highlightValue,
                    highlightNote: updated.highlightNote || DEFAULT_BANNER.highlightNote
                });

                setMetadata({
                    updatedAt: response.promotion.updatedAt || new Date().toISOString(),
                    lastUpdatedBy: response.promotion.lastUpdatedBy || 'admin'
                });
            }

            setSuccess(response?.message || 'Đã lưu banner khuyến mãi thành công.');
        } catch (err) {
            console.error('Update promotion banner failed:', err);
            setError(err.message || 'Không thể lưu banner khuyến mãi. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    }, [formState, normalizedOverlay]);

    return (
        <div className="promotion-management">
            <div className="promotion-header">
                <h2>🎯 Quản lý banner khuyến mãi</h2>
                <p>Điều chỉnh nội dung banner hiển thị trên trang chủ và kiểm soát trạng thái bật/tắt.</p>
                {metadata.updatedAt && (
                    <span className="promotion-meta">Cập nhật lần cuối: {new Date(metadata.updatedAt).toLocaleString('vi-VN')} • Bởi: {metadata.lastUpdatedBy || 'admin'}</span>
                )}
            </div>

            {loading ? (
                <div className="promotion-loading">Đang tải cấu hình banner...</div>
            ) : (
                <div className="promotion-content">
                    <form className="promotion-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="title">Tiêu đề chính</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={formState.title}
                                onChange={handleInputChange}
                                placeholder="Nhập tiêu đề nổi bật"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subtitle">Mô tả chi tiết</label>
                            <textarea
                                id="subtitle"
                                name="subtitle"
                                rows={4}
                                value={formState.subtitle}
                                onChange={handleInputChange}
                                placeholder="Nhập nội dung mô tả khuyến mãi"
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="textAlignment">Canh chữ</label>
                                <select
                                    id="textAlignment"
                                    name="textAlignment"
                                    value={formState.textAlignment}
                                    onChange={handleInputChange}
                                >
                                    {ALIGNMENT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="overlayOpacity">Độ mờ ảnh nền ({normalizedOverlay.toFixed(2)})</label>
                                <input
                                    id="overlayOpacity"
                                    name="overlayOpacity"
                                    type="range"
                                    min="0"
                                    max="0.95"
                                    step="0.05"
                                    value={normalizedOverlay}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label htmlFor="isActive">Hiển thị banner</label>
                                <input
                                    id="isActive"
                                    name="isActive"
                                    type="checkbox"
                                    checked={Boolean(formState.isActive)}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-subsection">
                            <h3>Nút hành động chính</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="primaryActionLabel">Tiêu đề nút</label>
                                    <input
                                        id="primaryActionLabel"
                                        type="text"
                                        value={formState.primaryAction.label}
                                        onChange={(event) => handleActionChange('primaryAction', 'label', event.target.value)}
                                        placeholder="Ví dụ: Xem sản phẩm ưu đãi"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="primaryActionLink">Đường dẫn</label>
                                    <input
                                        id="primaryActionLink"
                                        type="text"
                                        value={formState.primaryAction.link}
                                        onChange={(event) => handleActionChange('primaryAction', 'link', event.target.value)}
                                        placeholder="Ví dụ: /catalog hoặc https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-subsection">
                            <h3>Nút hành động phụ</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="secondaryActionLabel">Tiêu đề nút</label>
                                    <input
                                        id="secondaryActionLabel"
                                        type="text"
                                        value={formState.secondaryAction.label}
                                        onChange={(event) => handleActionChange('secondaryAction', 'label', event.target.value)}
                                        placeholder="Ví dụ: Tra cứu mã giảm giá"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="secondaryActionLink">Đường dẫn</label>
                                    <input
                                        id="secondaryActionLink"
                                        type="text"
                                        value={formState.secondaryAction.link}
                                        onChange={(event) => handleActionChange('secondaryAction', 'link', event.target.value)}
                                        placeholder="Ví dụ: /search hoặc https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-subsection">
                            <h3>Khối nhấn mạnh</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="badgeText">Badge</label>
                                    <input
                                        id="badgeText"
                                        name="badgeText"
                                        type="text"
                                        value={formState.badgeText}
                                        onChange={handleInputChange}
                                        placeholder="Ví dụ: Hot Deal"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="highlightValue">Giá trị nổi bật</label>
                                    <input
                                        id="highlightValue"
                                        name="highlightValue"
                                        type="text"
                                        value={formState.highlightValue}
                                        onChange={handleInputChange}
                                        placeholder="Ví dụ: 15%"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="highlightNote">Ghi chú</label>
                                    <input
                                        id="highlightNote"
                                        name="highlightNote"
                                        type="text"
                                        value={formState.highlightNote}
                                        onChange={handleInputChange}
                                        placeholder="Ví dụ: Giảm trực tiếp"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-subsection">
                            <h3>Ảnh nền banner</h3>
                            <div className="image-upload-group">
                                <div className="form-group">
                                    <label htmlFor="backgroundImageUrl">Link ảnh trực tiếp (tùy chọn)</label>
                                    <input
                                        id="backgroundImageUrl"
                                        name="backgroundImageUrl"
                                        type="text"
                                        value={formState.backgroundImageUrl.startsWith('data:image') ? '' : formState.backgroundImageUrl}
                                        onChange={handleInputChange}
                                        placeholder="Dán link ảnh (https://...)"
                                    />
                                    <small>Hệ thống ưu tiên link ảnh. Nếu tải ảnh lên từ máy, trường này sẽ để trống.</small>
                                </div>
                                <div className="form-group file-group">
                                    <label htmlFor="backgroundImageFile">Hoặc tải ảnh từ máy (jpg, png)</label>
                                    <input
                                        id="backgroundImageFile"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <button type="button" className="btn btn-outline" onClick={handleClearImage}>
                                        Xóa ảnh nền
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && <div className="form-alert error">{error}</div>}
                        {success && <div className="form-alert success">{success}</div>}

                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={handleResetToDefault}>
                                Khôi phục mặc định
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>

                    <div className="promotion-preview">
                        <h3>Xem trước banner</h3>
                        <div className="promo-banner preview-banner">
                            <div className={previewCardClasses} style={previewCardStyle}>
                                <div className="promo-content">
                                    <h4 className="promo-title">{formState.title}</h4>
                                    <p className="promo-subtitle">{formState.subtitle}</p>
                                    <div className="promo-actions">
                                        {formState.primaryAction.label && (
                                            <span className="btn btn-primary btn-lg" role="presentation">
                                                {formState.primaryAction.label}
                                            </span>
                                        )}
                                        {formState.secondaryAction.label && (
                                            <span className="btn btn-outline btn-lg" role="presentation">
                                                {formState.secondaryAction.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="promo-highlight">
                                    <div className="promo-badge">{formState.badgeText}</div>
                                    <span className="promo-percent">{formState.highlightValue}</span>
                                    <span className="promo-note">{formState.highlightNote}</span>
                                </div>
                            </div>
                            {!formState.isActive && (
                                <div className="preview-overlay">Banner đang tắt - khách hàng sẽ không nhìn thấy.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionManagement;
