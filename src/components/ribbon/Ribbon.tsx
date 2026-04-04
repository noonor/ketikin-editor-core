import React, { useState, useRef } from 'react';
import { Editor } from '../../core/Editor';
import {
    IconBold, IconItalic, IconUnderline, IconUndo, IconRedo, IconExport,
    IconPlus, IconMinus, IconAlignLeft, IconAlignCenter, IconAlignRight, IconAlignJustify,
    IconPaste, IconCut, IconCopy, IconFormatPainter, IconStrikethrough, IconSubscript,
    IconSuperscript, IconHighlight, IconFontColor, IconBulletList, IconNumberList,
    IconLineSpacing, IconFind, IconReplace, IconSelect, IconClearFormatting, IconChevronDown,
    IconBrightness, IconColor, IconArtistic, IconChange, IconRemoveBG, IconPosition, IconWrap,
    IconBringForward, IconSendBackward, IconRotate, IconCrop, IconBorder, IconEffects, IconLayoutOptions
} from '../common/Icons';
import {
    ribbonGroupStyle, ribbonBtnStyle, ribbonLabelStyle, ribbonBigBtnStyle,
    ribbonSmallBtnStyle, ribbonToolBtnStyle, ribbonDropdownStyle, galleryItemStyle
} from '../common/Styles';

interface RibbonProps {
    editor: Editor | null;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLayoutClick: () => void;
    onImportClick: () => void;
    onImageInsertClick?: () => void;
}

// ── Small inline components ────────────────────────────────────────────────

