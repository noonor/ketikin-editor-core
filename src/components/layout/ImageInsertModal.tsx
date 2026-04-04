import React, { useState } from 'react';

interface ImageInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({ isOpen, onClose, onInsert }) => {
    const [tab, setTab] = useState<'Local' | 'URL' | 'Stock'>('Local');
    const [url, setUrl] = useState('');

    if (!isOpen) return null;

    const modalStyle: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 2000, fontFamily: 'Segoe UI, sans-serif'
    };

    const contentStyle: React.CSSProperties = {
        backgroundColor: 'white', width: '500px', borderRadius: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden'
    };

    const headerStyle: React.CSSProperties = {
        padding: '12px 20px', borderBottom: '1px solid #edebe9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#f3f2f1'
    };

    const tabGroupStyle: React.CSSProperties = {
        display: 'flex', borderBottom: '1px solid #edebe9', backgroundColor: '#f3f2f1'
    };

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '10px 20px', cursor: 'pointer', fontSize: '13px',
        borderBottom: active ? '2px solid #185abd' : '2px solid transparent',
        color: active ? '#185abd' : '#323130', fontWeight: active ? '600' : 'normal'
    });

    const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) onInsert(ev.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={modalStyle} onClick={onClose}>
            <div style={contentStyle} onClick={e => e.stopPropagation()}>
                <div style={headerStyle}>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>Insert Image</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
                </div>
                <div style={tabGroupStyle}>
                    <div style={tabStyle(tab === 'Local')} onClick={() => setTab('Local')}>Local File</div>
                    <div style={tabStyle(tab === 'URL')} onClick={() => setTab('URL')}>From URL</div>
                    <div style={tabStyle(tab === 'Stock')} onClick={() => setTab('Stock')}>Stock Images</div>
                </div>
                <div style={{ padding: '30px', minHeight: '150px' }}>
                    {tab === 'Local' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '20px', color: '#605e5c' }}>Select an image file from your computer</div>
                            <input type="file" accept="image/*" onChange={handleLocalUpload} style={{ display: 'none' }} id="img-upload-input" />
                            <label htmlFor="img-upload-input" style={{ backgroundColor: '#185abd', color: 'white', padding: '8px 24px', borderRadius: '2px', cursor: 'pointer', display: 'inline-block' }}>Choose File</label>
                        </div>
                    )}
                    {tab === 'URL' && (
                        <div>
                            <div style={{ marginBottom: '10px', color: '#605e5c' }}>Paste the image link below:</div>
                            <input 
                                type="text" value={url} onChange={e => setUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                                style={{ width: '100%', padding: '8px', border: '1px solid #8a8886', borderRadius: '2px', outline: 'none' }}
                            />
                            <button 
                                onClick={() => url && onInsert(url)}
                                style={{ marginTop: '20px', width: '100%', backgroundColor: '#185abd', color: 'white', border: 'none', padding: '10px', borderRadius: '2px', cursor: 'pointer' }}
                            >Insert</button>
                        </div>
                    )}
                    {tab === 'Stock' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[
                                'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=200&h=150&fit=crop',
                                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=150&fit=crop',
                                'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=200&h=150&fit=crop',
                                'https://images.unsplash.com/photo-1501854140801-50d01674aa3e?w=200&h=150&fit=crop',
                                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=150&fit=crop',
                                'https://images.unsplash.com/photo-1506744038ac3-395328e2ad51?w=200&h=150&fit=crop'
                            ].map((src, i) => (
                                <img key={i} src={src} onClick={() => onInsert(src)} style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '2px' }} alt="Stock" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
