import React, { useState, useEffect } from 'react';
import { DocElement } from '../../types';
import { IconClose, WrapIcon } from '../common/Icons';
import { dialogRowStyle, dialogSelectStyle, dialogInputStyle, dialogBtnStyle } from '../common/Styles';

interface LayoutDialogProps {
    isOpen: boolean;
    onClose: () => void;
    element: DocElement | null;
    onUpdate: (props: Partial<DocElement>) => void;
}

export const LayoutDialog: React.FC<LayoutDialogProps> = ({ isOpen, onClose, element, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('Size');
    const [localProps, setLocalProps] = useState<Partial<DocElement>>({});

    useEffect(() => {
        if (element) setLocalProps({ ...element });
    }, [element, isOpen]);

    if (!isOpen || !element) return null;

    const handleApply = () => {
        onUpdate(localProps);
        onClose();
    };

    const updateNested = (path: string, value: any) => {
        const parts = path.split('.');
        const newProps = { ...localProps } as any;
        let current = newProps;
        for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = { ...(current[parts[i]] || {}) };
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        setLocalProps(newProps);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Position':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Horizontal</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px' }}>Alignment</label>
                                <select style={dialogSelectStyle} value={localProps.imagePosition?.horizontal?.value || 0} onChange={(e) => updateNested('imagePosition.horizontal.value', parseFloat(e.target.value))}>
                                    <option value="0">Left</option>
                                    <option value="1">Centered</option>
                                    <option value="2">Right</option>
                                </select>
                                <div style={{ fontSize: '12px', color: '#666' }}>relative to Column</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Vertical</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px' }}>Alignment</label>
                                <select style={dialogSelectStyle} value={localProps.imagePosition?.vertical?.value || 0} onChange={(e) => updateNested('imagePosition.vertical.value', parseFloat(e.target.value))}>
                                    <option value="0">Top</option>
                                    <option value="1">Centered</option>
                                    <option value="2">Bottom</option>
                                </select>
                                <div style={{ fontSize: '12px', color: '#666' }}>relative to Page</div>
                            </div>
                        </div>
                    </div>
                );
            case 'Text Wrapping':
                const wrapping = localProps.imageWrapping || 'topBottom';
                const options = [
                    { id: 'inline', label: 'In line with text' },
                    { id: 'square', label: 'Square' },
                    { id: 'tight', label: 'Tight' },
                    { id: 'through', label: 'Through' },
                    { id: 'topBottom', label: 'Top and bottom' },
                    { id: 'behind', label: 'Behind text' },
                    { id: 'front', label: 'In front of text' }
                ];
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                        {options.map(opt => (
                            <div key={opt.id} onClick={() => setLocalProps({ ...localProps, imageWrapping: opt.id as any })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '8px', borderRadius: '4px', border: wrapping === opt.id ? '2px solid #185abd' : '1px solid #d2d0ce', backgroundColor: wrapping === opt.id ? '#f3f9ff' : 'white' }}>
                                <WrapIcon />
                                <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>{opt.label}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'Size':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                            <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '13px' }}>Size and rotate</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 100px', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '12px' }}>Height</label>
                                    <div style={dialogRowStyle}><input type="number" style={dialogInputStyle} value={Math.round(localProps.imageHeight || 0)} onChange={(e)=>setLocalProps({...localProps, imageHeight: parseInt(e.target.value)})}/> <span style={{fontSize:'12px'}}>px</span></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '12px' }}>Width</label>
                                    <div style={dialogRowStyle}><input type="number" style={dialogInputStyle} value={Math.round(localProps.imageWidth || 0)} onChange={(e)=>setLocalProps({...localProps, imageWidth: parseInt(e.target.value)})}/> <span style={{fontSize:'12px'}}>px</span></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '12px' }}>Rotation</label>
                                    <div style={dialogRowStyle}><input type="number" style={dialogInputStyle} value={Math.round(localProps.imageRotation || 0)} onChange={(e)=>setLocalProps({...localProps, imageRotation: parseInt(e.target.value)})}/> <span style={{fontSize:'12px'}}>°</span></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '13px' }}>Scale</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 100px', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '12px' }}>Height</label>
                                    <div style={dialogRowStyle}><input type="number" style={dialogInputStyle} defaultValue="100"/> <span style={{fontSize:'12px'}}>%</span></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '12px' }}>Width</label>
                                    <div style={dialogRowStyle}><input type="number" style={dialogInputStyle} defaultValue="100"/> <span style={{fontSize:'12px'}}>%</span></div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}><input type="checkbox" checked={localProps.imageSizeOptions?.lockAspectRatio} onChange={(e) => updateNested('imageSizeOptions.lockAspectRatio', e.target.checked)}/> Lock aspect ratio</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}><input type="checkbox" checked={localProps.imageSizeOptions?.relativeToOriginalSize} onChange={(e) => updateNested('imageSizeOptions.relativeToOriginalSize', e.target.checked)}/> Relative to original picture size</label>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div style={{ backgroundColor: 'white', width: '560px', borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#323130' }}>Layout</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}><IconClose/></button>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    {['Position', 'Text Wrapping', 'Size'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', fontSize: '13px', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid #185abd' : '2px solid transparent', color: activeTab === tab ? '#185abd' : '#605e5c', cursor: 'pointer', fontWeight: activeTab === tab ? '600' : 'normal' }}>{tab}</button>
                    ))}
                </div>
                <div style={{ padding: '24px', flex: 1, minHeight: '300px' }}>
                    {renderTabContent()}
                </div>
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8f8f8', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
                    <button onClick={handleApply} style={dialogBtnStyle}>OK</button>
                    <button onClick={onClose} style={{ ...dialogBtnStyle, backgroundColor: 'white', color: '#323130', border: '1px solid #d2d0ce' }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};
