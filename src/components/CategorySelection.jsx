import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './CategorySelection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CategorySelection = () => {
    const history = useHistory();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/products/categories/parent`);
            
            if (!response.ok) {
                throw new Error('Không thể tải danh mục');
            }
            
            const data = await response.json();
            setCategories(data);
            setError('');
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Không thể tải danh mục. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryName) => {
        // Navigate to product catalog with parent category filter
        history.push(`/catalog/${encodeURIComponent(categoryName)}`);
    };

    // Lọc danh mục theo từ khóa tìm kiếm
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="category-selection-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="category-selection-container">
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <h3>Đã xảy ra lỗi</h3>
                    <p>{error}</p>
                    <button onClick={fetchCategories} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Icon helper cho các danh mục
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'default': '📦'
        };
        return iconMap[categoryName.toLowerCase()] || iconMap['default'];
    };

    return (
        <div className="category-selection-container">
            {/* Animated Background */}
            <div className="category-background">
                <div className="bg-shape"></div>
                <div className="bg-shape"></div>
                <div className="bg-shape"></div>
            </div>

            {/* Header Section */}
            <div className="category-header">
                <div className="header-badge">
                    <span className="badge-icon">🗂️</span>
                </div>
                <h1>Danh mục sản phẩm</h1>
                <p className="subtitle">Khám phá các danh mục và tìm sản phẩm bạn cần</p>
            </div>

            {/* Search Box - Always visible */}
            <div className="category-search">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Tìm kiếm danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <button 
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                        aria-label="Xóa tìm kiếm"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Stats Bar */}
            <div className="category-stats">
                <div className="stat-item">
                    <span className="stat-icon">📊</span>
                    <span className="stat-text">
                        <strong>{filteredCategories.length}</strong> danh mục
                    </span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <span className="stat-icon">📦</span>
                    <span className="stat-text">
                        <strong>{categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}</strong> sản phẩm
                    </span>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="categories-grid">
                {filteredCategories.map((category, index) => (
                    <div
                        key={index}
                        className="category-card"
                        onClick={() => handleCategoryClick(category.name)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="category-card-inner">
                            <div className="category-icon">
                                {getCategoryIcon(category.name)}
                            </div>
                            <div className="category-content">
                                <h3 className="category-name">{category.name}</h3>
                                <div className="category-meta">
                                    <span className="category-count">
                                        <span className="count-icon">📦</span>
                                        {category.count} sản phẩm
                                    </span>
                                </div>
                            </div>
                            <button className="view-category-btn">
                                <span>Xem thêm</span>
                                <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && !loading && (
                <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <h3>Không tìm thấy danh mục</h3>
                    <p>Không có danh mục nào phù hợp với "{searchTerm}"</p>
                    <button 
                        className="clear-filters-btn"
                        onClick={() => setSearchTerm('')}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}
        </div>
    );
};

export default CategorySelection;
