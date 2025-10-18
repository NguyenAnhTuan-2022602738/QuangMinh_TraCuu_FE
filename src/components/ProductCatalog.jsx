import React, { useState, useEffect, useCallback } from 'react';
import { useCustomer } from '../context/CustomerContext';
import axios from 'axios';
import './ProductCatalog.css';

const ProductCatalog = () => {
    const { customerType } = useCustomer();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(6); // Mặc định hiển thị 6 sản phẩm

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            // Sử dụng biến API_URL từ môi trường hoặc fallback về localhost nếu không có
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${API_URL}/products/${customerType}`);
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
    }, [customerType]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Đang tải sản phẩm...</p>
            </div>
        );
    }

    return (
        <div className="product-catalog">
            <div className="container">
                <div className="catalog-header">
                    <h1>Danh mục sản phẩm</h1>
                    {/* <p className="catalog-subtitle">
                        Đang xem giá: <strong className="price-type-badge">{customerType}</strong>
                    </p> */}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={fetchProducts} className="btn btn-secondary">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="catalog-controls card">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset về trang 1 khi thay đổi từ khóa tìm kiếm
                            }}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="category-filter">
                        <label>Danh mục:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1); // Reset về trang 1 khi thay đổi danh mục
                            }}
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

                {/* Results count and pagination settings */}
                <div className="results-pagination-container">
                    <div className="results-info">
                        Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
                        {selectedCategory !== 'all' && ` trong danh mục "${selectedCategory}"`}
                        {searchTerm && ` khớp với "${searchTerm}"`}
                    </div>
                    
                    <div className="pagination-settings">
                        <label>Số sản phẩm mỗi trang:</label>
                        <select
                            value={productsPerPage}
                            onChange={(e) => {
                                setProductsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Reset về trang 1 khi thay đổi số sản phẩm/trang
                            }}
                            className="products-per-page-select"
                        >
                            <option value={6}>6</option>
                            <option value={9}>9</option>
                            <option value={12}>12</option>
                            <option value={15}>15</option>
                        </select>
                    </div>
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
                        {filteredProducts
                            .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                            .map(product => (
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

                {/* Pagination */}
                {filteredProducts.length > productsPerPage && (
                    <div className="pagination-container">
                        <div className="pagination">
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(1)} 
                                disabled={currentPage === 1}
                            >
                                &laquo;
                            </button>
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                disabled={currentPage === 1}
                            >
                                &lsaquo;
                            </button>

                            <div className="pagination-info">
                                Trang <span className="current-page">{currentPage}</span> / 
                                <span className="total-pages">{Math.ceil(filteredProducts.length / productsPerPage)}</span>
                            </div>

                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / productsPerPage)))} 
                                disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                            >
                                &rsaquo;
                            </button>
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(Math.ceil(filteredProducts.length / productsPerPage))} 
                                disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                            >
                                &raquo;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCatalog;
