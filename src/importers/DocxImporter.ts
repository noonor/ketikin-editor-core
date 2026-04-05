import JSZip from 'jszip'
import { DocElement } from '../types'

// ============================================
// UNIT CONVERTERS
// ============================================

/** Twips (1/1440 inch) → px (96dpi) */
function twipsToPx(twips: number): number {
  return (twips / 1440) * 96
}

/** Half-points → px (96dpi) */
function halfPtToPx(hp: number): number {
  return hp / 2
}

// /** EMU (English Metric Units) → px */
// function emuToPx(emu: number): number {
//   return (emu / 914400) * 96
// }

// ============================================
// ALIGNMENT MAPPER
// ============================================

type Alignment = 'left' | 'center' | 'right' | 'justify'

function mapAlign(val: string | null): Alignment {
  switch (val) {
    case 'center': return 'center'
    case 'right': return 'right'
    case 'both':
    case 'justified':
    case 'distribute': return 'justify'
    default: return 'left'
  }
}

// ============================================
// XML HELPERS
// ============================================

/**
 * Ambil attribute dengan namespace w:
 * Coba w:name dulu, fallback ke name
 */
function attr(
  el: Element | null,
  name: string
): string | null {
  if (!el) return null
  return el.getAttribute(`w:${name}`)
    ?? el.getAttribute(name)
}

/**
 * querySelector yang handle namespace
 * Coba w\:tag dulu, fallback ke tag
 */
function qs(
  el: Element | Document,
  selector: string
): Element | null {
  try {
    return el.querySelector(
      selector.replace(/(\w+):/g, '$1\\:')
    ) ?? el.querySelector(
      selector.replace(/\w+:/g, '')
    )
  } catch {
    return null
  }
}

function qsa(
  el: Element | Document,
  selector: string
): Element[] {
  try {
    const withNs = el.querySelectorAll(
      selector.replace(/(\w+):/g, '$1\\:')
    )
    if (withNs.length > 0) return Array.from(withNs)
    return Array.from(
      el.querySelectorAll(
        selector.replace(/\w+:/g, '')
      )
    )
  } catch {
    return []
  }
}

// ============================================
// STYLE RESOLVER
// ============================================

interface TabStop {
  position: number;  // px dari margin kiri
  type: 'left' | 'center' | 'right' | 'decimal';
}

interface ResolvedStyle {
  fontFamily?: string
  fontSize?: number   // px
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  color?: string   // hex
  align?: Alignment
  lineHeight?: number   // multiplier
  spacingBefore?: number   // px
  spacingAfter?: number   // px
  firstLineIndent?: number   // px
  indentLeft?: number   // px
  tabStops?: TabStop[]
}


/**
 * Parse formatting properties dari element
 * (bisa dari w:pPr, w:rPr, atau w:style)
 */
function parseProps(el: Element): ResolvedStyle {
  const result: ResolvedStyle = {}

  // --- Paragraph Properties ---
  const pPr = qs(el, 'w:pPr')
  if (pPr) {
    // Alignment
    const jc = qs(pPr, 'w:jc')
    if (jc) result.align = mapAlign(attr(jc, 'val'))

    // Spacing
    const spacing = qs(pPr, 'w:spacing')
    if (spacing) {
      const before = attr(spacing, 'before')
      const after = attr(spacing, 'after')
      const line = attr(spacing, 'line')
      if (before) result.spacingBefore = twipsToPx(+before)
      if (after) result.spacingAfter = twipsToPx(+after)
      if (line) result.lineHeight = +line / 240
    }

    // Indent
    const ind = qs(pPr, 'w:ind')
    if (ind) {
      const left = attr(ind, 'left')
      const firstLine = attr(ind, 'firstLine')
      if (left) result.indentLeft = twipsToPx(+left)
      if (firstLine) result.firstLineIndent = twipsToPx(+firstLine)
    }

    // Tab stops
    const tabs = qs(pPr, 'w:tabs')
    if (tabs) {
      const tabEls = qsa(tabs, 'w:tab')
      result.tabStops = tabEls
        .filter(tab => {
          const val = attr(tab, 'val')
          return val !== 'clear' && val !== 'bar'
        })
        .map(tab => {
          const pos = attr(tab, 'pos')
          const val = attr(tab, 'val') || 'left'
          return {
            position: pos ? twipsToPx(+pos) : 0,
            type: (['left', 'center', 'right', 'decimal'].includes(val) ? val : 'left') as TabStop['type']
          }
        })
        .sort((a, b) => a.position - b.position)
    }
  }

  // --- Run Properties ---
  const rPr = qs(el, 'w:rPr')
  if (rPr) {
    // Font family
    const rFonts = qs(rPr, 'w:rFonts')
    if (rFonts) {
      result.fontFamily =
        attr(rFonts, 'ascii')
        ?? attr(rFonts, 'hAnsi')
        ?? undefined
    }

    // Font size (half-points)
    const sz = qs(rPr, 'w:sz')
    if (sz) {
      const val = attr(sz, 'val')
      if (val) result.fontSize = halfPtToPx(+val)
    }

    // Bold: tag ada = true, val="0" = false
    const b = qs(rPr, 'w:b')
    if (b) result.bold = attr(b, 'val') !== '0'

    // Italic
    const i = qs(rPr, 'w:i')
    if (i) result.italic = attr(i, 'val') !== '0'

    // Underline
    const u = qs(rPr, 'w:u')
    if (u) {
      const uVal = attr(u, 'val')
      result.underline = uVal !== 'none' && uVal !== null
    }

    // Strikethrough
    const strike = qs(rPr, 'w:strike')
    if (strike) result.strikethrough = attr(strike, 'val') !== '0'

    // Color
    const color = qs(rPr, 'w:color')
    if (color) {
      const colorVal = attr(color, 'val')
      if (colorVal && colorVal !== 'auto') {
        result.color = `#${colorVal}`
      }
    }
  }

  return result
}

