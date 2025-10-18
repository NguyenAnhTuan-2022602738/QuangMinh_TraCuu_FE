import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './AdminPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const history = useHistory();

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: '',
        unit: '',
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
            setLoading(true);
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            setProducts(data);
            setError('');
        } catch (err) {
            setError('Lỗi tải dữ liệu sản phẩm');
        } finally {
            setLoading(false);
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
                    code: '', name: '', category: '', unit: '',
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
            category: product.category || '',
            unit: product.unit || '',
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
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Xóa thành công!');
                fetchProducts();
            } else {
                alert('Có lỗi xảy ra');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
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

                return {
                    code: row['Mã sản phẩm'] || row['code'] || '',
                    name: row['Tên sản phẩm'] || row['name'] || '',
                    category: row['Danh mục'] || row['category'] || 'Chưa phân loại',
                    unit: row['Đơn vị'] || row['unit'] || 'Cái',
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
                'Tên sản phẩm': 'Ví dụ sản phẩm',
                'Danh mục': 'Phụ tùng',
                'Đơn vị': 'Cái',
                'BBCL': 100000,
                'BBPT': 95000,
                'BL': 110000,
                'BLVIP': 105000,
                'HONDA247': 98000
            },
            {
                'Mã sản phẩm': 'SP002',
                'Tên sản phẩm': 'Sản phẩm mẫu 2',
                'Danh mục': 'Linh kiện',
                'Đơn vị': 'Bộ',
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
            ['3. Tên sản phẩm là bắt buộc'],
            ['4. Giá có thể để trống hoặc 0 nếu không có'],
            ['5. Xóa các dòng mẫu trước khi nhập dữ liệu thật'],
        ], { origin: 'A4' });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
        XLSX.writeFile(wb, 'mau-import-san-pham.xlsx');
    };

    const filteredProducts = products.filter(p => 
        String(p.code).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.category).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <div className="container">
                    <div className="admin-header-content">
                        <div>
                            <h1>🛠️ Quản trị sản phẩm</h1>
                            <p>Phụ tùng xe máy Quang Minh</p>
                        </div>
                        <div className="admin-actions">
                            <Link to="/" className="btn btn-outline">
                                Về trang chủ
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container admin-content">
                <div className="admin-toolbar">
                    <div className="search-box-admin">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="toolbar-buttons">
                        <button 
                            onClick={() => {
                                setShowForm(true);
                                setEditingProduct(null);
                                setFormData({
                                    code: '', name: '', category: '', unit: '',
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
                            📥 Tải file mẫu
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
                                        <label>Danh mục *</label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
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
                                    <label>Đơn vị *</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        required
                                    />
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

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="products-table-container">
                        <div className="table-header">
                            <h3>Danh sách sản phẩm ({filteredProducts.length})</h3>
                        </div>
                        
                        <div className="table-responsive">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Danh mục</th>
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
                                            <td><code>{product.code}</code></td>
                                            <td className="product-name" title={product.name}>{product.name}</td>
                                            <td><span className="category-badge">{product.category}</span></td>
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
        </div>
    );
};

export default AdminPanel;