const FontFamilyDropdown: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [open, setOpen] = useState(false);
    const [custom, setCustom] = useState('');
    const families = ['Arial', 'Calibri', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Comic Sans MS'];
    const current = (editor?.getActiveFormats() as any)?.fontFamily || 'Arial';
    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{ ...ribbonDropdownStyle, minWidth: '110px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                className="ketikin-editor-ui"
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{current}</span>
                <IconChevronDown />
            </div>
            {open && (
                <div className="ketikin-editor-ui" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, backgroundColor: 'white', border: '1px solid #d2d0ce', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '160px' }}>
                    <div style={{ padding: '4px' }}>
                        <input
                            value={custom}
                            onChange={e => setCustom(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { editor?.setFontFamily(custom.trim()); setOpen(false); setCustom(''); } }}
                            placeholder="Custom font..."
                            style={{ width: '100%', fontSize: '12px', padding: '4px', border: '1px solid #d2d0ce', borderRadius: '3px', boxSizing: 'border-box' }}
                        />
                    </div>
                    {families.map(f => (
                        <div
                            key={f}
                            onClick={() => { editor?.setFontFamily(f); setOpen(false); }}
                            style={{ padding: '5px 10px', fontSize: '13px', fontFamily: f, cursor: 'pointer', backgroundColor: current === f ? '#e8f0fe' : 'white' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f2ff')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = current === f ? '#e8f0fe' : 'white')}
                        >{f}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FontSizeInput: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState('');
    const current = (editor?.getActiveFormats() as any)?.fontSize || 16;
    return editing ? (
        <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => { const n = parseInt(val); if (!isNaN(n) && n > 0) editor?.setFontSize(n); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { const n = parseInt(val); if (!isNaN(n) && n > 0) editor?.setFontSize(n); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
            style={{ ...ribbonDropdownStyle, width: '40px', textAlign: 'center' }}
            className="ketikin-editor-ui"
        />
    ) : (
        <div onClick={() => { setVal(String(current)); setEditing(true); }} style={{ ...ribbonDropdownStyle, width: '40px', textAlign: 'center', cursor: 'pointer' }} className="ketikin-editor-ui">
            {current}
        </div>
    );
};

const ColorPicker: React.FC<{ label: string; current?: string; onPick: (c: string) => void; icon: React.ReactNode }> = ({ current, onPick, icon }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
                onClick={() => ref.current?.click()}
                style={{ ...ribbonToolBtnStyle, position: 'relative' }}
                className="ketikin-editor-ui"
                title="Pick color"
            >
                {icon}
                <div style={{ height: '3px', background: current || '#000000', marginTop: '1px', borderRadius: '1px' }} />
            </button>
            <input
                ref={ref}
                type="color"
                value={current || '#000000'}
                onChange={e => onPick(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                className="ketikin-editor-ui"
            />
        </div>
    );
};

const LineSpacingMenu: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [open, setOpen] = useState(false);
    const options = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={ribbonToolBtnStyle} title="Line Spacing" className="ketikin-editor-ui"><IconLineSpacing /></button>
            {open && (
                <div className="ketikin-editor-ui" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, backgroundColor: 'white', border: '1px solid #d2d0ce', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '120px' }}>
                    {options.map(o => (
                        <div key={o} onClick={() => { editor?.setLineSpacing(o); setOpen(false); }}
                            style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f2f1')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                        >{o.toFixed(2)}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CaseMenu: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [open, setOpen] = useState(false);
    const cases: { label: string; mode: 'upper' | 'lower' | 'title' | 'sentence' | 'toggle' }[] = [
        { label: 'UPPERCASE', mode: 'upper' },
        { label: 'lowercase', mode: 'lower' },
        { label: 'Title Case', mode: 'title' },
        { label: 'Sentence case', mode: 'sentence' },
        { label: 'tOGGLE cASE', mode: 'toggle' },
    ];
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={ribbonToolBtnStyle} title="Change Case" className="ketikin-editor-ui"><IconChange /></button>
            {open && (
                <div className="ketikin-editor-ui" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, backgroundColor: 'white', border: '1px solid #d2d0ce', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '150px' }}>
                    {cases.map(c => (
                        <div key={c.mode} onClick={() => { editor?.changeCase(c.mode); setOpen(false); }}
                            style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f2f1')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                        >{c.label}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FindReplacePanel: React.FC<{ editor: Editor | null; onClose: () => void }> = ({ editor, onClose }) => {
    const [findTerm, setFindTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [msg, setMsg] = useState('');

    const doFind = () => {
        if (!findTerm) return;
        const found = editor?.findNext(findTerm);
        setMsg(found ? '' : 'Not found');
    };
    const doReplace = () => {
        if (!findTerm) return;
        const count = editor?.replaceText(findTerm, replaceTerm) ?? 0;
        setMsg(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);
    };

    return (
        <div className="ketikin-editor-ui" style={{ position: 'fixed', top: '180px', right: '20px', zIndex: 10000, background: 'white', border: '1px solid #d2d0ce', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '16px', minWidth: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Find & Replace</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#605e5c' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={findTerm} onChange={e => { setFindTerm(e.target.value); setMsg(''); }} placeholder="Find..." onKeyDown={e => e.key === 'Enter' && doFind()}
                    style={{ padding: '6px 10px', border: '1px solid #d2d0ce', borderRadius: '4px', fontSize: '13px' }} />
                <input value={replaceTerm} onChange={e => setReplaceTerm(e.target.value)} placeholder="Replace with..." onKeyDown={e => e.key === 'Enter' && doReplace()}
                    style={{ padding: '6px 10px', border: '1px solid #d2d0ce', borderRadius: '4px', fontSize: '13px' }} />
                {msg && <div style={{ fontSize: '12px', color: msg.startsWith('Replaced') ? '#107c10' : '#a4262c' }}>{msg}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={doFind} style={{ flex: 1, padding: '6px', background: '#f3f2f1', border: '1px solid #d2d0ce', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Find Next</button>
                    <button onClick={doReplace} style={{ flex: 1, padding: '6px', background: '#185abd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Replace All</button>
                </div>
            </div>
        </div>
    );
};

// ── Main Ribbon ────────────────────────────────────────────────────────────

export const Ribbon: React.FC<RibbonProps> = ({ editor, activeTab, setActiveTab, onLayoutClick, onImportClick, onImageInsertClick }) => {
    const [showFindReplace, setShowFindReplace] = useState(false);
    const fmt = (editor?.getActiveFormats() as any) || {};
    const activeBtn = (active: boolean) => ({ ...ribbonToolBtnStyle, backgroundColor: active ? '#cde6ff' : 'transparent', fontWeight: active ? 600 : 400 });

    const renderHomeTab = () => (
        <div style={{ display: 'flex', gap: '20px', padding: '10px', height: '110px' }}>

            {/* ── Clipboard ── */}
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <button
                        onClick={() => editor?.pasteFromClipboard()}
                        style={ribbonBigBtnStyle}
                        title="Paste (Ctrl+V)"
                        className="ketikin-editor-ui"
                    >
                        <IconPaste /><div style={{ marginTop: '4px' }}>Paste</div>
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button onClick={() => editor?.cutToClipboard()} style={ribbonSmallBtnStyle} title="Cut (Ctrl+X)" className="ketikin-editor-ui"><IconCut /> Cut</button>
                        <button onClick={() => editor?.copyToClipboard()} style={ribbonSmallBtnStyle} title="Copy (Ctrl+C)" className="ketikin-editor-ui"><IconCopy /> Copy</button>
                        <button onClick={() => editor?.clearFormatting()} style={ribbonSmallBtnStyle} title="Format Painter / Clear format" className="ketikin-editor-ui"><IconFormatPainter /> Format Painter</button>
                    </div>
                </div>
                <div style={ribbonLabelStyle}>Clipboard</div>
            </div>

            {/* ── Font ── */}
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                    <FontFamilyDropdown editor={editor} />
                    <FontSizeInput editor={editor} />
                    <button onClick={() => editor?.setFontSize((fmt.fontSize || 16) + 1)} style={ribbonToolBtnStyle} title="Increase Font Size" className="ketikin-editor-ui"><IconPlus /></button>
                    <button onClick={() => editor?.setFontSize(Math.max(1, (fmt.fontSize || 16) - 1))} style={ribbonToolBtnStyle} title="Decrease Font Size" className="ketikin-editor-ui"><IconMinus /></button>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => editor?.toggleFormat('bold')}          style={activeBtn(!!fmt.bold)}          title="Bold (Ctrl+B)"    className="ketikin-editor-ui"><IconBold /></button>
                    <button onClick={() => editor?.toggleFormat('italic')}        style={activeBtn(!!fmt.italic)}        title="Italic (Ctrl+I)"  className="ketikin-editor-ui"><IconItalic /></button>
                    <button onClick={() => editor?.toggleFormat('underline')}     style={activeBtn(!!fmt.underline)}     title="Underline (Ctrl+U)" className="ketikin-editor-ui"><IconUnderline /></button>
                    <button onClick={() => editor?.toggleFormat('strikethrough')} style={activeBtn(!!fmt.strikethrough)} title="Strikethrough"    className="ketikin-editor-ui"><IconStrikethrough /></button>
                    <button onClick={() => editor?.toggleFormat('subscript')}     style={activeBtn(!!fmt.subscript)}     title="Subscript"        className="ketikin-editor-ui"><IconSubscript /></button>
                    <button onClick={() => editor?.toggleFormat('superscript')}   style={activeBtn(!!fmt.superscript)}   title="Superscript"      className="ketikin-editor-ui"><IconSuperscript /></button>
                    <CaseMenu editor={editor} />
                    <button onClick={() => editor?.clearFormatting()} style={ribbonToolBtnStyle} title="Clear Formatting" className="ketikin-editor-ui"><IconClearFormatting /></button>
                    <ColorPicker label="Highlight" current={fmt.backgroundColor} onPick={c => editor?.setHighlightColor(c)} icon={<IconHighlight />} />
                    <ColorPicker label="Font Color" current={fmt.color}          onPick={c => editor?.setFontColor(c)}      icon={<IconFontColor />} />
                </div>
                <div style={ribbonLabelStyle}>Font</div>
            </div>

            {/* ── Paragraph ── */}
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <button onClick={() => editor?.toggleList('bullet')} style={activeBtn(fmt.listType === 'bullet')} title="Bullet List" className="ketikin-editor-ui"><IconBulletList /></button>
                    <button onClick={() => editor?.toggleList('number')} style={activeBtn(fmt.listType === 'number')} title="Numbered List" className="ketikin-editor-ui"><IconNumberList /></button>
                    <button onClick={() => editor?.setAlignment('left')}    style={activeBtn(fmt.align === 'left' || !fmt.align)}    title="Align Left"    className="ketikin-editor-ui"><IconAlignLeft /></button>
                    <button onClick={() => editor?.setAlignment('center')}  style={activeBtn(fmt.align === 'center')}  title="Align Center"  className="ketikin-editor-ui"><IconAlignCenter /></button>
                    <button onClick={() => editor?.setAlignment('right')}   style={activeBtn(fmt.align === 'right')}   title="Align Right"   className="ketikin-editor-ui"><IconAlignRight /></button>
                    <button onClick={() => editor?.setAlignment('justify')} style={activeBtn(fmt.align === 'justify')} title="Justify"       className="ketikin-editor-ui"><IconAlignJustify /></button>
                    <LineSpacingMenu editor={editor} />
                </div>
                <div style={ribbonLabelStyle}>Paragraph</div>
            </div>

            {/* ── Styles ── */}
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {([
                        { label: 'Normal',   style: 'Normal',   preview: { fontSize: '14px', fontWeight: 'normal' } },
                        { label: 'No Spacing', style: 'NoSpacing', preview: { fontSize: '14px', fontWeight: 'normal' } },
                        { label: 'Heading 1', style: 'Heading1', preview: { fontSize: '14px', fontWeight: 'bold', color: '#2e74b5' } },
                        { label: 'Heading 2', style: 'Heading2', preview: { fontSize: '13px', fontWeight: 'bold', color: '#2e74b5' } },
                    ] as const).map(s => (
                        <div
                            key={s.label}
                            onClick={() => editor?.applyStyle(s.style)}
                            style={{ ...galleryItemStyle, cursor: 'pointer' }}
                            title={`Apply ${s.label} style`}
                            className="ketikin-editor-ui"
                        >
                            <div style={{ fontSize: '9px', color: '#666', borderBottom: '1px solid #efefef', marginBottom: '4px' }}>{s.label}</div>
                            <div style={s.preview}>AaBbCc</div>
                        </div>
                    ))}
                </div>
                <div style={ribbonLabelStyle}>Styles</div>
            </div>

            {/* ── Editing ── */}
            <div style={ribbonGroupStyle}>
                <button onClick={() => setShowFindReplace(true)}  style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconFind />    Find</button>
                <button onClick={() => setShowFindReplace(true)}  style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconReplace /> Replace</button>
                <button onClick={() => editor?.selectAll()}        style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconSelect />  Select All</button>
                <div style={ribbonLabelStyle}>Editing</div>
            </div>
        </div>
    );

    const renderPictureTab = () => (
        <div style={{ display: 'flex', gap: '20px', padding: '10px', height: '110px' }}>
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <button style={ribbonBigBtnStyle} className="ketikin-editor-ui"><IconRemoveBG /><div style={{ marginTop: '4px' }}>Remove Background</div></button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconBrightness /> Corrections</button>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconColor /> Color</button>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconArtistic /> Artistic Effects</button>
                    </div>
                </div>
                <div style={ribbonLabelStyle}>Adjust</div>
            </div>
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map(i => <div key={i} style={galleryItemStyle} />)}
                </div>
                <div style={ribbonLabelStyle}>Picture Styles</div>
            </div>
            <div style={ribbonGroupStyle}>
                <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconBorder /> Picture Border</button>
                <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconEffects /> Picture Effects</button>
                <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconLayoutOptions /> Picture Layout</button>
                <div style={ribbonLabelStyle}>Styles</div>
            </div>
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconPosition /> Position</button>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconWrap /> Wrap Text</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconBringForward /> Bring Forward</button>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconSendBackward /> Send Backward</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconSelect /> Selection Pane</button>
                        <button onClick={() => editor?.rotateSelectedElement(90)} style={ribbonSmallBtnStyle} className="ketikin-editor-ui"><IconRotate /> Rotate</button>
                    </div>
                </div>
                <div style={ribbonLabelStyle}>Arrange</div>
            </div>
            <div style={ribbonGroupStyle}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button style={{ ...ribbonBigBtnStyle, width: '50px' }} className="ketikin-editor-ui"><IconCrop /><div style={{ marginTop: '4px' }}>Crop</div></button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={ribbonDropdownStyle}>Height: 4.5 cm</div>
                        <div style={ribbonDropdownStyle}>Width: 6.2 cm</div>
                    </div>
                </div>
                <div style={ribbonLabelStyle}>Size</div>
            </div>
        </div>
    );

    const renderFileTab = () => (
        <div style={{ display: 'flex', gap: '20px', padding: '10px', height: '110px' }}>
            <div style={ribbonGroupStyle}>
                <button onClick={onImportClick} style={ribbonBigBtnStyle} className="ketikin-editor-ui"><IconPlus /><div style={{ marginTop: '4px' }}>Open</div></button>
            </div>
            <div style={ribbonGroupStyle}>
                <button onClick={() => (window as any).ketikinSave?.()} style={ribbonBigBtnStyle} className="ketikin-editor-ui"><IconExport /><div style={{ marginTop: '4px' }}>Save</div></button>
            </div>
        </div>
    );

    const tabs = ['File', 'Home', 'Insert', 'Draw', 'Design', 'Layout', 'References', 'Mailings', 'Review', 'View', 'Help'];
    if (editor?.selectedElementIndex !== null && editor?.elements[editor.selectedElementIndex!]?.elementType === 'image') {
        tabs.push('Picture Format');
    }

    return (
        <>
            {showFindReplace && <FindReplacePanel editor={editor} onClose={() => setShowFindReplace(false)} />}

            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #d2d0ce', flexShrink: 0, backgroundColor: '#f3f2f1' }}>
                {/* Title bar */}
                <div style={{ height: '32px', backgroundColor: '#185abd', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '15px' }}>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginRight: '20px' }}>Ketikin Editor</div>
                    <button onClick={() => editor?.undo()} style={ribbonBtnStyle} title="Undo (Ctrl+Z)" className="ketikin-editor-ui"><IconUndo /></button>
                    <button onClick={() => editor?.redo()} style={ribbonBtnStyle} title="Redo (Ctrl+Y)" className="ketikin-editor-ui"><IconRedo /></button>
                    <button onClick={() => (window as any).ketikinSave?.()} style={ribbonBtnStyle} title="Save (Ctrl+S)" className="ketikin-editor-ui"><IconExport /></button>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', backgroundColor: '#f3f2f1', padding: '0 5px', height: '30px', alignItems: 'center' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="ketikin-editor-ui"
                            style={{
                                background: 'transparent', border: 'none',
                                borderBottom: activeTab === tab ? '2px solid #185abd' : '2px solid transparent',
                                color: activeTab === tab ? '#185abd' : '#323130',
                                padding: '5px 12px', fontSize: '13px', cursor: 'pointer', height: '30px',
                                fontWeight: activeTab === tab ? '600' : 'normal',
                                backgroundColor: activeTab === tab ? 'white' : 'transparent', outline: 'none'
                            }}
                        >{tab}</button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ backgroundColor: 'white', height: '110px' }}>
                    {activeTab === 'File'           && renderFileTab()}
                    {activeTab === 'Home'           && renderHomeTab()}
                    {activeTab === 'Insert'         && (
                        <div style={{ display: 'flex', gap: '20px', padding: '10px', height: '110px' }}>
                            <div style={ribbonGroupStyle}>
                                <button onClick={onImportClick} style={ribbonBigBtnStyle} title="Import Docx/PDF/TXT" className="ketikin-editor-ui"><IconPlus /><div style={{ marginTop: '4px' }}>Import File</div></button>
                            </div>
                            <div style={ribbonGroupStyle}>
                                <button onClick={onImageInsertClick} style={ribbonBigBtnStyle} title="Insert Image" className="ketikin-editor-ui"><IconPlus /><div style={{ marginTop: '4px' }}>Insert Image</div></button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Picture Format' && renderPictureTab()}
                    {activeTab === 'Layout'         && (
                        <div style={{ padding: '10px' }}>
                            <button onClick={onLayoutClick} style={ribbonBigBtnStyle} className="ketikin-editor-ui"><IconPosition /><div>Page Setup</div></button>
                        </div>
                    )}
                    {!['File', 'Home', 'Picture Format', 'Insert', 'Layout'].includes(activeTab) && (
                        <div style={{ padding: '20px', color: '#999', fontSize: '13px' }}>{activeTab} tab content (placeholder)</div>
                    )}
                </div>
            </div>
        </>
    );
};
