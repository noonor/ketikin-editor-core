import * as pdfjsLib from 'pdfjs-dist';
import { DocElement } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function importPdf(arrayBuffer: ArrayBuffer): Promise<DocElement[]> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const elements: DocElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const pageWidth = viewport.width;

      const lineMap = new Map<number, any[]>();
      content.items.forEach((item: any) => {
        if (!('str' in item) || !item.str) return;
        const y = Math.round(item.transform[5] / 3) * 3;
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y)!.push(item);
      });

      const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
      sortedYs.forEach(y => {
        const items = lineMap.get(y)!;
        items.sort((a: any, b: any) => a.transform[4] - b.transform[4]);
        const lineText = items.map((it: any) => it.str).join(' ').trim();
        if (!lineText) return;

        const fontSize = Math.abs(items[0].transform[0]) || 12;
        const fontName = (items[0].fontName || '').toLowerCase();
        const isBold = /bold|black|heavy|demi/.test(fontName);
        const isItalic = /italic|oblique|slant/.test(fontName);

        let headingLevel: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
        if (fontSize >= 22) headingLevel = 1; else if (fontSize >= 18) headingLevel = 2; else if (fontSize >= 15) headingLevel = 3; else if (fontSize >= 13) headingLevel = 4;

        const leftMargin = pageWidth * 0.1;
        const rightMargin = pageWidth * 0.9;
        const firstX = items[0].transform[4];
        const lastItem = items[items.length - 1];
        const lastX = lastItem.transform[4] + (lastItem.width || 0);
        const textCenterX = (firstX + lastX) / 2;
        const pageCenterX = pageWidth / 2;

        let align: 'left' | 'center' | 'right' | 'justify' = 'left';
        if (Math.abs(textCenterX - pageCenterX) < pageWidth * 0.05) align = 'center';
        else if (firstX > leftMargin + pageWidth * 0.1) align = 'right';
        else if (lastX > rightMargin - pageWidth * 0.05 && lineText.split(' ').length > 4) align = 'justify';

        elements.push({ text: lineText + '\n', fontSize: Math.round(fontSize), bold: isBold || undefined, italic: isItalic || undefined, headingLevel, align, color: '#000000' });
      });

      if (i < pdf.numPages) elements.push({ text: '\f', fontSize: 12, color: '#000000' });
    }
    return elements.length > 0 ? elements : [{ text: '⚠ PDF tidak mengandung teks.\n', fontSize: 14, color: '#cc0000' }];
  } catch (err) {
    return [{ text: `⚠ PDF extraction failed: ${(err as Error).message}\n`, fontSize: 14, color: '#cc0000' }];
  }
}
