export class SelectTool {
  constructor(editor) {
    this.editor = editor;
    this._canvas = document.getElementById('main-canvas');
    this._box = document.getElementById('selection-box');
    this._dragging = false;
    this._resizing = false;
    this._resizeHandle = null;
    this._dragLayer = null;
    this._startMouse = { x: 0, y: 0 };
    this._startPos = { x: 0, y: 0, w: 0, h: 0 };
    this._bind();
  }

  _bind() {
    this._canvas.addEventListener('mousedown', e => this._onDown(e));
    window.addEventListener('mousemove', e => this._onMove(e));
    window.addEventListener('mouseup', () => this._onUp());

    // Corner handle resize listeners
    if (this._box) {
      this._box.querySelectorAll('.sel-handle').forEach(h => {
        h.addEventListener('mousedown', e => {
          e.stopPropagation();
          this._startResize(e, h.dataset.handle);
        });
      });
    }
  }

  _getCanvasPt(e) {
    const rect = this._canvas.getBoundingClientRect();
    const scaleX = this.editor.compositor.compWidth / rect.width;
    const scaleY = this.editor.compositor.compHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _onDown(e) {
    if (this.editor.activeTool !== 'select') return;
    const pt = this._getCanvasPt(e);
    const layers = [...this.editor.compositor.layers].reverse();
    const curTime = this.editor.timeline.currentTime;

    for (const l of layers) {
      if (!l.visible) continue;
      if (l.duration > 0 && (curTime < l.startTime || curTime > l.startTime + l.duration)) continue;

      const cx = this.editor.compositor.compWidth / 2 + l.transform.x;
      const cy = this.editor.compositor.compHeight / 2 + l.transform.y;
      const hw = l.transform.width / 2;
      const hh = l.transform.height / 2;

      if (pt.x >= cx - hw && pt.x <= cx + hw && pt.y >= cy - hh && pt.y <= cy + hh) {
        this._dragging = true;
        this._dragLayer = l;
        this._startMouse = pt;
        this._startPos = { x: l.transform.x, y: l.transform.y, w: l.transform.width, h: l.transform.height };
        this.editor.selectLayer(l.id);
        return;
      }
    }
    
    this.editor.selectLayer(null);
  }

  _startResize(e, handle) {
    const l = this.editor.selectedLayer;
    if (!l) return;
    this._resizing = true;
    this._resizeHandle = handle;
    this._dragLayer = l;
    this._startMouse = this._getCanvasPt(e);
    this._startPos = { x: l.transform.x, y: l.transform.y, w: l.transform.width, h: l.transform.height };
  }

  _onMove(e) {
    if (this._resizing && this._dragLayer) {
      const pt = this._getCanvasPt(e);
      const dx = pt.x - this._startMouse.x;
      const dy = pt.y - this._startMouse.y;

      let newW = this._startPos.w;
      let newH = this._startPos.h;

      if (this._resizeHandle === 'br') {
        newW = Math.max(20, this._startPos.w + dx * 2);
        newH = Math.max(20, this._startPos.h + dy * 2);
      } else if (this._resizeHandle === 'bl') {
        newW = Math.max(20, this._startPos.w - dx * 2);
        newH = Math.max(20, this._startPos.h + dy * 2);
      } else if (this._resizeHandle === 'tr') {
        newW = Math.max(20, this._startPos.w + dx * 2);
        newH = Math.max(20, this._startPos.h - dy * 2);
      } else if (this._resizeHandle === 'tl') {
        newW = Math.max(20, this._startPos.w - dx * 2);
        newH = Math.max(20, this._startPos.h - dy * 2);
      }

      this._dragLayer.transform.width = Math.round(newW);
      this._dragLayer.transform.height = Math.round(newH);
      this.editor.ui.inspector.refresh(this._dragLayer);
      this.updateBox();
      return;
    }

    if (this._dragging && this._dragLayer) {
      const pt = this._getCanvasPt(e);
      this._dragLayer.transform.x = Math.round(this._startPos.x + (pt.x - this._startMouse.x));
      this._dragLayer.transform.y = Math.round(this._startPos.y + (pt.y - this._startMouse.y));
      this.editor.ui.inspector.refresh(this._dragLayer);
      this.updateBox();
    }
  }

  _onUp() {
    if (this._dragging || this._resizing) {
      this._dragging = false;
      this._resizing = false;
      this._resizeHandle = null;
      this._dragLayer = null;
      this.editor.saveHistory();
    }
  }

  updateBox() {
    const l = this.editor.selectedLayer;
    if (!l || !this._box || this.editor.activeTool !== 'select') {
      this._box?.classList.add('hidden');
      return;
    }

    const rect = this._canvas.getBoundingClientRect();
    const scale = rect.width / this.editor.compositor.compWidth;

    const w = l.transform.width * scale;
    const h = l.transform.height * scale;
    const cx = rect.width / 2 + l.transform.x * scale;
    const cy = rect.height / 2 + l.transform.y * scale;

    this._box.classList.remove('hidden');
    this._box.style.width = `${w}px`;
    this._box.style.height = `${h}px`;
    this._box.style.left = `${cx - w / 2}px`;
    this._box.style.top = `${cy - h / 2}px`;
    this._box.style.transform = `rotate(${l.transform.rotation || 0}deg)`;
  }
}
