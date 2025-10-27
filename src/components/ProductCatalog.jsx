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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(12);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Load parent category from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const parentCat = params.get('parent');
        if (parentCat) {
            setSelectedParentCategory(parentCat);
        }
    }, [location.search]);

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

    // Fetch products based on filters
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('customerToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            let url;
            if (selectedParentCategory === 'all') {
                // Fetch all products with price type
                url = `${API_URL}/products/${customerType}`;
            } else {
                // Fetch products by parent category with price type
                url = `${API_URL}/products/categories/${encodeURIComponent(selectedParentCategory)}/products?priceType=${customerType}`;
                if (selectedSubcategory !== 'all') {
                    url += `&subcategory=${encodeURIComponent(selectedSubcategory)}`;
                }
            }
            
            const response = await axios.get(url, { headers });
            setProducts(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            const msg = err?.response?.data?.message || 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [customerType, selectedParentCategory, selectedSubcategory, API_URL]);

    useEffect(() => {
        fetchParentCategories();
    }, [fetchParentCategories]);

    useEffect(() => {
        fetchSubcategories(selectedParentCategory);
        setSelectedSubcategory('all'); // Reset subcategory when parent changes
    }, [selectedParentCategory, fetchSubcategories]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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
        
        // Update URL
        const params = new URLSearchParams(location.search);
        if (parentCat === 'all') {
            params.delete('parent');
        } else {
            params.set('parent', parentCat);
        }
        history.push({ search: params.toString() });
    };

    // Filter products by search term
    const filteredProducts = products.filter(product => {
        const matchesSearch = (product.name && String(product.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (product.code && String(product.code).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

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
            <aside className="catalog-sidebar">
                <div className="sidebar-header">
                    <h3>📂 Danh mục cha</h3>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${selectedParentCategory === 'all' ? 'active' : ''}`}
                        onClick={() => handleParentCategorySelect('all')}
                    >
                        <span className="sidebar-icon">📦</span>
                        <span className="sidebar-label">Tất cả sản phẩm</span>
                        <span className="sidebar-count">{products.length}</span>
                    </button>
                    {parentCategories.map((cat, index) => (
                        <button
                            key={index}
                            className={`sidebar-item ${selectedParentCategory === cat.name ? 'active' : ''}`}
                            onClick={() => handleParentCategorySelect(cat.name)}
                        >
                            <span className="sidebar-icon">📁</span>
                            <span className="sidebar-label">{cat.name}</span>
                            <span className="sidebar-count">{cat.count}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="catalog-main">
                <div className="catalog-header">
                    <h1>
                        {selectedParentCategory === 'all' 
                            ? '📦 Tất cả sản phẩm' 
                            : `📁 ${selectedParentCategory}`}
                    </h1>
                    <p className="catalog-subtitle">
                        Đang xem bảng giá: <strong className="price-type-badge">{customerType}</strong>
                    </p>
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
                <div className="catalog-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm theo tên hoặc mã sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="search-input"
                        />
                    </div>

                    {subcategories.length > 0 && (
                        <div className="subcategory-filter">
                            <label>Danh mục con:</label>
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
                        <label>Hiển thị:</label>
                        <select
                            value={productsPerPage}
                            onChange={(e) => {
                                setProductsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="per-page-select"
                        >
                            <option value={12}>12 sản phẩm</option>
                            <option value={24}>24 sản phẩm</option>
                            <option value={48}>48 sản phẩm</option>
                            <option value={96}>96 sản phẩm</option>
                        </select>
                    </div>
                </div>

                {/* Results count */}
                <div className="results-info">
                    Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
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
                        {filteredProducts
                            .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                            .map(product => (
                            <div 
                                key={product.code} 
                                className="product-card card"
                                onClick={() => handleProductClick(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="product-header">
                                    <span className="product-code">{product.code}</span>
                                    {product.subcategory && (
                                        <span className="product-subcategory">{product.subcategory}</span>
                                    )}
                                </div>
                                {selectedParentCategory === 'all' && product.parentCategory && (
                                    <div className="product-parent-category">
                                        📁 {product.parentCategory}
                                    </div>
                                )}
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
            </main>
        </div>

        {/* Product Detail Modal - Fixed positioning */}
        {showModal && selectedProduct && (
            <div 
                className="modal-overlay" 
                onClick={handleCloseModal}
                style={{ top: `${selectedProduct.scrollTop}px` }}
            >
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseModal}>
                            ✕
                        </button>
                        
                        {/* Product Image */}
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

export default ProductCatalog;
