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
            <div className="container">
                <div className="search-header">
                    <h1>Tra cứu sản phẩm</h1>
                    <p className="search-subtitle">
                        Tìm kiếm sản phẩm theo mã hoặc tên • Giá hiện tại: <strong>{customerType}</strong>
                    </p>
                </div>

                <div className="search-box-wrapper card">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập mã sản phẩm hoặc tên sản phẩm..."
                                className="search-input-large"
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary search-btn"
                                disabled={loading}
                            >
                                {loading ? 'Đang tìm...' : '🔍 Tìm kiếm'}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {hasSearched && !loading && (
                    <div className="search-results">
                        <div className="results-header">
                            <h2>Kết quả tìm kiếm</h2>
                            <span className="results-count">
                                {searchResults.length} sản phẩm
                            </span>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="no-results card">
                                <div className="no-results-icon">🔍</div>
                                <h3>Không tìm thấy sản phẩm</h3>
                                <p>Không có sản phẩm nào khớp với từ khóa "{searchTerm}"</p>
                                <p>Vui lòng thử với từ khóa khác</p>
                            </div>
                        ) : (
                            <div className="results-grid">
                                {searchResults.map(product => (
                                    <div 
                                        key={product.code}
                                        className="result-card card"
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
                                        <div className="result-header">
                                            <span className="result-code">{product.code}</span>
                                            <span className="result-category">{product.parentCategory || product.category}</span>
                                        </div>
                                        <h3 className="result-name">{product.name}</h3>
                                        <div className="result-footer">
                                            <div className="result-unit">
                                                <span className="label">Đơn vị:</span>
                                                <span className="value">{product.unit}</span>
                                            </div>
                                            <div className="result-price">
                                                {formatPrice(product.price)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!hasSearched && !loading && (
                    <div className="search-tips card">
                        <h3>💡 Mẹo tìm kiếm</h3>
                        <ul>
                            <li>Nhập mã sản phẩm chính xác để tìm nhanh nhất</li>
                            <li>Hoặc nhập tên sản phẩm để tìm tất cả sản phẩm liên quan</li>
                            <li>Kết quả sẽ hiển thị giá theo loại khách hàng bạn đã chọn</li>
                            <li>Thay đổi loại giá ở góc trên bên phải để xem giá khác</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
        {showModal && selectedProduct && (
                <div 
                    className="modal-overlay" 
                    onClick={handleCloseModal}
                    style={{ top: `${selectedProduct.scrollTop || 0}px` }}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseModal}>
                            ✕
                        </button>

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

                        <div className="modal-header">
                            <div className="modal-code-badge">{selectedProduct.code}</div>
                            {selectedProduct.parentCategory && (
                                <div className="modal-parent-category">
                                    📁 {selectedProduct.parentCategory}
                                </div>
                            )}
                            {selectedProduct.subcategory && (
                                <div className="modal-subcategory">
                                    {selectedProduct.subcategory}
                                </div>
                            )}
                        </div>

                        <h2 className="modal-title">{selectedProduct.name}</h2>

                        <div className="modal-details">
                            <div className="modal-detail-row">
                                <span className="detail-label">📦 Mã sản phẩm:</span>
                                <span className="detail-value">{selectedProduct.code}</span>
                            </div>

                            {selectedProduct.parentCategory && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">📁 Danh mục cha:</span>
                                    <span className="detail-value">{selectedProduct.parentCategory}</span>
                                </div>
                            )}

                            {selectedProduct.subcategory && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">🏷️ Danh mục con:</span>
                                    <span className="detail-value">{selectedProduct.subcategory}</span>
                                </div>
                            )}

                            {selectedProduct.category && (
                                <div className="modal-detail-row">
                                    <span className="detail-label">📂 Danh mục:</span>
                                    <span className="detail-value">{selectedProduct.category}</span>
                                </div>
                            )}

                            <div className="modal-detail-row">
                                <span className="detail-label">📏 Đơn vị:</span>
                                <span className="detail-value">{selectedProduct.unit}</span>
                            </div>
                        </div>

                        <div className="modal-price-section">
                            <div className="modal-price-label">Giá bán</div>
                            <div className="modal-price-value">
                                {formatPrice(selectedProduct.price)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductSearch;