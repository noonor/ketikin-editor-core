import React from 'react';
import { DocElement } from '../../types';
import { IconClose, WrapIcon } from '../common/Icons';

interface LayoutOptionsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRect: { x: number; y: number; width: number; height: number; pageIdx: number } | null;
    element: DocElement | null;
    onUpdate: (props: Partial<DocElement>) => void;
}

export const LayoutOptionsPopup: React.FC<LayoutOptionsPopupProps> = ({ isOpen, onClose, anchorRect, element, onUpdate }) => {
    if (!isOpen || !anchorRect || !element) return null;

    const currentWrapping = element.imageWrapping || 'topBottom';
    const options = [
        { id: 'inline', label: 'In Line with Text' },
        { id: 'square', label: 'Square' },
        { id: 'tight', label: 'Tight' },
        { id: 'through', label: 'Through' },
        { id: 'topBottom', label: 'Top and Bottom' },
        { id: 'behind', label: 'Behind Text' },
        { id: 'front', label: 'In Front of Text' }
    ];

    const posX = anchorRect.x + anchorRect.width + 10;
    const posY = anchorRect.y;

    return (
        <div className="ketikin-editor-ui" style={{
            position: 'absolute', left: `${posX}px`, top: `${posY}px`, width: '180px', backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 2000, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#323130' }}>Layout Options</span>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px' }}><IconClose/></button>
            </div>
            <div style={{ fontSize: '11px', color: '#605e5c', marginBottom: '8px' }}>With Text Wrapping</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {options.map(opt => (
                    <button key={opt.id} onClick={() => onUpdate({ imageWrapping: opt.id as any })} title={opt.label} style={{ background: currentWrapping === opt.id ? '#f3f9ff' : 'white', border: currentWrapping === opt.id ? '2px solid #185abd' : '1px solid #d2d0ce', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WrapIcon />
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                <button style={{ background: 'transparent', border: 'none', color: '#185abd', fontSize: '11px', padding: 0, cursor: 'pointer' }}>See more...</button>
            </div>
        </div>
    );
};
