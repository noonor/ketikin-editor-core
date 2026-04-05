import { DocElement, EditorConfig, RenderPage, RenderLine, RenderChar } from '../../types/index';

export class LayoutEngine {
  private config: EditorConfig;
  private offscreenCtx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement>;

  constructor(config: EditorConfig, imageCache: Map<string, HTMLImageElement>) {
    this.config = config;
    this.imageCache = imageCache;
    const canvas = document.createElement('canvas');
    this.offscreenCtx = canvas.getContext('2d')!;
  }

  public updateConfig(config: EditorConfig) {
    this.config = config;
  }

  private getFontString(element: DocElement): string {
    const style = element.italic ? 'italic ' : '';
    const weight = element.bold ? 'bold ' : '';
    return `${style}${weight}${element.fontSize}px ${element.fontFamily || 'Calibri'}`;
  }

  private applyLineAlignment(line: RenderLine, elements: DocElement[], maxWidth: number) {
    if (line.chars.length <= 0) return;
    const firstChar = line.chars[0];
    const align = elements[firstChar.elementIndex]?.align || 'left';
    if (align === 'left') return;

    const lastChar = line.chars[line.chars.length - 1];
    const isNewLine = lastChar.char === '\n' || lastChar.char === '\f';
    if (isNewLine && line.chars.length === 1) return;

    const visibleLastChar = isNewLine && line.chars.length > 1 ? line.chars[line.chars.length - 2] : lastChar;
    const currentLineWidth = (visibleLastChar.x + visibleLastChar.width) - firstChar.x;
    const extraSpace = maxWidth - currentLineWidth;

    if (extraSpace <= 0) return;

    if (align === 'center') {
      const shift = extraSpace / 2;
      line.chars.forEach(c => c.x += shift);
    } else if (align === 'right') {
      line.chars.forEach(c => c.x += extraSpace);
    } else if (align === 'justify' && !isNewLine) {
      let spaceCount = 0;
      line.chars.forEach(c => { if (c.char === ' ') spaceCount++ });
      if (spaceCount > 0) {
        const spaceAdd = extraSpace / spaceCount;
        let currentShift = 0;
        line.chars.forEach(c => {
          c.x += currentShift;
          if (c.char === ' ') currentShift += spaceAdd;
        });
      }
    }
  }

