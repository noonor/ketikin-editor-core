# Ketikin Editor Core — AI Context

## Apa ini?
Canvas-based document editor engine untuk Indonesia.
Dibuat dari scratch tanpa framework editor.
Terinspirasi dari OnlyOffice.
Dirilis open source di GitHub.

## Dipakai oleh
KetikinAI — platform penulisan akademik Indonesia.

## Tech Stack
- TypeScript strict
- Canvas API untuk rendering
- JSZip + DOMParser untuk import DOCX
- pdfjs-dist untuk import PDF
- Vite sebagai bundler
- React wrapper tersedia (ReactWrapper.tsx)

## Struktur Folder
```
src/
├── components/
│   ├── common/
│   ├── editor/
│   ├── layout/
│   └── ribbon/
├── core/
│   ├── render/
│   ├── transform/
│   ├── Editor.ts
│   ├── HistoryManager.ts
│   └── InputHandler.ts
├── importers/
│   ├── DocxImporter.ts   ← XML parser (JSZip, NO mammoth)
│   ├── FileImporter.ts   ← orchestrator
│   ├── HtmlImporter.ts
│   └── PdfImporter.ts
└── types/
    └── index.ts          ← DocElement, schema, types
```

## Data Model Utama
DocElement — unit terkecil konten:
- text: string
- fontSize: number (px)
- color: string (hex)
- bold, italic, underline: boolean
- align: 'left'|'center'|'right'|'justify'
- lineHeight: number (multiplier)
- spacingBefore, spacingAfter: number (px)
- headingLevel: 1-6
- elementType: 'text'|'image'
- imageUrl, imageWidth, imageHeight
- listType: 'bullet'|'number'
- listLevel: number

KetikinDocument (schema lengkap):
- metadata, setup, header, footer
- body: BlockElement[]
- annotations, trackChanges

## Fitur yang Sudah Jalan
- Canvas rendering engine
- Heading, Bold, Italic, Underline
- Styling & formatting
- Layout halaman A4
- Open file (DOCX, PDF, HTML, TXT, RTF)
- Save
- Insert gambar
- Next page & pagination
- Export
- Zoom in/out
- Multiple page view
- Page counter
- Total word count

## Fitur Sedang Dikerjakan
- Fix open file format (text-align dari DOCX)
- Parse XML langsung tanpa mammoth

## Fitur Planned
- Tabel
- Penomoran halaman (header/footer)
- List (bullet & number)
- Track changes
- Komentar/anotasi
- Beautifier (format otomatis tanpa AI)

## Tools Config (untuk KetikinAI)
Editor bisa dikonfigurasi via JSON:
{
  "tools": {
    "include": ["bold", "italic", "fontSize"],
    "exclude": ["table", "chart"]
  },
  "page": {
    "size": "A4",
    "margin": { "top": 4, "left": 4,
                "right": 2.5, "bottom": 2.5 }
  }
}
AI Agent KetikinAI yang set config ini via JSON.

## Keputusan Arsitektur Penting
1. Canvas-based, BUKAN DOM/TipTap/Quill
   → Full control pagination
   → Tidak tergantung library editor lain

2. Import DOCX: parse XML langsung (JSZip)
   → Mammoth SUDAH DIHAPUS
   → Lebih akurat, tidak ada formatting hilang

3. DocElement[] sebagai format internal
   → Flat array, mudah di-render ke canvas
   → KetikinDocument untuk persist ke disk

## Yang TIDAK BOLEH Dilakukan
- Jangan pakai mammoth (sudah dihapus)
- Jangan ganti canvas dengan DOM rendering
- Jangan install library editor (TipTap, Quill, dll)
- Jangan ubah DocElement interface di types/index.ts
  tanpa diskusi — breaking change ke semua importer