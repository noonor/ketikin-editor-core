# Changelog — Ketikin Editor Core

All notable changes to the **Ketikin Editor Core** canvas library are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Interactive Canvas-based Table support (insert rows/columns, cell merge, border styling).
- Automated Header & Footer page numbering systems (Roman numerals & Arabic pagination).
- Automatic bulleted and numbered lists with nested indentation levels.
- Collaboration tools, margin annotations, and inline commenting.
- Automated academic manuscript beautifier conforming to university formatting guidelines.

---

## [0.1.1-beta] - 2026-04-05

### Added
- **Tab Stop Support**: Full Tab key navigation and configurable tab stops for standard academic paragraph indentation.
- **Ruler & Margin Measurement**: High-precision A4 margin boundary calculations for Indonesian thesis standards (4-4-3-3 cm).

### Changed
- **DocxImporter**: Fully replaced `mammoth.js` with a Direct OpenXML Parser (`JSZip` + native `DOMParser`) targeting `word/document.xml`.
  - Resolved missing *Justified* text alignments when importing `.docx` files.
  - Preserved headings, font sizes, colors, and line spacings without fidelity loss.
- Updated default page layout: standard A4 sizing and academic margin specifications.
- Updated default font family and canvas font metrics calibration.

### Removed
- Completely removed `mammoth` dependency.

### Fixed
- Fixed responsive font size calculations within canvas bounding containers.
- Corrected cursor coordinate synchronization across multi-page boundaries.

---

## [0.1.0-beta] - 2026-03-28

### Added
- **Canvas-Based Rendering Engine**: High-performance pure HTML5 Canvas text and shape renderer without `contenteditable` DOM dependencies.
- **Deterministic Multi-Page Pagination**: Dynamic A4 page distribution with automatic line height and page break computation.
- **Multi-Format File Importer**:
  - Importers for DOCX, PDF (via `pdfjs-dist`), HTML, TXT, RTF, and XML.
- **Multi-Format File Exporter**:
  - PDF and DOCX document export pipelines.
- **Rich Text & Formatting Core**:
  - Headings 1–6, Bold, Italic, Underline, Font Family, Font Size, Line Spacing, Before/After Spacing, Text Alignment (Left, Center, Right, Justify).
- **Image Insertion**: Image embedding, resize handles, and inline flow positioning.
- **UI Ribbon Menu**: Modular React ribbon bar (Home, Insert, Layout) bound directly to core editor commands.
- **Document Statistics & Navigation**:
  - Smooth Zoom in / Zoom out slider controls.
  - Multi-page side-by-side or stacked views.
  - Live Word counter and Page indicator.
- **History Manager**: Robust snapshot-based Undo and Redo engine.