/**
 * Resolve style chain dari styles.xml
 * Paragraph bisa inherit dari style lain (basedOn)
 */
function resolveStyle(
  styleId: string | null,
  stylesDoc: Document,
  cache: Map<string, ResolvedStyle>
): ResolvedStyle {
  if (!styleId) return {}
  if (cache.has(styleId)) return cache.get(styleId)!

  const style = qs(
    stylesDoc,
    `w:style[w:styleId="${styleId}"]`
  )
  if (!style) return {}

  // Resolve parent dulu
  const basedOn = qs(style, 'w:basedOn')
  const parentId = attr(basedOn, 'val')
  const parentStyle = parentId
    ? resolveStyle(parentId, stylesDoc, cache)
    : {}

  // Parse style ini
  const thisStyle = parseProps(style)

  // Merge: parent → child (child override parent)
  const resolved: ResolvedStyle = {
    ...parentStyle,
    ...thisStyle,
    tabStops: thisStyle.tabStops?.length 
      ? thisStyle.tabStops 
      : parentStyle.tabStops
  }

  cache.set(styleId, resolved)
  return resolved
}

// ============================================
// HEADING DETECTOR
// ============================================

function detectHeadingLevel(
  styleId: string | null,
  styleName: string | null
): 1 | 2 | 3 | 4 | 5 | 6 | undefined {
  const targets = [styleId, styleName]
    .filter(Boolean)
    .map(s => s!.toLowerCase())

  for (const t of targets) {
    // "heading1", "heading 1", "h1"
    const m = t.match(/heading\s*(\d)/)
      ?? t.match(/^h(\d)$/)
    if (m) {
      const level = parseInt(m[1])
      if (level >= 1 && level <= 6)
        return level as 1 | 2 | 3 | 4 | 5 | 6
    }
  }
  return undefined
}

function getEffectiveTabStops(
  tabStops: TabStop[] | undefined,
  defaultTabStop: number = 48 // px, ~1.25cm
): TabStop[] {
  if (tabStops && tabStops.length > 0) {
    return tabStops
  }
  // Generate default tab stops setiap 48px
  // sampai max page width ~700px
  return Array.from(
    { length: Math.floor(700 / defaultTabStop) },
    (_, i) => ({
      position: (i + 1) * defaultTabStop,
      type: 'left' as const
    })
  )
}

// ============================================
// PARAGRAPH PARSER
// ============================================

