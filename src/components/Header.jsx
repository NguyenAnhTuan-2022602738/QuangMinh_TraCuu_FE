import React, { useEffect, useState } from 'react';
import { Link, NavLink, useHistory } from 'react-router-dom';
import CustomerTypeSelector from './CustomerTypeSelector';
import './Header.css';

const Header = ({ showSelector = true, priceType = null }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const history = useHistory();
    const [customerLoggedIn, setCustomerLoggedIn] = useState(false);
    
    // Build navigation paths based on whether price type is locked
    const getNavPath = (path) => {
        if (priceType) {
            return path === '/' ? `/${priceType}` : `/${priceType}${path}`;
        }
        return path;
    };
    
    // Toggle mobile menu
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };
    
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    useEffect(() => {
        const token = localStorage.getItem('customerToken');
        setCustomerLoggedIn(!!token);
    }, []);

    const handleCustomerLogout = () => {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerAllowed');
        // redirect to homepage or price selector
        history.push('/');
        setCustomerLoggedIn(false);
    };


    return (
        <header className="header">
            <div className="header-container">
                {/* Mobile Header - Only visible on small screens */}
                <div className="header-top">
                    <Link to={getNavPath('/')} className="header-logo">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Quang Minh Logo" />
                        </div>
                        <div>
                            <div className="logo-text">Phụ tùng xe máy Quang Minh</div>
                            <div className="logo-text-sub">Uy tín - Chất lượng - Giá tốt</div>
                        </div>
                    </Link>
                    
                    <button 
                        className={menuOpen ? "menu-toggle active" : "menu-toggle"} 
                        onClick={toggleMenu} 
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                </div>
                
                {/* Desktop/Mobile Menu - Structure stays the same but displays differently */}
                <div className={`mobile-menu-wrapper ${menuOpen ? "open" : ""}`}>
                    {/* Desktop Logo - Only visible on desktop */}
                    <Link to={getNavPath('/')} className="header-logo desktop-only">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Quang Minh Logo" onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div style="color:#dc2626;font-weight:bold;font-size:1.5rem">QM</div>';
                            }} />
                        </div>
                        <div>
                            <div className="logo-text">Phụ tùng xe máy Quang Minh</div>
                            <div className="logo-text-sub">Uy tín - Chất lượng - Giá tốt</div>
                        </div>
                    </Link>
                    
                    <nav>
                        <ul>
                            <li>
                                <NavLink exact to={getNavPath('/')} activeClassName="active" onClick={() => setMenuOpen(false)}>
                                    Trang chủ
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to={getNavPath('/catalog')} activeClassName="active" onClick={() => setMenuOpen(false)}>
                                    Danh mục sản phẩm
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to={getNavPath('/search')} activeClassName="active" onClick={() => setMenuOpen(false)}>
                                    Tra cứu
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to={getNavPath('/about')} activeClassName="active" onClick={() => setMenuOpen(false)}>
                                    Giới thiệu
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                    
                    {showSelector && (
                        <div className="header-actions">
                            <CustomerTypeSelector />
                        </div>
                    )}
                    {customerLoggedIn && (
                        <div className="header-actions">
                            <button className="btn btn-outline" onClick={handleCustomerLogout}>Đăng xuất</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;