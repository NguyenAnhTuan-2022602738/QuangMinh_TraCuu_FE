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
                        <p>Email: phutunghitech@gmail.com</p>
                        <p>Hotline: +84 94 292 98 18</p>
                        <p>Địa chỉ: Đông Ngạc, Đông Thắng, Hanoi, Vietnam </p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Dịch vụ</h4>
                        <p>Tra cứu sản phẩm</p>
                        <p>Báo giá tốt</p>
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