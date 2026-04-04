import { DocElement } from '../types';
import { textToElements, htmlToElements, rtfToElements, xmlToElements } from './HtmlImporter';
import { importDocx } from './DocxImporter';
import { importPdf } from './PdfImporter';

export type ImportableFormat =
  | '.txt' | '.html' | '.htm' | '.mht' | '.mhtml'
  | '.rtf' | '.xml' | '.doc' | '.docx' | '.docm'
  | '.dotx' | '.dotm' | '.dot' | '.odt' | '.pdf' | '.wpd';

export const OPEN_FILE_ACCEPT =
  '.docx,.docm,.dotx,.dotm,.doc,.dot,.htm,.html,.rtf,.mht,.mhtml,.xml,.odt,.pdf,.txt,.wpd';

export const FILE_TYPE_GROUPS = [
  { label: 'All Word Documents', accept: '.docx,.docm,.dotx,.dotm,.doc,.dot,.htm,.html,.rtf,.mht,.mhtml,.xml,.odt,.pdf,.txt' },
  { label: 'Word Documents (*.docx)', accept: '.docx' },
  { label: 'Word Macro-Enabled (*.docm)', accept: '.docm' },
  { label: 'XML Files (*.xml)', accept: '.xml' },
  { label: 'Word 97-2003 (*.doc)', accept: '.doc' },
  { label: 'All Web Pages', accept: '.htm,.html,.mht,.mhtml' },
  { label: 'All Word Templates', accept: '.dotx,.dotm,.dot' },
  { label: 'Rich Text Format (*.rtf)', accept: '.rtf' },
  { label: 'Text Files (*.txt)', accept: '.txt' },
  { label: 'OpenDocument Text (*.odt)', accept: '.odt' },
  { label: 'PDF Files (*.pdf)', accept: '.pdf' },
  { label: 'WordPerfect (.wpd)', accept: '.wpd' },
  { label: 'Recover Text from Any File', accept: '*' },
];

/**
 * Parse a File object into DocElement[].
 */
export async function importFile(file: File): Promise<DocElement[]> {
  const ext = ('.' + file.name.split('.').pop()!.toLowerCase()) as ImportableFormat;

  const readAsArrayBuffer = (): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const readAsText = (encoding?: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file, encoding);
    });

  switch (ext) {
    case '.txt':
    case '.wpd':
      return textToElements(await readAsText('utf-8'));

    case '.html':
    case '.htm':
    case '.mht':
    case '.mhtml':
      return htmlToElements(await readAsText('utf-8'));

    case '.rtf':
      return rtfToElements(await readAsText('utf-8'));

    case '.xml':
      return xmlToElements(await readAsText('utf-8'));

    case '.docx':
    case '.docm':
    case '.dotx':
    case '.dotm':
    case '.odt':
    case '.doc':
    case '.dot':
      return importDocx(await readAsArrayBuffer());

    case '.pdf':
      return importPdf(await readAsArrayBuffer());

    default:
      return [{ text: `⚠ Unsupported file type: ${ext}\n`, fontSize: 14, color: '#cc0000' }];
  }
}

/** Read an image file as a data URL, and get its natural dimensions */
export async function importImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff';
