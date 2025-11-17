import React, { useEffect, useState, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { CustomerContext } from '../context/CustomerContext';
import { fetchProductDetails } from '../services/api';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const { customerType } = useContext(CustomerContext);
    const history = useHistory();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const getProductDetails = async () => {
            try {
                const data = await fetchProductDetails(productId, customerType);
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getProductDetails();
    }, [productId, customerType]);

    const formatPrice = (price) => {
        if (price == null || price === 0) return 'Đang cập nhật';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return (
            <div className="details-container">
                <div className="details-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="details-container">
                <div className="details-error">
                    <span className="error-icon">⚠️</span>
                    <h2>Có lỗi xảy ra</h2>
                    <p>{error}</p>
                    <button onClick={() => history.goBack()} className="btn-back">
                        ← Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="details-container">
                <div className="details-error">
                    <span className="error-icon">📦</span>
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
                    <button onClick={() => history.goBack()} className="btn-back">
                        ← Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="details-container">
            {/* Breadcrumb */}
            <div className="details-breadcrumb">
                <button onClick={() => history.push('/categories')} className="breadcrumb-link">
                    📂 Danh mục
                </button>
                <span className="breadcrumb-separator">›</span>
                {product.parentCategory && (
                    <>
                        <button 
                            onClick={() => history.push(`/category/${product.parentCategory}`)} 
                            className="breadcrumb-link"
                        >
                            {product.parentCategory}
                        </button>
                        <span className="breadcrumb-separator">›</span>
                    </>
                )}
                <span className="breadcrumb-current">{product.name}</span>
            </div>

            {/* Main Content Grid */}
            <div className="details-grid">
                {/* Left Column - Image Gallery */}
                <div className="details-gallery">
                    <div className="gallery-main">
                        {product.image ? (
                            <img 
                                src={product.image} 
                                alt={product.name}
                                className="gallery-image"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        ) : (
                            <div className="gallery-placeholder">
                                <span className="placeholder-icon">📦</span>
                                <p>Chưa có hình ảnh</p>
                            </div>
                        )}
                    </div>
                    <div className="gallery-badge">
                        <span className="badge-icon">🏷️</span>
                        <span>Mã: {product.code}</span>
                    </div>
                </div>

                {/* Right Column - Product Info */}
                <div className="details-info">
                    {/* Close Button */}
                    <button onClick={() => history.goBack()} className="details-close-btn" aria-label="Đóng">
                        ✕
                    </button>

                    {/* Header */}
                    <div className="details-header">
                        <div className="details-badges">
                            {product.parentCategory && (
                                <span className="detail-badge badge-category">
                                    📁 {product.parentCategory}
                                </span>
                            )}
                            {product.subcategory && (
                                <span className="detail-badge badge-subcategory">
                                    🏷️ {product.subcategory}
                                </span>
                            )}
                        </div>
                        <h1 className="details-title">{product.name}</h1>
                        <div className="details-code">
                            <span className="code-label">Mã sản phẩm:</span>
                            <span className="code-value">{product.code}</span>
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="details-price-section">
                        <div className="price-card">
                            <div className="price-header">
                                <span className="price-label">Giá bán</span>
                                <span className="price-type">{customerType}</span>
                            </div>
                            <div className="price-value">{formatPrice(product.price)}</div>
                            {product.unit && (
                                <div className="price-unit">Đơn vị: {product.unit}</div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="details-tabs">
                        <div className="tabs-header">
                            <button 
                                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                                onClick={() => setActiveTab('info')}
                            >
                                📋 Thông tin chi tiết
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('specs')}
                            >
                                📊 Thông số
                            </button>
                        </div>
                        <div className="tabs-content">
                            {activeTab === 'info' && (
                                <div className="tab-panel">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">📦 Mã sản phẩm</span>
                                            <span className="info-value">{product.code}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">📏 Đơn vị tính</span>
                                            <span className="info-value">{product.unit || 'Chưa cập nhật'}</span>
                                        </div>
                                        {product.parentCategory && (
                                            <div className="info-item">
                                                <span className="info-label">📁 Danh mục cha</span>
                                                <span className="info-value">{product.parentCategory}</span>
                                            </div>
                                        )}
                                        {product.subcategory && (
                                            <div className="info-item">
                                                <span className="info-label">🏷️ Danh mục con</span>
                                                <span className="info-value">{product.subcategory}</span>
                                            </div>
                                        )}
                                        {product.category && (
                                            <div className="info-item">
                                                <span className="info-label">📂 Danh mục</span>
                                                <span className="info-value">{product.category}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'specs' && (
                                <div className="tab-panel">
                                    <div className="specs-list">
                                        <div className="spec-item">
                                            <span className="spec-icon">💰</span>
                                            <div className="spec-content">
                                                <span className="spec-label">Giá bán ({customerType})</span>
                                                <span className="spec-value">{formatPrice(product.price)}</span>
                                            </div>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-icon">📏</span>
                                            <div className="spec-content">
                                                <span className="spec-label">Đơn vị</span>
                                                <span className="spec-value">{product.unit || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-icon">🏷️</span>
                                            <div className="spec-content">
                                                <span className="spec-label">Mã sản phẩm</span>
                                                <span className="spec-value">{product.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="details-actions">
                        <button onClick={() => history.goBack()} className="btn-secondary">
                            ← Quay lại
                        </button>
                        <button 
                            onClick={() => history.push('/products')} 
                            className="btn-primary"
                        >
                            Xem tất cả sản phẩm →
                        </button>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="details-additional">
                <div className="additional-card">
                    <div className="card-icon">ℹ️</div>
                    <div className="card-content">
                        <h3>Lưu ý</h3>
                        <p>Giá sản phẩm có thể thay đổi tùy theo thời điểm và số lượng đặt hàng. Vui lòng liên hệ để được tư vấn chi tiết.</p>
                    </div>
                </div>
                <div className="additional-card">
                    <div className="card-icon">📞</div>
                    <div className="card-content">
                        <h3>Hỗ trợ</h3>
                        <p>Cần hỗ trợ? Liên hệ với chúng tôi để được tư vấn và báo giá chi tiết.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;