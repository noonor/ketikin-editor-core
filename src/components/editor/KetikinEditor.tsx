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
    showHeader?: boolean;
    showFooter?: boolean;
    backgroundColor?: string;
    theme?: 'light' | 'dark';
    onEditorCreated?: (editor: Editor) => void;
    onCommandTriggered?: (cmd: any) => void;
}

const KetikinEditor: React.FC<KetikinEditorProps> = ({ 
    initialElements = [], 
    config, 
    onSave,
    showHeader = true,
    showFooter,
    backgroundColor,
    theme,
    onEditorCreated,
    onCommandTriggered
}) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);

    // Pastikan scroll container selalu di posisi paling atas saat inisialisasi
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [editor]);


    const [isOptionsPopupOpen, setIsOptionsPopupOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<DocElement | null>(null);
    const [selectedRect, setSelectedRect] = useState<any>(null);
    const [zoom, setZoom] = useState(100);
    const [stats, setStats] = useState({ pages: 1, words: 0 });
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [, setFormatTick] = useState(0); // triggers ribbon re-render on caret/selection changes
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true
        });
    };

    const handleContextCommand = (type: 'perbaiki' | 'lanjutkan' | 'saran') => {
        if (!editor) return;
        
        let selectedText = editor.getSelectedText();
        if (!selectedText) {
            const full = editor.getFullText();
            const caret = editor.caretIndex;
            let start = caret;
            while (start > 0 && full[start - 1] !== '\n') start--;
            let end = caret;
            while (end < full.length && full[end] !== '\n') end++;
            selectedText = full.substring(start, end).trim();
        }
        
        if (!selectedText) {
            selectedText = "Teks kosong pada kursor";
        }
        
        onCommandTriggered?.({
            type,
            selectedText,
            from: editor.caretIndex,
            to: editor.caretIndex
        });
        setContextMenu(null);
    };

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            const ed = new Editor(containerRef.current, initialElements, config);
            // onSelectionChange is set below alongside onChange
            ed.onChange = () => {
                const el = ed.elements;
                if (onSave) onSave(el);
                setSelectedRect(ed.getRotatedVisualBounds());
                setStats(ed.getStats());
                setZoom(Math.round(ed.getScale() * 100));
                setFormatTick(t => t + 1);
            };
            ed.onSelectionChange = () => {
                const sel = ed.getSelectedElement();
                setSelectedElement(sel ? { ...sel } : null);
                setSelectedRect(ed.getRotatedVisualBounds());
                setFormatTick(t => t + 1);
                if (sel?.elementType === 'image') {
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
            if (onEditorCreated) onEditorCreated(ed);
        }
    }, [containerRef]);

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

    const isDark = theme === 'dark' || (theme !== 'light' && (backgroundColor ? (backgroundColor.startsWith('#0') || backgroundColor.startsWith('#1')) : true));
    const shouldShowFooter = showFooter !== undefined ? showFooter : showHeader;
    const canvasBg = backgroundColor || (isDark ? '#0c0d12' : '#eef2f6');
    const rootBg = backgroundColor || (isDark ? '#0c0d12' : '#eef2f6');

    return (
        <div className="ketikin-editor-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: rootBg, overflow: 'hidden', fontFamily: '"Segoe UI", system-ui, sans-serif', position: 'relative' }}>
            <div 
                ref={scrollContainerRef}
                onContextMenu={handleContextMenu} 
                className="ketikin-editor-scroll"
                style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: canvasBg, padding: '16px 0 60px 0', position: 'relative' }}
            >

                
                {/* Floating Rounded Sticky Balloon Ribbon positioned directly above the document */}
                {showHeader && (
                    <div style={{ position: 'sticky', top: '12px', zIndex: 1000, width: '100%', maxWidth: '816px', display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '0 16px', pointerEvents: 'none' }}>
                        <div style={{ pointerEvents: 'auto', width: '100%' }}>
                            <Ribbon 
                                editor={editor} 
                                theme={isDark ? 'dark' : 'light'}
                                onLayoutClick={() => setIsLayoutOpen(true)}
                                onImportClick={handleImportFile}
                                onImageInsertClick={() => setIsImageModalOpen(true)}
                            />
                        </div>
                    </div>
                )}

                {/* containerRef: ONLY page wrappers are appended here by the Editor class imperatively */}
                <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', alignSelf: 'center' }}>
                </div>


                {/* Context Menu Render */}
                {contextMenu && contextMenu.visible && (
                    <div 
                        className="ketikin-context-menu ketikin-editor-ui"
                        style={{
                            position: 'fixed',
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                            border: isDark ? '1px solid #2c2c2e' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '4px 0',
                            zIndex: 99999,
                            minWidth: '180px',
                            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.12)',
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: '12px',
                            color: isDark ? '#ffffff' : '#0f172a'
                        }}
                    >
                        <ContextMenuItem onClick={() => handleContextCommand('saran')}>
                            💬 Tanyakan ke Chatbot AI
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleContextCommand('perbaiki')}>
                            🔍 Perbaiki Tata Bahasa (EYD)
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleContextCommand('lanjutkan')}>
                            ➕ Lanjutkan Tulisan
                        </ContextMenuItem>
                        <div style={{ height: '1px', backgroundColor: isDark ? '#2c2c2e' : '#e2e8f0', margin: '4px 0' }} />
                        <ContextMenuItem onClick={() => { editor?.copyToClipboard(); setContextMenu(null); }}>
                            Copy
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { editor?.cutToClipboard(); setContextMenu(null); }}>
                            Cut
                        </ContextMenuItem>
                    </div>
                )}

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

            {shouldShowFooter && (
                <div style={{ 
                    height: '24px', 
                    backgroundColor: isDark ? '#18181b' : '#f8fafc', 
                    borderTop: isDark ? '1px solid #27272a' : '1px solid #e2e8f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0 15px', 
                    fontSize: '11px', 
                    color: isDark ? '#a1a1aa' : '#64748b',
                    userSelect: 'none'
                }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div>Page {stats.pages} of {stats.pages}</div>
                        <div>{stats.words} words</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => { const z = Math.max(25, zoom - 10); setZoom(z); editor?.setScale(z/100); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', color: 'inherit' }}>-</button>
                        <input 
                            type="range" min="25" max="300" value={zoom} 
                            onChange={(e) => { const z = parseInt(e.target.value); setZoom(z); editor?.setScale(z/100); }}
                            style={{ width: '100px', height: '2px', cursor: 'pointer' }}
                        />
                        <button onClick={() => { const z = Math.min(300, zoom + 10); setZoom(z); editor?.setScale(z/100); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', color: 'inherit' }}>+</button>
                        <div style={{ width: '35px', textAlign: 'right' }}>{zoom}%</div>
                    </div>
                </div>
            )}


            <style>{`
                @keyframes caret-blink { from { opacity: 1; } to { opacity: 0; } }
                .editor-page-wrapper { transition: transform 0.2s; }
                .editor-page { transition: box-shadow 0.2s; }
                .editor-page:hover { box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23) !important; }
                .ketikin-editor-scroll::-webkit-scrollbar { width: 8px; }
                .ketikin-editor-scroll::-webkit-scrollbar-track { background: transparent; }
                .ketikin-editor-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
                .ketikin-editor-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
            `}</style>

        </div>
    );
};

const ContextMenuItem: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => {
    const [hover, setHover] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                color: '#e5e5ea',
                cursor: 'pointer',
                outline: 'none',
                fontSize: '12px',
                backgroundColor: hover ? '#2c2c2e' : 'transparent',
            }}
        >
            {children}
        </button>
    );
};

export default KetikinEditor;
export { KetikinEditor };
export type { KetikinEditorProps };
