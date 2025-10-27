import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './CategoryManagement.css';

const CategoryManagement = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState({});
    const [initialLoading, setInitialLoading] = useState(true);
    const [draggedCategory, setDraggedCategory] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const fetchCategoriesMetadata = async () => {
        try {
            setInitialLoading(true);
            console.log('🔍 Fetching parent categories from:', `${API_URL}/products/categories/parent`);
            
            const response = await axios.get(`${API_URL}/products/categories/parent`);
            const parentCategories = response.data;
            
            console.log('📦 Parent categories received:', parentCategories);

            // Validate response is array
            if (!Array.isArray(parentCategories)) {
                console.error('❌ Invalid response from API (not an array):', parentCategories);
                setInitialLoading(false);
                return;
            }

            console.log(`✅ Found ${parentCategories.length} parent categories`);

            // Get product count for each category (lightweight query)
            const categoriesMetadata = await Promise.all(
                parentCategories.map(async (parentCat) => {
                    try {
                        console.log(`📊 Loading count for category: ${parentCat}`);
                        const productsRes = await axios.get(`${API_URL}/products`, {
                            params: { parent: parentCat }
                        });
                        
                        const count = Array.isArray(productsRes.data) ? productsRes.data.length : 0;
                        console.log(`  ✓ ${parentCat}: ${count} products`);
                        
                        return {
                            name: String(parentCat), // Ensure it's a string
                            productCount: count,
                            subcategories: null, // Will be loaded on demand
                            products: null, // Will be loaded on demand
                            loaded: false
                        };
                    } catch (error) {
                        console.error(`❌ Error loading metadata for ${parentCat}:`, error);
                        return {
                            name: String(parentCat),
                            productCount: 0,
                            subcategories: null,
                            products: null,
                            loaded: false
                        };
                    }
                })
            );

            // Sort by product count (ascending) - load small categories first
            categoriesMetadata.sort((a, b) => a.productCount - b.productCount);
            
            console.log('📋 Categories metadata prepared:', categoriesMetadata);

            setCategories(categoriesMetadata);
            setInitialLoading(false);

            // Auto-load categories with < 100 products immediately
            const autoLoadCats = categoriesMetadata.filter(cat => cat.productCount < 100 && cat.productCount > 0);
            console.log(`🚀 Auto-loading ${autoLoadCats.length} small categories`);
            
            autoLoadCats.forEach(cat => {
                loadCategoryDetails(cat.name);
            });
        } catch (error) {
            console.error('❌ Error fetching categories metadata:', error);
            setInitialLoading(false);
            alert('Lỗi khi tải danh mục: ' + error.message);
        }
    };

    // Fetch all parent categories with their product counts (lightweight)
    useEffect(() => {
        fetchCategoriesMetadata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load details for a specific category (lazy load)
    const loadCategoryDetails = useCallback(async (categoryName) => {
        if (loadingCategories[categoryName]) return; // Already loading

        setLoadingCategories(prev => ({ ...prev, [categoryName]: true }));

        try {
            const productsRes = await axios.get(`${API_URL}/products`, {
                params: { parent: categoryName }
            });
            
            if (!Array.isArray(productsRes.data)) {
                console.error('Invalid products response:', productsRes.data);
                setLoadingCategories(prev => ({ ...prev, [categoryName]: false }));
                return;
            }

            // Group products by subcategory
            const subcategories = {};
            productsRes.data.forEach(product => {
                const subcat = product.subcategory || 'Không có danh mục con';
                if (!subcategories[subcat]) {
                    subcategories[subcat] = [];
                }
                subcategories[subcat].push(product);
            });

            setCategories(prev => prev.map(cat => 
                cat.name === categoryName 
                    ? {
                        ...cat,
                        subcategories: subcategories,
                        products: productsRes.data,
                        loaded: true
                    }
                    : cat
            ));
        } catch (error) {
            console.error(`Error loading category ${categoryName}:`, error);
        } finally {
            setLoadingCategories(prev => ({ ...prev, [categoryName]: false }));
        }
    }, [API_URL, loadingCategories]);

    // Calculate similarity between two strings (Levenshtein distance based)
    const calculateSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;
        
        str1 = str1.toLowerCase().trim();
        str2 = str2.toLowerCase().trim();
        
        if (str1 === str2) return 100;

        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 100;

        const editDistance = getEditDistance(longer, shorter);
        return ((longer.length - editDistance) / longer.length) * 100;
    };

    const getEditDistance = (str1, str2) => {
        const costs = [];
        for (let i = 0; i <= str1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= str2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[str2.length] = lastValue;
        }
        return costs[str2.length];
    };

    // Find matching subcategory in target parent category
    const findMatchingSubcategory = (oldSubcat, targetParentCategory) => {
        const targetSubcategories = Object.keys(targetParentCategory.subcategories);
        
        let bestMatch = null;
        let bestSimilarity = 0;

        targetSubcategories.forEach(targetSubcat => {
            const similarity = calculateSimilarity(oldSubcat, targetSubcat);
            if (similarity >= 70 && similarity > bestSimilarity) {
                bestMatch = targetSubcat;
                bestSimilarity = similarity;
            }
        });

        return bestMatch;
    };

    // Preview what will happen when dropping
    const handleDragStart = (e, category) => {
        // Load category details if not loaded yet
        if (!category.loaded) {
            loadCategoryDetails(category.name);
        }
        setDraggedCategory(category);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, targetCategory) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Load target category details if not loaded
        if (!targetCategory.loaded) {
            loadCategoryDetails(targetCategory.name);
        }

        if (draggedCategory && draggedCategory.name !== targetCategory.name && 
            draggedCategory.loaded && targetCategory.loaded) {
            // Generate preview data
            const updates = [];
            
            draggedCategory.products.forEach(product => {
                const oldSubcat = product.subcategory || '';
                const matchingSubcat = findMatchingSubcategory(oldSubcat, targetCategory);
                
                updates.push({
                    productId: product._id,
                    productCode: product.code,
                    productName: product.name,
                    oldParent: draggedCategory.name,
                    newParent: targetCategory.name,
                    oldSubcat: oldSubcat,
                    newSubcat: matchingSubcat || oldSubcat,
                    subcatChanged: !!matchingSubcat,
                    similarity: matchingSubcat ? calculateSimilarity(oldSubcat, matchingSubcat) : 0
                });
            });

            setPreviewData({
                from: draggedCategory.name,
                to: targetCategory.name,
                updates: updates
            });
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setPreviewData(null);
    };

    const handleDrop = async (e, targetCategory) => {
        e.preventDefault();
        
        if (!draggedCategory || draggedCategory.name === targetCategory.name) {
            setDraggedCategory(null);
            setPreviewData(null);
            return;
        }

        // Show preview modal for confirmation
        setShowPreview(true);
    };

    const handleConfirmMove = async () => {
        if (!previewData) return;

        try {
            setInitialLoading(true);
            
            // Update all products
            const updatePromises = previewData.updates.map(update => 
                axios.put(`${API_URL}/products/${update.productId}`, {
                    parentCategory: update.newParent,
                    subcategory: update.newSubcat
                })
            );

            await Promise.all(updatePromises);

            alert(`✅ Đã chuyển ${previewData.updates.length} sản phẩm từ "${previewData.from}" sang "${previewData.to}"`);
            
            // Refresh data - reload only affected categories
            await Promise.all([
                loadCategoryDetails(previewData.from),
                loadCategoryDetails(previewData.to)
            ]);
            
            setShowPreview(false);
            setPreviewData(null);
            setDraggedCategory(null);
        } catch (error) {
            console.error('Error moving products:', error);
            alert('❌ Lỗi khi di chuyển sản phẩm: ' + error.message);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleCancelMove = () => {
        setShowPreview(false);
        setPreviewData(null);
        setDraggedCategory(null);
    };

    if (initialLoading) {
        return (
            <div className="category-management">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="category-management">
            <div className="category-header">
                <h2>🗂️ Quản lý Danh mục</h2>
                <p className="category-description">
                    Kéo và thả danh mục để chuyển sản phẩm. Hệ thống sẽ tự động so sánh và cập nhật danh mục con.
                </p>
                <div className="category-stats">
                    <span className="stat-badge">
                        📊 {categories?.length || 0} danh mục
                    </span>
                    <span className="stat-badge">
                        ✅ {categories?.filter(c => c.loaded).length || 0} đã tải
                    </span>
                    <span className="stat-badge">
                        ⏳ {categories?.filter(c => !c.loaded).length || 0} chưa tải
                    </span>
                </div>
            </div>

            <div className="categories-grid">
                {Array.isArray(categories) && categories.map((category) => (
                    <div
                        key={category.name}
                        className={`category-card ${draggedCategory?.name === category.name ? 'dragging' : ''} ${!category.loaded ? 'not-loaded' : ''}`}
                        draggable={category.loaded}
                        onDragStart={(e) => category.loaded && handleDragStart(e, category)}
                        onDragOver={(e) => handleDragOver(e, category)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category)}
                        onClick={() => !category.loaded && loadCategoryDetails(category.name)}
                    >
                        <div className="category-card-header">
                            <h3>📁 {category.name}</h3>
                            <span className="product-count-badge">{category.productCount} sản phẩm</span>
                        </div>

                        {!category.loaded ? (
                            <div className="category-placeholder">
                                {loadingCategories[category.name] ? (
                                    <>
                                        <div className="mini-spinner"></div>
                                        <p>Đang tải...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="load-icon">👆</div>
                                        <p>Click để tải chi tiết</p>
                                        <small>{category.productCount} sản phẩm</small>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="subcategories-list">
                                {category.subcategories && Object.entries(category.subcategories).map(([subcat, products]) => (
                                    <div key={subcat} className="subcategory-item">
                                        <span className="subcategory-name">🏷️ {subcat}</span>
                                        <span className="subcategory-count">{products.length}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {previewData && previewData.to === category.name && draggedCategory?.name !== category.name && (
                            <div className="drop-preview">
                                <div className="drop-preview-icon">⬇️</div>
                                <p>Thả vào đây để chuyển {previewData.updates.length} sản phẩm</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {(!categories || categories.length === 0) && (
                <div className="empty-state">
                    <p>📦 Chưa có danh mục nào</p>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && previewData && (
                <div className="preview-modal-overlay" onClick={handleCancelMove}>
                    <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-modal-header">
                            <h3>🔄 Xác nhận chuyển danh mục</h3>
                            <button className="modal-close" onClick={handleCancelMove}>✕</button>
                        </div>

                        <div className="preview-summary">
                            <div className="preview-summary-item">
                                <span className="preview-label">Từ:</span>
                                <span className="preview-value from">{previewData.from}</span>
                            </div>
                            <div className="preview-arrow">➡️</div>
                            <div className="preview-summary-item">
                                <span className="preview-label">Sang:</span>
                                <span className="preview-value to">{previewData.to}</span>
                            </div>
                        </div>

                        <div className="preview-stats">
                            <div className="stat-item">
                                <span className="stat-number">{previewData.updates.length}</span>
                                <span className="stat-label">Sản phẩm</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {previewData.updates.filter(u => u.subcatChanged).length}
                                </span>
                                <span className="stat-label">Đổi danh mục con</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {previewData.updates.filter(u => !u.subcatChanged).length}
                                </span>
                                <span className="stat-label">Giữ nguyên</span>
                            </div>
                        </div>

                        <div className="preview-products-list">
                            <h4>Chi tiết thay đổi:</h4>
                            <div className="preview-products-scroll">
                                {previewData.updates.map((update, index) => (
                                    <div key={index} className="preview-product-item">
                                        <div className="preview-product-info">
                                            <span className="preview-product-code">{update.productCode}</span>
                                            <span className="preview-product-name">{update.productName}</span>
                                        </div>
                                        <div className="preview-product-changes">
                                            <div className="change-row">
                                                <span className="change-label">Danh mục con:</span>
                                                {update.subcatChanged ? (
                                                    <span className="change-value changed">
                                                        {update.oldSubcat} → {update.newSubcat}
                                                        <span className="similarity-badge">
                                                            {Math.round(update.similarity)}% giống
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="change-value unchanged">
                                                        {update.oldSubcat || '(Trống)'} (giữ nguyên)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="preview-modal-actions">
                            <button className="btn-cancel" onClick={handleCancelMove}>
                                ❌ Hủy
                            </button>
                            <button className="btn-confirm" onClick={handleConfirmMove}>
                                ✅ Xác nhận chuyển
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
