import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '../../core/Editor';
import {
    IconBold, IconItalic, IconUnderline, IconUndo, IconRedo, IconExport,
    IconPlus, IconAlignLeft, IconAlignCenter, IconAlignRight, IconAlignJustify,
    IconStrikethrough, IconSubscript,
    IconSuperscript, IconHighlight, IconFontColor,
    IconFind, IconClearFormatting, IconChevronDown,
    IconPosition
} from '../common/Icons';

interface RibbonProps {
    editor: Editor | null;
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    onLayoutClick: () => void;
    onImportClick: () => void;
    onImageInsertClick?: () => void;
    theme?: 'light' | 'dark';
}

export const Ribbon: React.FC<RibbonProps> = ({ 
    editor, 
    onLayoutClick, 
    onImportClick, 
    onImageInsertClick,
    theme = 'dark'
}) => {
    const isDark = theme !== 'light';
    // Active Balloon Popover State: null | 'font' | 'paragraph' | 'insert' | 'layout' | 'find'
    const [activeBalloon, setActiveBalloon] = useState<string | null>(null);

    const toolbarRef = useRef<HTMLDivElement>(null);

    const fmt = (editor?.getActiveFormats() as any) || {};

    // Close balloon when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                setActiveBalloon(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleBalloon = (name: string) => {
        setActiveBalloon(prev => prev === name ? null : name);
    };

    // Color pickers refs
    const fontColorRef = useRef<HTMLInputElement>(null);
    const highlightColorRef = useRef<HTMLInputElement>(null);

    const fontFamilies = [
        'Arial', 'Calibri', 'Times New Roman', 'Georgia', 'Inter', 
        'Roboto', 'Courier New', 'Verdana', 'Trebuchet MS'
    ];
    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];
    const lineSpacings = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

    const currentFont = fmt.fontFamily || 'Calibri';
    const currentSize = fmt.fontSize || 12;

    const popoverStyle = getBalloonPopoverStyle(isDark);
    const itemBtnStyle = getBalloonItemBtnStyle(isDark);
    const sepStyle = getSeparatorStyle(isDark);
    const btnStyle = (active: boolean) => balloonBtnStyle(active, isDark);
    const trigStyle = (active: boolean) => balloonTriggerStyle(active, isDark);


    return (
        <div 
            ref={toolbarRef}
            className="ketikin-editor-ui sticky-balloon-toolbar"
            style={{ 
                width: '100%',
                backgroundColor: isDark ? 'rgba(18, 18, 22, 0.88)' : 'rgba(255, 255, 255, 0.94)', 
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '16px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                userSelect: 'none',
                boxShadow: isDark 
                  ? '0 12px 36px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                  : '0 10px 30px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                backdropFilter: 'blur(16px)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: isDark ? '#ffffff' : '#0f172a'
            }}
            onMouseDown={e => {
                if (!(e.target as HTMLElement).closest('input')) {
                    e.preventDefault();
                }
            }}
        >

            {/* 1. History Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                    onClick={() => editor?.undo()}
                    style={btnStyle(false)}
                    title="Undo (Ctrl+Z)"
                >
                    <IconUndo />
                </button>
                <button
                    onClick={() => editor?.redo()}
                    style={btnStyle(false)}
                    title="Redo (Ctrl+Y)"
                >
                    <IconRedo />
                </button>
            </div>

            <div style={sepStyle} />

            {/* 2. Quick Text Formats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                    onClick={() => editor?.toggleFormat('bold')}
                    style={btnStyle(!!fmt.bold)}
                    title="Tebal / Bold (Ctrl+B)"
                >
                    <IconBold />
                </button>
                <button
                    onClick={() => editor?.toggleFormat('italic')}
                    style={btnStyle(!!fmt.italic)}
                    title="Miring / Italic (Ctrl+I)"
                >
                    <IconItalic />
                </button>
                <button
                    onClick={() => editor?.toggleFormat('underline')}
                    style={btnStyle(!!fmt.underline)}
                    title="Garis Bawah / Underline (Ctrl+U)"
                >
                    <IconUnderline />
                </button>
            </div>

            <div style={sepStyle} />

            {/* 3. Balloon: Font & Typography */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => toggleBalloon('font')}
                    style={trigStyle(activeBalloon === 'font')}
                    title="Pengaturan Font & Tipografi"
                >
                    <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#a78bfa' : '#4f46e5', marginRight: '4px' }}>A</span>
                    <span style={{ fontSize: '11px', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentFont} ({currentSize})
                    </span>
                    <IconChevronDown />
                </button>

                {activeBalloon === 'font' && (
                    <div style={popoverStyle}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#a1a1aa' : '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Font & Tipografi
                        </div>

                        {/* Font Family List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto', marginBottom: '10px' }}>
                            {fontFamilies.map(font => (
                                <div
                                    key={font}
                                    onClick={() => { editor?.setFontFamily(font); }}
                                    style={{
                                        padding: '5px 8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontFamily: font,
                                        cursor: 'pointer',
                                        backgroundColor: currentFont === font ? (isDark ? '#3b0764' : '#eff6ff') : 'transparent',
                                        color: currentFont === font ? (isDark ? '#e9d5ff' : '#1d4ed8') : (isDark ? '#e4e4e7' : '#1e293b'),
                                        fontWeight: currentFont === font ? '600' : 'normal'
                                    }}
                                >
                                    {font}
                                </div>
                            ))}
                        </div>

                        {/* Font Size Buttons */}
                        <div style={{ fontSize: '11px', color: isDark ? '#71717a' : '#64748b', marginBottom: '4px' }}>Ukuran Font:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                            {fontSizes.map(sz => (
                                <button
                                    key={sz}
                                    onClick={() => editor?.setFontSize(sz)}
                                    style={{
                                        padding: '3px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                                        backgroundColor: currentSize === sz ? (isDark ? '#7c3aed' : '#2563eb') : (isDark ? '#18181b' : '#f1f5f9'),
                                        color: currentSize === sz ? 'white' : (isDark ? 'white' : '#1e293b'),
                                        cursor: 'pointer'
                                    }}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>

                        {/* Font Colors & Effects */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: isDark ? '1px solid #27272a' : '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => fontColorRef.current?.click()}
                                style={itemBtnStyle}
                                title="Warna Teks"
                            >
                                <IconFontColor />
                                <span style={{ fontSize: '11px', marginLeft: '4px' }}>Warna Teks</span>
                            </button>
                            <input
                                ref={fontColorRef}
                                type="color"
                                value={fmt.color || '#000000'}
                                onChange={e => editor?.setFontColor(e.target.value)}
                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                            />

                            <button
                                onClick={() => highlightColorRef.current?.click()}
                                style={itemBtnStyle}
                                title="Warna Sorotan (Highlight)"
                            >
                                <IconHighlight />
                                <span style={{ fontSize: '11px', marginLeft: '4px' }}>Highlight</span>
                            </button>
                            <input
                                ref={highlightColorRef}
                                type="color"
                                value={fmt.backgroundColor || '#ffff00'}
                                onChange={e => editor?.setHighlightColor(e.target.value)}
                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                            <button onClick={() => editor?.toggleFormat('strikethrough')} style={btnStyle(!!fmt.strikethrough)} title="Coret / Strikethrough">
                                <IconStrikethrough />
                            </button>
                            <button onClick={() => editor?.toggleFormat('subscript')} style={btnStyle(!!fmt.subscript)} title="Subscript">
                                <IconSubscript />
                            </button>
                            <button onClick={() => editor?.toggleFormat('superscript')} style={btnStyle(!!fmt.superscript)} title="Superscript">
                                <IconSuperscript />
                            </button>
                            <button onClick={() => editor?.clearFormatting()} style={btnStyle(false)} title="Hapus Format">
                                <IconClearFormatting />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Balloon: Paragraph & Alignment */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => toggleBalloon('paragraph')}
                    style={trigStyle(activeBalloon === 'paragraph')}
                    title="Perataan Paragraf & Jarak Baris"
                >
                    <IconAlignLeft />
                    <span style={{ fontSize: '11px', marginLeft: '4px' }}>Paragraf</span>
                    <IconChevronDown />
                </button>

                {activeBalloon === 'paragraph' && (
                    <div style={popoverStyle}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#a1a1aa' : '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Perataan Teks
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                            <button onClick={() => editor?.setAlignment('left')} style={btnStyle(fmt.align === 'left')} title="Rata Kiri">
                                <IconAlignLeft />
                            </button>
                            <button onClick={() => editor?.setAlignment('center')} style={btnStyle(fmt.align === 'center')} title="Rata Tengah">
                                <IconAlignCenter />
                            </button>
                            <button onClick={() => editor?.setAlignment('right')} style={btnStyle(fmt.align === 'right')} title="Rata Kanan">
                                <IconAlignRight />
                            </button>
                            <button onClick={() => editor?.setAlignment('justify')} style={btnStyle(fmt.align === 'justify')} title="Rata Kiri Kanan (Justify)">
                                <IconAlignJustify />
                            </button>
                        </div>

                        <div style={{ fontSize: '11px', color: isDark ? '#71717a' : '#64748b', marginBottom: '4px' }}>Spasi Baris (Line Spacing):</div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            {lineSpacings.map(sp => (
                                <button
                                    key={sp}
                                    onClick={() => editor?.setLineSpacing(sp)}
                                    style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                                        backgroundColor: fmt.lineHeight === sp ? (isDark ? '#7c3aed' : '#2563eb') : (isDark ? '#18181b' : '#f1f5f9'),
                                        color: fmt.lineHeight === sp ? 'white' : (isDark ? 'white' : '#1e293b'),
                                        cursor: 'pointer'
                                    }}
                                >
                                    {sp.toFixed(2)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Balloon: Insert Menu */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => toggleBalloon('insert')}
                    style={trigStyle(activeBalloon === 'insert')}
                    title="Sisipkan Berkas / Gambar"
                >
                    <IconPlus />
                    <span style={{ fontSize: '11px', marginLeft: '4px' }}>Sisipkan</span>
                    <IconChevronDown />
                </button>

                {activeBalloon === 'insert' && (
                    <div style={popoverStyle}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#a1a1aa' : '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Sisipkan Elemen
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                                onClick={() => { onImportClick(); setActiveBalloon(null); }}
                                style={{ ...itemBtnStyle, justifyContent: 'flex-start', padding: '8px 10px' }}
                            >
                                <IconExport />
                                <div style={{ textAlign: 'left', marginLeft: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>Import Dokumen</div>
                                    <div style={{ fontSize: '10px', color: isDark ? '#71717a' : '#64748b' }}>Docx, PDF, atau TXT</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { onImageInsertClick?.(); setActiveBalloon(null); }}
                                style={{ ...itemBtnStyle, justifyContent: 'flex-start', padding: '8px 10px' }}
                            >
                                <IconPlus />
                                <div style={{ textAlign: 'left', marginLeft: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>Sisipkan Gambar</div>
                                    <div style={{ fontSize: '10px', color: isDark ? '#71717a' : '#64748b' }}>PNG, JPG, WebP</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 6. Balloon: Page Layout */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => { onLayoutClick(); }}
                    style={trigStyle(false)}
                    title="Pengaturan Halaman & Margin"
                >
                    <IconPosition />
                    <span style={{ fontSize: '11px', marginLeft: '4px' }}>Tata Letak</span>
                </button>
            </div>

            {/* 7. Balloon: Search & Replace */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => toggleBalloon('find')}
                    style={trigStyle(activeBalloon === 'find')}
                    title="Cari & Ganti Teks"
                >
                    <IconFind />
                </button>

                {activeBalloon === 'find' && (
                    <FindBalloonPanel editor={editor} isDark={isDark} onClose={() => setActiveBalloon(null)} />
                )}
            </div>
        </div>
    );
};

// ── Find & Replace Mini Balloon ─────────────────────────────────────────────
const FindBalloonPanel: React.FC<{ editor: Editor | null; isDark?: boolean; onClose: () => void }> = ({ editor, isDark = true, onClose }) => {
    const [findTerm, setFindTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [msg, setMsg] = useState('');

    const popoverStyle = getBalloonPopoverStyle(isDark);
    const itemBtnStyle = getBalloonItemBtnStyle(isDark);
    const inStyle = getInputStyle(isDark);

    const doFind = () => {
        if (!findTerm) return;
        const found = editor?.findNext(findTerm);
        setMsg(found ? 'Ditemukan' : 'Tidak ditemukan');
    };

    const doReplace = () => {
        if (!findTerm) return;
        const count = editor?.replaceText(findTerm, replaceTerm) ?? 0;
        setMsg(`Mengganti ${count} kata`);
    };

    return (
        <div style={{ ...popoverStyle, width: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '12px', color: isDark ? '#e4e4e7' : '#1e293b' }}>Cari & Ganti Teks</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: isDark ? '#71717a' : '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                    value={findTerm}
                    onChange={e => { setFindTerm(e.target.value); setMsg(''); }}
                    placeholder="Kata yang dicari..."
                    onKeyDown={e => e.key === 'Enter' && doFind()}
                    style={inStyle}
                />
                <input
                    value={replaceTerm}
                    onChange={e => setReplaceTerm(e.target.value)}
                    placeholder="Ganti dengan..."
                    onKeyDown={e => e.key === 'Enter' && doReplace()}
                    style={inStyle}
                />
                {msg && <div style={{ fontSize: '11px', color: isDark ? '#a78bfa' : '#4f46e5' }}>{msg}</div>}

                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button onClick={doFind} style={{ ...itemBtnStyle, flex: 1, padding: '5px' }}>Cari</button>
                    <button onClick={doReplace} style={{ ...itemBtnStyle, flex: 1, padding: '5px', backgroundColor: isDark ? '#7c3aed' : '#2563eb', color: 'white' }}>Ganti Semua</button>
                </div>
            </div>
        </div>
    );

};

// ── Styles ──────────────────────────────────────────────────────────────────
const balloonBtnStyle = (active: boolean, isDark: boolean = true): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: active ? (isDark ? '#7c3aed' : '#2563eb') : 'transparent',
    color: active ? 'white' : (isDark ? '#a1a1aa' : '#64748b'),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
});

const balloonTriggerStyle = (active: boolean, isDark: boolean = true): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 8px',
    height: '28px',
    borderRadius: '6px',
    border: active 
      ? (isDark ? '1px solid #7c3aed' : '1px solid #3b82f6') 
      : (isDark ? '1px solid #27272a' : '1px solid #e2e8f0'),
    backgroundColor: active 
      ? (isDark ? '#1e1b4b' : '#eff6ff') 
      : (isDark ? '#18181b' : '#f8fafc'),
    color: active 
      ? (isDark ? '#e9d5ff' : '#1d4ed8') 
      : (isDark ? '#d4d4d8' : '#334155'),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
});

const getBalloonPopoverStyle = (isDark: boolean = true): React.CSSProperties => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    zIndex: 99999,
    backgroundColor: isDark ? '#121215' : '#ffffff',
    border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: isDark 
      ? '0 10px 30px -5px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.05)' 
      : '0 10px 30px -5px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
    padding: '12px',
    minWidth: '220px',
    backdropFilter: 'blur(16px)',
    color: isDark ? '#e4e4e7' : '#1e293b',
});

const getBalloonItemBtnStyle = (isDark: boolean = true): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '6px',
    border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#18181b' : '#f8fafc',
    color: isDark ? '#e4e4e7' : '#1e293b',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '11px',
    transition: 'all 0.15s ease',
});

const getSeparatorStyle = (isDark: boolean = true): React.CSSProperties => ({
    width: '1px',
    height: '18px',
    backgroundColor: isDark ? '#27272a' : '#e2e8f0',
    margin: '0 4px',
});

const getInputStyle = (isDark: boolean = true): React.CSSProperties => ({
    padding: '6px 8px',
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    border: isDark ? '1px solid #27272a' : '1px solid #cbd5e1',
    borderRadius: '6px',
    color: isDark ? 'white' : '#0f172a',
    fontSize: '12px',
    outline: 'none',
});

