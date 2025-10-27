import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './CategorySelection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CategorySelection = () => {
    const history = useHistory();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return (
            <div className="category-selection-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="category-selection-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchCategories} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="category-selection-container">
            <div className="category-header">
                <h1>📋 Chọn danh mục sản phẩm</h1>
                <p className="subtitle">Vui lòng chọn danh mục để xem sản phẩm</p>
            </div>

            <div className="categories-grid">
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className="category-card"
                        onClick={() => handleCategoryClick(category.name)}
                    >
                        <div className="category-icon">
                            📦
                        </div>
                        <h3 className="category-name">{category.name}</h3>
                        <p className="category-count">{category.count} sản phẩm</p>
                        <div className="category-arrow">→</div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <p>Chưa có danh mục nào</p>
                </div>
            )}
        </div>
    );
};

export default CategorySelection;
