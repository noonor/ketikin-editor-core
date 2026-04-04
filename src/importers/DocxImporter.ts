import mammoth from 'mammoth';
import { DocElement } from '../types';
import { htmlToElements } from './HtmlImporter';

export async function importDocx(arrayBuffer: ArrayBuffer): Promise<DocElement[]> {
  try {
    const options = {
      transformDocument: (document: any) => {
        const alignMap: Record<string, string> = {
          'left': 'left', 'center': 'center', 'right': 'right', 'justified': 'justify',
          'justify': 'justify', 'both': 'justify', 'distribute': 'justify',
        };

        const transformRun = (run: any) => {
          if (run.fontSize) {
            run.styleId = `fs-${run.fontSize}`;
            run.styleName = `fs-${run.fontSize}`;
          }
          if (run.font) {
            run.styleId = (run.styleId || '') + ` font-${run.font.replace(/\s+/g, '_')}`;
            run.styleName = (run.styleName || '') + ` font-${run.font}`;
          }
          return run;
        };

        const transformParagraph = (paragraph: any) => {
          if (paragraph.alignment) {
            const mapped = alignMap[paragraph.alignment] || paragraph.alignment;
            paragraph.styleId = `aligned-${mapped}`;
            paragraph.styleName = `aligned-${mapped}`;
          }
          if (paragraph.indent) {
            paragraph.indent.firstLine = paragraph.indent.firstLine || 0;
          }
          return paragraph;
        };

        const transformChildren = (children: any[]): any[] => {
          if (!children) return [];
          return children.map((child: any) => {
            if (child.type === 'paragraph') return transformParagraph(child);
            if (child.type === 'run') return transformRun(child);
            if (child.children) child.children = transformChildren(child.children);
            return child;
          });
        };

        document.children = transformChildren(document.children);
        return document;
      },
      styleMap: [
        "r[style-name^='fs-'] => span.size-{style-name}",
        "r[style-name^='font-'] => span.font-{style-name}",
        "p[style-name='aligned-left'] => p.align-left",
        "p[style-name='aligned-center'] => p.align-center",
        "p[style-name='aligned-right'] => p.align-right",
        "p[style-name='aligned-justify'] => p.align-justify",
        "p[style-name='Center'] => p.align-center",
        "p[style-name='Centered'] => p.align-center",
        "p[style-name='Right'] => p.align-right",
        "p[style-name='Justify'] => p.align-justify",
        "p[style-name='Justified'] => p.align-justify",
        "p[style-name='Heading 1'] => h1", "p[style-name='Heading 2'] => h2", "p[style-name='Heading 3'] => h3",
        "p[style-name='heading 1'] => h1", "p[style-name='heading 2'] => h2", "p[style-name='heading 3'] => h3",
        "r[style-name='Underline'] => u", "u => u", "strike => del", "br[type='page'] => br.page-break"
      ]
    };
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    return htmlToElements(result.value);
  } catch (err) {
    console.error('mammoth failed:', err);
    return [{ text: `⚠ Could not parse .docx file. ${(err as Error).message}\n`, fontSize: 14, color: '#cc0000' }];
  }
}
