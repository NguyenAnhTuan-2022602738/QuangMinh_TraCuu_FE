import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryManagement.css';

const CategoryManagement = ({ onDataChanged }) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // State management
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Fetch all categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/products/categories/parent`);
            const parentCategories = response.data;

            if (!Array.isArray(parentCategories)) {
                throw new Error('Invalid response format');
            }

            // Get product count for each category
            const categoriesWithCount = await Promise.all(
                parentCategories.map(async (categoryName) => {
                    try {
                        const productsRes = await axios.get(`${API_URL}/categories/${encodeURIComponent(categoryName)}/products`, {
                            params: { limit: 1 } // Just get count, not all products
                        });
                        const count = productsRes.data?.pagination?.totalProducts || 0;

                        return {
                            name: categoryName,
                            productCount: count,
                            description: getCategoryDescription(categoryName),
                            createdAt: new Date().toISOString() // Placeholder
                        };
                    } catch (error) {
                        console.error(`Error loading count for ${categoryName}:`, error);
                        return {
                            name: categoryName,
                            productCount: 0,
                            description: getCategoryDescription(categoryName),
                            createdAt: new Date().toISOString()
                        };
                    }
                })
            );

            setCategories(categoriesWithCount);
            setError('');
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Lỗi khi tải danh mục: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Get category description based on name
    const getCategoryDescription = (categoryName) => {
        const descriptions = {
            'PHỤ TÙNG ĐỘNG CƠ': 'Các bộ phận quan trọng của động cơ xe máy',
            'PHỤ TÙNG PHANH': 'Hệ thống phanh và các bộ phận liên quan',
            'PHỤ TÙNG ĐIỆN': 'Bộ phận điện tử và hệ thống điện',
            'PHỤ TÙNG KHUNG': 'Khung xe và các bộ phận kết cấu',
            'PHỤ TÙNG TREO': 'Hệ thống treo và giảm xóc',
            'PHỤ TÙNG TRUYỀN ĐỘNG': 'Hộp số và hệ thống truyền động',
            'PHỤ TÙNG LỌC': 'Các loại bộ lọc (dầu, gió, nhiên liệu)',
            'PHỤ TÙNG KHÁC': 'Các phụ tùng khác'
        };
        return descriptions[categoryName] || 'Danh mục phụ tùng xe máy';
    };

    // Load products for a specific category
    const loadCategoryProducts = async (categoryName) => {
        try {
            setLoadingProducts(true);
            console.log('📦 Loading products for category:', categoryName);
            const response = await axios.get(`${API_URL}/categories/${encodeURIComponent(categoryName)}/products`, {
                params: { limit: 1000 } // Get all products for this category
            });

            console.log('📦 Products response:', response.data);
            if (response.data && Array.isArray(response.data.products)) {
                setCategoryProducts(response.data.products);
                setSelectedCategory(categoryName);
                console.log(`✅ Loaded ${response.data.products.length} products for category "${categoryName}"`);
            } else {
                setCategoryProducts([]);
                setSelectedCategory(categoryName);
                console.log(`⚠️ No products found for category "${categoryName}"`);
            }
        } catch (error) {
            console.error('❌ Error loading category products:', error);
            alert('Lỗi khi tải sản phẩm: ' + error.message);
            setCategoryProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            if (editingCategory) {
                // Update category name - update all products in this category
                await updateCategoryName(editingCategory.name, formData.name);
                alert('Cập nhật danh mục thành công!');
            } else {
                // Create new category - create a sample product
                await createNewCategory(formData.name, formData.description);
                alert('Thêm danh mục thành công!');
            }

            setShowForm(false);
            setFormData({ name: '', description: '' });
            setEditingCategory(null);
            fetchCategories(); // Refresh the list
            
            // Notify parent component to refresh data
            if (onDataChanged) {
                onDataChanged();
            }
        } catch (error) {
            alert('Lỗi khi lưu danh mục: ' + error.message);
        }
    };

    // Create new category by creating a sample product
    const createNewCategory = async (categoryName, description) => {
        const sampleProduct = {
            code: `SAMPLE_${Date.now()}`,
            name: `Sản phẩm mẫu - ${categoryName}`,
            parentCategory: categoryName,
            subcategory: 'Sản phẩm mẫu',
            unit: 'Cái',
            BBCL: 0,
            BBPT: 0,
            BL: 0,
            BLVIP: 0,
            HONDA247: 0
        };

        const response = await axios.post(`${API_URL}/products`, sampleProduct, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.status === 201) {
            // Delete the sample product after creating category
            const createdProduct = response.data.product;
            await axios.delete(`${API_URL}/products/${createdProduct._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
        }
    };

    // Update category name by updating all products in that category
    const updateCategoryName = async (oldName, newName) => {
        try {
            // Get all products in this category
            const response = await axios.get(`${API_URL}/products`, {
                params: { parent: oldName }
            });

            if (response.data.products && response.data.products.length > 0) {
                // Update each product
                const updatePromises = response.data.products.map(product =>
                    axios.put(`${API_URL}/products/${product._id}`, {
                        parentCategory: newName
                    }, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    })
                );

                await Promise.all(updatePromises);
            }
        } catch (error) {
            throw new Error('Không thể cập nhật tên danh mục: ' + error.message);
        }
    };

    // State for additional features
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeData, setMergeData] = useState({ fromCategory: '', toCategory: '' });
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveData, setMoveData] = useState({ productId: '', newCategory: '' });
    const [selectedProductsForMove, setSelectedProductsForMove] = useState([]);
    const [initialLoading, setInitialLoading] = useState(false);

    // Handle merge categories
    const handleMergeCategories = async () => {
        if (!mergeData.fromCategory || !mergeData.toCategory) {
            alert('Vui lòng chọn cả hai danh mục');
            return;
        }

        if (mergeData.fromCategory === mergeData.toCategory) {
            alert('Không thể gộp danh mục với chính nó');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn gộp "${mergeData.fromCategory}" vào "${mergeData.toCategory}"?\n\nTất cả sản phẩm sẽ được chuyển sang danh mục đích.`)) {
            return;
        }

        try {
            setInitialLoading(true);
            await updateCategoryName(mergeData.fromCategory, mergeData.toCategory);
            alert(`Đã gộp danh mục "${mergeData.fromCategory}" vào "${mergeData.toCategory}" thành công!`);
            setShowMergeModal(false);
            setMergeData({ fromCategory: '', toCategory: '' });
            fetchCategories();
            
            // Notify parent component to refresh data
            if (onDataChanged) {
                onDataChanged();
            }
        } catch (error) {
            alert('Lỗi khi gộp danh mục: ' + error.message);
        } finally {
            setInitialLoading(false);
        }
    };

    // Handle move products between categories
    const handleMoveProducts = async () => {
        if (selectedProductsForMove.length === 0 || !moveData.newCategory) {
            alert('Vui lòng chọn sản phẩm và danh mục đích');
            return;
        }

        try {
            setInitialLoading(true);
            console.log('🚚 Moving products:', selectedProductsForMove, 'to category:', moveData.newCategory);

            const updatePromises = selectedProductsForMove.map(productId =>
                axios.put(`${API_URL}/products/${productId}`, {
                    parentCategory: moveData.newCategory
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                })
            );

            const results = await Promise.all(updatePromises);
            console.log('✅ Move results:', results);

            // Kiểm tra xem danh mục cũ còn sản phẩm nào không
            const remainingProductsResponse = await axios.get(`${API_URL}/products`, {
                params: { parent: selectedCategory }
            });
            
            const remainingProducts = remainingProductsResponse.data.products || [];
            
            if (remainingProducts.length === 0 && selectedCategory !== moveData.newCategory) {
                alert(`✅ Đã chuyển ${selectedProductsForMove.length} sản phẩm thành công!\n\n📝 Sản phẩm đã được chuyển từ "${selectedCategory}" sang "${moveData.newCategory}".\n\n⚠️ Danh mục "${selectedCategory}" không còn sản phẩm nào và sẽ biến mất khỏi danh sách.`);
            } else {
                alert(`✅ Đã chuyển ${selectedProductsForMove.length} sản phẩm thành công!\n\n📝 Sản phẩm đã được chuyển từ "${selectedCategory}" sang "${moveData.newCategory}".`);
            }
            setShowMoveModal(false);
            setMoveData({ productId: '', newCategory: '' });
            setSelectedProductsForMove([]);

            // Refresh data properly
            console.log('🔄 Refreshing data after move...');
            await fetchCategories(); // Refresh category list first
            await loadCategoryProducts(selectedCategory); // Then refresh current category products
            console.log('✅ Data refreshed');

            // Notify parent component to refresh data
            if (onDataChanged) {
                onDataChanged();
            }

        } catch (error) {
            console.error('❌ Error moving products:', error);
            alert('Lỗi khi di chuyển sản phẩm: ' + error.message);
        } finally {
            setInitialLoading(false);
        }
    };

    // Handle delete category
    const handleDeleteCategory = async (categoryName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?\n\nTất cả sản phẩm trong danh mục này sẽ bị xóa vĩnh viễn!`)) {
            return;
        }

        try {
            // Get all products in this category
            const response = await axios.get(`${API_URL}/products`, {
                params: { parent: categoryName }
            });

            if (response.data.products && response.data.products.length > 0) {
                // Delete all products in this category
                const deletePromises = response.data.products.map(product =>
                    axios.delete(`${API_URL}/products/${product._id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    })
                );

                await Promise.all(deletePromises);
                alert(`Đã xóa danh mục "${categoryName}" và ${response.data.products.length} sản phẩm!`);
            } else {
                alert('Danh mục không có sản phẩm nào để xóa.');
            }

            fetchCategories(); // Refresh the list
            
            // Notify parent component to refresh data
            if (onDataChanged) {
                onDataChanged();
            }
        } catch (error) {
            alert('Lỗi khi xóa danh mục: ' + error.message);
        }
    };

    // Export categories data
    const exportCategories = () => {
        const exportData = categories.map(cat => ({
            'Tên danh mục': cat.name,
            'Số sản phẩm': cat.productCount,
            'Mô tả': cat.description,
            'Ngày tạo': cat.createdAt
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh mục');
        XLSX.writeFile(wb, `danh-muc-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Get detailed category statistics
    const getCategoryStats = (categoryName) => {
        const category = categories.find(c => c.name === categoryName);
        if (!category) return null;

        const products = categoryProducts;
        const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
        
        const priceStats = {
            min: Math.min(...products.map(p => Math.min(
                p.prices?.BBCL || p.BBCL || 0,
                p.prices?.BBPT || p.BBPT || 0,
                p.prices?.BL || p.BL || 0,
                p.prices?.BLVIP || p.BLVIP || 0,
                p.prices?.honda247 || p.HONDA247 || 0
            )).filter(p => p > 0)),
            max: Math.max(...products.map(p => Math.max(
                p.prices?.BBCL || p.BBCL || 0,
                p.prices?.BBPT || p.BBPT || 0,
                p.prices?.BL || p.BL || 0,
                p.prices?.BLVIP || p.BLVIP || 0,
                p.prices?.honda247 || p.HONDA247 || 0
            ))),
            avg: products.reduce((sum, p) => {
                const prices = [
                    p.prices?.BBCL || p.BBCL || 0,
                    p.prices?.BBPT || p.BBPT || 0,
                    p.prices?.BL || p.BL || 0,
                    p.prices?.BLVIP || p.BLVIP || 0,
                    p.prices?.honda247 || p.HONDA247 || 0
                ].filter(price => price > 0);
                return sum + (prices.reduce((a, b) => a + b, 0) / prices.length || 0);
            }, 0) / products.length
        };

        return {
            totalProducts: products.length,
            subcategories: subcategories.length,
            subcategoryList: subcategories,
            priceStats,
            lastUpdated: new Date().toLocaleDateString('vi-VN')
        };
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get category stats
    const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);
    const totalCategories = categories.length;

    useEffect(() => {
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="category-management">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="category-management">
                <div className="error-state">
                    <span>⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchCategories} className="btn btn-primary">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="category-management-modern">
            {/* Header */}
            <div className="category-header">
                <div className="header-content">
                    <h1>🗂️ Quản lý Danh mục</h1>
                    <p className="header-description">
                        Quản lý các danh mục phụ tùng và xem sản phẩm trong từng danh mục
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setEditingCategory(null);
                            setFormData({ name: '', description: '' });
                        }}
                        className="btn btn-primary"
                    >
                        ➕ Thêm danh mục
                    </button>
                    <button
                        onClick={() => setShowMergeModal(true)}
                        className="btn btn-secondary"
                    >
                        🔗 Gộp danh mục
                    </button>
                    <button
                        onClick={() => setShowMoveModal(true)}
                        className="btn btn-secondary"
                    >
                        ↗️ Di chuyển sản phẩm
                    </button>
                    <button
                        onClick={exportCategories}
                        className="btn btn-info"
                    >
                        📥 Xuất dữ liệu
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{totalCategories}</h3>
                        <p>Tổng danh mục</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <h3>{totalProducts}</h3>
                        <p>Tổng sản phẩm</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>{totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0}</h3>
                        <p>SP/Danh mục</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{categories.filter(c => c.productCount > 0).length}</h3>
                        <p>Có sản phẩm</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="category-toolbar">
                <div className="search-section">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="clear-search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-section">
                    <select className="sort-select">
                        <option value="name">Sắp xếp theo tên</option>
                        <option value="products">Sắp xếp theo số sản phẩm</option>
                        <option value="recent">Mới nhất</option>
                    </select>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="categories-grid">
                {filteredCategories.map((category) => (
                    <div
                        key={category.name}
                        className={`category-card ${selectedCategory === category.name ? 'selected' : ''}`}
                        onClick={() => loadCategoryProducts(category.name)}
                    >
                        <div className="category-card-header">
                            <div className="category-icon">
                                {getCategoryIcon(category.name)}
                            </div>
                            <div className="category-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCategory(category);
                                        setFormData({
                                            name: category.name,
                                            description: category.description
                                        });
                                        setShowForm(true);
                                    }}
                                    className="btn-icon btn-edit"
                                    title="Sửa"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.name);
                                    }}
                                    className="btn-icon btn-delete"
                                    title="Xóa"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="category-content">
                            <h3 className="category-name">{category.name}</h3>
                            <p className="category-description">{category.description}</p>

                            <div className="category-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{category.productCount}</span>
                                    <span className="stat-label">sản phẩm</span>
                                </div>
                            </div>
                        </div>

                        <div className="category-footer">
                            <button
                                onClick={() => loadCategoryProducts(category.name)}
                                className="btn btn-outline btn-sm"
                            >
                                {selectedCategory === category.name ? 'Đang xem' : 'Xem sản phẩm'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Category Stats */}
            {selectedCategory && getCategoryStats(selectedCategory) && (
                <div className="detailed-stats-section">
                    <h2>📊 Thống kê chi tiết: {selectedCategory}</h2>
                    <div className="detailed-stats-grid">
                        {(() => {
                            const stats = getCategoryStats(selectedCategory);
                            return (
                                <>
                                    <div className="detail-stat-card">
                                        <div className="stat-icon">📦</div>
                                        <div className="stat-content">
                                            <h4>{stats.totalProducts}</h4>
                                            <p>Tổng sản phẩm</p>
                                        </div>
                                    </div>

                                    <div className="detail-stat-card">
                                        <div className="stat-icon">🏷️</div>
                                        <div className="stat-content">
                                            <h4>{stats.subcategories}</h4>
                                            <p>Danh mục con</p>
                                        </div>
                                    </div>

                                    <div className="detail-stat-card">
                                        <div className="stat-icon">💰</div>
                                        <div className="stat-content">
                                            <h4>{stats.priceStats.min.toLocaleString()}đ</h4>
                                            <p>Giá thấp nhất</p>
                                        </div>
                                    </div>

                                    <div className="detail-stat-card">
                                        <div className="stat-icon">💎</div>
                                        <div className="stat-content">
                                            <h4>{stats.priceStats.max.toLocaleString()}đ</h4>
                                            <p>Giá cao nhất</p>
                                        </div>
                                    </div>

                                    <div className="detail-stat-card">
                                        <div className="stat-icon">📊</div>
                                        <div className="stat-content">
                                            <h4>{stats.priceStats.avg.toLocaleString()}đ</h4>
                                            <p>Giá trung bình</p>
                                        </div>
                                    </div>

                                    <div className="detail-stat-card">
                                        <div className="stat-icon">📅</div>
                                        <div className="stat-content">
                                            <h4>{stats.lastUpdated}</h4>
                                            <p>Cập nhật cuối</p>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {getCategoryStats(selectedCategory).subcategoryList.length > 0 && (
                        <div className="subcategories-list">
                            <h3>🏷️ Danh mục con:</h3>
                            <div className="subcategory-tags">
                                {getCategoryStats(selectedCategory).subcategoryList.map(sub => (
                                    <span key={sub} className="subcategory-tag">{sub}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {filteredCategories.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>Không tìm thấy danh mục</h3>
                    <p>{searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có danh mục nào'}</p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="btn btn-primary"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* Category Products Panel */}
            {selectedCategory && (
                <div className="category-products-panel">
                    <div className="panel-header">
                        <h2>📦 Sản phẩm trong "{selectedCategory}"</h2>
                        <div className="panel-actions">
                            <button
                                onClick={() => {
                                    if (selectedProductsForMove.length === categoryProducts.length) {
                                        setSelectedProductsForMove([]);
                                    } else {
                                        setSelectedProductsForMove(categoryProducts.map(p => p._id));
                                    }
                                }}
                                className="btn btn-outline btn-sm"
                            >
                                {selectedProductsForMove.length === categoryProducts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                            <button
                                onClick={() => setShowMoveModal(true)}
                                className="btn btn-primary btn-sm"
                                disabled={selectedProductsForMove.length === 0}
                            >
                                Di chuyển ({selectedProductsForMove.length})
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setCategoryProducts([]);
                                    setSelectedProductsForMove([]);
                                }}
                                className="btn-close-panel"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {loadingProducts ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải sản phẩm...</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {categoryProducts.map((product) => (
                                <div key={product._id} className="product-card">
                                    <div className="product-header">
                                        <div className="product-select">
                                            <input
                                                type="checkbox"
                                                id={`select-${product._id}`}
                                                checked={selectedProductsForMove.includes(product._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedProductsForMove([...selectedProductsForMove, product._id]);
                                                    } else {
                                                        setSelectedProductsForMove(selectedProductsForMove.filter(id => id !== product._id));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`select-${product._id}`}></label>
                                        </div>
                                        <span className="product-code">{product.code}</span>
                                        <span className="product-unit">{product.unit}</span>
                                    </div>
                                    <h4 className="product-name">{product.name}</h4>
                                    <div className="product-subcategory">
                                        {product.subcategory && (
                                            <span className="subcategory-badge">
                                                🏷️ {product.subcategory}
                                            </span>
                                        )}
                                    </div>
                                    <div className="product-prices">
                                        {product.prices?.BBCL && (
                                            <div className="price-item">
                                                <span className="price-label">BBCL:</span>
                                                <span className="price-value">
                                                    {product.prices.BBCL.toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        )}
                                        {product.prices?.BBPT && (
                                            <div className="price-item">
                                                <span className="price-label">BBPT:</span>
                                                <span className="price-value">
                                                    {product.prices.BBPT.toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {categoryProducts.length === 0 && !loadingProducts && (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3>Không có sản phẩm</h3>
                            <p>Danh mục này chưa có sản phẩm nào</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Category Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}</h2>
                            <button onClick={() => setShowForm(false)} className="modal-close">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="category-form">
                            <div className="form-group">
                                <label>Tên danh mục *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="VD: PHỤ TÙNG ĐỘNG CƠ"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Mô tả về danh mục này..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Merge Categories Modal */}
            {showMergeModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>🔗 Gộp danh mục</h3>
                            <button
                                onClick={() => setShowMergeModal(false)}
                                className="close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Danh mục nguồn (sẽ bị xóa):</label>
                                <select
                                    value={mergeData.fromCategory}
                                    onChange={(e) => setMergeData({...mergeData, fromCategory: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">Chọn danh mục nguồn</option>
                                    {categories.map(cat => (
                                        <option key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.productCount} sản phẩm)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Danh mục đích (sẽ giữ lại):</label>
                                <select
                                    value={mergeData.toCategory}
                                    onChange={(e) => setMergeData({...mergeData, toCategory: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">Chọn danh mục đích</option>
                                    {categories.map(cat => (
                                        <option key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.productCount} sản phẩm)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="merge-warning">
                                ⚠️ <strong>Lưu ý:</strong> Tất cả sản phẩm từ danh mục nguồn sẽ được chuyển sang danh mục đích. Danh mục nguồn sẽ bị xóa.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setShowMergeModal(false)}
                                className="btn btn-outline"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleMergeCategories}
                                className="btn btn-danger"
                                disabled={!mergeData.fromCategory || !mergeData.toCategory}
                            >
                                Gộp danh mục
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Products Modal */}
            {showMoveModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>↗️ Di chuyển sản phẩm</h3>
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Chọn danh mục đích:</label>
                                <select
                                    value={moveData.newCategory}
                                    onChange={(e) => setMoveData({...moveData, newCategory: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">Chọn danh mục đích</option>
                                    {categories.map(cat => (
                                        <option key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.productCount} sản phẩm)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Chọn sản phẩm để di chuyển:</label>
                                <div className="product-selection">
                                    {categoryProducts.map(product => (
                                        <div key={product._id} className="product-checkbox">
                                            <input
                                                type="checkbox"
                                                id={`product-${product._id}`}
                                                checked={selectedProductsForMove.includes(product._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedProductsForMove([...selectedProductsForMove, product._id]);
                                                    } else {
                                                        setSelectedProductsForMove(selectedProductsForMove.filter(id => id !== product._id));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`product-${product._id}`}>
                                                {product.name} - {product.partNumber}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="selection-info">
                                Đã chọn: {selectedProductsForMove.length} sản phẩm
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="btn btn-outline"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleMoveProducts}
                                className="btn btn-primary"
                                disabled={selectedProductsForMove.length === 0 || !moveData.newCategory}
                            >
                                Di chuyển sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to get category icons
const getCategoryIcon = (categoryName) => {
    const icons = {
        'PHỤ TÙNG ĐỘNG CƠ': '⚙️',
        'PHỤ TÙNG PHANH': '🛑',
        'PHỤ TÙNG ĐIỆN': '🔌',
        'PHỤ TÙNG KHUNG': '🏗️',
        'PHỤ TÙNG TREO': '🔧',
        'PHỤ TÙNG TRUYỀN ĐỘNG': '⚡',
        'PHỤ TÙNG LỌC': '🔍',
        'PHỤ TÙNG KHÁC': '📦'
    };
    return icons[categoryName] || '📦';
};

export default CategoryManagement;
