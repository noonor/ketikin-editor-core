import { DocElement, EditorConfig, RenderPage, RenderChar } from '../../types/index';

export class CanvasRenderer {
  private config: EditorConfig;
  private imageCache: Map<string, HTMLImageElement>;

  constructor(config: EditorConfig, imageCache: Map<string, HTMLImageElement>) {
    this.config = config;
    this.imageCache = imageCache;
  }

  public updateConfig(config: EditorConfig) {
    this.config = config;
  }

  public render(pages: RenderPage[], containers: HTMLElement[], selection?: { start: number, end: number } | null, elements?: DocElement[], dropTargetIndex?: number | null) {
    const dpr = window.devicePixelRatio || 1;

    pages.forEach((page, idx) => {
      let canvas = containers[idx]?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      if (canvas.width !== this.config.width * dpr || canvas.height !== this.config.height * dpr) {
        canvas.width = this.config.width * dpr;
        canvas.height = this.config.height * dpr;
        canvas.style.width = `${this.config.width}px`;
        canvas.style.height = `${this.config.height}px`;
      }

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, this.config.width, this.config.height);

      if (selection) {
        const start = Math.min(selection.start, selection.end);
        const end = Math.max(selection.start, selection.end);

        ctx.fillStyle = 'rgba(0, 120, 215, 0.3)';
        page.lines.forEach(line => {
          const selectedCharsInLine = line.chars.filter(c => c.charIndex >= start && c.charIndex < end);
          if (selectedCharsInLine.length > 0) {
            const first = selectedCharsInLine[0];
            const last = selectedCharsInLine[selectedCharsInLine.length - 1];
            ctx.fillRect(first.x, line.y, (last.x + last.width) - first.x, line.height);
          }
        });
      }

      if (dropTargetIndex !== null && dropTargetIndex !== undefined) {
        page.lines.forEach(line => {
          line.chars.forEach(char => {
            if (char.charIndex === dropTargetIndex) {
              ctx.fillStyle = '#185abd';
              ctx.fillRect(char.x - 1, line.y, 3, line.height);
            }
          });
        });
      }

      // --- PASS 1: Render 'behind' elements ---
      this.drawPageContent(ctx, page, elements, (char) => (char as any).wrapping === 'behind');

      // --- PASS 2: Render normal elements ---
      this.drawPageContent(ctx, page, elements, (char) => {
          const w = (char as any).wrapping;
          return w !== 'behind' && w !== 'front';
      });

      // --- PASS 3: Render 'front' elements ---
      this.drawPageContent(ctx, page, elements, (char) => (char as any).wrapping === 'front');
    });
  }

  private drawPageContent(ctx: CanvasRenderingContext2D, page: RenderPage, elements: DocElement[] | undefined, filter: (char: RenderChar) => boolean) {
    page.lines.forEach(line => {
      line.chars.forEach(char => {
        if (!filter(char)) return;

        const el = elements?.[char.elementIndex];

        if (el?.elementType === 'image' && el.imageUrl && char.char !== '\n') {
          const cached = this.imageCache.get(el.imageUrl);
          if (cached && cached.complete && cached.naturalWidth > 0) {
            ctx.save();
            if (el.imageFilters) {
              const f = el.imageFilters;
              let filterStr = `brightness(${f.brightness ?? 1}) contrast(${f.contrast ?? 1}) grayscale(${f.grayscale ?? 0}) saturate(${f.saturate ?? 1}) sepia(${f.sepia ?? 0})`;
              if (f.blur) filterStr += ` blur(${f.blur}px)`;
              if (f.hueRotate) filterStr += ` hue-rotate(${f.hueRotate}deg)`;
              ctx.filter = filterStr;
            }
            if (el.imageOpacity !== undefined) ctx.globalAlpha = el.imageOpacity;
            if (el.imageShadow) {
              ctx.shadowColor = el.imageShadow.color;
              ctx.shadowBlur = el.imageShadow.blur;
              ctx.shadowOffsetX = el.imageShadow.x;
              ctx.shadowOffsetY = el.imageShadow.y;
            }
            const cx = char.x + char.width / 2;
            const cy = char.y + char.height / 2;
            ctx.translate(cx, cy);
            if (el.imageRotation) ctx.rotate((el.imageRotation * Math.PI) / 180);
            if (el.imageFlip) ctx.scale(el.imageFlip.horizontal ? -1 : 1, el.imageFlip.vertical ? -1 : 1);
            ctx.translate(-cx, -cy);

            let sx = 0, sy = 0, sw = cached.naturalWidth, sh = cached.naturalHeight;
            if (el.imageCrop) {
              sx = (el.imageCrop.left / 100) * cached.naturalWidth;
              sy = (el.imageCrop.top / 100) * cached.naturalHeight;
              sw = (1 - (el.imageCrop.left + el.imageCrop.right) / 100) * cached.naturalWidth;
              sh = (1 - (el.imageCrop.top + el.imageCrop.bottom) / 100) * cached.naturalHeight;
            }

            if (el.imageBorder && el.imageBorder.width > 0) {
              ctx.strokeStyle = el.imageBorder.color;
              ctx.lineWidth = el.imageBorder.width;
              if (el.imageBorder.style === 'dashed') ctx.setLineDash([5, 5]);
              else if (el.imageBorder.style === 'dotted') ctx.setLineDash([2, 1]);
              else ctx.setLineDash([]);
              if (el.imageBorder.radius) {
                const r = el.imageBorder.radius;
                ctx.beginPath();
                ctx.roundRect(char.x, char.y, char.width, char.height, r);
                ctx.stroke();
                ctx.clip();
              } else ctx.strokeRect(char.x, char.y, char.width, char.height);
            }
            ctx.drawImage(cached, sx, sy, sw, sh, char.x, char.y, char.width, char.height);
            ctx.restore();
          } else {
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(char.x, char.y, char.width, char.height);
            ctx.fillStyle = '#aaa';
            ctx.font = '13px Arial';
            ctx.fillText('⏳ Loading image...', char.x + 10, char.y + char.height / 2);
          }
          return;
        }

        if (char.backgroundColor) {
          ctx.fillStyle = char.backgroundColor;
          ctx.fillRect(char.x, line.y, char.width, line.height);
        }

        const fontName = el?.fontFamily || 'Arial';
        ctx.font = `${char.italic ? 'italic ' : ''}${char.bold ? 'bold ' : ''}${char.fontSize}px ${fontName}`;
        ctx.fillStyle = char.color || 'black';
        ctx.fillText(char.char, char.x, char.y + char.ascent);

        if (char.underline) {
          ctx.strokeStyle = char.color || 'black';
          ctx.lineWidth = Math.max(1, char.fontSize / 15);
          ctx.beginPath();
          ctx.moveTo(char.x, char.y + char.ascent + 2);
          ctx.lineTo(char.x + char.width, char.y + char.ascent + 2);
          ctx.stroke();
        }
        
        if (char.strikethrough) {
          ctx.strokeStyle = char.color || 'black';
          ctx.lineWidth = Math.max(1, char.fontSize / 15);
          ctx.beginPath();
          ctx.moveTo(char.x, char.y + char.ascent / 1.5);
          ctx.lineTo(char.x + char.width, char.y + char.ascent / 1.5);
          ctx.stroke();
        }
      });
    });
  }
}