function parseParagraph(
  p: Element,
  stylesDoc: Document,
  defaultStyle: ResolvedStyle,
  styleCache: Map<string, ResolvedStyle>,
  defaultTabStopPx: number = 48
): DocElement[] {
  const elements: DocElement[] = []

  // 1. Ambil styleId dari paragraf
  const pStyle = qs(p, 'w:pStyle')
  const styleId = attr(pStyle, 'val')

  // Ambil style name dari stylesDoc
  const styleDef = styleId
    ? qs(stylesDoc, `w:style[w:styleId="${styleId}"]`)
    : null
  const styleNameEl = styleDef
    ? qs(styleDef, 'w:name')
    : null
  const styleName = attr(styleNameEl, 'val')

  // 2. Resolve style chain
  const styleProps = resolveStyle(
    styleId, stylesDoc, styleCache
  )

  // 3. Parse inline paragraph props
  const inlineProps = parseProps(p)

  // 4. Merge: default → style → inline
  const paraProps: ResolvedStyle = {
    ...defaultStyle,
    ...styleProps,
    ...inlineProps
  }


  // 5. Detect heading
  const headingLevel = detectHeadingLevel(
    styleId, styleName
  )

  // 6. Heading alignment default = center
  if (headingLevel === 1 && !inlineProps.align) {
    paraProps.align = 'center'
  }

  // 7. Parse semua run (w:r)
  const runs = qsa(p, 'w:r')

  if (runs.length === 0) {
    // Paragraf kosong
    elements.push({
      text: '\n',
      fontSize: paraProps.fontSize || 12,
      color: paraProps.color || '#000000',
      align: paraProps.align,
      lineHeight: paraProps.lineHeight,
      spacingBefore: paraProps.spacingBefore,
      spacingAfter: paraProps.spacingAfter,
      tabStops: getEffectiveTabStops(paraProps.tabStops, defaultTabStopPx),
      headingLevel,
    })
    return elements
  }

  runs.forEach((run, runIdx) => {
    // Skip deleted text (track changes)
    if (run.closest('w\\:del, del')) return

    // Cek page break
    const pageBr = qs(run, 'w:br[w:type="page"]')
      ?? qs(run, 'w:lastRenderedPageBreak')
    if (pageBr) {
      elements.push({
        text: '\f',
        fontSize: 12,
        color: '#000000'
      })
      return
    }

    // Parse run properties
    const runProps = parseProps(run)

    // Merge paragraph + run props
    const finalProps: ResolvedStyle = {
      ...paraProps,
      ...runProps
    }

    // Cek tab character (w:tab)
    let tabText = ''
    const tabs = Array.from(run.childNodes).filter(
      n => (n as Element).localName === 'tab'
    )
    if (tabs.length > 0) {
      tabText = '\t'.repeat(tabs.length)
    }

    // Ambil teks dari w:t
    const tNodes = qsa(run, 'w:t')
    const tText = tNodes
      .map(t => t.textContent || '')
      .join('')

    let text = tabText + tText

    // Cek line break
    const lineBr = qs(run, 'w:br')
    if (lineBr && attr(lineBr, 'type') !== 'page') {
      text += '\n'
    }

    if (!text) return

    // Newline di akhir run terakhir (end of paragraph)
    const isLast = runIdx === runs.length - 1
    if (isLast && !text.endsWith('\n')) {
      text += '\n'
    }

    elements.push({
      text,
      fontSize: finalProps.fontSize || 12,
      color: finalProps.color || '#000000',
      fontFamily: finalProps.fontFamily,
      bold: finalProps.bold || undefined,
      italic: finalProps.italic || undefined,
      underline: finalProps.underline || undefined,
      align: finalProps.align,
      lineHeight: finalProps.lineHeight,
      spacingBefore: runIdx === 0 ? finalProps.spacingBefore : undefined,
      spacingAfter: isLast ? finalProps.spacingAfter : undefined,
      tabStops: getEffectiveTabStops(finalProps.tabStops, defaultTabStopPx),
      headingLevel,
    } as DocElement)
  })

  // Jika semua runs menghasilkan teks kosong
  // (paragraf dengan formatting tapi no text)
  // → tetap push newline untuk preserve spacing
  if (elements.length === 0) {
    elements.push({
      text: '\n',
      fontSize: paraProps.fontSize || 12,
      color: paraProps.color || '#000000',
      align: paraProps.align,
      lineHeight: paraProps.lineHeight,
      spacingBefore: paraProps.spacingBefore,
      spacingAfter: paraProps.spacingAfter,
      tabStops: getEffectiveTabStops(paraProps.tabStops, defaultTabStopPx),
      headingLevel,
    })
  }

  return elements
}

// ============================================
// TABLE PARSER
// ============================================

