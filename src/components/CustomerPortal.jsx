import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerPortal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CustomerPortal = ({ priceType }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [priceType]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/products/${priceType}`);
            const productsData = response.data;
            setProducts(productsData);
            
            // Extract unique categories
            const uniqueCategories = [...new Set(productsData.map(p => p.category))];
            setCategories(uniqueCategories);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = (product.name && String(product.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (product.code && String(product.code).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const formatPrice = (price) => {
        if (price == null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getPriceTypeName = (type) => {
        const names = {
            'BBCL': 'Bán buôn chính lẻ',
            'BBPT': 'Bán buôn phụ tùng',
            'BL': 'Bán lẻ',
            'BLVIP': 'Bán lẻ VIP',
            'HONDA247': 'Honda 247'
        };
        return names[type] || type;
    };

    if (loading) {
        return (
            <div className="customer-portal">
                <div className="portal-loading">
                    <div className="spinner"></div>
                    <p>Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-portal">
            {/* Portal Header */}
            <div className="portal-header">
                <div className="container">
                    <div className="portal-brand">
                        <div className="logo-icon">P</div>
                        <div className="brand-info">
                            <h1>Product Lookup System</h1>
                            <p className="price-badge">Bảng giá {getPriceTypeName(priceType)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="portal-content">
                <div className="container">
                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={fetchProducts} className="btn btn-secondary">
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Search and Filter Controls */}
                    <div className="portal-controls card">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <span className="search-icon">🔍</span>
                        </div>

                        <div className="category-filter">
                            <label>Danh mục:</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-select"
                            >
                                <option value="all">Tất cả ({products.length})</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat} ({products.filter(p => p.category === cat).length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
                        {selectedCategory !== 'all' && ` trong danh mục "${selectedCategory}"`}
                        {searchTerm && ` khớp với "${searchTerm}"`}
                    </div>

                    {/* Product Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="no-results card">
                            <div className="no-results-icon">📦</div>
                            <h3>Không tìm thấy sản phẩm</h3>
                            <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {filteredProducts.map(product => (
                                <div key={product.code} className="product-card card">
                                    <div className="product-header">
                                        <span className="product-code">{product.code}</span>
                                        <span className="product-category">{product.category}</span>
                                    </div>
                                    <h3 className="product-name" title={product.name}>{product.name}</h3>
                                    <div className="product-details">
                                        <div className="product-info">
                                            <span className="info-label">Đơn vị:</span>
                                            <span className="info-value">{product.unit}</span>
                                        </div>
                                        <div className="product-price">
                                            {formatPrice(product.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Portal Footer */}
            <div className="portal-footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Product Lookup System. Bảng giá {getPriceTypeName(priceType)}.</p>
                    <p>Liên hệ: support@productlookup.com | Hotline: 1900-xxxx</p>
                </div>
            </div>
        </div>
    );
};

export default CustomerPortal;