  public layout(elements: DocElement[]): RenderPage[] {
    const pages: RenderPage[] = [];
    let currentPage: RenderPage = { lines: [], pageIndex: 0 };
    pages.push(currentPage);

    let currentY = this.config.padding.top;
    let currentLine: RenderLine = { chars: [], y: currentY, height: 0, startIndex: 0, endIndex: 0 };
    let currentX = this.config.padding.left;

    const maxWidth = this.config.width - this.config.padding.left - this.config.padding.right;
    const maxHeight = this.config.height - this.config.padding.bottom;

    let globalCharIndex = 0;

    elements.forEach((element, elementIdx) => {
      // ── IMAGE BLOCK ──────────────────────────────────────────────
      if (element.elementType === 'image' && element.imageUrl) {
        const wrapping = element.imageWrapping || 'topBottom';
        const imgW = Math.min(element.imageWidth || 300, maxWidth);
        const imgH = element.imageHeight || 200;

        if (wrapping === 'inline') {
            if (currentX + imgW > maxWidth && currentLine.chars.length > 0) {
                this.applyLineAlignment(currentLine, elements, maxWidth);
                currentLine.startIndex = currentLine.chars[0]?.charIndex ?? globalCharIndex;
                currentLine.endIndex = currentLine.chars.length > 0 ? currentLine.chars[currentLine.chars.length-1].charIndex + 1 : globalCharIndex;
                currentPage.lines.push({ ...currentLine });
                currentY += currentLine.height || element.fontSize * 1.2;
                currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
                currentX = this.config.padding.left;
            }
            
            if (currentY + imgH > maxHeight) {
                currentPage = { lines: [], pageIndex: pages.length };
                pages.push(currentPage);
                currentY = this.config.padding.top;
                currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
                currentX = this.config.padding.left;
            }

            const imgChar: RenderChar = {
                char: '\u{1F5BC}', elementIndex: elementIdx, charIndex: globalCharIndex++,
                x: currentX, y: currentY, width: imgW, height: imgH, ascent: imgH, fontSize: element.fontSize,
            };
            (imgChar as any).wrapping = 'inline';
            currentLine.chars.push(imgChar);
            currentLine.height = Math.max(currentLine.height, imgH);
            currentX += imgW;

            if (!this.imageCache.has(element.imageUrl)) {
                const img = new Image();
                img.src = element.imageUrl;
                this.imageCache.set(element.imageUrl, img);
            }
            return;
        }

        if (wrapping === 'behind' || wrapping === 'front' || wrapping === 'square' || wrapping === 'tight') {
            let imgX = (element.imagePosition?.horizontal?.value ?? (this.config.padding.left + (maxWidth - imgW) / 2));
            let imgY = (element.imagePosition?.vertical?.value ?? currentY);
            
            imgX += (element.imageXOffset || 0);

            const imgChar: RenderChar = {
                char: '\u{1F5BC}', elementIndex: elementIdx, charIndex: globalCharIndex++,
                x: imgX, y: imgY, width: imgW, height: imgH, ascent: imgH, fontSize: element.fontSize,
            };
            (imgChar as any).wrapping = wrapping;

            // Page handling for floating images
            let targetPage = currentPage;
            // ... (page handling logic could be expanded)

            targetPage.lines.push({ chars: [imgChar], y: imgY, height: 0, startIndex: imgChar.charIndex, endIndex: imgChar.charIndex + 1 });
            
            if (!this.imageCache.has(element.imageUrl)) {
                const img = new Image(); img.src = element.imageUrl; this.imageCache.set(element.imageUrl, img);
            }
            return;
        }

        // Default: topBottom (Block level)
        if (currentLine.chars.length > 0) {
          this.applyLineAlignment(currentLine, elements, maxWidth);
          currentLine.startIndex = currentLine.chars[0].charIndex;
          currentLine.endIndex = currentLine.chars[currentLine.chars.length - 1].charIndex + 1;
          currentPage.lines.push({ ...currentLine });
          currentY += currentLine.height || element.fontSize * 1.2;
          currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
          currentX = this.config.padding.left;
        }

        if (currentY + imgH > maxHeight) {
          currentPage = { lines: [], pageIndex: pages.length };
          pages.push(currentPage);
          currentY = this.config.padding.top;
          currentLine.y = currentY;
          currentLine.startIndex = globalCharIndex;
          currentLine.endIndex = globalCharIndex;
        }

        const align = element.align || 'left';
        let imgX = this.config.padding.left;
        if (align === 'center') imgX = this.config.padding.left + (maxWidth - imgW) / 2;
        else if (align === 'right') imgX = this.config.padding.left + (maxWidth - imgW);
        imgX += (element.imageXOffset || 0);

        const imgChar: RenderChar = {
          char: '\u{1F5BC}', elementIndex: elementIdx, charIndex: globalCharIndex++,
          x: imgX, y: currentY, width: imgW, height: imgH, ascent: imgH, fontSize: element.fontSize,
        };
        const imgLine: RenderLine = { chars: [imgChar], y: currentY, height: imgH, startIndex: imgChar.charIndex, endIndex: imgChar.charIndex + 1 };
        currentPage.lines.push(imgLine);
        currentY += imgH + 8;

        const nlChar: RenderChar = {
          char: '\n', elementIndex: elementIdx, charIndex: globalCharIndex++,
          x: this.config.padding.left, y: currentY, width: 1, height: element.fontSize * 1.2,
          ascent: element.fontSize, fontSize: element.fontSize,
        };
        currentPage.lines.push({ chars: [nlChar], y: currentY, height: element.fontSize * 1.2, startIndex: nlChar.charIndex, endIndex: nlChar.charIndex + 1 });
        currentY += element.fontSize * 1.2;

        currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
        currentX = this.config.padding.left;

        if (!this.imageCache.has(element.imageUrl)) {
          const img = new Image(); img.src = element.imageUrl; this.imageCache.set(element.imageUrl, img);
        }
        return;
      }
      // ── TEXT BLOCK ───────────────────────────────────────────────
      const font = this.getFontString(element);
      this.offscreenCtx.font = font;

      const words = element.text.split(/(\s|\n|\f)/);

      words.forEach((word) => {
        if (word === '\n' || word === '\f') {
          const charHeight = element.fontSize * 1.2;
          const renderChar: RenderChar = {
            char: word,
            elementIndex: elementIdx,
            charIndex: globalCharIndex++,
            x: currentX,
            y: currentY,
            width: 1,
            height: charHeight,
            ascent: element.fontSize,
            fontSize: element.fontSize,
            bold: element.bold,
            italic: element.italic,
            underline: element.underline,
            strikethrough: element.strikethrough,
            backgroundColor: element.backgroundColor,
            subscript: element.subscript,
            superscript: element.superscript,
            color: element.color
          };
          currentLine.chars.push(renderChar);
          currentLine.height = Math.max(currentLine.height, charHeight);

          this.applyLineAlignment(currentLine, elements, maxWidth);
          currentLine.startIndex = currentLine.chars[0].charIndex;
          currentLine.endIndex = currentLine.chars[currentLine.chars.length - 1].charIndex + 1;
          currentPage.lines.push({ ...currentLine });

          const lineHeightMult = elements[renderChar.elementIndex]?.lineHeight || 1.0;

          if (word === '\f') {
            currentPage = { lines: [], pageIndex: pages.length };
            pages.push(currentPage);
            currentY = this.config.padding.top;
          } else {
            const spacingAfter = element.spacingAfter || 0;
            currentY += (currentLine.height || charHeight) * lineHeightMult + spacingAfter;

            if (currentY + charHeight > maxHeight) {
              currentPage = { lines: [], pageIndex: pages.length };
              pages.push(currentPage);
              currentY = this.config.padding.top;
            }
          }

          currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
          currentX = this.config.padding.left;
          return;
        }

        if (word === '') return;

        if (word === '\t') {
          const elementTabStopData = elements[elementIdx]?.tabStops;
          
          let nextTabX: number;
          const relativeX = currentX - this.config.padding.left;
          
          if (elementTabStopData && elementTabStopData.length > 0) {
              const nextStop = elementTabStopData.find(ts => ts.position > relativeX);
              if (nextStop) {
                  nextTabX = this.config.padding.left + nextStop.position;
              } else {
                  const defaultTabStop = 48; // px
                  nextTabX = this.config.padding.left + Math.ceil((relativeX + 1) / defaultTabStop) * defaultTabStop;
              }
          } else {
              const defaultTabStop = 48; // px
              nextTabX = this.config.padding.left + Math.ceil((relativeX + 1) / defaultTabStop) * defaultTabStop;
          }

          const charWidth = Math.max(10, nextTabX - currentX);
          
          const charHeight = element.fontSize * 1.2;
          const renderChar: RenderChar = {
            char: '\t',
            elementIndex: elementIdx,
            charIndex: globalCharIndex++,
            x: currentX,
            y: currentY,
            width: charWidth,
            height: charHeight,
            ascent: element.fontSize,
            fontSize: element.fontSize,
            bold: element.bold,
            italic: element.italic,
            underline: element.underline,
            color: element.color
          };
          currentLine.chars.push(renderChar);
          currentLine.height = Math.max(currentLine.height, charHeight);
          currentX += charWidth;
          return;
        }

        const wordWidth = this.offscreenCtx.measureText(word).width;

        // Wrap word to next line if it overflows (only if NOT at line start to avoid infinite loop)
        if (currentX + wordWidth > this.config.padding.left + maxWidth && currentLine.chars.length > 0) {
          this.applyLineAlignment(currentLine, elements, maxWidth);
          currentLine.startIndex = currentLine.chars[0].charIndex;
          currentLine.endIndex = currentLine.chars[currentLine.chars.length - 1].charIndex + 1;
          currentPage.lines.push({ ...currentLine });

          const lineHeightMult = elements[elementIdx]?.lineHeight || 1.0;
          currentY += (currentLine.height || element.fontSize * 1.2) * lineHeightMult;

          if (currentY + (element.fontSize * 1.2) > maxHeight) {
            currentPage = { lines: [], pageIndex: pages.length };
            pages.push(currentPage);
            currentY = this.config.padding.top;
          }

          currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
          currentX = this.config.padding.left;
        }

        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          const isSub = element.subscript;
          const isSup = element.superscript;
          const displayFontSize = (isSub || isSup) ? element.fontSize * 0.65 : element.fontSize;
          
          this.offscreenCtx.font = `${element.italic ? 'italic ' : ''}${element.bold ? 'bold ' : ''}${displayFontSize}px ${element.fontFamily || 'Calibri'}`;
          
          const charWidth = this.offscreenCtx.measureText(char).width;
          const charHeight = element.fontSize * 1.2;

          // Per-char page break (only if NOT at line start to avoid infinite loop on very wide chars)
          if (currentX + charWidth > this.config.padding.left + maxWidth && currentLine.chars.length > 0) {
            this.applyLineAlignment(currentLine, elements, maxWidth);
            currentLine.startIndex = currentLine.chars[0].charIndex;
            currentLine.endIndex = currentLine.chars[currentLine.chars.length - 1].charIndex + 1;
            currentPage.lines.push({ ...currentLine });

            const lineHeightMult = elements[elementIdx]?.lineHeight || 1.0;
            currentY += (currentLine.height || element.fontSize * 1.2) * lineHeightMult;

            if (currentY + (element.fontSize * 1.2) > maxHeight) {
              currentPage = { lines: [], pageIndex: pages.length };
              pages.push(currentPage);
              currentY = this.config.padding.top;
            }

            currentLine = { chars: [], y: currentY, height: 0, startIndex: globalCharIndex, endIndex: globalCharIndex };
            currentX = this.config.padding.left;
          }

          // Compute charY AFTER potential page break so it uses the updated currentY
          let charY = currentY;
          if (isSub) charY += element.fontSize * 0.3;
          if (isSup) charY -= element.fontSize * 0.3;

          const renderChar: RenderChar = {
            char,
            elementIndex: elementIdx,
            charIndex: globalCharIndex++,
            x: currentX,
            y: charY,
            width: charWidth,
            height: charHeight,
            ascent: displayFontSize,
            fontSize: displayFontSize,
            bold: element.bold,
            italic: element.italic,
            underline: element.underline,
            strikethrough: element.strikethrough,
            backgroundColor: element.backgroundColor,
            subscript: element.subscript,
            superscript: element.superscript,
            color: element.color
          };

          currentLine.chars.push(renderChar);
          currentLine.height = Math.max(currentLine.height, charHeight);
          currentX += charWidth;
        }
      });
    });

    // Always push the last line, even if it's empty, to provide a valid cursor position at the end of total pages.
    this.applyLineAlignment(currentLine, elements, maxWidth);
    currentLine.startIndex = currentLine.chars[0]?.charIndex ?? globalCharIndex;
    currentLine.endIndex = currentLine.chars.length > 0 ? currentLine.chars[currentLine.chars.length - 1].charIndex + 1 : globalCharIndex;
    currentPage.lines.push(currentLine);

    return pages.map((p, i) => ({ ...p, pageIndex: i }));
  }
}