function parseTable(
  tbl: Element,
  stylesDoc: Document,
  defaultStyle: ResolvedStyle,
  styleCache: Map<string, ResolvedStyle>,
  defaultTabStopPx: number = 48
): DocElement[] {
  const elements: DocElement[] = []
  const rows = qsa(tbl, 'w:tr')

  rows.forEach(row => {
    const cells = qsa(row, 'w:tc')
    cells.forEach((cell, cellIdx) => {
      const paras = qsa(cell, 'w:p')
      paras.forEach(p => {
        const parsed = parseParagraph(
          p, stylesDoc, defaultStyle, styleCache, defaultTabStopPx
        )
        elements.push(...parsed)
      })
      // Tab antar cell
      if (cellIdx < cells.length - 1) {
        elements.push({
          text: '\t',
          fontSize: defaultStyle.fontSize || 12,
          color: '#000000'
        })
      }
    })
    // Newline di akhir row
    elements.push({
      text: '\n',
      fontSize: defaultStyle.fontSize || 12,
      color: '#000000'
    })
  })

  return elements
}

// ============================================
// MAIN DOCX PARSER
// ============================================

export async function importDocx(
  arrayBuffer: ArrayBuffer
): Promise<DocElement[]> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Ambil XML files
    const documentXml = await zip
      .file('word/document.xml')
      ?.async('text')

    const stylesXml = await zip
      .file('word/styles.xml')
      ?.async('text')

    const settingsXml = await zip
      .file('word/settings.xml')
      ?.async('text')

    if (!documentXml) {
      return [{
        text: '⚠ word/document.xml tidak ditemukan\n',
        fontSize: 14,
        color: '#cc0000'
      }]
    }

    // Parse XML
    const parser = new DOMParser()

    let defaultTabStopPx = 48 // default 720 twips

    if (settingsXml) {
      const settingsDoc = parser.parseFromString(
        settingsXml, 'text/xml'
      )
      const defaultTab = qs(
        settingsDoc, 'w:defaultTabStop'
      )
      if (defaultTab) {
        const tabVal = attr(defaultTab, 'val')
        if (tabVal) {
          defaultTabStopPx = twipsToPx(+tabVal)
        }
      }
    }

    const documentDoc = parser.parseFromString(
      documentXml, 'text/xml'
    )
    const stylesDoc = stylesXml
      ? parser.parseFromString(stylesXml, 'text/xml')
      : parser.parseFromString(
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>',
        'text/xml'
      )

    // Cek parse error
    const parseError = documentDoc.querySelector(
      'parsererror'
    )
    if (parseError) {
      return [{
        text: `⚠ XML parse error: ${parseError.textContent
          }\n`,
        fontSize: 14,
        color: '#cc0000'
      }]
    }

    // Ambil document defaults sebagai base style
    const docDefaults = qs(stylesDoc, 'w:docDefaults')
    const defaultStyle: ResolvedStyle = docDefaults
      ? parseProps(docDefaults)
      : {
        fontSize: halfPtToPx(24), // 12pt
        lineHeight: 1.0,
        color: '#000000'
      }

    // Style cache untuk performa
    const styleCache = new Map<string, ResolvedStyle>()

    // Ambil body
    const body = qs(documentDoc, 'w:body')
    if (!body) {
      return [{
        text: '⚠ w:body tidak ditemukan\n',
        fontSize: 14,
        color: '#cc0000'
      }]
    }

    const elements: DocElement[] = []

    // Iterasi semua child di body
    Array.from(body.childNodes).forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return
      const el = node as Element

      // Gunakan localName untuk ignore namespace prefix
      switch (el.localName) {
        case 'p':
          elements.push(
            ...parseParagraph(
              el, stylesDoc, defaultStyle, styleCache, defaultTabStopPx
            )
          )
          break

        case 'tbl':
          elements.push(
            ...parseTable(
              el, stylesDoc, defaultStyle, styleCache, defaultTabStopPx
            )
          )
          break

        case 'sectPr':
          // Section properties — skip untuk sekarang
          // Nanti bisa dipakai untuk margin/header/footer
          break
      }
    })

    return elements.length > 0
      ? elements
      : [{
        text: '⚠ Dokumen kosong atau tidak ada konten\n',
        fontSize: 14,
        color: '#cc0000'
      }]

  } catch (err) {
    console.error('DOCX XML parse failed:', err)
    return [{
      text: `⚠ Gagal parse DOCX: ${(err as Error).message
        }\n`,
      fontSize: 14,
      color: '#cc0000'
    }]
  }
}
