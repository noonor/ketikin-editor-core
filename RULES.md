# Coding Rules — Ketikin Editor Core

## TypeScript
- Strict mode — tidak ada `any` kecuali
  untuk API eksternal (pdfjs, browser API)
  yang memang tidak punya types
- Semua fungsi harus punya return type explicit
- Tidak ada `as unknown as X` kecuali terpaksa

## File & Folder
- Satu tanggung jawab per file
- Importer baru → buat di src/importers/formats/
- Helper reusable → buat di src/importers/helpers/
- Jangan taruh logic di FileImporter.ts
  (dia hanya orchestrator)

## Perubahan Kode
- Baca file relevan dulu sebelum ubah apapun
- Ubah HANYA file yang disebutkan
- Jangan refactor kode yang tidak rusak
- Jangan install library baru tanpa diskusi
- Satu bug = satu fix = satu PR

## Import DOCX
- Gunakan JSZip untuk buka ZIP
- Gunakan DOMParser untuk parse XML
- Namespace XML: gunakan localName, 
  bukan tagName (untuk handle namespace prefix)
- Unit conversion:
  twips → px: (twips / 1440) * 96
  half-points → px: (hp / 2 / 72) * 96
  EMU → px: (emu / 914400) * 96
- Alignment mapping:
  'both' → 'justify'
  'justified' → 'justify'
  'distribute' → 'justify'

## Canvas Rendering
- Semua rendering via Canvas API
- Tidak ada DOM manipulation untuk render konten
- Pagination dihitung di render engine

## Testing
- Test manual untuk setiap format file
- Minimal test: DOCX dengan justify, center,
  bold, italic, heading
- PDF: pastikan page break muncul antar halaman