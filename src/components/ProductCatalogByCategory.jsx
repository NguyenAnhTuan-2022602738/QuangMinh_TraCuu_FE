import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchSubcategories();
        fetchProducts();
    }, [parentCategory]);

    useEffect(() => {
        fetchProducts();
    }, [selectedSubcategory]);

    const fetchSubcategories = async () => {
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
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const url = `${API_URL}/products/categories/${encodeURIComponent(parentCategory)}/products${
                selectedSubcategory !== 'all' ? `?subcategory=${encodeURIComponent(selectedSubcategory)}` : ''
            }`;
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Không thể tải sản phẩm');
            
            const data = await response.json();
            setProducts(data);
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Không thể tải sản phẩm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.code?.toLowerCase().includes(searchLower) ||
            product.name?.toLowerCase().includes(searchLower) ||
            product.subcategory?.toLowerCase().includes(searchLower)
        );
    });

    const goBack = () => {
        history.push('/categories');
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
                    <p className="product-count">{filteredProducts.length} sản phẩm</p>
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

                <div className="subcategory-filters">
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
