import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about">
            <div className="container">
                {/* Hero Section */}
                <section className="about-hero">
                    <h1>Về chúng tôi</h1>
                    <p className="lead">
                        Hệ thống tra cứu sản phẩm chuyên nghiệp, cung cấp thông tin chính xác và nhanh chóng
                    </p>
                </section>

                {/* Company Info */}
                <section className="company-info">
                    <div className="grid grid-2">
                        <div className="info-card card">
                            <h2>🏢 Giới thiệu công ty</h2>
                            <p>
                                Chúng tôi là đơn vị tiên phong trong việc cung cấp giải pháp tra cứu sản phẩm 
                                trực tuyến, giúp khách hàng dễ dàng tìm kiếm và so sánh giá cả các sản phẩm.
                            </p>
                            <p>
                                Với hệ thống dữ liệu phong phú và được cập nhật liên tục, chúng tôi cam kết 
                                mang đến trải nghiệm tốt nhất cho người dùng.
                            </p>
                        </div>

                        <div className="info-card card">
                            <h2>🎯 Sứ mệnh</h2>
                            <p>
                                Sứ mệnh của chúng tôi là tạo ra một nền tảng tra cứu thông tin sản phẩm 
                                minh bạch, chính xác và dễ sử dụng.
                            </p>
                            <p>
                                Chúng tôi hướng đến việc kết nối doanh nghiệp với khách hàng một cách 
                                hiệu quả nhất, tiết kiệm thời gian và chi phí.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Vision & Values */}
                <section className="vision-values">
                    <div className="card vision-card">
                        <h2>🔭 Tầm nhìn</h2>
                        <p>
                            Trở thành hệ thống tra cứu sản phẩm hàng đầu tại Việt Nam, được tin dùng bởi 
                            hàng triệu người dùng và doanh nghiệp.
                        </p>
                    </div>

                    <h2 className="values-title">💎 Giá trị cốt lõi</h2>
                    <div className="grid grid-3">
                        <div className="value-card card">
                            <div className="value-icon">✅</div>
                            <h3>Chính xác</h3>
                            <p>Thông tin luôn được kiểm tra và cập nhật thường xuyên</p>
                        </div>

                        <div className="value-card card">
                            <div className="value-icon">⚡</div>
                            <h3>Nhanh chóng</h3>
                            <p>Tra cứu nhanh, giao diện thân thiện, dễ sử dụng</p>
                        </div>

                        <div className="value-card card">
                            <div className="value-icon">🤝</div>
                            <h3>Tin cậy</h3>
                            <p>Cam kết bảo mật thông tin và phục vụ tận tâm</p>
                        </div>

                        <div className="value-card card">
                            <div className="value-icon">🌟</div>
                            <h3>Chuyên nghiệp</h3>
                            <p>Đội ngũ giàu kinh nghiệm, nhiệt tình hỗ trợ</p>
                        </div>

                        <div className="value-card card">
                            <div className="value-icon">🚀</div>
                            <h3>Đổi mới</h3>
                            <p>Luôn cải tiến và phát triển tính năng mới</p>
                        </div>

                        <div className="value-card card">
                            <div className="value-icon">💪</div>
                            <h3>Hiệu quả</h3>
                            <p>Tối ưu hóa quy trình, tiết kiệm thời gian</p>
                        </div>
                    </div>
                </section>

                {/* Services */}
                <section className="services-section">
                    <h2>🛠️ Dịch vụ của chúng tôi</h2>
                    <div className="grid grid-2">
                        <div className="service-card card">
                            <h3>📦 Tra cứu sản phẩm</h3>
                            <ul>
                                <li>Tìm kiếm theo mã sản phẩm</li>
                                <li>Tìm kiếm theo tên sản phẩm</li>
                                <li>Lọc theo danh mục</li>
                                <li>Xem chi tiết thông tin</li>
                            </ul>
                        </div>

                        <div className="service-card card">
                            <h3>💰 Báo giá linh hoạt</h3>
                            <ul>
                                <li>Giá theo loại khách hàng (BBCL, BBPT)</li>
                                <li>Giá buôn lẻ (BL, BLVIP)</li>
                                <li>Giá đặc biệt Honda247</li>
                                <li>Cập nhật giá theo thời gian thực</li>
                            </ul>
                        </div>

                        <div className="service-card card">
                            <h3>📊 Quản lý danh mục</h3>
                            <ul>
                                <li>Phân loại sản phẩm chi tiết</li>
                                <li>Dễ dàng tìm kiếm và lọc</li>
                                <li>Giao diện trực quan</li>
                                <li>Hỗ trợ đa danh mục</li>
                            </ul>
                        </div>

                        <div className="service-card card">
                            <h3>🔔 Hỗ trợ khách hàng</h3>
                            <ul>
                                <li>Tư vấn chuyên nghiệp</li>
                                <li>Hỗ trợ 24/7</li>
                                <li>Giải đáp thắc mắc nhanh chóng</li>
                                <li>Đào tạo sử dụng hệ thống</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="contact-section">
                    <div className="contact-card card">
                        <h2>📞 Liên hệ với chúng tôi</h2>
                        <div className="contact-info">
                            <div className="contact-item">
                                <strong>📧 Email:</strong>
                                <p>support@productlookup.com</p>
                            </div>
                            <div className="contact-item">
                                <strong>☎️ Hotline:</strong>
                                <p>1900-xxxx</p>
                            </div>
                            <div className="contact-item">
                                <strong>📍 Địa chỉ:</strong>
                                <p>Hà Nội, Việt Nam</p>
                            </div>
                            <div className="contact-item">
                                <strong>🕐 Giờ làm việc:</strong>
                                <p>Thứ 2 - Thứ 6: 8:00 - 17:30</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
