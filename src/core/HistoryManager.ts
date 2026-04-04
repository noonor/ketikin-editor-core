import { DocElement } from '../types';

export class HistoryManager {
  private undoStack: DocElement[][] = [];
  private redoStack: DocElement[][] = [];

  constructor(initialElements: DocElement[]) {
    this.pushHistory(initialElements, true);
  }

  public pushHistory(elements: DocElement[], initial = false) {
    this.undoStack.push(JSON.parse(JSON.stringify(elements)));
    if (!initial) {
      this.redoStack = [];
    }
  }

  public undo(): DocElement[] | null {
    if (this.undoStack.length > 1) {
      const popped = this.undoStack.pop()!;
      this.redoStack.push(popped);
      return JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1]));
    }
    return null;
  }

  public redo(): DocElement[] | null {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop()!;
      this.undoStack.push(state);
      return JSON.parse(JSON.stringify(state));
    }
    return null;
  }
}
