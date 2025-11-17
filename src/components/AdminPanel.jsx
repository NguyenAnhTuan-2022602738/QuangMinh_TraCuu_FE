import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './AdminPanel.css';
import AdminQR from './AdminQR';
import AdminUserManagement from './AdminUserManagement';
import CategoryManagement from './CategoryManagement';
import PromotionManagement from './PromotionManagement';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const getInitialIsMobile = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.innerWidth < 1024;
    };

    const [isMobile, setIsMobile] = useState(getInitialIsMobile);
    const [sidebarOpen, setSidebarOpen] = useState(() => !getInitialIsMobile());
    const history = useHistory();
    const location = useLocation();
    const isMountedRef = useRef(true);

    useEffect(() => {
        const handleResize = () => {
            if (typeof window === 'undefined') return;
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Track mount state to avoid setting state after unmount
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Get active view from URL path
    const getActiveView = () => {
        const path = location.pathname;
        console.log('📍 Current path:', path);
        
        if (path.includes('/admin/products')) {
            console.log('✅ Active view: products');
            return 'products';
        }
        if (path.includes('/admin/users')) {
            console.log('✅ Active view: users');
            return 'users';
        }
        if (path.includes('/admin/qr')) {
            console.log('✅ Active view: qr');
            return 'qr';
        }
        if (path.includes('/admin/categories')) {
            console.log('✅ Active view: categories');
            return 'categories';
        }
        if (path.includes('/admin/promotions')) {
            console.log('✅ Active view: promotions');
            return 'promotions';
        }
        
        console.log('✅ Active view: dashboard');
        return 'dashboard';
    };

    const activeView = getActiveView();

    const handleNavigate = (path) => {
        history.push(path);
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        parentCategory: '',
        subcategory: '',
        category: '', // Keep for backward compatibility
        unit: '',
        image: '',
        BBCL: '',
        BBPT: '',
        BL: '',
        BLVIP: '',
        HONDA247: ''
    });

    useEffect(() => {
        // Kiểm tra xác thực admin
        const isAdmin = localStorage.getItem('isAdmin');
        const token = localStorage.getItem('adminToken');
        
        if (!isAdmin || !token) {
            history.push('/admin-login');
            return;
        }

        fetchProducts();
    }, [history]);

    const fetchProducts = async () => {
        try {
            if (!isMountedRef.current) return;
            setLoading(true);
            const response = await fetch(`${API_URL}/products?limit=all`);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const data = await response.json();
            if (!isMountedRef.current) return;

            const normalizedProducts = Array.isArray(data)
                ? data
                : Array.isArray(data?.products)
                    ? data.products
                    : [];

            setProducts(normalizedProducts);
            setError('');
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error('Error fetching admin products:', err);
            setError('Lỗi tải dữ liệu sản phẩm');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        history.push('/');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingProduct 
                ? `${API_URL}/products/${editingProduct._id}`
                : `${API_URL}/products`;
            
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(editingProduct ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!');
                setShowForm(false);
                setEditingProduct(null);
                setFormData({
                    code: '', name: '', parentCategory: '', subcategory: '', category: '', unit: '', image: '',
                    BBCL: '', BBPT: '', BL: '', BLVIP: '', HONDA247: ''
                });
                fetchProducts();
            } else {
                const data = await response.json();
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            code: product.code || '',
            name: product.name || '',
            parentCategory: product.parentCategory || product.category || '',
            subcategory: product.subcategory || '',
            category: product.category || '',
            unit: product.unit || '',
            image: product.image || '',
            // Lấy giá từ product.prices nếu có, ngược lại lấy từ product (cấu trúc cũ)
            BBCL: (product.prices?.BBCL !== undefined) ? product.prices.BBCL : (product.BBCL || ''),
            BBPT: (product.prices?.BBPT !== undefined) ? product.prices.BBPT : (product.BBPT || ''),
            BL: (product.prices?.BL !== undefined) ? product.prices.BL : (product.BL || ''),
            BLVIP: (product.prices?.BLVIP !== undefined) ? product.prices.BLVIP : (product.BLVIP || ''),
            HONDA247: (product.prices?.honda247 !== undefined) ? product.prices.honda247 : (product.HONDA247 || '')
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            console.log('🗑️ Deleting product:', id);
            console.log('🔑 Token:', token ? 'Available' : 'Missing');
            
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Delete response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Delete success:', data);
                alert('Xóa thành công!');
                fetchProducts();
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Delete failed:', response.status, errorData);
                alert(`Có lỗi xảy ra: ${errorData.message || response.statusText}`);
            }
        } catch (err) {
            console.error('💥 Delete error:', err);
            alert(`Lỗi kết nối server: ${err.message}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            alert('Vui lòng chọn ít nhất một sản phẩm để xóa');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            const deletePromises = selectedProducts.map(id =>
                fetch(`${API_URL}/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            );

            const results = await Promise.allSettled(deletePromises);
            const successCount = results.filter(result => result.status === 'fulfilled' && result.value.ok).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                alert(`Xóa thành công ${successCount} sản phẩm${failCount > 0 ? `, thất bại ${failCount}` : ''}!`);
                setSelectedProducts([]);
                fetchProducts();
            } else {
                alert('Không thể xóa sản phẩm nào. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert('Lỗi kết nối server khi xóa hàng loạt');
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedProducts(filteredProducts.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId, checked) => {
        if (checked) {
            setSelectedProducts(prev => [...prev, productId]);
        } else {
            setSelectedProducts(prev => prev.filter(id => id !== productId));
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            console.log('Excel data parsed:', jsonData.slice(0, 2));

            if (jsonData.length === 0) {
                alert('File Excel không có dữ liệu hoặc không đúng định dạng. Vui lòng kiểm tra lại.');
                setUploading(false);
                e.target.value = '';
                return;
            }

            // Chuyển đổi dữ liệu Excel sang format phù hợp
            const products = jsonData.map(row => {
                // Kiểm tra các trường bắt buộc
                if (!row['Mã sản phẩm'] && !row['code']) {
                    throw new Error('Thiếu cột Mã sản phẩm/code trong file Excel');
                }
                if (!row['Tên sản phẩm'] && !row['name']) {
                    throw new Error('Thiếu cột Tên sản phẩm/name trong file Excel');
                }

                const parentCategory = row['Danh mục cha'] || row['parentCategory'] || row['Danh mục'] || row['category'] || 'Chưa phân loại';
                const subcategory = row['Danh mục con'] || row['subcategory'] || row['Danh mục'] || row['category'] || 'Chưa phân loại';

                return {
                    code: row['Mã sản phẩm'] || row['code'] || '',
                    name: row['Tên sản phẩm'] || row['name'] || '',
                    parentCategory: parentCategory,
                    subcategory: subcategory,
                    category: row['Danh mục'] || row['category'] || parentCategory, // Backward compatibility
                    unit: row['Đơn vị'] || row['unit'] || 'Cái',
                    image: row['URL Ảnh'] || row['image'] || null,
                    BBCL: parseFloat(row['BBCL']) || 0,
                    BBPT: parseFloat(row['BBPT']) || 0,
                    BL: parseFloat(row['BL']) || 0,
                    BLVIP: parseFloat(row['BLVIP']) || 0,
                    HONDA247: parseFloat(row['HONDA247']) || 0
                };
            });

            console.log('Processed products:', products.slice(0, 2));

            // Gửi lên server
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/products/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ products })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Import thành công ${result.count} sản phẩm!`);
                fetchProducts();
            } else {
                alert(`Lỗi khi import: ${result.message || 'Không xác định'}`);
                console.error('Import error:', result);
            }
        } catch (err) {
            console.error('Excel upload error:', err);
            alert('Lỗi xử lý file Excel: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const downloadExcelTemplate = () => {
        const template = [
            {
                'Mã sản phẩm': 'SP001',
                'Tên sản phẩm': 'Bộ lọc dầu Honda City',
                'Danh mục cha': 'PHỤ TÙNG ĐỘNG CƠ',
                'Danh mục con': 'Bộ lọc dầu',
                'Đơn vị': 'Cái',
                'URL Ảnh': 'https://example.com/image1.jpg',
                'BBCL': 100000,
                'BBPT': 95000,
                'BL': 110000,
                'BLVIP': 105000,
                'HONDA247': 98000
            },
            {
                'Mã sản phẩm': 'SP002',
                'Tên sản phẩm': 'Má phanh trước Honda Civic',
                'Danh mục cha': 'PHỤ TÙNG PHANH',
                'Danh mục con': 'Má phanh',
                'Đơn vị': 'Bộ',
                'URL Ảnh': 'https://example.com/image2.jpg',
                'BBCL': 50000,
                'BBPT': 48000,
                'BL': 55000,
                'BLVIP': 52000,
                'HONDA247': 49000
            }
        ];

        // Thêm trường hướng dẫn
        const ws = XLSX.utils.json_to_sheet(template);
        
        // Thêm hướng dẫn trong sheet
        XLSX.utils.sheet_add_aoa(ws, [
            ['HƯỚNG DẪN IMPORT SẢN PHẨM:'],
            ['1. Không thay đổi tên các cột'],
            ['2. Mã sản phẩm là bắt buộc và phải duy nhất'],
            ['3. Tên sản phẩm, Danh mục cha, Danh mục con là bắt buộc'],
            ['4. Danh mục cha: nhóm lớn (VD: PHỤ TÙNG ĐỘNG CƠ, PHỤ TÙNG PHANH)'],
            ['5. Danh mục con: nhóm nhỏ trong danh mục cha (VD: Bộ lọc dầu, Má phanh)'],
            ['6. URL Ảnh: link ảnh sản phẩm (có thể để trống)'],
            ['7. Giá có thể để trống hoặc 0 nếu không có'],
            ['8. Xóa các dòng mẫu trước khi nhập dữ liệu thật'],
        ], { origin: 'A4' });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
        XLSX.writeFile(wb, 'mau-import-san-pham.xlsx');
    };

    const categories = [...new Set(products.map(p => p.parentCategory || p.category).filter(Boolean))].sort();

    const filteredProducts = (Array.isArray(products) ? products : []).filter(p => 
        (String(p.code).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.category).toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === '' || p.parentCategory === selectedCategory || p.category === selectedCategory)
    );

    return (
        <div className={`admin-panel-modern ${isMobile ? 'is-mobile' : ''} ${sidebarOpen ? 'sidebar-visible' : ''}`}>
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon">QM</div>
                        <div className="brand-text">
                            <h3>Quang Minh</h3>
                            <span>Admin Panel</span>
                        </div>
                    </div>
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin')}
                    >
                        <span className="nav-icon">📊</span>
                        <span className="nav-label">Tổng quan</span>
                    </button>
                    
                    <button 
                        className={`nav-item ${activeView === 'products' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin/products')}
                    >
                        <span className="nav-icon">📦</span>
                        <span className="nav-label">Sản phẩm</span>
                    </button>

                    <button 
                        className={`nav-item ${activeView === 'users' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin/users')}
                    >
                        <span className="nav-icon">👥</span>
                        <span className="nav-label">Tài khoản</span>
                    </button>

                    <button 
                        className={`nav-item ${activeView === 'categories' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin/categories')}
                    >
                        <span className="nav-icon">🗂️</span>
                        <span className="nav-label">Danh mục</span>
                    </button>

                    <button 
                        className={`nav-item ${activeView === 'promotions' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin/promotions')}
                    >
                        <span className="nav-icon">🎯</span>
                        <span className="nav-label">Banner khuyến mãi</span>
                    </button>

                    <button 
                        className={`nav-item ${activeView === 'qr' ? 'active' : ''}`}
                        onClick={() => handleNavigate('/admin/qr')}
                    >
                        <span className="nav-icon">🔗</span>
                        <span className="nav-label">Tạo QR Code</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="footer-link">
                        <span className="nav-icon">🏠</span>
                        <span className="nav-label">Trang chủ</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {isMobile && sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    role="presentation"
                />
            )}

            {/* Main Content */}
            <main className="admin-main-content">
                {/* Top Bar */}
                <div className="admin-topbar">
                    {isMobile && (
                        <button
                            className="mobile-menu-btn"
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Mở menu quản trị"
                        >
                            ☰
                        </button>
                    )}
                    {!isMobile && !sidebarOpen && (
                        <button
                            className="sidebar-reopen-btn"
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Mở lại thanh điều hướng"
                        >
                            ☰
                        </button>
                    )}
                    <div className="topbar-left">
                        <h1 className="page-title">
                            {activeView === 'dashboard' && '📊 Tổng quan'}
                            {activeView === 'products' && '📦 Quản lý sản phẩm'}
                            {activeView === 'users' && '👥 Quản lý tài khoản'}
                            {activeView === 'qr' && '🔗 Tạo QR Code'}
                            {activeView === 'categories' && '🗂️ Quản lý danh mục'}
                            {activeView === 'promotions' && '🎯 Banner khuyến mãi'}
                        </h1>
                        <p className="page-subtitle">Phụ tùng xe máy Quang Minh</p>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-user-info">
                            <div className="user-avatar">👤</div>
                            <span>Admin</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="admin-content-area">
                    
                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <div className="dashboard-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-info">
                                    <h3>{products.length}</h3>
                                    <p>Tổng sản phẩm</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-info">
                                    <h3>{new Set(products.map(p => p.category)).size}</h3>
                                    <p>Danh mục</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <h3>5</h3>
                                    <p>Bảng giá</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>Active</h3>
                                    <p>Hệ thống</p>
                                </div>
                            </div>

                            <div className="quick-actions-card">
                                <h3>⚡ Thao tác nhanh</h3>
                                <div className="quick-actions">
                                    <button onClick={() => history.push('/admin/products')} className="quick-action-btn">
                                        <span>📦</span> Xem sản phẩm
                                    </button>
                                    <button onClick={() => { history.push('/admin/products'); setShowForm(true); setEditingProduct(null); setFormData({ code: '', name: '', parentCategory: '', subcategory: '', category: '', unit: '', BBCL: '', BBPT: '', BL: '', BLVIP: '', HONDA247: '' }); }} className="quick-action-btn">
                                        <span>➕</span> Thêm sản phẩm
                                    </button>
                                    <button onClick={() => history.push('/admin/users')} className="quick-action-btn">
                                        <span>👥</span> Quản lý tài khoản
                                    </button>
                                    <button onClick={() => history.push('/admin/qr')} className="quick-action-btn">
                                        <span>🔗</span> Tạo QR Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products View */}
                    {activeView === 'products' && (
                        <div className="products-view">
                            <div className="view-toolbar">
                <div className="search-filters">
                    <div className="search-box-admin">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="category-filter">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="category-select"
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="toolbar-buttons">
                    {selectedProducts.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="btn btn-danger"
                        >
                            🗑️ Xóa ({selectedProducts.length})
                        </button>
                    )}
                    
                    <button 
                        onClick={() => {
                            setShowForm(true);
                            setEditingProduct(null);
                            setFormData({
                                code: '', name: '', parentCategory: '', subcategory: '', category: '', unit: '',
                                BBCL: '', BBPT: '', BL: '', BLVIP: '', HONDA247: ''
                            });
                        }}
                        className="btn btn-primary"
                    >
                        ➕ Thêm sản phẩm
                    </button>
                    
                    <button 
                        onClick={downloadExcelTemplate}
                        className="btn btn-outline"
                    >
                        📄 Tải file mẫu
                    </button>
                    
                    <label className="btn btn-secondary file-upload-btn">
                        {uploading ? '⏳ Đang import...' : '📤 Import Excel'}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleExcelUpload}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
                            </div>

                {showForm && (
                    <div className="product-form-modal">
                        <div className="modal-overlay" onClick={() => setShowForm(false)}></div>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{editingProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</h2>
                                <button onClick={() => setShowForm(false)} className="close-btn">✕</button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Mã sản phẩm *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Danh mục cha *</label>
                                        <input
                                            type="text"
                                            name="parentCategory"
                                            value={formData.parentCategory}
                                            onChange={handleInputChange}
                                            placeholder="VD: PHỤ TÙNG ĐỘNG CƠ"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Danh mục con *</label>
                                        <input
                                            type="text"
                                            name="subcategory"
                                            value={formData.subcategory}
                                            onChange={handleInputChange}
                                            placeholder="VD: Bộ lọc dầu"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Đơn vị *</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>🖼️ URL Ảnh sản phẩm</label>
                                    <input
                                        type="url"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formData.image && (
                                        <div className="image-preview">
                                            <img src={formData.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>

                                <div className="price-section">
                                    <h3>Bảng giá</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>BBCL</label>
                                            <input
                                                type="number"
                                                name="BBCL"
                                                value={formData.BBCL}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>BBPT</label>
                                            <input
                                                type="number"
                                                name="BBPT"
                                                value={formData.BBPT}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>BL</label>
                                            <input
                                                type="number"
                                                name="BL"
                                                value={formData.BL}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>BLVIP</label>
                                            <input
                                                type="number"
                                                name="BLVIP"
                                                value={formData.BLVIP}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>HONDA247</label>
                                        <input
                                            type="number"
                                            name="HONDA247"
                                            value={formData.HONDA247}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeView === 'products' && loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                )}

                {activeView === 'products' && error && (
                    <div className="error-state">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {activeView === 'products' && !loading && !error && (
                    <div className="products-table-container">
                        <div className="table-header">
                            <h3>Danh sách sản phẩm ({filteredProducts.length})</h3>
                        </div>
                        
                        <div className="table-responsive">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Danh mục cha</th>
                                        <th>Danh mục con</th>
                                        <th>Đơn vị</th>
                                        <th>BBCL</th>
                                        <th>BBPT</th>
                                        <th>BL</th>
                                        <th>BLVIP</th>
                                        <th>HONDA247</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.includes(product._id)}
                                                    onChange={(e) => handleSelectProduct(product._id, e.target.checked)}
                                                />
                                            </td>
                                            <td><code>{product.code}</code></td>
                                            <td className="product-name" title={product.name}>{product.name}</td>
                                            <td><span className="category-badge parent">{product.parentCategory || product.category}</span></td>
                                            <td><span className="category-badge sub">{product.subcategory || '-'}</span></td>
                                            <td>{product.unit}</td>
                                            <td className="price-cell">{(product.prices?.BBCL !== undefined ? product.prices.BBCL : product.BBCL)?.toLocaleString('vi-VN')}</td>
                                            <td className="price-cell">{(product.prices?.BBPT !== undefined ? product.prices.BBPT : product.BBPT)?.toLocaleString('vi-VN')}</td>
                                            <td className="price-cell">{(product.prices?.BL !== undefined ? product.prices.BL : product.BL)?.toLocaleString('vi-VN')}</td>
                                            <td className="price-cell">{(product.prices?.BLVIP !== undefined ? product.prices.BLVIP : product.BLVIP)?.toLocaleString('vi-VN')}</td>
                                            <td className="price-cell">{(product.prices?.honda247 !== undefined ? product.prices.honda247 : product.HONDA247)?.toLocaleString('vi-VN')}</td>
                                            <td className="action-cell">
                                                <button 
                                                    onClick={() => handleEdit(product)}
                                                    className="btn-action btn-edit"
                                                    title="Sửa"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product._id)}
                                                    className="btn-action btn-delete"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="empty-state">
                                <p>📦 Không tìm thấy sản phẩm nào</p>
                            </div>
                        )}
                    </div>
                )}
                    </div>
                )}

                {/* QR Code View */}
                {activeView === 'qr' && (
                    <div className="admin-qr-container">
                        {console.log('🔗 Rendering AdminQR component')}
                        <AdminQR onBack={() => history.push('/admin')} />
                    </div>
                )}

                {/* User Management View */}
                {activeView === 'users' && (
                    <div className="admin-usermgmt-container">
                        {console.log('👥 Rendering AdminUserManagement component')}
                        <AdminUserManagement onBack={() => history.push('/admin')} />
                    </div>
                )}

                {/* Category Management View */}
                {activeView === 'categories' && (
                    <div className="admin-category-container">
                        {console.log('🗂️ Rendering CategoryManagement component')}
                        <CategoryManagement onDataChanged={fetchProducts} />
                    </div>
                )}

                {/* Promotion Banner Management View */}
                {activeView === 'promotions' && (
                    <div className="admin-promotion-container">
                        {console.log('🎯 Rendering PromotionManagement component')}
                        <PromotionManagement />
                    </div>
                )}

                </div>
            </main>
        </div>
    );
};

export default AdminPanel;
