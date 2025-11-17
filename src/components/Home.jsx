import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import './Home.css';
import { fetchPromotionBanner } from '../services/api';

const DEFAULT_PROMOTION = {
    title: 'Ưu đãi khuyến mãi đặc biệt',
    subtitle: 'Giảm ngay 15% cho toàn bộ đơn hàng từ 5 triệu đồng trở lên khi đặt hàng trong tháng này. Ưu đãi áp dụng cho tất cả nhóm khách hàng và được hỗ trợ giao hàng nhanh.',
    backgroundImageUrl: '',
    isActive: true,
    overlayOpacity: 0.55,
    textAlignment: 'left',
    primaryAction: {
        label: 'Xem sản phẩm ưu đãi',
        link: '/catalog'
    },
    secondaryAction: {
        label: 'Tra cứu mã giảm giá',
        link: '/search'
    },
    badgeText: 'Hot Deal',
    highlightValue: '15%',
    highlightNote: 'Giảm trực tiếp'
};

const PROMO_POPUP_LAST_SHOWN_KEY = 'qm_promo_popup_last_shown_v1';
const PROMO_POPUP_INTERVAL_MS = 60_000;

const Home = () => {
    const { customerType, locked } = useCustomer();
    const [promotion, setPromotion] = useState(DEFAULT_PROMOTION);
    const [promotionLoading, setPromotionLoading] = useState(true);
    const [promotionError, setPromotionError] = useState('');
    const [showPromotionPopup, setShowPromotionPopup] = useState(false);
    
    // Check if we're on a price-type specific path
    const priceTypePrefix = locked ? `/${customerType}` : '';

    // Loads the promotion banner configuration once when the component mounts.
    useEffect(() => {
        let isMounted = true;

        // Fetches the promotion banner data from the API.
        const loadPromotion = async () => {
            try {
                const data = await fetchPromotionBanner();
                if (!isMounted || !data) {
                    return;
                }

                setPromotion(prev => ({
                    ...prev,
                    ...data,
                    primaryAction: {
                        ...prev.primaryAction,
                        ...(data.primaryAction || {})
                    },
                    secondaryAction: {
                        ...prev.secondaryAction,
                        ...(data.secondaryAction || {})
                    },
                    badgeText: data.badgeText || prev.badgeText,
                    highlightValue: data.highlightValue || prev.highlightValue,
                    highlightNote: data.highlightNote || prev.highlightNote
                }));
                setPromotionError('');
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load promotion banner', error);
                    setPromotion(DEFAULT_PROMOTION);
                    setPromotionError('Không thể tải thông tin khuyến mãi, đang hiển thị nội dung mặc định.');
                }
            } finally {
                if (isMounted) {
                    setPromotionLoading(false);
                }
            }
        };

        loadPromotion();

        return () => {
            isMounted = false;
        };
    }, []);

    // Automatically opens the promotion popup for active campaigns when the page loads.
    useEffect(() => {
        if (promotionLoading || promotion?.isActive === false) {
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        let lastShown = 0;
        try {
            lastShown = Number(sessionStorage.getItem(PROMO_POPUP_LAST_SHOWN_KEY)) || 0;
        } catch (error) {
            console.warn('Không thể đọc thời gian popup khuyến mãi', error);
        }

        if (!lastShown) {
            const timer = setTimeout(() => setShowPromotionPopup(true), 700);
            return () => clearTimeout(timer);
        }
    }, [promotion?.isActive, promotionLoading]);

    // Re-open the popup every PROMO_POPUP_INTERVAL_MS when it has been dismissed.
    useEffect(() => {
        if (promotionLoading || promotion?.isActive === false) {
            return undefined;
        }

        if (typeof window === 'undefined') {
            return undefined;
        }

        const interval = setInterval(() => {
            if (showPromotionPopup) {
                return;
            }

            let lastShown = 0;
            try {
                lastShown = Number(sessionStorage.getItem(PROMO_POPUP_LAST_SHOWN_KEY)) || 0;
            } catch (error) {
                console.warn('Không thể đọc thời gian popup khuyến mãi', error);
            }

            if (!lastShown || Date.now() - lastShown >= PROMO_POPUP_INTERVAL_MS) {
                setShowPromotionPopup(true);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [promotion?.isActive, promotionLoading, showPromotionPopup]);

    useEffect(() => {
        if (!showPromotionPopup || typeof window === 'undefined') {
            return;
        }

        try {
            sessionStorage.setItem(PROMO_POPUP_LAST_SHOWN_KEY, String(Date.now()));
        } catch (error) {
            console.warn('Không thể ghi thời gian popup khuyến mãi', error);
        }
    }, [showPromotionPopup]);

    const handleDismissPromotionPopup = useCallback(() => {
        setShowPromotionPopup(false);
    }, []);

    useEffect(() => {
        if (showPromotionPopup) {
            const onKeyDown = (event) => {
                if (event.key === 'Escape') {
                    handleDismissPromotionPopup();
                }
            };

            window.addEventListener('keydown', onKeyDown);
            return () => window.removeEventListener('keydown', onKeyDown);
        }
    }, [handleDismissPromotionPopup, showPromotionPopup]);

    // Normalizes the overlay opacity value coming from the server/admin UI.
    const overlayOpacity = useMemo(() => {
        const value = Number(promotion?.overlayOpacity);
        if (Number.isNaN(value)) {
            return DEFAULT_PROMOTION.overlayOpacity;
        }
        return Math.min(Math.max(value, 0), 0.95);
    }, [promotion?.overlayOpacity]);

    // Builds the CSS classes needed to render the promotion card.
    const promotionCardClasses = useMemo(() => {
        const classes = ['promo-card'];
        if (promotion?.backgroundImageUrl) {
            classes.push('promo-card--with-image');
        }
        if (promotion?.textAlignment) {
            classes.push(`promo-card--align-${promotion.textAlignment}`);
        }
        return classes.join(' ');
    }, [promotion?.backgroundImageUrl, promotion?.textAlignment]);

    // Applies the gradient overlay when a background image is configured.
    const promotionBackgroundStyle = promotion?.backgroundImageUrl
        ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url(${promotion.backgroundImageUrl})`
        }
        : {};

    // Normalizes internal links so they respect the selected price-type prefix.
    const buildInternalLink = (targetPath) => {
        if (!targetPath) {
            return '';
        }

        if (/^https?:\/\//i.test(targetPath)) {
            return targetPath;
        }

        let finalPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
        if (priceTypePrefix && !finalPath.startsWith(priceTypePrefix)) {
            finalPath = `${priceTypePrefix}${finalPath}`;
        }
        return finalPath;
    };

    // Renders an action button based on admin-provided configuration.
    const renderActionButton = (action, variant, fallback, options = {}) => {
        const payload = action || {};
        const label = payload.label?.trim() || fallback.label;
        const link = payload.link?.trim() || fallback.link;
        const extraClassName = options.className ? ` ${options.className}` : '';
        const onClick = options.onClick;

        if (!label || !link) {
            return null;
        }

        const baseClass = `btn ${variant === 'primary' ? 'btn-primary btn-lg' : variant === 'outline' ? 'btn-outline btn-lg' : 'btn-secondary btn-lg'}`;
        const className = `${baseClass}${extraClassName}`.trim();

        if (/^https?:\/\//i.test(link)) {
            return (
                <a href={link} className={className} target="_blank" rel="noopener noreferrer" onClick={onClick}>
                    {label}
                </a>
            );
        }

        const internalLink = buildInternalLink(link);
        return (
            <Link to={internalLink} className={className} onClick={onClick}>
                {label}
            </Link>
        );
    };

    const popupBackgroundStyle = promotion?.backgroundImageUrl
        ? {
            backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.5), rgba(17, 17, 17, 0.8)), url(${promotion.backgroundImageUrl})`
        }
        : {};

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Hệ thống tra cứu sản phẩm
                            <span className="gradient-text"> chuyên nghiệp</span>
                        </h1>
                        <p className="hero-subtitle">
                            Tra cứu nhanh chóng, chính xác với giá phù hợp cho từng loại khách hàng
                        </p>
                        <div className="hero-actions">
                            <Link to={`${priceTypePrefix}/catalog`} className="btn btn-secondary btn-lg">
                                Xem danh mục sản phẩm
                            </Link>
                            <Link to={`${priceTypePrefix}/search`} className="btn btn-outline btn-lg">
                                Tra cứu ngay
                            </Link>
                        </div>
                        {/* <div className="hero-badge">
                            {locked ? (
                                <>🔒 Bảng giá: <strong>{getPriceTypeName(customerType)}</strong></>
                            ) : (
                                <>Bạn đang xem giá: <strong>{customerType}</strong></>
                            )}
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Promotion Banner Section */}
            {!promotionLoading && promotion?.isActive !== false && (
                <section className="promo-banner">
                    <div className="container">
                        <div className={promotionCardClasses} style={promotionBackgroundStyle}>
                            <div className="promo-content">
                                <h2 className="promo-title">{promotion?.title || DEFAULT_PROMOTION.title}</h2>
                                <p className="promo-subtitle">
                                    {promotion?.subtitle || DEFAULT_PROMOTION.subtitle}
                                </p>
                                <div className="promo-actions">
                                    {renderActionButton(promotion?.primaryAction, 'primary', DEFAULT_PROMOTION.primaryAction)}
                                    {renderActionButton(promotion?.secondaryAction, 'outline', DEFAULT_PROMOTION.secondaryAction)}
                                </div>
                            </div>
                            <div className="promo-highlight">
                                <div className="promo-badge">{promotion?.badgeText || DEFAULT_PROMOTION.badgeText}</div>
                                <span className="promo-percent">{promotion?.highlightValue || DEFAULT_PROMOTION.highlightValue}</span>
                                <span className="promo-note">{promotion?.highlightNote || DEFAULT_PROMOTION.highlightNote}</span>
                            </div>
                        </div>
                        {promotionError && (
                            <p className="promo-error">Không thể tải thông tin khuyến mãi, hiển thị nội dung mặc định.</p>
                        )}
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Tính năng nổi bật</h2>
                    <div className="grid grid-3">
                        <div className="feature-card card">
                            <div className="feature-icon">🔍</div>
                            <h3>Tra cứu nhanh</h3>
                            <p>Tìm kiếm sản phẩm theo mã hoặc tên trong tích tắc</p>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">💰</div>
                            <h3>Giá phù hợp</h3>
                            <p>Hàng chuẩn - Giá tốt</p>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">📊</div>
                            <h3>Danh mục đa dạng</h3>
                            <p>Phân loại sản phẩm rõ ràng, dễ tìm kiếm</p>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">⚡</div>
                            <h3>Cập nhật liên tục</h3>
                            <p>Dữ liệu được cập nhật thường xuyên</p>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">📱</div>
                            <h3>Đa nền tảng</h3>
                            <p>Sử dụng trên mọi thiết bị, mọi lúc mọi nơi</p>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">🔒</div>
                            <h3>Bảo mật cao</h3>
                            <p>Thông tin được bảo vệ an toàn tuyệt đối</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2>Bắt đầu tra cứu ngay hôm nay</h2>
                        <p>Truy cập hàng nghìn sản phẩm với giá cạnh tranh</p>
                        <Link to={`${priceTypePrefix}/catalog`} className="btn btn-primary btn-lg">
                            Khám phá ngay
                        </Link>
                    </div>
                </div>
            </section>

            {showPromotionPopup && (
                <div className="promo-popup-overlay" role="dialog" aria-modal="true" aria-label="Thông tin khuyến mãi nổi bật">
                    <div className={`promo-popup-card ${promotion?.backgroundImageUrl ? 'promo-popup-card--with-image' : ''}`} style={popupBackgroundStyle}>
                        <button type="button" className="promo-popup-close" onClick={() => handleDismissPromotionPopup()} aria-label="Đóng khuyến mãi">
                            ✕
                        </button>
                        <div className="promo-popup-body">
                            <div className="promo-popup-badge">{promotion?.badgeText || DEFAULT_PROMOTION.badgeText}</div>
                            <h3 className="promo-popup-title">{promotion?.title || DEFAULT_PROMOTION.title}</h3>
                            <p className="promo-popup-subtitle">{promotion?.subtitle || DEFAULT_PROMOTION.subtitle}</p>
                            <div className="promo-popup-highlight">
                                <span className="popup-highlight-value">{promotion?.highlightValue || DEFAULT_PROMOTION.highlightValue}</span>
                                <span className="popup-highlight-note">{promotion?.highlightNote || DEFAULT_PROMOTION.highlightNote}</span>
                            </div>
                        </div>
                        <div className="promo-popup-actions">
                            {renderActionButton(promotion?.primaryAction, 'primary', DEFAULT_PROMOTION.primaryAction, {
                                className: 'popup-primary',
                                onClick: () => handleDismissPromotionPopup()
                            })}
                            {renderActionButton(promotion?.secondaryAction, 'outline', DEFAULT_PROMOTION.secondaryAction, {
                                className: 'popup-secondary',
                                onClick: () => handleDismissPromotionPopup()
                            })}
                            <button type="button" className="promo-popup-dismiss" onClick={() => handleDismissPromotionPopup()}>
                                Bỏ qua khuyến mãi này
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
