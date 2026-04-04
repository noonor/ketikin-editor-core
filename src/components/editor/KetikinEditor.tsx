import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '../../core/Editor';
import { DocElement, KetikinDocument } from '../../types';
import { importFile, OPEN_FILE_ACCEPT, FILE_TYPE_GROUPS } from '../../importers/FileImporter';
import { Ribbon } from '../ribbon/Ribbon.tsx';
import { LayoutDialog } from '../layout/LayoutDialog.tsx';
import { LayoutOptionsPopup } from '../layout/LayoutOptionsPopup.tsx';
import { ImageInsertModal } from '../layout/ImageInsertModal.tsx';

interface KetikinEditorProps {
    initialElements?: DocElement[];
    config?: Partial<KetikinDocument>;
    onSave?: (elements: DocElement[]) => void;
}

const KetikinEditor: React.FC<KetikinEditorProps> = ({ initialElements = [], config, onSave }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [activeTab, setActiveTab] = useState('Home');
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const [isOptionsPopupOpen, setIsOptionsPopupOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<DocElement | null>(null);
    const [selectedRect, setSelectedRect] = useState<any>(null);
    const [zoom, setZoom] = useState(100);
    const [stats, setStats] = useState({ pages: 1, words: 0 });
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [, setFormatTick] = useState(0); // triggers ribbon re-render on caret/selection changes

    useEffect(() => {
        if (containerRef.current && !editor) {
            const ed = new Editor(containerRef.current, initialElements, config);
            // onSelectionChange is set below alongside onChange
            ed.onChange = () => {
                const el = ed.elements;
                if (onSave) onSave(el);
                setSelectedRect(ed.getRotatedVisualBounds());
                setStats(ed.getStats());
                setFormatTick(t => t + 1);
            };
            ed.onSelectionChange = () => {
                const sel = ed.getSelectedElement();
                setSelectedElement(sel ? { ...sel } : null);
                setSelectedRect(ed.getRotatedVisualBounds());
                setFormatTick(t => t + 1);
                if (sel?.elementType === 'image') {
                    setActiveTab('Picture Format');
                    setIsOptionsPopupOpen(true);
                } else {
                    setIsOptionsPopupOpen(false);
                }
            };
            (window as any).ketikinSave = () => {
                if (onSave) onSave(ed.elements);
                alert('Document Saved!');
            };
            setEditor(ed);
            setStats(ed.getStats());
        }
    }, [containerRef, editor, initialElements, config, onSave]);

    const handleImportFile = async () => {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: FILE_TYPE_GROUPS.map(g => ({ description: g.label, accept: { 'application/octet-stream': g.accept.split(',') } }))
            });
            const file = await fileHandle.getFile();
            const elements = await importFile(file);
            editor?.loadContent(elements);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = OPEN_FILE_ACCEPT;
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const elements = await importFile(file);
                        editor?.loadContent(elements);
                    }
                };
                input.click();
            }
        }
    };

    return (
        <div className="ketikin-editor-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#f3f2f1', overflow: 'hidden', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
            <Ribbon 
                editor={editor} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLayoutClick={() => setIsLayoutOpen(true)}
                onImportClick={handleImportFile}
                onImageInsertClick={() => setIsImageModalOpen(true)}
            />

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', backgroundColor: '#e2e2e2', padding: '40px 0', scrollBehavior: 'smooth', position: 'relative' }}>
                {/* containerRef: ONLY page wrappers are appended here by the Editor class imperatively */}
                <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', alignSelf: 'flex-start' }}>
                </div>

                {/* Popup is outside containerRef so it doesn't disturb the flex page layout */}
                <LayoutOptionsPopup 
                    isOpen={isOptionsPopupOpen}
                    onClose={() => setIsOptionsPopupOpen(false)}
                    anchorRect={selectedRect}
                    element={selectedElement}
                    onUpdate={(props) => editor?.updateSelectedElement(props)}
                />
            </div>

            <LayoutDialog 
                isOpen={isLayoutOpen}
                onClose={() => setIsLayoutOpen(false)}
                element={selectedElement}
                onUpdate={(props) => editor?.updateSelectedElement(props)}
            />

            <ImageInsertModal 
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onInsert={(url: string) => {
                    editor?.insertImage(url);
                    setIsImageModalOpen(false);
                }}
            />

            <div style={{ 
                height: '24px', 
                backgroundColor: '#f3f2f1', 
                borderTop: '1px solid #d2d0ce', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0 15px', 
                fontSize: '11px', 
                color: '#605e5c',
                userSelect: 'none'
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div>Page {stats.pages} of {stats.pages}</div>
                    <div>{stats.words} words</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => { const z = Math.max(25, zoom - 10); setZoom(z); editor?.setScale(z/100); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px' }}>-</button>
                    <input 
                        type="range" min="25" max="300" value={zoom} 
                        onChange={(e) => { const z = parseInt(e.target.value); setZoom(z); editor?.setScale(z/100); }}
                        style={{ width: '100px', height: '2px', cursor: 'pointer' }}
                    />
                    <button onClick={() => { const z = Math.min(300, zoom + 10); setZoom(z); editor?.setScale(z/100); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px' }}>+</button>
                    <div style={{ width: '35px', textAlign: 'right' }}>{zoom}%</div>
                </div>
            </div>

            <style>{`
                @keyframes caret-blink { from { opacity: 1; } to { opacity: 0; } }
                .editor-page-wrapper { transition: transform 0.2s; }
                .editor-page { transition: box-shadow 0.2s; }
                .editor-page:hover { box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23) !important; }
            `}</style>
        </div>
    );
};

export default KetikinEditor;
export { KetikinEditor };
export type { KetikinEditorProps };
