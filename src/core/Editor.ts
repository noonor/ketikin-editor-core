import { RenderEngine } from './render/RenderEngine';
import { DocElement, EditorConfig, RenderPage, RenderChar, KetikinDocument } from '../types/index';
import { HistoryManager } from './HistoryManager';
import { ImageTransformer } from './transform/ImageTransformer';
import { InputHandler } from './InputHandler';

export class Editor {
  private container: HTMLElement;
  public elements: DocElement[];
  private engine: RenderEngine;
  private pages: RenderPage[] = [];
  private caretIndex: number = 0;
  public pageContainers: HTMLElement[] = [];
  public pageWrappers: HTMLElement[] = [];
  private caretElement: HTMLDivElement | null = null;
  private selection: { start: number; end: number } | null = null;

  private scale: number = 1;
  private history: HistoryManager;
  private transformer: ImageTransformer;
  private inputHandler: InputHandler;

  private config: EditorConfig;
  private pendingFormat: Record<string, any> | null = null;
  public selectedElementIndex: number | null = null;

  public onSelectionChange?: () => void;
  public onChange?: () => void;

  constructor(container: HTMLElement, initialElements: DocElement[], schemaConfig?: Partial<KetikinDocument>) {
    this.container = container;
    this.elements = JSON.parse(JSON.stringify(initialElements));
    if (this.elements.length === 0) {
      this.elements.push({ text: '\n', fontSize: 12, fontFamily: 'Calibri', color: '#000000' });
    }

    this.history = new HistoryManager(this.elements);
    this.transformer = new ImageTransformer();
    this.inputHandler = new InputHandler(this);

    this.config = {
      width: 794, height: 1123,
      padding: { top: 96, bottom: 96, left: 96, right: 96 }
    };

    if (schemaConfig?.setup) {
      const setup = schemaConfig.setup;
      if (setup.pageSize === 'A4') { this.config.width = 794; this.config.height = 1123; }
      else if (setup.pageSize === 'Letter') { this.config.width = 816; this.config.height = 1056; }
      else if (setup.pageSize === 'Custom' && setup.customWidth && setup.customHeight) {
        this.config.width = setup.customWidth;
        this.config.height = setup.customHeight;
      }
      if (setup.orientation === 'landscape') {
        const temp = this.config.width;
        this.config.width = this.config.height;
        this.config.height = temp;
      }
      this.config.padding = setup.margins;
    }

    this.engine = new RenderEngine(this.config);
    this.init();
    this.render();
  }

  private init() {
    this.container.tabIndex = 0;
    this.container.style.outline = 'none';
    this.inputHandler.attach();
    setTimeout(() => this.container.focus(), 100);
  }

  public getContainer() { return this.container; }
  public getScale() { return this.scale; }
  public setScale(scale: number) {
    this.scale = Math.max(0.25, Math.min(scale, 3));
    this.syncPageContainers();
    this.render();
    this.onChange?.();
  }

  public getStats() {
    const text = this.elements.map(e => e.text).join(' ');
    const words = text.match(/\b\w+\b/g)?.length || 0;
    return { pages: this.pages.length, words };
  }

  public loadContent(newElements: DocElement[]) {
    this.elements = JSON.parse(JSON.stringify(newElements));
    if (this.elements.length === 0) this.elements.push({ text: '\n', fontSize: 12, fontFamily: 'Calibri', color: '#000000' });
    this.caretIndex = 0;
    this.selection = null;
    this.pendingFormat = null;
    this.render();
    this.history.pushHistory(this.elements);
    this.onChange?.();
  }

  public undo() {
    const state = this.history.undo();
    if (state) {
      this.elements = state;
      this.render();
      this.onChange?.();
    }
  }

  public redo() {
    const state = this.history.redo();
    if (state) {
      this.elements = state;
      this.render();
      this.onChange?.();
    }
  }

  public render() {
    this.pages = this.engine.layout(this.elements);
    this.syncPageContainers();
    this.engine.render(this.pages, this.pageContainers, this.selection, this.elements, this.transformer.dropTargetIndex);
    this.updateCaret();
    this.onChange?.();
  }

