import { DocElement, RenderPage, RenderChar, EditorConfig } from '../../types';

export type TransformType = 'none' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-tm' | 'resize-bm' | 'resize-lm' | 'resize-rm' | 'rotate' | 'move';

export class ImageTransformer {
  public isTransforming: TransformType = 'none';
  public transformStart: { x: number, y: number, width: number, height: number, rotation: number } | null = null;
  public dropTargetIndex: number | null = null;

  public findImageAt(x: number, y: number, pageIdx: number, pages: RenderPage[], elements: DocElement[]): number | null {
    const page = pages[pageIdx];
    if (!page) return null;
    for (const line of page.lines) {
      for (const char of line.chars) {
        const el = elements[char.elementIndex];
        if (el?.elementType === 'image') {
          const cx = char.x + char.width / 2;
          const cy = char.y + char.height / 2;
          const rotation = el.imageRotation || 0;
          const rad = (-rotation * Math.PI) / 180;
          const dx = x - cx;
          const dy = y - cy;
          const ux = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
          const uy = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;
          if (ux >= char.x && ux <= char.x + char.width && uy >= char.y && uy <= char.y + char.height) {
            return char.elementIndex;
          }
        }
      }
    }
    return null;
  }

  public getHandleAt(x: number, y: number, char: RenderChar, rotation: number): TransformType {
    const cx = char.x + char.width / 2;
    const cy = char.y + char.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const rad = (-rotation * Math.PI) / 180;
    const ux = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
    const uy = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;
    const s = 12;
    if (Math.abs(ux - char.x) < s && Math.abs(uy - char.y) < s) return 'resize-tl';
    if (Math.abs(ux - (char.x + char.width)) < s && Math.abs(uy - char.y) < s) return 'resize-tr';
    if (Math.abs(ux - char.x) < s && Math.abs(uy - (char.y + char.height)) < s) return 'resize-bl';
    if (Math.abs(ux - (char.x + char.width)) < s && Math.abs(uy - (char.y + char.height)) < s) return 'resize-br';
    if (Math.abs(ux - cx) < s && Math.abs(uy - char.y) < s) return 'resize-tm';
    if (Math.abs(ux - cx) < s && Math.abs(uy - (char.y + char.height)) < s) return 'resize-bm';
    if (Math.abs(ux - char.x) < s && Math.abs(uy - cy) < s) return 'resize-lm';
    if (Math.abs(ux - (char.x + char.width)) < s && Math.abs(uy - cy) < s) return 'resize-rm';
    if (Math.abs(ux - cx) < s && Math.abs(uy - (char.y - 45)) < s) return 'rotate';
    return 'none';
  }

  public handleTransform(x: number, y: number, el: DocElement, char: RenderChar, config: EditorConfig): boolean {
    if (!this.transformStart) return false;
    const start = this.transformStart;

    if (this.isTransforming === 'rotate') {
      const cx = char.x + char.width / 2;
      const cy = char.y + char.height / 2;
      const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90;
      let snapped = (angle + 360) % 360;
      if (Math.abs(snapped % 15) < 5 || Math.abs(snapped % 15) > 10) snapped = Math.round(snapped / 15) * 15;
      el.imageRotation = snapped;

      const rad = (el.imageRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const rotatedW = (el.imageWidth! * cos) + (el.imageHeight! * sin);
      const leftBoundary = config.padding.left;
      const rightBoundary = config.width - config.padding.right;
      const currentOffset = el.imageXOffset || 0;
      const layoutCenterX = (char.x + char.width / 2) - currentOffset;
      let newMinX = layoutCenterX - rotatedW / 2 + currentOffset;
      let newMaxX = layoutCenterX + rotatedW / 2 + currentOffset;
      if (newMinX < leftBoundary) el.imageXOffset = currentOffset + (leftBoundary - newMinX);
      else if (newMaxX > rightBoundary) el.imageXOffset = currentOffset - (newMaxX - rightBoundary);
      return true;
    }

    const dx = x - start.x;
    const dy = y - start.y;
    const ratio = (start.width / start.height) || 1;

    if (this.isTransforming === 'resize-br') {
      el.imageWidth = Math.max(20, start.width + dx);
      el.imageHeight = el.imageWidth / ratio;
    } else if (this.isTransforming === 'resize-bl') {
      el.imageWidth = Math.max(20, start.width - dx);
      el.imageHeight = el.imageWidth / ratio;
    } else if (this.isTransforming === 'resize-tr') {
      el.imageWidth = Math.max(20, start.width + dx);
      el.imageHeight = el.imageWidth / ratio;
    } else if (this.isTransforming === 'resize-tl') {
      el.imageWidth = Math.max(20, start.width - dx);
      el.imageHeight = el.imageWidth / ratio;
    } else if (this.isTransforming === 'resize-tm') {
      el.imageHeight = Math.max(20, start.height - dy);
    } else if (this.isTransforming === 'resize-bm') {
      el.imageHeight = Math.max(20, start.height + dy);
    } else if (this.isTransforming === 'resize-lm') {
      el.imageWidth = Math.max(20, start.width - dx);
    } else if (this.isTransforming === 'resize-rm') {
      el.imageWidth = Math.max(20, start.width + dx);
    }
    return true;
  }
}
