import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import './ProductCatalogByCategory.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductCatalogByCategory = () => {
    const { parentCategory } = useParams();
    const history = useHistory();
    const [products, setProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(12);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        productsPerPage: 12,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchSubcategories = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/products/categories/${encodeURIComponent(parentCategory)}/subcategories`
            );
            
            if (!response.ok) throw new Error('Không thể tải danh mục con');
            
            const data = await response.json();
            setSubcategories(data);
        } catch (err) {
            console.error('Error fetching subcategories:', err);
        }
    }, [parentCategory]);

    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            let url = `${API_URL}/products/categories/${encodeURIComponent(parentCategory)}/products?page=${page}&limit=${productsPerPage}`;
            
            if (selectedSubcategory !== 'all') {
                url += `&subcategory=${encodeURIComponent(selectedSubcategory)}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Không thể tải sản phẩm');
            
            const data = await response.json();
            
            // Handle both paginated and non-paginated responses for backward compatibility
            if (data.pagination) {
                setProducts(Array.isArray(data.products) ? data.products : []);
                setPagination(data.pagination);
            } else {
                // Fallback for non-paginated response
                const productsData = Array.isArray(data) ? data : [];
                setProducts(productsData);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalProducts: productsData.length,
                    productsPerPage: productsPerPage,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            }
            
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Không thể tải sản phẩm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = (products || []).filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.code?.toLowerCase().includes(searchLower) ||
            product.name?.toLowerCase().includes(searchLower) ||
            product.subcategory?.toLowerCase().includes(searchLower)
        );
    });

    useEffect(() => {
        fetchSubcategories();
        setSelectedSubcategory('all');
        setCurrentPage(1); // Reset to first page when category changes
    }, [fetchSubcategories]);

    useEffect(() => {
        fetchProducts(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubcategory, currentPage, productsPerPage]);

    const goBack = () => {
        history.push('/categories');
    };

    const handleProductsPerPageChange = (newLimit) => {
        setProductsPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    return (
        <div className="catalog-by-category-container">
            {/* Header */}
            <div className="catalog-header">
                <button onClick={goBack} className="back-btn">
                    ← Quay lại
                </button>
                <div className="header-info">
                    <h1>📦 {decodeURIComponent(parentCategory)}</h1>
                    <p className="product-count">
                        Hiển thị {filteredProducts.length} sản phẩm trên tổng số {pagination.totalProducts} sản phẩm
                        {selectedSubcategory !== 'all' && ` trong danh mục "${selectedSubcategory}"`}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="catalog-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm theo mã, tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Desktop: Filter chips */}
                <div className="subcategory-filters desktop-filters">
                    <button
                        className={`filter-chip ${selectedSubcategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedSubcategory('all')}
                    >
                        Tất cả
                    </button>
                    {subcategories.map((sub, index) => (
                        <button
                            key={index}
                            className={`filter-chip ${selectedSubcategory === sub ? 'active' : ''}`}
                            onClick={() => setSelectedSubcategory(sub)}
                        >
                            {sub}
                        </button>
                    ))}
                </div>

                {/* Mobile: Dropdown select */}
                <div className="subcategory-select-mobile">
                    <label>Danh mục:</label>
                    <select
                        value={selectedSubcategory}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="category-select"
                    >
                        <option value="all">Tất cả danh mục</option>
                        {subcategories.map((sub, index) => (
                            <option key={index} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>

                <div className="per-page-filter">
                    <label>Hiển thị:</label>
                    <select
                        value={productsPerPage}
                        onChange={(e) => handleProductsPerPageChange(Number(e.target.value))}
                        className="per-page-select"
                    >
                        <option value={12}>12 sản phẩm</option>
                        <option value={24}>24 sản phẩm</option>
                        <option value={48}>48 sản phẩm</option>
                        <option value={96}>96 sản phẩm</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải sản phẩm...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchProducts} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            )}

            {/* Products Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
                <>
                    <div className="products-grid">
                        {filteredProducts.map((product) => (
                            <div key={product._id} className="product-card">
                                <div className="product-header">
                                    <span className="product-code">{product.code}</span>
                                    <span className="subcategory-badge">{product.subcategory}</span>
                                </div>
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-meta">
                                    <span className="product-unit">📏 {product.unit}</span>
                                </div>
                                <button 
                                    className="view-details-btn"
                                    onClick={() => history.push(`/product/${product.code}`)}
                                >
                                    Xem chi tiết →
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination">
                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={!pagination.hasPrevPage}
                                >
                                    &laquo;
                                </button>
                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(prev => prev - 1)} 
                                    disabled={!pagination.hasPrevPage}
                                >
                                    &lsaquo;
                                </button>

                                <div className="pagination-info">
                                    Trang <span className="current-page">{pagination.currentPage}</span> / 
                                    <span className="total-pages">{pagination.totalPages}</span>
                                    <span className="pagination-total">({pagination.totalProducts} sản phẩm)</span>
                                </div>

                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(prev => prev + 1)} 
                                    disabled={!pagination.hasNextPage}
                                >
                                    &rsaquo;
                                </button>
                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(pagination.totalPages)} 
                                    disabled={!pagination.hasNextPage}
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <p>Không tìm thấy sản phẩm nào</p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductCatalogByCategory;