  public insertImage(dataUrl: string, width?: number, height?: number) {
    const maxW = this.config.width - this.config.padding.left - this.config.padding.right;
    const maxH = this.config.height - this.config.padding.top - this.config.padding.bottom;
    let imgW = width || 300, imgH = height || 200;
    const ratio = imgW / imgH;
    if (imgW > maxW) { imgW = maxW; imgH = imgW / ratio; }
    if (imgH > maxH * 0.8) { imgH = maxH * 0.8; imgW = imgH * ratio; }

    const imgEl: DocElement = { elementType: 'image', imageUrl: dataUrl, imageWidth: imgW, imageHeight: imgH, text: '\n', fontSize: 12, fontFamily: 'Calibri' };
    let currentTotal = 0, insertIdx = this.elements.length;
    for (let i = 0; i < this.elements.length; i++) {
      if (this.caretIndex <= currentTotal + this.elements[i].text.length) { insertIdx = i + 1; break; }
      currentTotal += this.elements[i].text.length;
    }
    this.elements.splice(insertIdx, 0, imgEl);
    this.caretIndex = currentTotal + imgEl.text.length + 1;
    this.render();
    this.history.pushHistory(this.elements);
    this.onChange?.();
  }

  private syncPageContainers() {
    while (this.pageContainers.length < this.pages.length) {
      const wrapper = document.createElement('div');
      wrapper.className = 'editor-page-wrapper';
      wrapper.style.position = 'relative';  // wrapper sizes to the scaled page
      wrapper.style.flexShrink = '0';

      const pageDiv = document.createElement('div');
      pageDiv.className = 'editor-page';
      pageDiv.style.width = `${this.config.width}px`;
      pageDiv.style.height = `${this.config.height}px`;
      pageDiv.style.backgroundColor = 'white';
      pageDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
      // position:relative so the caret (position:absolute) is anchored to this page
      pageDiv.style.position = 'relative';
      pageDiv.style.cursor = 'text';
      pageDiv.style.overflow = 'hidden';
      pageDiv.style.transformOrigin = 'top left';

      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      pageDiv.appendChild(canvas);
      wrapper.appendChild(pageDiv);
      this.container.appendChild(wrapper);
      this.pageWrappers.push(wrapper);
      this.pageContainers.push(pageDiv);
    }

    while (this.pageContainers.length > this.pages.length) {
      this.pageContainers.pop();
      const wrapper = this.pageWrappers.pop();
      if (wrapper && wrapper.parentNode === this.container) this.container.removeChild(wrapper);
    }

    const scaledHeight = this.config.height * this.scale;
    const scaledWidth = this.config.width * this.scale;
    // Wrapper must match the visual footprint of the scaled page so the parent flex layout sizes correctly
    this.pageWrappers.forEach(w => {
      w.style.width = `${scaledWidth}px`;
      w.style.height = `${scaledHeight}px`;
    });
    // Scale the page canvas via CSS transform
    this.pageContainers.forEach(div => {
      div.style.transform = `scale(${this.scale})`;
      div.style.transformOrigin = 'top left';
    });
  }

  private getAllChars(): RenderChar[] {
    const allChars: RenderChar[] = [];
    this.pages.forEach(p => p.lines.forEach(l => allChars.push(...l.chars)));
    return allChars.sort((a, b) => a.charIndex - b.charIndex);
  }

  private updateCaret() {
    const allChars = this.getAllChars();
    if (!this.caretElement) {
      this.caretElement = document.createElement('div');
      this.caretElement.className = 'editor-caret';
      this.caretElement.style.width = '1px';
      this.caretElement.style.backgroundColor = 'black';
      this.caretElement.style.position = 'absolute';
      this.caretElement.style.pointerEvents = 'none';
      this.caretElement.style.animation = 'caret-blink 1s steps(2, start) infinite';
    }
    if (this.selection && this.selection.start !== this.selection.end) {
      if (this.caretElement) this.caretElement.style.display = 'none';
      return;
    }

    if (this.caretElement) this.caretElement.style.display = 'block';

    const total = this.elements.reduce((sum, el) => sum + el.text.length, 0);
    const lastEl = this.elements[this.elements.length - 1];
    const maxIndex = total - (lastEl && lastEl.text.endsWith('\n') ? 1 : 0);
    this.caretIndex = Math.max(0, Math.min(this.caretIndex, maxIndex));

    let charOnPage = allChars.find(c => c.charIndex === this.caretIndex);

    if (charOnPage) {
      if (this.caretElement) {
        this.caretElement.style.height = `${charOnPage.height}px`;
        this.caretElement.style.left = `${charOnPage.x}px`;
        this.caretElement.style.top = `${charOnPage.y}px`;
      }
      const pageIdx = this.findPageIdxForChar(this.caretIndex);
      if (this.pageContainers[pageIdx] && this.caretElement) {
        this.pageContainers[pageIdx].appendChild(this.caretElement);
      }
    } else {
      // Fallback for end of line or end of document
      const prevChar = allChars.find(c => c.charIndex === this.caretIndex - 1);
      const pageIdx = this.findPageIdxForChar(this.caretIndex);

      if (prevChar && this.caretElement) {
        this.caretElement.style.height = `${prevChar.height}px`;
        if (prevChar.char === '\n' || prevChar.char === '\f') {
          // Find the line that starts with this caretIndex
          let targetLine: any = null;
          const page = this.pages[pageIdx];
          if (page) {
            page.lines.forEach(l => { if (l.startIndex === this.caretIndex) targetLine = l; });
          }

          if (targetLine) {
            this.caretElement.style.left = `${this.config.padding.left}px`;
            this.caretElement.style.top = `${targetLine.y}px`;
          } else {
            this.caretElement.style.left = `${this.config.padding.left}px`;
            this.caretElement.style.top = `${prevChar.y + prevChar.height}px`;
          }
        } else {
          this.caretElement.style.left = `${prevChar.x + prevChar.width}px`;
          this.caretElement.style.top = `${prevChar.y}px`;
        }
      } else if (this.caretElement) {
        // First character of the document
        this.caretElement.style.height = '18px';
        this.caretElement.style.left = `${this.config.padding.left}px`;
        this.caretElement.style.top = `${this.config.padding.top}px`;
      }

      if (this.pageContainers[pageIdx] && this.caretElement) {
        this.pageContainers[pageIdx].appendChild(this.caretElement);
      }
    }
  }

