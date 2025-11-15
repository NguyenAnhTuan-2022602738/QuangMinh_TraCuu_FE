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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
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
        setCurrentPage(1);
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
        setCurrentPage(1);
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'default': '📦',
            'electronics': '💻',
            'food': '🍕',
            'clothing': '👕',
            'books': '📚',
            'tools': '🔧',
            'sports': '⚽',
            'beauty': '💄'
        };
        return icons[category.toLowerCase()] || icons.default;
    };

    return (
        <div className="catalog-by-category-container">
            {/* Animated Background */}
            <div className="category-background">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>

            {/* Header */}
            <div className="catalog-header">
                <button onClick={goBack} className="back-btn">
                    <span className="back-icon">←</span>
                    <span>Quay lại</span>
                </button>
                <div className="header-content">
                    <div className="header-badge">
                        <span className="badge-icon">{getCategoryIcon(parentCategory)}</span>
                        <span>Danh mục</span>
                    </div>
                    <h1 className="header-title">{decodeURIComponent(parentCategory)}</h1>
                    <p className="header-subtitle">
                        <span className="count-highlight">{filteredProducts.length}</span> sản phẩm 
                        {selectedSubcategory !== 'all' && (
                            <span> trong <strong>"{selectedSubcategory}"</strong></span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="catalog-filters">
                {/* Search Box */}
                <div className="filter-row">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã, tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="view-mode-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <span className="view-icon">⊞</span>
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <span className="view-icon">☰</span>
                        </button>
                    </div>
                </div>

                {/* Subcategory Filters */}
                {subcategories.length > 0 && (
                    <div className="filter-row">
                        <div className="subcategory-filters">
                            <button
                                className={`filter-chip ${selectedSubcategory === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedSubcategory('all')}
                            >
                                <span className="chip-icon">📦</span>
                                <span>Tất cả</span>
                            </button>
                            {subcategories.map((sub, index) => (
                                <button
                                    key={index}
                                    className={`filter-chip ${selectedSubcategory === sub ? 'active' : ''}`}
                                    onClick={() => setSelectedSubcategory(sub)}
                                >
                                    <span className="chip-icon">🏷️</span>
                                    <span>{sub}</span>
                                </button>
                            ))}
                        </div>

                        {/* Products Per Page */}
                        <div className="per-page-filter">
                            <label>Hiển thị:</label>
                            <select
                                value={productsPerPage}
                                onChange={(e) => handleProductsPerPageChange(Number(e.target.value))}
                                className="per-page-select"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                                <option value={96}>96</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Mobile Subcategory Dropdown */}
                {subcategories.length > 0 && (
                    <div className="subcategory-mobile">
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
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải sản phẩm...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <h3>Có lỗi xảy ra</h3>
                    <p>{error}</p>
                    <button onClick={() => fetchProducts(currentPage)} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            )}

            {/* Products Grid/List */}
            {!loading && !error && filteredProducts.length > 0 && (
                <>
                    <div className={`products-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                        {filteredProducts.map((product) => (
                            <div 
                                key={product._id} 
                                className="product-card"
                                onClick={() => history.push(`/product/${product.code}`)}
                            >
                                <div className="product-image-placeholder">
                                    <span className="placeholder-icon">📦</span>
                                </div>
                                <div className="product-content">
                                    <div className="product-header">
                                        <span className="product-code">{product.code}</span>
                                        <span className="subcategory-badge">{product.subcategory}</span>
                                    </div>
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="product-meta">
                                        <span className="product-unit">
                                            <span className="meta-icon">📏</span>
                                            {product.unit}
                                        </span>
                                    </div>
                                    <button className="view-details-btn">
                                        <span>Xem chi tiết</span>
                                        <span className="btn-arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <div className="pagination">
                                <button 
                                    className="pagination-btn pagination-first" 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={!pagination.hasPrevPage}
                                    title="First page"
                                >
                                    <span>«</span>
                                </button>
                                <button 
                                    className="pagination-btn pagination-prev" 
                                    onClick={() => setCurrentPage(prev => prev - 1)} 
                                    disabled={!pagination.hasPrevPage}
                                    title="Previous page"
                                >
                                    <span>‹</span>
                                </button>

                                <div className="pagination-info">
                                    <span className="page-current">{pagination.currentPage}</span>
                                    <span className="page-separator">/</span>
                                    <span className="page-total">{pagination.totalPages}</span>
                                    <span className="products-total">({pagination.totalProducts} sản phẩm)</span>
                                </div>

                                <button 
                                    className="pagination-btn pagination-next" 
                                    onClick={() => setCurrentPage(prev => prev + 1)} 
                                    disabled={!pagination.hasNextPage}
                                    title="Next page"
                                >
                                    <span>›</span>
                                </button>
                                <button 
                                    className="pagination-btn pagination-last" 
                                    onClick={() => setCurrentPage(pagination.totalPages)} 
                                    disabled={!pagination.hasNextPage}
                                    title="Last page"
                                >
                                    <span>»</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>
                        {searchTerm 
                            ? `Không có kết quả nào phù hợp với "${searchTerm}"` 
                            : 'Danh mục này hiện chưa có sản phẩm nào.'
                        }
                    </p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="clear-filters-btn">
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductCatalogByCategory;
