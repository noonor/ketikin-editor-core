import { DocElement } from '../types';

/** Convert plain text to DocElements, splitting on newlines */
export function textToElements(text: string): DocElement[] {
  const elements: DocElement[] = [];
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    elements.push({ text: line + (idx < lines.length - 1 ? '\n' : ''), fontSize: 12, fontFamily: 'Calibri', color: '#000000' });
  });
  if (elements.length === 0) elements.push({ text: '\n', fontSize: 12, fontFamily: 'Calibri', color: '#000000' });
  return elements;
}

/** Use a context-aware recursive walker to convert HTML to DocElements */
export function htmlToElements(html: string): DocElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: DocElement[] = [];

  const getAlignment = (el: HTMLElement): 'left' | 'center' | 'right' | 'justify' | undefined => {
    if (el.classList.contains('align-center')) return 'center';
    if (el.classList.contains('align-right')) return 'right';
    if (el.classList.contains('align-justify')) return 'justify';
    if (el.classList.contains('align-left')) return 'left';
    if (el.classList.contains('center')) return 'center';
    if (el.classList.contains('right')) return 'right';
    if (el.classList.contains('justify')) return 'justify';
    const ta = el.style.textAlign;
    if (ta === 'center') return 'center';
    if (ta === 'right') return 'right';
    if (ta === 'justify' || ta === 'justify-all') return 'justify';
    if (ta === 'left') return 'left';
    try {
      const computed = window.getComputedStyle(el);
      const cta = computed.textAlign;
      if (cta === 'center') return 'center';
      if (cta === 'right') return 'right';
      if (cta === 'justify') return 'justify';
    } catch { }
    return undefined;
  };

  const walkNode = (node: Node, context: Partial<DocElement>) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        const last = elements[elements.length - 1];
        const isSameFormatting = last &&
          last.bold === context.bold &&
          last.italic === context.italic &&
          last.underline === context.underline &&
          last.align === context.align &&
          last.fontSize === context.fontSize &&
          last.color === context.color &&
          !last.text.endsWith('\n') &&
          !last.text.endsWith('\f') &&
          !last.text.endsWith('\t') &&
          !last.elementType;

        if (isSameFormatting) last.text += text;
        else elements.push({ ...context, text } as DocElement);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const newContext: Partial<DocElement> = { ...context };

      const detectedAlign = getAlignment(el);
      if (detectedAlign) newContext.align = detectedAlign;

      const sb = el.style.marginTop || el.style.paddingTop;
      const sa = el.style.marginBottom || el.style.paddingBottom;
      const lh = el.style.lineHeight;
      if (sb) newContext.spacingBefore = parseFloat(sb);
      if (sa) newContext.spacingAfter = parseFloat(sa);
      if (lh) newContext.lineHeight = parseFloat(lh);

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li'].includes(tag)) {
        newContext.spacingAfter = newContext.spacingAfter || 12;
        newContext.lineHeight = newContext.lineHeight || 1.35;
      }

      el.classList.forEach(cls => {
        if (cls.startsWith('fs-')) {
          const val = parseInt(cls.substring(3));
          if (!isNaN(val)) newContext.fontSize = val;
        }
        if (cls.startsWith('font-')) {
          newContext.fontFamily = cls.substring(5).replace(/_/g, ' ');
        }
      });

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = parseInt(tag[1]) as any;
        const shapes: Record<number, number> = { 1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14 };
        newContext.fontSize = shapes[level] || 12;
        newContext.bold = true;
        newContext.headingLevel = level;
      }

      if (['b', 'strong'].includes(tag)) newContext.bold = true;
      if (['i', 'em'].includes(tag)) newContext.italic = true;
      if (['u', 'ins'].includes(tag)) newContext.underline = true;

      if (tag === 'br') {
        const text = el.classList.contains('page-break') ? '\f' : '\n';
        elements.push({ ...newContext, text } as DocElement);
        return;
      }

      node.childNodes.forEach(child => walkNode(child, newContext));

      if (['p', 'div', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const last = elements[elements.length - 1];
        if (last && !last.text.endsWith('\n')) last.text += '\n';
        else if (!last || (last && last.text.endsWith('\n') && node.childNodes.length === 0)) {
          elements.push({ ...newContext, text: '\n' } as DocElement);
        }
      } else if (['td', 'th'].includes(tag)) {
        const last = elements[elements.length - 1];
        if (last && !last.text.endsWith('\t') && !last.text.endsWith('\n')) last.text += '\t';
      }
    }
  };

  doc.body.childNodes.forEach(node => walkNode(node, { fontSize: 12, fontFamily: 'Calibri', color: '#000000', align: 'left' }));
  if (elements.length === 0) elements.push({ text: '\n', fontSize: 12, fontFamily: 'Calibri', color: '#000000', align: 'left' });
  return elements;
}

/** Strip RTF control words and return plain text */
export function rtfToElements(rtf: string): DocElement[] {
  let text = rtf
    .replace(/\\[a-z]+[\-]?[0-9]* ?/g, ' ')
    .replace(/\{|\}/g, '')
    .replace(/\\\*/g, '')
    .replace(/\\par\b/g, '\n')
    .replace(/\\line\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\\n/g, '')
    .replace(/  +/g, ' ')
    .trim();
  return textToElements(text);
}

/** Strip XML tags, return visible text content */
export function xmlToElements(xml: string): DocElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const text = doc.documentElement.textContent || '';
  return textToElements(text);
}
