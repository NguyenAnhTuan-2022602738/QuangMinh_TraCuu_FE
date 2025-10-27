import React, { useState, useRef, useEffect } from 'react';
import './AdminQR.css';

const AdminQR = ({ onBack }) => {
    // Form states
    const [inputUrl, setInputUrl] = useState('');
    const [priceType, setPriceType] = useState('BBCL');
    const [productCode, setProductCode] = useState('');
    const [size, setSize] = useState(300);
    
    // QR state
    const [qrSrc, setQrSrc] = useState('');
    const [generating, setGenerating] = useState(false);
    const imgRef = useRef(null);
    
    // History state
    const [qrHistory, setQrHistory] = useState([]);
    
    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('qr_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                setQrHistory(parsed);
                console.log('📜 Loaded QR history:', parsed.length, 'items');
            }
        } catch (err) {
            console.error('❌ Failed to load QR history:', err);
        }
    }, []);
    
    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (qrHistory.length > 0) {
            try {
                localStorage.setItem('qr_history', JSON.stringify(qrHistory));
                console.log('💾 Saved QR history:', qrHistory.length, 'items');
            } catch (err) {
                console.error('❌ Failed to save QR history:', err);
            }
        }
    }, [qrHistory]);

    /**
     * Build URL from template
     * Pattern: {origin}/{priceType}[/{productCode}]
     * Example: https://example.com/bbcl/SP001
     */
    const buildFromTemplate = () => {
        const origin = window.location.origin || 'http://localhost:3000';
        let path = `/${priceType.toLowerCase()}`;
        
        if (productCode.trim()) {
            path += `/${encodeURIComponent(productCode.trim())}`;
        }
        
        return origin + path;
    };

    /**
     * Generate QR code using public API
     */
    const generate = () => {
        // Use custom URL or build from template
        const url = inputUrl.trim() || buildFromTemplate();
        
        if (!url) {
            alert('⚠️ Vui lòng nhập URL hoặc chọn mẫu để tạo QR');
            return;
        }

        setGenerating(true);
        
        try {
            const encoded = encodeURIComponent(url);
            // Use QR Server API (free, no API key needed)
            const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
            
            console.log('🔗 Generating QR for URL:', url);
            console.log('📐 Size:', size);
            
            setQrSrc(src);
            
            // Save to history
            const newItem = {
                id: Date.now(),
                url: url,
                priceType: priceType,
                productCode: productCode || '',
                size: size,
                qrSrc: src,
                createdAt: new Date().toISOString()
            };
            
            setQrHistory(prev => [newItem, ...prev]); // Add to beginning
            console.log('✅ Added to history:', newItem);
            
            setTimeout(() => setGenerating(false), 500);
        } catch (err) {
            console.error('❌ QR generation error:', err);
            alert('❌ Lỗi tạo QR: ' + err.message);
            setGenerating(false);
        }
    };
    
    /**
     * Delete QR from history
     */
    const deleteQR = (id) => {
        if (window.confirm('🗑️ Xác nhận xóa QR code này khỏi lịch sử?')) {
            setQrHistory(prev => prev.filter(item => item.id !== id));
            console.log('🗑️ Deleted QR:', id);
            
            // If deleted QR is currently displayed, clear it
            const deletedItem = qrHistory.find(item => item.id === id);
            if (deletedItem && deletedItem.qrSrc === qrSrc) {
                setQrSrc('');
            }
        }
    };
    
    /**
     * Load QR from history
     */
    const loadQR = (item) => {
        setInputUrl(item.url);
        setPriceType(item.priceType);
        setProductCode(item.productCode);
        setSize(item.size);
        setQrSrc(item.qrSrc);
        console.log('📂 Loaded QR from history:', item);
        
        // Scroll to top to see the preview
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    /**
     * Clear all history
     */
    const clearHistory = () => {
        if (window.confirm('🗑️ Xác nhận xóa toàn bộ lịch sử QR code?')) {
            setQrHistory([]);
            localStorage.removeItem('qr_history');
            console.log('🧹 History cleared');
        }
    };

    /**
     * Download QR code as PNG
     */
    const downloadQR = async () => {
        if (!qrSrc) {
            alert('⚠️ Chưa có QR code để tải');
            return;
        }

        try {
            console.log('💾 Downloading QR code...');
            
            // Method 1: Try direct download via canvas
            const img = imgRef.current;
            if (img) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Create temp image with CORS enabled
                const tmpImg = new Image();
                tmpImg.crossOrigin = 'anonymous';
                tmpImg.src = qrSrc;
                
                tmpImg.onload = () => {
                    // White background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw QR
                    ctx.drawImage(tmpImg, 0, 0, canvas.width, canvas.height);
                    
                    // Convert to blob and download
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `qr-${priceType}-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        console.log('✅ QR downloaded successfully');
                    }, 'image/png');
                };
                
                tmpImg.onerror = () => {
                    console.warn('⚠️ CORS error, opening in new tab instead');
                    window.open(qrSrc, '_blank');
                };
            } else {
                // Method 2: Fallback - open in new tab
                window.open(qrSrc, '_blank');
            }
        } catch (err) {
            console.error('❌ Download error:', err);
            alert('❌ Lỗi tải QR: ' + err.message);
            window.open(qrSrc, '_blank');
        }
    };

    /**
     * Copy URL to clipboard
     */
    const copyLink = async () => {
        const url = inputUrl.trim() || buildFromTemplate();
        
        if (!url) {
            alert('⚠️ Không có URL để sao chép');
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            alert('✅ Đã sao chép link vào clipboard:\n\n' + url);
            console.log('📋 Copied URL:', url);
        } catch (err) {
            console.error('❌ Copy error:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                alert('✅ Đã sao chép link: ' + url);
            } catch (e) {
                alert('❌ Không thể sao chép. Vui lòng copy thủ công:\n\n' + url);
            }
            document.body.removeChild(textArea);
        }
    };

    /**
     * Clear all form data
     */
    const clearAll = () => {
        setInputUrl('');
        setProductCode('');
        setQrSrc('');
        setPriceType('BBCL');
        setSize(300);
        console.log('🧹 Form cleared');
    };

    return (
        <div className="admin-qr">
            {/* Header */}
            <div className="admin-qr-header">
                <button className="btn btn-outline" onClick={onBack}>
                    ← Quay lại
                </button>
                <h2>🔗 Tạo QR Code cho bảng giá</h2>
            </div>

            <div className="admin-qr-body">
                {/* Left: Form */}
                <div className="admin-qr-col">
                    <div className="qr-form-card">
                        <h3>📝 Nhập thông tin</h3>
                        
                        {/* Option 1: Direct URL */}
                        <div className="form-section">
                            <label>
                                <strong>Cách 1:</strong> Nhập URL trực tiếp
                            </label>
                            <input 
                                type="text" 
                                placeholder="https://example.com/bbcl/SP001" 
                                value={inputUrl} 
                                onChange={(e) => setInputUrl(e.target.value)}
                                className="url-input"
                            />
                            <p className="hint">Nếu để trống, sẽ dùng mẫu tự động bên dưới</p>
                        </div>

                        <div className="divider">
                            <span>HOẶC</span>
                        </div>

                        {/* Option 2: Template */}
                        <div className="form-section">
                            <label>
                                <strong>Cách 2:</strong> Tạo tự động từ mẫu
                            </label>
                            
                            <div className="form-row">
                                <div className="form-col">
                                    <label className="small-label">Loại bảng giá</label>
                                    <select 
                                        value={priceType} 
                                        onChange={(e) => setPriceType(e.target.value)}
                                        className="select-input"
                                    >
                                        <option value="BBCL">BBCL</option>
                                        <option value="BBPT">BBPT</option>
                                        <option value="BL">BL</option>
                                        <option value="BLVIP">BLVIP</option>
                                        <option value="HONDA247">HONDA247</option>
                                    </select>
                                </div>
                                
                                <div className="form-col">
                                    <label className="small-label">Mã sản phẩm (tùy chọn)</label>
                                    <input 
                                        type="text" 
                                        placeholder="SP001" 
                                        value={productCode} 
                                        onChange={(e) => setProductCode(e.target.value)}
                                        className="text-input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-col">
                                    <label className="small-label">Kích thước QR</label>
                                    <select 
                                        value={size} 
                                        onChange={(e) => setSize(Number(e.target.value))}
                                        className="select-input"
                                    >
                                        <option value={150}>150 x 150 px (Nhỏ)</option>
                                        <option value={250}>250 x 250 px (Vừa)</option>
                                        <option value={300}>300 x 300 px (Lớn)</option>
                                        <option value={500}>500 x 500 px (Rất lớn)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="preview-url">
                                <strong>URL sẽ tạo:</strong>
                                <code>{inputUrl.trim() || buildFromTemplate()}</code>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="qr-actions">
                            <button 
                                className="btn btn-primary" 
                                onClick={generate}
                                disabled={generating}
                            >
                                {generating ? '⏳ Đang tạo...' : '✨ Tạo QR Code'}
                            </button>
                            <button 
                                className="btn btn-outline" 
                                onClick={clearAll}
                            >
                                🧹 Xóa hết
                            </button>
                        </div>

                        {/* Copy & Download */}
                        {qrSrc && (
                            <div className="qr-preview-actions">
                                <button className="btn btn-secondary" onClick={copyLink}>
                                    📋 Copy Link
                                </button>
                                <button className="btn btn-secondary" onClick={downloadQR}>
                                    💾 Tải QR Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="admin-qr-preview">
                    <div className="preview-card">
                        <h3>👁️ Xem trước</h3>
                        <div className="preview-box">
                            {qrSrc ? (
                                <div className="qr-wrapper">
                                    <img 
                                        ref={imgRef} 
                                        src={qrSrc} 
                                        alt="QR Code Preview" 
                                        className="qr-image"
                                        onError={() => {
                                            console.error('❌ QR image failed to load');
                                            alert('❌ Không thể tải QR code. Vui lòng thử lại.');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="placeholder">
                                    <div className="placeholder-icon">📱</div>
                                    <p>QR Code sẽ hiển thị ở đây</p>
                                    <p className="hint">Nhập thông tin và nhấn "Tạo QR Code"</p>
                                </div>
                            )}
                        </div>
                        
                        {qrSrc && (
                            <div className="preview-info">
                                <div className="info-row">
                                    <span className="info-label">🔗 Link:</span>
                                    <code className="info-value">{inputUrl.trim() || buildFromTemplate()}</code>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">📐 Kích thước:</span>
                                    <span className="info-value">{size} x {size} px</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* History Section */}
            {qrHistory.length > 0 && (
                <div className="qr-history-section">
                    <div className="history-header">
                        <h3>📜 Lịch sử QR Code ({qrHistory.length})</h3>
                        <button className="btn btn-outline btn-sm" onClick={clearHistory}>
                            🗑️ Xóa tất cả
                        </button>
                    </div>
                    
                    <div className="history-grid">
                        {qrHistory.map(item => (
                            <div key={item.id} className="history-item">
                                <div className="history-qr-preview">
                                    <img src={item.qrSrc} alt="QR Preview" />
                                </div>
                                <div className="history-info">
                                    <div className="history-meta">
                                        <span className="price-badge">{item.priceType}</span>
                                        {item.productCode && (
                                            <span className="product-code">{item.productCode}</span>
                                        )}
                                        <span className="qr-size">{item.size}px</span>
                                    </div>
                                    <div className="history-url" title={item.url}>
                                        {item.url}
                                    </div>
                                    <div className="history-time">
                                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div className="history-actions">
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => loadQR(item)}
                                        title="Tải lại QR này"
                                    >
                                        📂
                                    </button>
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = item.qrSrc;
                                            a.download = `qr-${item.priceType}-${item.id}.png`;
                                            a.click();
                                        }}
                                        title="Tải xuống"
                                    >
                                        💾
                                    </button>
                                    <button 
                                        className="btn-icon btn-delete" 
                                        onClick={() => deleteQR(item.id)}
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQR;
