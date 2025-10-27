import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './CustomerLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CustomerLogin = ({ priceType }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(true);
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${API_URL}/auth/customer-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await resp.json();
            if (resp.ok) {
                localStorage.setItem('customerToken', data.token);
                localStorage.setItem('customerAllowed', JSON.stringify(data.allowedPriceTypes || []));
                // If a specific priceType was requested, go there. Otherwise pick the first allowed price type returned by the server.
                if (priceType) {
                    history.push(`/${priceType}`);
                } else if (data.allowedPriceTypes && data.allowedPriceTypes.length > 0) {
                    history.push(`/${data.allowedPriceTypes[0]}`);
                } else {
                    history.push('/');
                }
            } else {
                setError(data.message || 'Đăng nhập không thành công');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="customer-login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                            <img src="/logo.png" alt="Quang Minh Logo" />
                    </div>
                    <div>
                        <h2>Đăng nhập khách hàng</h2>
                        <div className="small-note">Sử dụng số điện thoại để đăng nhập</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>Số điện thoại</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="0123456789" />

                    <label>Mật khẩu</label>
                    <div className="field-row">
                        <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
                        <button type="button" className="show-pass" onClick={() => setShowPass(s => !s)}>{showPass ? 'Ẩn' : 'Hiện'}</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input type="checkbox" checked={remember} onChange={() => setRemember(r => !r)} /> Ghi nhớ
                        </label>
                        <div className="forgot" onClick={() => alert('Liên hệ admin để đặt lại mật khẩu')}>Quên mật khẩu?</div>
                    </div>

                    <div className="actions">
                        <button className="btn btn-primary" type="submit">Đăng nhập</button>
                    </div>
                    {error && <div className="error">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default CustomerLogin;
