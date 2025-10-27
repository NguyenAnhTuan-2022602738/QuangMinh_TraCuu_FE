import React, { useState, useEffect } from 'react';
import './AdminUserManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const priceOptions = ["BBCL", "BBPT", "BL", "BLVIP", "HONDA247"];

const AdminUserManagement = ({ onBack }) => {
    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [selected, setSelected] = useState([]);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    // const [result, setResult] = useState(null); // Not used - removed to fix ESLint warning
    const [users, setUsers] = useState([]);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setFetchLoading(true);
            setError('');
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                setError('Không tìm thấy token xác thực');
                return;
            }

            const resp = await fetch(`${API_URL}/auth/admin/customers`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await resp.json();
            
            if (resp.ok) {
                setUsers(data || []);
                console.log('✅ Loaded users:', data.length);
            } else {
                setError(data.message || 'Không thể tải danh sách tài khoản');
                console.error('❌ Fetch users failed:', data);
            }
        } catch (err) {
            setError('Lỗi kết nối: ' + err.message);
            console.error('❌ fetchUsers error:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    const toggle = (opt) => {
        setSelected(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    const clearForm = () => {
        setName(''); setPhone(''); setSelected([]); setEditing(null);
    };

    const handleCreateOrUpdate = async () => {
        // Validation
        if (!name.trim()) {
            alert('⚠️ Vui lòng nhập họ tên');
            return;
        }
        if (!phone.trim()) {
            alert('⚠️ Vui lòng nhập số điện thoại');
            return;
        }
        if (selected.length === 0) {
            alert('⚠️ Vui lòng chọn ít nhất một quyền xem bảng giá');
            return;
        }

        setLoading(true);
        
        try {
            const adminToken = localStorage.getItem('adminToken');
            
            if (!adminToken) {
                alert('❌ Không tìm thấy token xác thực');
                return;
            }

            const url = editing 
                ? `${API_URL}/auth/admin/customers/${editing._id}` 
                : `${API_URL}/auth/admin/create-customer`;
            
            const method = editing ? 'PUT' : 'POST';
            
            const payload = {
                name: name.trim(),
                phone: phone.trim(),
                allowedPriceTypes: selected
            };

            console.log(`📤 ${editing ? 'Updating' : 'Creating'} customer:`, payload);

            const resp = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await resp.json();
            
            if (resp.ok) {
                console.log('✅ Operation successful:', data);
                
                // Show success message with password if creating new user
                if (!editing && data.password) {
                    alert(`✅ Tạo tài khoản thành công!\n\n👤 Tên: ${data.customer?.name}\n📱 SĐT: ${data.customer?.username}\n🔑 Mật khẩu: ${data.password}\n\n⚠️ Lưu mật khẩu này!`);
                } else {
                    alert('✅ Cập nhật tài khoản thành công!');
                }
                
                clearForm();
                fetchUsers();
            } else {
                alert(`❌ Lỗi: ${data.message || 'Không xác định'}`);
                console.error('❌ Operation failed:', data);
            }
        } catch (err) {
            const errorMsg = err.message || 'Lỗi kết nối';
            alert('❌ ' + errorMsg);
            console.error('❌ Request error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (u) => {
        setEditing(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setSelected(u.allowedPriceTypes || []);
    };

    const handleDelete = async (u) => {
        if (!window.confirm(`⚠️ Xác nhận xóa tài khoản:\n\n👤 ${u.name}\n📱 ${u.username || u.phone}\n\nHành động này không thể hoàn tác!`)) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            
            console.log('🗑️ Deleting customer:', u._id);
            
            const resp = await fetch(`${API_URL}/auth/admin/customers/${u._id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await resp.json();
            
            if (resp.ok) {
                alert('✅ Xóa tài khoản thành công!');
                console.log('✅ Customer deleted:', u._id);
                fetchUsers();
            } else {
                alert(`❌ Lỗi: ${data.message || 'Không thể xóa'}`);
                console.error('❌ Delete failed:', data);
            }
        } catch (err) {
            alert('❌ Lỗi kết nối: ' + err.message);
            console.error('❌ Delete error:', err);
        }
    };

    const handleResetPassword = async (u) => {
        if (!window.confirm(`🔑 Reset mật khẩu cho:\n\n👤 ${u.name}\n📱 ${u.username || u.phone}\n\nMật khẩu mới sẽ được tạo ngẫu nhiên.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            
            console.log('🔄 Resetting password for:', u._id);
            
            const resp = await fetch(`${API_URL}/auth/admin/customers/${u._id}/reset-password`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await resp.json();
            
            if (resp.ok) {
                alert(`✅ Reset mật khẩu thành công!\n\n👤 Tài khoản: ${u.username || u.phone}\n🔑 Mật khẩu mới: ${data.password}\n\n⚠️ Vui lòng lưu mật khẩu này!`);
                console.log('✅ Password reset successful');
            } else {
                alert(`❌ Lỗi: ${data.message || 'Không thể reset mật khẩu'}`);
                console.error('❌ Reset failed:', data);
            }
        } catch (err) {
            alert('❌ Lỗi kết nối: ' + err.message);
            console.error('❌ Reset error:', err);
        }
    };

    return (
        <div className="admin-user-management">
            {/* Header with back button */}
            <div className="um-header">
                <button className="btn btn-outline" onClick={onBack}>
                    ← Quay lại
                </button>
                <h2>👥 Quản lý tài khoản khách hàng</h2>
            </div>

            {/* Show error if fetch failed */}
            {error && (
                <div className="um-error-banner">
                    ⚠️ {error}
                    <button onClick={fetchUsers} className="btn btn-outline">🔄 Thử lại</button>
                </div>
            )}

            <div className="um-grid">
                {/* Left side: Form */}
                <div className="um-form">
                    <h3>{editing ? '✏️ Chỉnh sửa tài khoản' : '➕ Tạo tài khoản mới'}</h3>
                    
                    <label>Họ tên <span className="required">*</span></label>
                    <input 
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        disabled={loading}
                    />

                    <label>Số điện thoại (username) <span className="required">*</span></label>
                    <input 
                        type="tel"
                        placeholder="0123456789"
                        value={phone} 
                        onChange={e => setPhone(e.target.value)}
                        disabled={loading || editing}
                        title={editing ? "Không thể thay đổi số điện thoại" : ""}
                    />

                    <label>Quyền xem bảng giá <span className="required">*</span></label>
                    <div className="price-options">
                        {priceOptions.map(p => (
                            <label key={p} className={`price-opt ${selected.includes(p) ? 'active' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={selected.includes(p)} 
                                    onChange={() => toggle(p)}
                                    disabled={loading}
                                /> 
                                {p}
                            </label>
                        ))}
                    </div>

                    <div className="um-actions">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleCreateOrUpdate} 
                            disabled={loading}
                        >
                            {loading ? '⏳ Đang xử lý...' : (editing ? '💾 Cập nhật' : '➕ Tạo tài khoản')}
                        </button>
                        {editing && (
                            <button className="btn btn-outline" onClick={clearForm} disabled={loading}>
                                ✖ Hủy
                            </button>
                        )}
                    </div>
                </div>

                {/* Right side: User list */}
                <div className="um-list">
                    <div className="um-list-header">
                        <h3>📋 Danh sách tài khoản ({users.length})</h3>
                        <button 
                            className="btn btn-outline btn-sm" 
                            onClick={fetchUsers}
                            disabled={fetchLoading}
                        >
                            {fetchLoading ? '⏳' : '🔄'} Làm mới
                        </button>
                    </div>

                    {fetchLoading ? (
                        <div className="um-loading">
                            <div className="spinner"></div>
                            <p>Đang tải danh sách...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="um-empty">
                            <p>📭 Chưa có tài khoản nào</p>
                            <p className="hint">Tạo tài khoản đầu tiên ở form bên trái</p>
                        </div>
                    ) : (
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Họ tên</th>
                                        <th>Số điện thoại</th>
                                        <th>Quyền xem giá</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} className={editing && editing._id === u._id ? 'editing' : ''}>
                                            <td className="name-col">
                                                {editing && editing._id === u._id && '✏️ '}
                                                {u.name}
                                            </td>
                                            <td>
                                                <code>{u.username || u.phone}</code>
                                            </td>
                                            <td>
                                                <div className="price-tags">
                                                    {(u.allowedPriceTypes || []).length > 0 
                                                        ? u.allowedPriceTypes.map(pt => (
                                                            <span key={pt} className="price-tag">{pt}</span>
                                                        ))
                                                        : <span className="no-access">Không có quyền</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="actions">
                                                <button 
                                                    className="btn-action btn-edit" 
                                                    onClick={() => handleEditClick(u)}
                                                    title="Chỉnh sửa"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn-action btn-reset" 
                                                    onClick={() => handleResetPassword(u)}
                                                    title="Reset mật khẩu"
                                                >
                                                    🔑
                                                </button>
                                                <button 
                                                    className="btn-action btn-delete" 
                                                    onClick={() => handleDelete(u)}
                                                    title="Xóa tài khoản"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
