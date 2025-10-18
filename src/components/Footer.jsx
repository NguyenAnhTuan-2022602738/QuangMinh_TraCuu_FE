import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h4>Về chúng tôi</h4>
                        <p>Hệ thống tra cứu sản phẩm chuyên nghiệp</p>
                        <p>Cung cấp thông tin chính xác và nhanh chóng</p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Liên hệ</h4>
                        <p>Email: support@productlookup.com</p>
                        <p>Hotline: 1900-xxxx</p>
                        <p>Địa chỉ: Hà Nội, Việt Nam</p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Dịch vụ</h4>
                        <p>Tra cứu sản phẩm</p>
                        <p>Báo giá theo loại khách hàng</p>
                        <p>Tư vấn chuyên nghiệp</p>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Product Lookup System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;