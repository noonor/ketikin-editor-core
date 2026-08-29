# Ketikin Editor Core

> **High-Performance Canvas-Based Document Editor Engine for Indonesian & Academic Workflows**  
> *Project Status: **v0.1.1-beta***

---

## 🌟 Overview

**Ketikin Editor Core** is a powerful, lightweight, high-performance rich text document editor engine built from scratch using the **HTML5 Canvas API**. Designed to deliver a desktop-grade word processing experience (inspired by OnlyOffice and Microsoft Word) directly inside the browser, it eliminates the unpredictable formatting quirks and DOM limitations of traditional `contenteditable` or DOM-based editors.

It serves as the core document canvas engine for **[KetikinAI](https://github.com/noonor/ketikin-web)**, providing deterministic A4 pagination, precision academic margins, native DOCX XML parsing, and direct PDF vector import.

---

## 🛠️ Tech Stack

- **Core Engine**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode), Native HTML5 Canvas API
- **Build Tool & Bundler**: [Vite 5](https://vitejs.dev/), `vite-plugin-dts`
- **UI Wrapper**: [React 18 / 19](https://react.dev/) Component Wrapper (`ReactWrapper.tsx`)
- **Document Parsers**:
  - `jszip` + Browser Native `DOMParser` — Direct OpenXML (`word/document.xml`) parser without third-party abstraction loss
  - `pdfjs-dist` — Vector PDF parsing and page-by-page rendering
- **Format Output**: ES Modules (`./dist/ketikin-editor.js`) & UMD (`./dist/ketikin-editor.umd.cjs`) with complete TypeScript declarations (`./dist/index.d.ts`)

---

## ✨ Key Features

### 1. 🎨 Pure Canvas Rendering Engine
- Zero dependency on HTML `contenteditable` or browser DOM formatting quirks.
- Pixel-perfect text rendering, selection highlights, custom cursors, and layout calculation across all modern browsers.

### 2. 📄 Deterministic Multi-Page Pagination (A4 Academic Standard)
- Accurate line-to-index mapping and dynamic text flow distribution across multiple pages.
- Standard Indonesian thesis page layout defaults (A4 size with customizable margins, e.g., Top: 4cm, Left: 4cm, Bottom: 3cm, Right: 3cm).
- Real-time page boundary recalculations upon inserting text, images, or headings.

### 3. 📎 Native DOCX OpenXML Importer (Zero Mammoth Dependency)
- Direct parsing of `.docx` archive structures via `JSZip` and `DOMParser`.
- Preserves paragraph alignments (left, center, right, justified), custom font families, font sizes, line spacings, and text styles without formatting degradation.

### 4. 📑 PDF Import & Direct Editing
- High-fidelity PDF document importing powered by `pdfjs-dist`.
- Extracts and maps vector text elements into editable canvas blocks.

### 5. 📏 Tab Stops, Indentation & Rulers
- Precise Tab Stop navigation and paragraph indentations conforming to Indonesian academic writing standards.

### 6. 📋 Integrated Professional UI Ribbon
- Modular React-based top ribbon menu (Home, Insert, Layout, Page Setup, Export) mapped directly to core editor commands.

### 7. 🖼️ Image & Media Management
- Insert, position, resize, and maintain image inline flow with text wrapping.

### 8. 🔍 Zoom Controls & Real-Time Document Statistics
- Smooth zoom in/out with multi-page side-by-side or stacked view.
- Persistent word counter, character counter, and active page indicator.

### 9. ⚙️ JSON Configurable Toolbar & Tools
- Declarative configuration format allowing AI agents or host applications to dynamically customize available toolbar controls and page setups.

---

## 🏛️ Core Data Model

The editor relies on a clean, flat data structure for high-speed canvas iteration:

### `DocElement` (Smallest Unit of Content)
```typescript
interface DocElement {
  text: string;
  fontSize: number; // in pixels
  fontFamily?: string;
  color: string; // hex color code
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number; // multiplier (e.g. 1.5, 2.0)
  spacingBefore?: number;
  spacingAfter?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  elementType: 'text' | 'image';
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  listType?: 'bullet' | 'number';
  listLevel?: number;
}
```

### Dynamic Configuration Schema
```json
{
  "tools": {
    "include": ["bold", "italic", "underline", "heading", "fontSize", "align", "image"],
    "exclude": ["table", "chart"]
  },
  "page": {
    "size": "A4",
    "margin": {
      "top": 4,
      "left": 4,
      "right": 3,
      "bottom": 3
    }
  }
}
```

---

## 📁 Project Structure

```text
ketikin-editor-core/
├── dev/                  # Development playground & sandbox
├── src/
│   ├── components/       # React UI components
│   │   ├── common/       # Button, Select, Dropdown, Modal primitives
│   │   ├── editor/       # Canvas viewport, overlay, selection box, cursor
│   │   ├── layout/       # Editor shell, status bar, ruler
│   │   └── ribbon/       # Home, Insert, Layout ribbon tabs
│   ├── core/             # Core Canvas Engine
│   │   ├── render/       # Canvas painter, text measurement, pagination
│   │   ├── transform/    # Coordinate transformations & bounding box math
│   │   ├── Editor.ts     # Main Editor coordinator class
│   │   ├── HistoryManager.ts # Undo / Redo state management
│   │   └── InputHandler.ts   # Keyboard, mouse, and touch event handlers
│   ├── importers/        # Document Importers
│   │   ├── DocxImporter.ts   # Direct OpenXML parser (JSZip + DOMParser)
│   │   ├── FileImporter.ts   # Master file import orchestrator
│   │   ├── HtmlImporter.ts   # HTML clipboard & file parser
│   │   └── PdfImporter.ts    # PDF vector parser via pdfjs-dist
│   ├── types/            # TypeScript interfaces & document schemas
│   ├── index.ts          # Package public entry point
│   └── ReactWrapper.tsx  # Ready-to-use React component wrapper
├── vite.config.ts        # Vite library build configuration
├── package.json          # Package manifest & dependencies
└── tsconfig.json         # TypeScript compiler configuration
```

---

## 🚀 Installation & Integration

### 1. Local Workspace / Monorepo Integration
In your host application (`KetikinAI`):
```json
{
  "dependencies": {
    "ketikin-editor-core": "file:../ketikin-editor-core"
  }
}
```

### 2. Basic React Usage
```tsx
import React, { useRef } from 'react';
import { KetikinEditor } from 'ketikin-editor-core';

export function DocumentEditorPage() {
  const editorRef = useRef(null);

  return (
    <div className="w-full h-screen">
      <KetikinEditor
        ref={editorRef}
        initialPageSize="A4"
        initialMargins={{ top: 4, left: 4, right: 3, bottom: 3 }}
        onChange={(doc) => console.log('Document updated:', doc)}
      />
    </div>
  );
}
```

### 3. Development Scripts
```bash
# Install dependencies
npm install

# Start local playground server
npm run dev

# Build bundle into dist/ (ESM + UMD + Types)
npm run build

# Preview build
npm run preview
```

---

## ⚠️ Architectural Constraints

1. **Pure Canvas Rendering**: Do not replace or introduce DOM-based contenteditable wrappers for the main document canvas.
2. **No Mammoth.js**: DOCX imports must exclusively use the native OpenXML DOM parser (`DocxImporter.ts`) to avoid losing academic alignment and styling rules.
3. **Model Integrity**: The `DocElement` contract in `src/types/index.ts` is the foundational protocol for all importers, transformers, and the KetikinAI web client.

---

## 👥 Authors & Acknowledgments

- **Lead Creator & Developer**: [Muhammad Zulki Akbari](https://github.com/mzulkiakbari)
- **AI Pair Programmers & Intelligence**: [Claude](https://anthropic.com/claude) (Anthropic) & [Gemini](https://deepmind.google/technologies/gemini/) (Google)
- **AI Development Tools**: Google Antigravity IDE
- **Organization & Project Management**: [Noonor](https://github.com/noonor)

---

## 📜 Contributing & License

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [RULES.md](RULES.md) before submitting pull requests.

This project is released under the **MIT License**.

