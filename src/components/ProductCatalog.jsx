import React, { useState, useEffect, useCallback } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { useHistory, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ProductCatalog.css';

const ProductCatalog = () => {
    const { customerType } = useCustomer();
    const history = useHistory();
    const location = useLocation();
    
    const [products, setProducts] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedParentCategory, setSelectedParentCategory] = useState('all');
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth > 768;
        }
        return true;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(12);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        productsPerPage: 12,
        hasNextPage: false,
        hasPrevPage: false
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Load parent category from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const parentCat = params.get('parent');
        if (parentCat) {
            setSelectedParentCategory(parentCat);
        }
    }, [location.search]);

    // Ensure sidebar visibility aligns with viewport size
    useEffect(() => {
        const handleResize = () => {
            if (typeof window === 'undefined') return;
            if (window.innerWidth > 768) {
                setIsMobileSidebarOpen(true);
            } else {
                setIsMobileSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch parent categories
    const fetchParentCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/products/categories/parent`);
            setParentCategories(response.data);
        } catch (err) {
            console.error('Error fetching parent categories:', err);
        }
    }, [API_URL]);

    // Fetch subcategories for selected parent category
    const fetchSubcategories = useCallback(async (parentCat) => {
        if (!parentCat || parentCat === 'all') {
            setSubcategories([]);
            return;
        }
        
        try {
            const response = await axios.get(
                `${API_URL}/products/categories/${encodeURIComponent(parentCat)}/subcategories`
            );
            setSubcategories(response.data);
        } catch (err) {
            console.error('Error fetching subcategories:', err);
            setSubcategories([]);
        }
    }, [API_URL]);

    // Fetch products based on filters with server-side pagination
    const fetchProducts = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('customerToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            let url;
            if (selectedParentCategory === 'all') {
                // Fetch all products with price type and pagination
                url = `${API_URL}/products/${customerType}?page=${page}&limit=${productsPerPage}`;
            } else {
                // Fetch products by parent category with price type and pagination
                url = `${API_URL}/products/categories/${encodeURIComponent(selectedParentCategory)}/products?priceType=${customerType}&page=${page}&limit=${productsPerPage}`;
                if (selectedSubcategory !== 'all') {
                    url += `&subcategory=${encodeURIComponent(selectedSubcategory)}`;
                }
            }
            const trimmedSearch = searchTerm.trim();
            if (trimmedSearch) {
                url += `&search=${encodeURIComponent(trimmedSearch)}`;
            }
            
            const response = await axios.get(url, { headers });
            
            // Handle both paginated and non-paginated responses for backward compatibility
            if (response.data.pagination) {
                setProducts(Array.isArray(response.data.products) ? response.data.products : []);
                setPagination(response.data.pagination);
            } else {
                // Fallback for non-paginated response
                const productsData = Array.isArray(response.data) ? response.data : [];
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
            
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            const msg = err?.response?.data?.message || 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [customerType, selectedParentCategory, selectedSubcategory, productsPerPage, API_URL, searchTerm]);

    useEffect(() => {
        fetchParentCategories();
    }, [fetchParentCategories]);

    useEffect(() => {
        fetchSubcategories(selectedParentCategory);
        setSelectedSubcategory('all'); // Reset subcategory when parent changes
        setCurrentPage(1); // Reset to first page when category changes
    }, [selectedParentCategory, fetchSubcategories]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [fetchProducts, currentPage]);

    // Prevent body scroll when modal is open
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

    // Close modal on ESC key
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && showModal) {
                handleCloseModal();
            }
        };
        
        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [showModal]);

    // Handle parent category selection
    const handleParentCategorySelect = (parentCat) => {
        setSelectedParentCategory(parentCat);
        setCurrentPage(1);
        setCategorySearch('');
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setIsMobileSidebarOpen(false);
        }
        
        // Update URL
        const params = new URLSearchParams(location.search);
        if (parentCat === 'all') {
            params.delete('parent');
        } else {
            params.set('parent', parentCat);
        }
        history.push({ search: params.toString() });
    };

    // Handle products per page change
    const handleProductsPerPageChange = (newLimit) => {
        setProductsPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    // Filter products by search term
    const filteredProducts = (products || []).filter(product => {
        const matchesSearch = (product.name && String(product.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (product.code && String(product.code).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const filteredParentCategories = (parentCategories || [])
        .filter((category) => Boolean(category))
        .filter((category) => category.toLowerCase().includes(categorySearch.toLowerCase()));

    const formatPrice = (price) => {
        if (price == null || price === 0) return 'Đang cập nhật';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleProductClick = (product) => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setSelectedProduct({ ...product, scrollTop });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setTimeout(() => setSelectedProduct(null), 300); // Wait for animation
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
        <>
            <div className="product-catalog-with-sidebar">
            {/* Sidebar */}
            <aside className={`catalog-sidebar ${isMobileSidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-content">
                        <span className="sidebar-header-icon">🗂️</span>
                        <h3>Danh mục sản phẩm</h3>
                    </div>
                    <button
                        type="button"
                        className="sidebar-toggle-btn"
                        onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                        aria-expanded={isMobileSidebarOpen}
                        aria-controls="parent-category-sidebar"
                    >
                        <span className="sidebar-toggle-icon">
                            {isMobileSidebarOpen ? '✕' : '☰'}
                        </span>
                    </button>
                </div>
                <div
                    id="parent-category-sidebar"
                    className={`sidebar-content ${isMobileSidebarOpen ? 'expanded' : ''}`}
                >
                    <div className="sidebar-search">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm danh mục..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="sidebar-search-input"
                        />
                        {categorySearch && (
                            <button 
                                className="clear-search"
                                onClick={() => setCategorySearch('')}
                                aria-label="Xóa tìm kiếm"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <nav className="sidebar-nav">
                        <button
                            className={`sidebar-item ${selectedParentCategory === 'all' ? 'active' : ''}`}
                            onClick={() => handleParentCategorySelect('all')}
                        >
                            <span className="sidebar-icon">📦</span>
                            <div className="sidebar-item-content">
                                <span className="sidebar-label">Tất cả sản phẩm</span>
                                <span className="sidebar-count">{pagination.totalProducts}</span>
                            </div>
                            {selectedParentCategory === 'all' && (
                                <span className="active-indicator">→</span>
                            )}
                        </button>
                        {filteredParentCategories.length > 0 ? (
                            filteredParentCategories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`sidebar-item ${selectedParentCategory === cat ? 'active' : ''}`}
                                    onClick={() => handleParentCategorySelect(cat)}
                                >
                                    <span className="sidebar-icon">📁</span>
                                    <div className="sidebar-item-content">
                                        <span className="sidebar-label">{cat}</span>
                                    </div>
                                    {selectedParentCategory === cat && (
                                        <span className="active-indicator">→</span>
                                    )}
                                </button>
                            ))
                        ) : (
                            categorySearch ? (
                                <div className="sidebar-empty">
                                    <span className="empty-icon">🔍</span>
                                    <p>Không tìm thấy danh mục</p>
                                </div>
                            ) : null
                        )}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="catalog-main">
                {/* Catalog Background Animation */}
                <div className="catalog-background">
                    <div className="bg-shape"></div>
                    <div className="bg-shape"></div>
                    <div className="bg-shape"></div>
                </div>

                <div className="catalog-header">
                    <div className="header-content">
                        <div className="header-badge">
                            {selectedParentCategory === 'all' ? '📦' : '📁'}
                        </div>
                        <div className="header-text">
                            <h1>
                                {selectedParentCategory === 'all' 
                                    ? 'Tất cả sản phẩm' 
                                    : selectedParentCategory}
                            </h1>
                            <p className="catalog-subtitle">
                                Bảng giá: <span className="price-type-badge">{customerType}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-state">
                        <span className="error-icon">⚠️</span>
                        <h3>Đã xảy ra lỗi</h3>
                        <p>{error}</p>
                        <button onClick={() => fetchProducts(currentPage)} className="retry-btn">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="catalog-controls">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                aria-label="Xóa tìm kiếm"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="filters-row">
                        {subcategories.length > 0 && (
                            <div className="subcategory-filter">
                                <label className="filter-label">
                                    <span className="filter-icon">🏷️</span>
                                    Danh mục con:
                                </label>
                                <select
                                    value={selectedSubcategory}
                                    onChange={(e) => {
                                        setSelectedSubcategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="subcategory-select"
                                >
                                    <option value="all">Tất cả</option>
                                    {subcategories.map((sub, index) => (
                                        <option key={index} value={sub}>
                                            {sub}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div className="products-per-page-filter">
                            <label className="filter-label">
                                <span className="filter-icon">📊</span>
                                Hiển thị:
                            </label>
                            <select
                                value={productsPerPage}
                                onChange={(e) => handleProductsPerPageChange(Number(e.target.value))}
                                className="per-page-select"
                            >
                                <option value={12}>12 SP</option>
                                <option value={24}>24 SP</option>
                                <option value={48}>48 SP</option>
                                <option value={96}>96 SP</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div className="results-info">
                    <span className="results-icon">📈</span>
                    <span className="results-text">
                        Hiển thị <strong>{filteredProducts.length}</strong> / <strong>{pagination.totalProducts}</strong> sản phẩm
                        {searchTerm && <span className="search-highlight"> · Tìm kiếm "{searchTerm}"</span>}
                        {selectedParentCategory !== 'all' && <span className="category-highlight"> · {selectedParentCategory}</span>}
                    </span>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📦</span>
                        <h3>Không tìm thấy sản phẩm</h3>
                        <p>
                            {searchTerm 
                                ? 'Vui lòng thử tìm kiếm với từ khóa khác' 
                                : 'Không có sản phẩm nào trong danh mục này'
                            }
                        </p>
                        {searchTerm && (
                            <button 
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="product-grid">
                        {filteredProducts.map(product => (
                            <div 
                                key={product.code} 
                                className="product-card"
                                onClick={() => handleProductClick(product)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleProductClick(product);
                                    }
                                }}
                            >
                                <div className="product-image-placeholder">
                                    <span className="placeholder-icon">📷</span>
                                </div>
                                <div className="product-content">
                                    <div className="product-header">
                                        <span className="product-code">{product.code}</span>
                                        {product.parentCategory && (
                                            <span className="product-category">📁 {product.parentCategory}</span>
                                        )}
                                    </div>
                                    <h3 className="product-name" title={product.name}>{product.name}</h3>
                                    <div className="product-footer">
                                        <div className="product-unit">
                                            <span className="label">📦 Đơn vị:</span>
                                            <span className="value">{product.unit}</span>
                                        </div>
                                        <div className="product-price">
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="pagination-wrapper">
                        <div className="pagination">
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(1)} 
                                disabled={!pagination.hasPrevPage}
                                title="Trang đầu"
                            >
                                ⟨⟨
                            </button>
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                disabled={!pagination.hasPrevPage}
                                title="Trang trước"
                            >
                                ‹
                            </button>

                            <div className="pagination-info">
                                <span className="page-current">{pagination.currentPage}</span>
                                <span className="page-separator">/</span>
                                <span className="page-total">{pagination.totalPages}</span>
                                <span className="products-total">
                                    ({pagination.totalProducts} SP)
                                </span>
                            </div>

                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                disabled={!pagination.hasNextPage}
                                title="Trang sau"
                            >
                                ›
                            </button>
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(pagination.totalPages)} 
                                disabled={!pagination.hasNextPage}
                                title="Trang cuối"
                            >
                                ⟩⟩
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>

        {/* Product Detail Modal */}
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

export default ProductCatalog;
