import React, { useState, useRef } from 'react';
import './AdminQR.css';

const AdminQR = ({ onBack }) => {
    const [inputUrl, setInputUrl] = useState('');
    const [priceType, setPriceType] = useState('BBCL');
    const [productCode, setProductCode] = useState('');
    const [size, setSize] = useState(300);
    const [qrSrc, setQrSrc] = useState('');
    const imgRef = useRef(null);

    const buildFromTemplate = () => {
        // Build a frontend link template: origin/priceType[/productCode]
        const origin = window.location.origin || '';
        let path = `/${priceType.toLowerCase()}`;
        if (productCode.trim()) path += `/${encodeURIComponent(productCode.trim())}`;
        return origin + path;
    };

    const generate = () => {
        const url = inputUrl.trim() || buildFromTemplate();
        if (!url) return alert('Vui lòng nhập link hoặc điền mẫu');
        const encoded = encodeURIComponent(url);
        // Use qrserver public API for quick QR generation
        const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
        setQrSrc(src);
    };

    const downloadQR = async () => {
        if (!qrSrc) return;
        try {
            // Draw image to canvas to force a download filename
            const img = imgRef.current;
            if (!img) return window.open(qrSrc, '_blank');

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            // ensure crossOrigin for external image
            const tmpImg = new Image();
            tmpImg.crossOrigin = 'anonymous';
            tmpImg.src = qrSrc;
            tmpImg.onload = () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tmpImg, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'qr-code.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
            };
            tmpImg.onerror = () => {
                // fallback: open in new tab
                window.open(qrSrc, '_blank');
            };
        } catch (err) {
            console.error(err);
            window.open(qrSrc, '_blank');
        }
    };

    const copyLink = async () => {
        const url = inputUrl.trim() || buildFromTemplate();
        if (!url) return alert('No url');
        try {
            await navigator.clipboard.writeText(url);
            alert('Đã sao chép link tới clipboard');
        } catch (err) {
            alert('Không thể sao chép');
        }
    };

    return (
        <div className="admin-qr">
            <div className="admin-qr-header">
                <button className="btn btn-outline" onClick={onBack}>← Quay lại</button>
                <h2>Tạo QR code cho link / bảng giá</h2>
            </div>

            <div className="admin-qr-body">
                <div className="admin-qr-col">
                    <label>1) Nhập URL (hoặc để trống để dùng mẫu bên dưới)</label>
                    <input type="text" placeholder="https://example.com/prices/..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} />

                    <label>2) Hoặc chọn mẫu tạo nhanh (gắn giá theo loại)</label>
                    <div className="qr-templates">
                        <select value={priceType} onChange={(e) => setPriceType(e.target.value)}>
                            <option value="BBCL">BBCL</option>
                            <option value="BBPT">BBPT</option>
                            <option value="BL">BL</option>
                            <option value="BLVIP">BLVIP</option>
                            <option value="HONDA247">HONDA247</option>
                        </select>
                        <input type="text" placeholder="Mã sản phẩm (tùy chọn)" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
                        <div className="qr-size">
                            <label>Kích thước:</label>
                            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                                <option value={150}>150</option>
                                <option value={250}>250</option>
                                <option value={300}>300</option>
                                <option value={500}>500</option>
                            </select>
                        </div>

                        <div className="qr-actions">
                            <button className="btn btn-primary" onClick={generate}>Tạo QR</button>
                            <button className="btn btn-outline" onClick={() => { setInputUrl(''); setProductCode(''); setQrSrc(''); }}>Clear</button>
                        </div>
                    </div>

                    <div className="qr-preview-actions">
                        <button className="btn" onClick={copyLink}>Sao chép link</button>
                        <button className="btn" onClick={downloadQR} disabled={!qrSrc}>Tải QR</button>
                    </div>
                </div>

                <div className="admin-qr-preview">
                    <div className="preview-box">
                        {qrSrc ? (
                            <img ref={imgRef} src={qrSrc} alt="QR preview" />
                        ) : (
                            <div className="placeholder">QR sẽ hiển thị ở đây</div>
                        )}
                    </div>
                    <div className="preview-info">
                        <div>Link: <code>{inputUrl.trim() || buildFromTemplate()}</code></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminQR;
