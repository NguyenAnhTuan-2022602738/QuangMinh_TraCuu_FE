import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Gửi request để xác thực admin
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Lưu token vào localStorage
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('isAdmin', 'true');
                history.push('/admin');
            } else {
                setError(data.message || 'Mật khẩu không đúng');
            }
        } catch (err) {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="admin-icon">🔐</div>
                        <h1>Đăng nhập Admin</h1>
                        <p>Trang quản trị Phụ tùng xe máy Quang Minh</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu Admin</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu admin"
                                required
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading || !password}
                        >
                            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>⚠️ Chỉ dành cho quản trị viên hệ thống</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
