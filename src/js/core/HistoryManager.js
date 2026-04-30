export class HistoryManager {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
    this._maxStates = 60;
  }

  /** Serialize only the data we can safely clone (no DOM elements) */
  _serialize(layers) {
    return layers.map(l => {
      const base = {
        id: l.id,
        assetId: l.asset ? l.asset.id : null,
        assetType: l.assetType,
        transform: { ...l.transform },
        filters: { ...l.filters },
        visible: l.visible,
        name: l.name,
        startTime: l.startTime ?? 0,
        duration: l.duration ?? 5,
      };
      if (l.assetType === 'text') {
        base.content = l.content;
        base.style = { ...l.style };
      }
      return base;
    });
  }

  saveState(layers) {
    const snapshot = this._serialize(layers);
    this._undoStack.push(snapshot);
    this._redoStack = [];
    if (this._undoStack.length > this._maxStates) this._undoStack.shift();
  }

  undo() {
    if (this._undoStack.length <= 1) return null;
    const cur = this._undoStack.pop();
    this._redoStack.push(cur);
    return this._undoStack[this._undoStack.length - 1];
  }

  redo() {
    if (!this._redoStack.length) return null;
    const next = this._redoStack.pop();
    this._undoStack.push(next);
    return next;
  }

  canUndo() { return this._undoStack.length > 1; }
  canRedo() { return this._redoStack.length > 0; }
}
