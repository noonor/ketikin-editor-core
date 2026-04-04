import { DocElement, EditorConfig, RenderPage } from '../../types/index';
import { LayoutEngine } from './LayoutEngine';
import { CanvasRenderer } from './CanvasRenderer';

export class RenderEngine {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private layoutEngine: LayoutEngine;
  private canvasRenderer: CanvasRenderer;

  constructor(config: EditorConfig) {
    this.layoutEngine = new LayoutEngine(config, this.imageCache);
    this.canvasRenderer = new CanvasRenderer(config, this.imageCache);
  }

  public updateConfig(config: EditorConfig) {
    this.layoutEngine.updateConfig(config);
    this.canvasRenderer.updateConfig(config);
  }

  public layout(elements: DocElement[]): RenderPage[] {
    return this.layoutEngine.layout(elements);
  }

  public render(pages: RenderPage[], containers: HTMLElement[], selection?: { start: number, end: number } | null, elements?: DocElement[], dropTargetIndex?: number | null) {
    this.canvasRenderer.render(pages, containers, selection, elements, dropTargetIndex);
  }
}