  public findPageIdxForChar(charIndex: number): number {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      for (const line of page.lines) {
        // Check if index falls accurately within the line range
        if (charIndex >= line.startIndex && charIndex < line.endIndex) return i;
        // Edge case: if it's the very last index of an empty line at the end of the document
        if (line.startIndex === charIndex && line.endIndex === charIndex) return i;
      }
    }
    // If it's the very end of the document, it belongs to the last page
    return Math.max(0, this.pages.length - 1);
  }

  public getCharIndexAt(x: number, y: number, pageIdx: number): number {
    const page = this.pages[pageIdx];
    if (!page || page.lines.length === 0) return 0;
    let closestLine = page.lines[0], minLineDist = Infinity;
    page.lines.forEach(line => {
      const lineMidY = line.y + line.height / 2;
      const dist = Math.abs(y - lineMidY);
      if (dist < minLineDist) { minLineDist = dist; closestLine = line; }
    });
    if (closestLine.chars.length === 0) return 0;
    let bestCharIndex = closestLine.chars[0].charIndex, minCharDist = Infinity;
    closestLine.chars.forEach(char => {
      const charMidX = char.x + char.width / 2;
      const dist = Math.abs(x - charMidX);
      if (dist < minCharDist) {
        minCharDist = dist;
        bestCharIndex = (x > char.x + char.width / 2) ? char.charIndex + (char.char !== '\n' && char.char !== '\f' ? 1 : 0) : char.charIndex;
      }
    });
    const lastChar = closestLine.chars[closestLine.chars.length - 1];
    if (x > lastChar.x + lastChar.width) return (lastChar.char === '\n' || lastChar.char === '\f') ? lastChar.charIndex : lastChar.charIndex + 1;
    if (x < closestLine.chars[0].x) return closestLine.chars[0].charIndex;
    return bestCharIndex;
  }

  public handlePageMouseDown(x: number, y: number, pageIdx: number, shiftKey: boolean) {
    const imageIdxAtPos = this.transformer.findImageAt(x, y, pageIdx, this.pages, this.elements);
    const index = this.getCharIndexAt(x, y, pageIdx);
    this.caretIndex = index;

    if (this.selectedElementIndex !== null) {
      const char = this.getAllChars().find(c => c.elementIndex === this.selectedElementIndex);
      const el = this.elements[this.selectedElementIndex];
      if (char && el.elementType === 'image') {
        const handle = this.transformer.getHandleAt(x, y, char, el.imageRotation || 0);
        if (handle !== 'none') {
          this.transformer.isTransforming = handle;
          this.transformer.transformStart = { x, y, width: el.imageWidth || char.width, height: el.imageHeight || char.height, rotation: el.imageRotation || 0 };
          return;
        }
        if (imageIdxAtPos === this.selectedElementIndex) {
          this.transformer.isTransforming = 'move';
          this.transformer.transformStart = { x, y, width: 0, height: 0, rotation: 0 };
          return;
        }
      }
    }

    const allChars = this.getAllChars();
    const charUnderMouse = allChars.find(c => c.charIndex === index);
    const elAtChar = charUnderMouse ? this.elements[charUnderMouse.elementIndex] : null;
    const page = this.pages[pageIdx];
    const closestLine = page?.lines.find(l => l.chars.some(c => c.charIndex === index));
    const isHitOnTextLine = closestLine && y >= closestLine.y && y <= closestLine.y + (closestLine.height || 18);

    if (isHitOnTextLine && elAtChar && (elAtChar.elementType !== 'image' || (charUnderMouse as any).wrapping === 'inline')) {
      if (imageIdxAtPos !== null && this.elements[imageIdxAtPos].imageWrapping === 'front') this.selectedElementIndex = imageIdxAtPos;
      else this.selectedElementIndex = (elAtChar.elementType === 'image') ? charUnderMouse!.elementIndex : null;
    } else {
      if (imageIdxAtPos !== null) this.selectedElementIndex = imageIdxAtPos;
      else if (elAtChar && (charUnderMouse as any).wrapping === 'inline' && isHitOnTextLine) this.selectedElementIndex = charUnderMouse!.elementIndex;
      else this.selectedElementIndex = null;
    }

    if (this.onSelectionChange) this.onSelectionChange();
    if (shiftKey) {
      if (!this.selection) this.selection = { start: this.caretIndex, end: index };
      else this.selection.end = index;
    } else this.selection = { start: index, end: index };

    this.pendingFormat = null;
    this.render();
  }

  public handlePageMouseMove(x: number, y: number, pageIdx: number, target: HTMLElement) {
    if (this.transformer.isTransforming !== 'none' && this.selectedElementIndex !== null) {
      const el = this.elements[this.selectedElementIndex];
      const char = this.getAllChars().find(c => c.elementIndex === this.selectedElementIndex);
      if (this.transformer.isTransforming === 'move') {
        this.transformer.dropTargetIndex = this.getCharIndexAt(x, y, pageIdx);
        target.style.cursor = 'move';
        this.render();
        return;
      }
      if (char && this.transformer.handleTransform(x, y, el, char, this.config)) {
        this.render();
        this.onChange?.();
      }
      return;
    }
    const index = this.getCharIndexAt(x, y, pageIdx);
    if (this.selection) {
      this.selection.end = index;
      this.caretIndex = index;
      this.render();
    }
  }

  public handlePageMouseUp() {
    if (this.transformer.isTransforming === 'move' && this.selectedElementIndex !== null && this.transformer.dropTargetIndex !== null) {
      const el = this.elements.splice(this.selectedElementIndex, 1)[0];
      let currentTotal = 0, insertIdx = this.elements.length;
      for (let i = 0; i < this.elements.length; i++) {
        if (this.transformer.dropTargetIndex <= currentTotal + this.elements[i].text.length) { insertIdx = i; break; }
        currentTotal += this.elements[i].text.length;
      }
      this.elements.splice(insertIdx, 0, el);
      this.selectedElementIndex = insertIdx;
      this.caretIndex = this.transformer.dropTargetIndex;
    }
    if (this.transformer.isTransforming !== 'none') {
      this.transformer.isTransforming = 'none';
      this.transformer.transformStart = null;
      this.transformer.dropTargetIndex = null;
      this.history.pushHistory(this.elements);
      this.render();
    }
  }

  public handlePageDoubleClick(x: number, y: number, pageIdx: number) {
    const index = this.getCharIndexAt(x, y, pageIdx);
    const fullText = this.elements.map(el => el.text).join('');
    let start = index, end = index;
    while (start > 0 && !/[\s\n]/.test(fullText[start - 1])) start--;
    while (end < fullText.length && !/[\s\n]/.test(fullText[end])) end++;
    this.selection = { start, end };
    this.caretIndex = end;
    this.render();
  }

  public selectAll() { this.selection = { start: 0, end: this.elements.reduce((s, e) => s + e.text.length, 0) }; this.render(); }
  public deselectAll() { this.selectedElementIndex = null; this.onSelectionChange?.(); this.render(); }
  public getSelectedText() {
    if (!this.selection) return '';
    const start = Math.min(this.selection.start, this.selection.end), end = Math.max(this.selection.start, this.selection.end);
    return this.elements.map(el => el.text).join('').substring(start, end);
  }

  // Formatting keys used for pending-format comparisons (excludes text/image fields)
  private readonly _fmtKeys: (keyof DocElement)[] = [
    'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
    'fontSize', 'fontFamily', 'color', 'backgroundColor',
    'align', 'lineHeight', 'spacingAfter', 'listType', 'listLevel', 'headingLevel',
  ];

  /** Returns true if `el` has the same formatting values as pendingFormat. */
  private _matchesPendingFormat(el: DocElement): boolean {
    if (!this.pendingFormat) return true;
    return this._fmtKeys.every(k => {
      const pv = (this.pendingFormat as any)[k];
      const ev = (el as any)[k];
      // Treat undefined and false as equivalent for boolean toggles
      const norm = (v: any) => (v === undefined ? false : v);
      return norm(pv) === norm(ev);
    });
  }

  /** Builds a new DocElement inheriting the pending format (without text/image fields). */
  private _newPendingEl(text: string, fallback: DocElement): DocElement {
    const base: Partial<DocElement> = { fontSize: fallback.fontSize || 12 };
    for (const k of this._fmtKeys) {
      const v = (this.pendingFormat as any)?.[k];
      if (v !== undefined) (base as any)[k] = v;
    }
    return { ...base, text } as DocElement;
  }

  public insertText(text: string) {
    this.history.pushHistory(this.elements);
    if (this.selection && this.selection.start !== this.selection.end) this.deleteSelection();

    let currentTotal = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      const elEnd = currentTotal + el.text.length;

      if (this.caretIndex >= currentTotal && this.caretIndex <= elEnd) {
        const offset = this.caretIndex - currentTotal;

        if (this.pendingFormat) {
          // ── Case A: at end of element that already matches → just append ──
          if (offset === el.text.length && this._matchesPendingFormat(el)) {
            el.text += text;
            this.caretIndex += text.length;
            break;
          }

          // ── Case B: at start of element, prev element matches → append to prev ──
          if (offset === 0 && i > 0 && this._matchesPendingFormat(this.elements[i - 1])) {
            this.elements[i - 1].text += text;
            this.caretIndex += text.length;
            break;
          }

          // ── Case C: mid-element or element doesn't match → split & inject ──
          if (offset > 0) {
            // Split before-part off into its own element
            const before = { ...el, text: el.text.substring(0, offset) };
            el.text = el.text.substring(offset);
            this.elements.splice(i, 0, before);
            i++;
          }
          // Insert new element carrying pending format
          const newEl = this._newPendingEl(text, el);
          this.elements.splice(i, 0, newEl);
          this.caretIndex += text.length;
          break;
        }

        // ── No pending format: normal insert into current element ──
        el.text = el.text.substring(0, offset) + text + el.text.substring(offset);
        this.caretIndex += text.length;
        break;
      }

      currentTotal = elEnd;
    }
    this.render();
  }


  public deleteBackward() {
    if (this.selection && this.selection.start !== this.selection.end) { this.deleteSelection(); return; }
    if (this.caretIndex > 0) {
      this.history.pushHistory(this.elements);
      let currentTotal = 0;
      for (let i = 0; i < this.elements.length; i++) {
        const el = this.elements[i];
        if (this.caretIndex > currentTotal && this.caretIndex <= currentTotal + el.text.length) {
          const offset = this.caretIndex - currentTotal;
          el.text = el.text.substring(0, offset - 1) + el.text.substring(offset);
          this.caretIndex--;
          if (el.text === '' && this.elements.length > 1) this.elements.splice(i, 1);
          break;
        }
        currentTotal += el.text.length;
      }
      this.render();
    }
  }

  public deleteForward() {
    if (this.selection && this.selection.start !== this.selection.end) { this.deleteSelection(); return; }
    const total = this.elements.reduce((s, e) => s + e.text.length, 0);
    if (this.caretIndex < total) {
      this.history.pushHistory(this.elements);
      let currentTotal = 0;
      for (let i = 0; i < this.elements.length; i++) {
        const el = this.elements[i];
        if (this.caretIndex >= currentTotal && this.caretIndex < currentTotal + el.text.length) {
          const offset = this.caretIndex - currentTotal;
          el.text = el.text.substring(0, offset) + el.text.substring(offset + 1);
          if (el.text === '' && this.elements.length > 1) this.elements.splice(i, 1);
          break;
        }
        currentTotal += el.text.length;
      }
      this.render();
    }
  }

  private deleteSelection() {
    if (!this.selection) return;
    this.history.pushHistory(this.elements);
    const start = Math.min(this.selection.start, this.selection.end), end = Math.max(this.selection.start, this.selection.end);
    let currentTotal = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      const elStart = currentTotal, elEnd = currentTotal + el.text.length;
      const intersectStart = Math.max(start, elStart), intersectEnd = Math.min(end, elEnd);
      if (intersectStart < intersectEnd) {
        const offsetStart = intersectStart - elStart, offsetEnd = intersectEnd - elStart;
        el.text = el.text.substring(0, offsetStart) + el.text.substring(offsetEnd);
      }
      currentTotal += el.text.length;
    }
    this.elements = this.elements.filter((el, idx) => el.text.length > 0 || idx === 0);
    this.caretIndex = start;
    this.selection = null;
    this.render();
  }

  public moveCaret(dir: number, shift: boolean) {
    const total = this.elements.reduce((s, e) => s + e.text.length, 0);
    const newIndex = Math.max(0, Math.min(this.caretIndex + dir, total));
    if (shift) {
      if (!this.selection) this.selection = { start: this.caretIndex, end: newIndex };
      else this.selection.end = newIndex;
    } else {
      this.selection = null;
      this.pendingFormat = null; // moving cursor resets pending format
    }
    this.caretIndex = newIndex;
    this.render();
  }

  public moveCaretLine(dir: number, shift: boolean) {
    const allChars = this.getAllChars();
    const curChar = allChars.find(c => c.charIndex === this.caretIndex) || allChars[allChars.length - 1];
    if (!curChar) return;
    const targetY = curChar.y + (dir * curChar.height * 1.2);
    const pageIdx = this.findPageIdxForChar(this.caretIndex);
    const newIndex = this.getCharIndexAt(curChar.x, targetY, pageIdx);
    this.moveCaret(newIndex - this.caretIndex, shift);
  }

  public getSelectedElement() { return this.selectedElementIndex !== null ? this.elements[this.selectedElementIndex] : null; }
  public getSelectedElementRect() {
    if (this.selectedElementIndex === null) return null;
    const char = this.getAllChars().find(c => c.elementIndex === this.selectedElementIndex);
    if (!char) return null;
    return { x: char.x, y: char.y, width: char.width, height: char.height, pageIdx: this.findPageIdxForChar(char.charIndex), rotation: (this.elements[this.selectedElementIndex] as any).imageRotation || 0 };
  }
  public getRotatedVisualBounds() {
    if (this.selectedElementIndex === null) return null;
    const char = this.getAllChars().find(c => c.elementIndex === this.selectedElementIndex);
    const el = this.elements[this.selectedElementIndex];
    if (!char || el.elementType !== 'image') return null;
    const cx = char.x + char.width / 2, cy = char.y + char.height / 2, rad = ((el.imageRotation || 0) * Math.PI) / 180;
    const corners = [{ x: char.x, y: char.y }, { x: char.x + char.width, y: char.y }, { x: char.x + char.width, y: char.y + char.height }, { x: char.x, y: char.y + char.height }];
    const rotated = corners.map(p => { const dx = p.x - cx, dy = p.y - cy; return { x: dx * Math.cos(rad) - dy * Math.sin(rad) + cx, y: dx * Math.sin(rad) + dy * Math.cos(rad) + cy }; });
    const minX = Math.min(...rotated.map(p => p.x)), maxX = Math.max(...rotated.map(p => p.x)), minY = Math.min(...rotated.map(p => p.y)), maxY = Math.max(...rotated.map(p => p.y));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, pageIdx: this.findPageIdxForChar(char.charIndex), rotation: el.imageRotation || 0 };
  }
  public updateSelectedElement(props: Partial<DocElement>) { if (this.selectedElementIndex !== null) { Object.assign(this.elements[this.selectedElementIndex], props); this.render(); this.history.pushHistory(this.elements); this.onChange?.(); } }
  public rotateSelectedElement(degrees: number) { if (this.selectedElementIndex !== null) { const el = this.elements[this.selectedElementIndex]; el.imageRotation = ((el.imageRotation || 0) + degrees) % 360; this.render(); this.history.pushHistory(this.elements); this.onChange?.(); } }
  public deleteSelectedElement() { if (this.selectedElementIndex !== null) { this.history.pushHistory(this.elements); this.elements.splice(this.selectedElementIndex, 1); this.selectedElementIndex = null; this.render(); this.onSelectionChange?.(); this.onChange?.(); } }
  public toggleFormat(format: string) {
    const current = this.getActiveFormats() as any;
    this.applyFormat({ [format]: !current[format] });
  }
  public applyFormat(props: Partial<DocElement>) {
    if (this.selection && this.selection.start !== this.selection.end) {
      this.history.pushHistory(this.elements);
      const start = Math.min(this.selection.start, this.selection.end), end = Math.max(this.selection.start, this.selection.end);
      let currentTotal = 0;
      for (let i = 0; i < this.elements.length; i++) {
        const el = this.elements[i];
        const elStart = currentTotal, elEnd = currentTotal + el.text.length;
        const intersectStart = Math.max(start, elStart), intersectEnd = Math.min(end, elEnd);
        if (intersectStart < intersectEnd) {
          if (intersectStart > elStart) {
            const left = { ...el, text: el.text.substring(0, intersectStart - elStart) };
            el.text = el.text.substring(intersectStart - elStart);
            this.elements.splice(i, 0, left);
            i++;
          }
          if (intersectEnd < elEnd) {
            const right = { ...el, text: el.text.substring(intersectEnd - intersectStart) };
            el.text = el.text.substring(0, intersectEnd - intersectStart);
            this.elements.splice(i + 1, 0, right);
          }
          Object.assign(this.elements[i], props);
        }
        currentTotal = elEnd;
      }
      this.render();
    } else {
      this.pendingFormat = { ...this.getActiveFormats(), ...props };
      this.onSelectionChange?.(); // Trigger UI update for pending format
    }
  }

  public setAlignment(align: any) {
    if (this.selection) {
      this.history.pushHistory(this.elements);
      const start = Math.min(this.selection.start, this.selection.end), end = Math.max(this.selection.start, this.selection.end);
      let currentTotal = 0;
      for (let i = 0; i < this.elements.length; i++) {
        const el = this.elements[i];
        const elStart = currentTotal, elEnd = currentTotal + el.text.length;
        if (elEnd > start && elStart < end) el.align = align;
        currentTotal = elEnd;
      }
      this.render();
    } else {
      const elIdx = this.getElementIndexForChar(this.caretIndex);
      this.elements[elIdx].align = align;
      this.render();
    }
  }
  private getElementIndexForChar(charIndex: number): number {
    let currentTotal = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      if (charIndex >= currentTotal && charIndex < currentTotal + el.text.length) return i;
      currentTotal += el.text.length;
    }
    return Math.max(0, this.elements.length - 1);
  }

  public getActiveFormats() {
    if (this.pendingFormat) return this.pendingFormat;
    const elIdx = this.getElementIndexForChar(this.caretIndex);
    return this.elements[elIdx] || {};
  }

  // ── CLIPBOARD ─────────────────────────────────────────────────────────────
  public copyToClipboard() {
    const text = this.getSelectedText();
    if (text) navigator.clipboard?.writeText(text).catch(() => {});
  }

  public cutToClipboard() {
    this.copyToClipboard();
    if (this.selection && this.selection.start !== this.selection.end) {
      this.deleteSelection();
    }
  }

  public async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) this.insertText(text);
    } catch {
      // Fall back silently — browser paste event handles real pastes
    }
  }

  // ── FORMATTING ────────────────────────────────────────────────────────────
  public clearFormatting() {
    const clean = { bold: false, italic: false, underline: false, strikethrough: false, subscript: false, superscript: false, backgroundColor: undefined as any, color: '#000000', fontSize: 12, fontFamily: 'Calibri', align: 'left' as const };
    this.applyFormat(clean);
  }

  public setFontFamily(family: string) { this.applyFormat({ fontFamily: family }); }
  public setFontSize(size: number)     { this.applyFormat({ fontSize: Math.max(1, size) }); }
  public setFontColor(color: string)   { this.applyFormat({ color }); }
  public setHighlightColor(color: string | undefined) { this.applyFormat({ backgroundColor: color }); }

  public setLineSpacing(lineHeight: number) {
    const elIdx = this.getElementIndexForChar(this.caretIndex);
    if (this.selection && this.selection.start !== this.selection.end) {
      this.applyFormat({ lineHeight });
    } else {
      this.elements[elIdx].lineHeight = lineHeight;
      this.render();
    }
  }

  public changeCase(mode: 'upper' | 'lower' | 'title' | 'sentence' | 'toggle') {
    if (!this.selection || this.selection.start === this.selection.end) return;
    this.history.pushHistory(this.elements);
    const s = Math.min(this.selection.start, this.selection.end);
    const e = Math.max(this.selection.start, this.selection.end);
    let currentTotal = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      const elStart = currentTotal, elEnd = currentTotal + el.text.length;
      const is = Math.max(s, elStart), ie = Math.min(e, elEnd);
      if (is < ie) {
        const sel = el.text.substring(is - elStart, ie - elStart);
        let transformed = sel;
        if (mode === 'upper')    transformed = sel.toUpperCase();
        if (mode === 'lower')    transformed = sel.toLowerCase();
        if (mode === 'title')    transformed = sel.replace(/\b\w/g, c => c.toUpperCase());
        if (mode === 'sentence') transformed = sel.charAt(0).toUpperCase() + sel.slice(1).toLowerCase();
        if (mode === 'toggle')   transformed = sel.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
        el.text = el.text.substring(0, is - elStart) + transformed + el.text.substring(ie - elStart);
      }
      currentTotal = elEnd;
    }
    this.render();
  }

  // ── PARAGRAPH STYLES ──────────────────────────────────────────────────────
  public applyStyle(style: 'Normal' | 'NoSpacing' | 'Heading1' | 'Heading2' | 'Heading3') {
    this.history.pushHistory(this.elements);
    const styleMap: Record<string, Partial<DocElement>> = {
      Normal:    { fontSize: 12, bold: false, italic: false, fontFamily: 'Calibri',   lineHeight: 1.15, spacingAfter: 8,  headingLevel: undefined },
      NoSpacing: { fontSize: 12, bold: false, italic: false, fontFamily: 'Calibri',   lineHeight: 1.0,  spacingAfter: 0,  headingLevel: undefined },
      Heading1:  { fontSize: 28, bold: true,  italic: false, fontFamily: 'Calibri', lineHeight: 1.15, spacingAfter: 12, headingLevel: 1 },
      Heading2:  { fontSize: 22, bold: true,  italic: false, fontFamily: 'Calibri', lineHeight: 1.15, spacingAfter: 8,  headingLevel: 2 },
      Heading3:  { fontSize: 18, bold: true,  italic: true,  fontFamily: 'Calibri', lineHeight: 1.15, spacingAfter: 6,  headingLevel: 3 },
    };
    const props = styleMap[style];
    if (!props) return;

    // Apply to current paragraph (all elements on same logical line/paragraph)
    if (this.selection && this.selection.start !== this.selection.end) {
      this.applyFormat(props);
    } else {
      const elIdx = this.getElementIndexForChar(this.caretIndex);
      Object.assign(this.elements[elIdx], props);
      this.render();
    }
    this.history.pushHistory(this.elements);
    this.onChange?.();
  }

  // ── LISTS ─────────────────────────────────────────────────────────────────
  public toggleList(type: 'bullet' | 'number') {
    this.history.pushHistory(this.elements);
    const elIdx = this.getElementIndexForChar(this.caretIndex);
    const el = this.elements[elIdx];
    if (el.listType === type) {
      el.listType = undefined;
      el.listLevel = undefined;
    } else {
      el.listType = type;
      el.listLevel = el.listLevel ?? 0;
    }
    this.render();
    this.history.pushHistory(this.elements);
    this.onChange?.();
  }

  // ── FIND & REPLACE ────────────────────────────────────────────────────────
  public getFullText(): string {
    return this.elements.map(e => e.text).join('');
  }

  /** Returns array of char-index positions where `term` is found. */
  public findText(term: string): number[] {
    if (!term) return [];
    const full = this.getFullText();
    const results: number[] = [];
    let idx = full.indexOf(term, 0);
    while (idx !== -1) {
      results.push(idx);
      idx = full.indexOf(term, idx + 1);
    }
    return results;
  }

  /** Selects the first occurrence of `term` after the current caret. */
  public findNext(term: string): boolean {
    const positions = this.findText(term);
    if (positions.length === 0) return false;
    const next = positions.find(p => p > this.caretIndex) ?? positions[0];
    this.selection = { start: next, end: next + term.length };
    this.caretIndex = next + term.length;
    this.render();
    return true;
  }

  /** Replaces current selection if it matches, then finds next. */
  public replaceText(find: string, replacement: string): number {
    if (!find) return 0;
    this.history.pushHistory(this.elements);
    const full = this.getFullText();
    let replaced = 0;
    let offset = 0;
    let idx = full.indexOf(find, 0);
    while (idx !== -1) {
      const adjustedIdx = idx - offset;  // position shifts as we replace
      // Locate and splice into elements
      this._spliceText(adjustedIdx, find.length, replacement);
      offset += find.length - replacement.length;
      replaced++;
      idx = full.indexOf(find, idx + find.length);
    }
    if (replaced > 0) {
      this.render();
      this.history.pushHistory(this.elements);
      this.onChange?.();
    }
    return replaced;
  }

  /** Low-level helper: replaces `length` chars at flat `index` with `text`. */
  private _spliceText(index: number, length: number, text: string) {
    let currentTotal = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      const elStart = currentTotal;
      const elEnd = currentTotal + el.text.length;
      if (index >= elStart && index < elEnd) {
        const offset = index - elStart;
        el.text = el.text.substring(0, offset) + text + el.text.substring(offset + length);
        return;
      }
      currentTotal = elEnd;
    }
  }
}
