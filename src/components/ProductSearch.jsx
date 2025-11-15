import React, { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import axios from 'axios';
import './ProductSearch.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductSearch = () => {
    const { customerType } = useCustomer();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setError('Vui lòng nhập mã hoặc tên sản phẩm');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setHasSearched(true);
            setShowModal(false);
            setSelectedProduct(null);
            
            // Fetch all products with current price type
            const response = await axios.get(`${API_URL}/products/${customerType}?limit=all`);
            const allProducts = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.products)
                    ? response.data.products
                    : [];
            
            // Filter by search term
            const filtered = allProducts.filter(p => 
                (p.code && String(p.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.name && String(p.name).toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
            setSearchResults(filtered);
        } catch (err) {
            setError('Không thể tìm kiếm sản phẩm. Vui lòng thử lại.');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (product) => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        setSelectedProduct({ ...product, scrollTop });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setTimeout(() => setSelectedProduct(null), 200);
    };

    const formatPrice = (price) => {
        if (price == null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <>
        <div className="product-search">
            <div className="search-background">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>

            <div className="container">
                <div className="search-header">
                    <div className="header-badge">
                        <span className="badge-icon">🔍</span>
                    </div>
                    <h1>Tra cứu sản phẩm</h1>
                    <p className="search-subtitle">
                        Tìm kiếm sản phẩm theo mã hoặc tên • Giá hiện tại: <span className="price-type-badge">{customerType}</span>
                    </p>
                </div>

                <div className="search-box-wrapper">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-group">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập mã sản phẩm hoặc tên sản phẩm..."
                                className="search-input-large"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchResults([]);
                                        setHasSearched(false);
                                    }}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    ✕
                                </button>
                            )}
                            <button 
                                type="submit" 
                                className="btn-primary search-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Đang tìm...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">🔍</span>
                                        Tìm kiếm
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Đã xảy ra lỗi</h3>
                        <p>{error}</p>
                        <button 
                            className="retry-btn"
                            onClick={() => {
                                setError('');
                                if (searchTerm) handleSearch({ preventDefault: () => {} });
                            }}
                        >
                            🔄 Thử lại
                        </button>
                    </div>
                )}

                {hasSearched && !loading && (
                    <div className="search-results">
                        <div className="results-header">
                            <div className="results-title">
                                <span className="results-icon">📊</span>
                                <h2>Kết quả tìm kiếm</h2>
                            </div>
                            <div className="results-stats">
                                <span className="stat-label">Tìm thấy</span>
                                <span className="results-count">{searchResults.length}</span>
                                <span className="stat-label">sản phẩm</span>
                            </div>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="no-results">
                                <div className="no-results-icon">🔍</div>
                                <h3>Không tìm thấy sản phẩm</h3>
                                <p className="search-term">Không có sản phẩm nào khớp với từ khóa <strong>"{searchTerm}"</strong></p>
                                <p className="search-hint">Vui lòng thử với từ khóa khác</p>
                                <button
                                    className="clear-filters-btn"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setHasSearched(false);
                                    }}
                                >
                                    ✕ Xóa tìm kiếm
                                </button>
                            </div>
                        ) : (
                            <div className="results-grid">
                                {searchResults.map(product => (
                                    <div 
                                        key={product.code}
                                        className="result-card"
                                        onClick={() => handleResultClick(product)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleResultClick(product);
                                            }
                                        }}
                                    >
                                        <div className="result-image-placeholder">
                                            <span className="placeholder-icon">📷</span>
                                        </div>
                                        <div className="result-content">
                                            <div className="result-header">
                                                <span className="result-code">{product.code}</span>
                                                <span className="result-category">📁 {product.parentCategory || product.category}</span>
                                            </div>
                                            <h3 className="result-name">{product.name}</h3>
                                            <div className="result-footer">
                                                <div className="result-unit">
                                                    <span className="label">📦 Đơn vị:</span>
                                                    <span className="value">{product.unit}</span>
                                                </div>
                                                <div className="result-price">
                                                    {formatPrice(product.price)}
                                                </div>
                                            </div>
                                            <button className="view-details-btn">
                                                <span>Xem chi tiết</span>
                                                <span className="btn-arrow">→</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!hasSearched && !loading && (
                    <div className="search-tips">
                        <div className="tips-icon">💡</div>
                        <h3>Mẹo tìm kiếm</h3>
                        <ul>
                            <li>
                                <span className="tip-icon">✓</span>
                                Nhập mã sản phẩm chính xác để tìm nhanh nhất
                            </li>
                            <li>
                                <span className="tip-icon">✓</span>
                                Hoặc nhập tên sản phẩm để tìm tất cả sản phẩm liên quan
                            </li>
                            <li>
                                <span className="tip-icon">✓</span>
                                Kết quả sẽ hiển thị giá theo loại khách hàng bạn đã chọn
                            </li>
                            <li>
                                <span className="tip-icon">✓</span>
                                Thay đổi loại giá ở góc trên bên phải để xem giá khác
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
        {showModal && selectedProduct && (
                <div 
                    className="modal-overlay" 
                    onClick={handleCloseModal}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseModal} aria-label="Đóng">
                            ✕
                        </button>
                        
                        <div className="modal-header">
                            <div className="modal-badge-group">
                                <span className="modal-code-badge">{selectedProduct.code}</span>
                                {selectedProduct.subcategory && (
                                    <span className="modal-subcategory-badge">
                                        {selectedProduct.subcategory}
                                    </span>
                                )}
                            </div>
                            {selectedProduct.parentCategory && (
                                <div className="modal-parent-category">
                                    <span className="parent-icon">📁</span>
                                    {selectedProduct.parentCategory}
                                </div>
                            )}
                        </div>

                        <h2 className="modal-title">{selectedProduct.name}</h2>

                        {selectedProduct.image && (
                            <div className="modal-image-container">
                                <img 
                                    src={selectedProduct.image} 
                                    alt={selectedProduct.name}
                                    className="modal-product-image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        <div className="modal-details">
                            <div className="modal-detail-row">
                                <span className="detail-label">
                                    <span className="detail-icon">📦</span>
                                    Mã sản phẩm:
                                </span>
                                <span className="detail-value">{selectedProduct.code}</span>
                            </div>
                            
                            {selectedProduct.parentCategory && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">
                                        <span className="detail-icon">📁</span>
                                        Danh mục cha:
                                    </span>
                                    <span className="detail-value">{selectedProduct.parentCategory}</span>
                                </div>
                            )}
                            
                            {selectedProduct.subcategory && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">
                                        <span className="detail-icon">🏷️</span>
                                        Danh mục con:
                                    </span>
                                    <span className="detail-value">{selectedProduct.subcategory}</span>
                                </div>
                            )}
                            
                            {selectedProduct.category && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">
                                        <span className="detail-icon">📂</span>
                                        Danh mục:
                                    </span>
                                    <span className="detail-value">{selectedProduct.category}</span>
                                </div>
                            )}
                            
                            <div className="modal-detail-row">
                                <span className="detail-label">
                                    <span className="detail-icon">📏</span>
                                    Đơn vị:
                                </span>
                                <span className="detail-value">{selectedProduct.unit}</span>
                            </div>
                        </div>

                        <div className="modal-price-section">
                            <div className="modal-price-label">Giá bán ({customerType})</div>
                            <div className="modal-price-value">
                                {formatPrice(selectedProduct.price)}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="modal-action-btn secondary" onClick={handleCloseModal}>
                                <span className="btn-icon">✕</span>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductSearch;