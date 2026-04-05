# Changelog

## [Unreleased]

### Changed
- DocxImporter: Ganti mammoth.js dengan 
  XML parser langsung (JSZip + DOMParser)
  → Fix alignment 'justified' tidak ter-apply
  → Fix formatting hilang saat open file

### Removed
- mammoth.js dependency (dihapus total)

## [0.1.0] - 2026-03-28

### Added
- Canvas-based rendering engine
- Pagination (multi-page A4)
- Open file: DOCX, PDF, HTML, TXT, RTF, XML
- Export PDF & DOCX
- Zoom in/out, multiple page view
- Bold, Italic, Underline, Heading
- Insert gambar
- Word count, page count
- History (undo/redo)

## [0.1.1] - 2026-04-05

### Added
- Tab Stop Support

## [0.1.1] - 2026-04-04

### Fixed
- Responsive font size value inside box
- Update default font family and font size.
- Update default page layout: size and margin.

---

## Cara Pakainya ke Cursor/Antigravity

Setiap kali mulai sesi baru, tambahkan di awal prompt:
```
Baca CONTEXT.md dan RULES.md dulu
sebelum melakukan apapun.
```

Atau lebih eksplisit:
```
Ini adalah project Ketikin Editor Core.
Baca CONTEXT.md untuk memahami arsitektur.
Baca RULES.md untuk aturan coding.
Setelah baca keduanya, baru kerjakan task berikut:

[task kamu di sini]