import type { Editor } from './Editor';

export class InputHandler {
  private editor: Editor;
  private isMouseDown: boolean = false;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  public attach() {
    const container = this.editor.getContainer();
    container.addEventListener('keydown', this.handleKeyDown.bind(this));
    container.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    container.addEventListener('copy', this.handleCopy.bind(this));
    container.addEventListener('paste', this.handlePaste.bind(this));
    if (container.parentElement) {
      container.parentElement.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }
  }

  private handleWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomStep = 0.1;
      let newScale = this.editor.getScale();
      if (e.deltaY < 0) newScale = Math.min(3, newScale + zoomStep);
      else newScale = Math.max(0.25, newScale - zoomStep);
      this.editor.setScale(newScale);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') { e.preventDefault(); this.editor.setScale(Math.min(3, this.editor.getScale() + 0.1)); return; }
      if (e.key === '-') { e.preventDefault(); this.editor.setScale(Math.max(0.25, this.editor.getScale() - 0.1)); return; }
      if (e.key === '0') { e.preventDefault(); this.editor.setScale(1); return; }

      const key = e.key.toLowerCase();
      if (key === 'z') { e.preventDefault(); this.editor.undo(); return; }
      if (key === 'y') { e.preventDefault(); this.editor.redo(); return; }
      if (key === 'a') { e.preventDefault(); this.editor.selectAll(); return; }
      if (key === 'b') { e.preventDefault(); this.editor.toggleFormat('bold'); return; }
      if (key === 'i') { e.preventDefault(); this.editor.toggleFormat('italic'); return; }
      if (key === 'u') { e.preventDefault(); this.editor.toggleFormat('underline'); return; }
      if (key === 's') { e.preventDefault(); (window as any).ketikinSave?.(); return; }

      if (key === 'l') { e.preventDefault(); this.editor.setAlignment('left'); return; }
      if (key === 'e') { e.preventDefault(); this.editor.setAlignment('center'); return; }
      if (key === 'r') { e.preventDefault(); this.editor.setAlignment('right'); return; }
      if (key === 'j') { e.preventDefault(); this.editor.setAlignment('justify'); return; }
    }
    if (e.key === 'Backspace') { e.preventDefault(); this.editor.deleteBackward(); return; }
    if (e.key === 'Delete') { e.preventDefault(); this.editor.deleteForward(); return; }
    if (e.key === 'Enter') { e.preventDefault(); this.editor.insertText('\n'); return; }
    if (e.key === 'Tab') { e.preventDefault(); this.editor.insertText('\t'); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.editor.moveCaret(-1, e.shiftKey); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.editor.moveCaret(1, e.shiftKey); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); this.editor.moveCaretLine(-1, e.shiftKey); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); this.editor.moveCaretLine(1, e.shiftKey); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.editor.insertText(e.key);
    }
  }

  private handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const pageIdx = this.editor.pageContainers.findIndex(c => c.contains(target) || c === target);
    if (pageIdx !== -1) {
      const rect = this.editor.pageContainers[pageIdx].getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.editor.getScale();
      const y = (e.clientY - rect.top) / this.editor.getScale();
      this.editor.handlePageMouseDown(x, y, pageIdx, e.shiftKey);
      this.isMouseDown = true;
    } else {
      if (!target.closest('.ketikin-editor-ui')) this.editor.deselectAll();
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isMouseDown) return;
    const target = e.target as HTMLElement;
    const pageIdx = this.editor.pageContainers.findIndex(c => c.contains(target));
    if (pageIdx === -1) return;
    const rect = this.editor.pageContainers[pageIdx].getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.editor.getScale();
    const y = (e.clientY - rect.top) / this.editor.getScale();
    this.editor.handlePageMouseMove(x, y, pageIdx, target);
  }

  private handleMouseUp() {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.editor.handlePageMouseUp();
    }
  }

  private handleDoubleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const pageIdx = this.editor.pageContainers.findIndex(c => c.contains(target) || c === target);
    if (pageIdx !== -1) {
      const rect = this.editor.pageContainers[pageIdx].getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.editor.getScale();
      const y = (e.clientY - rect.top) / this.editor.getScale();
      this.editor.handlePageDoubleClick(x, y, pageIdx);
    }
  }

  private handleCopy(e: ClipboardEvent) {
    const text = this.editor.getSelectedText();
    if (text && e.clipboardData) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
    }
  }

  private handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text/plain');
    if (text) {
      e.preventDefault();
      this.editor.insertText(text);
    }
  }
}
