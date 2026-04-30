export class SelectTool {
  constructor(editor) {
    this.editor = editor;
    this._canvas = document.getElementById('main-canvas');
    this._box = document.getElementById('selection-box');
    this._dragging = false;
    this._dragLayer = null;
    this._startMouse = { x: 0, y: 0 };
    this._startPos = { x: 0, y: 0 };
    this._bind();
  }

  _bind() {
    this._canvas.onmousedown = e => this._onDown(e);
    window.onmousemove = e => this._onMove(e);
    window.onmouseup = () => this._onUp();
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
      if (!l.visible || curTime < l.startTime || curTime > l.startTime + l.duration) continue;
      
      const cx = this.editor.compositor.compWidth / 2 + l.transform.x;
      const cy = this.editor.compositor.compHeight / 2 + l.transform.y;
      const hw = l.transform.width / 2, hh = l.transform.height / 2;
      
      if (pt.x >= cx - hw && pt.x <= cx + hw && pt.y >= cy - hh && pt.y <= cy + hh) {
        this._dragging = true;
        this._dragLayer = l;
        this._startMouse = pt;
        this._startPos = { x: l.transform.x, y: l.transform.y };
        this.editor.selectLayer(l.id);
        return;
      }
    }
    this.editor.selectLayer(null);
  }

  _onMove(e) {
    if (!this._dragging || !this._dragLayer) return;
    const pt = this._getCanvasPt(e);
    this._dragLayer.transform.x = this._startPos.x + (pt.x - this._startMouse.x);
    this._dragLayer.transform.y = this._startPos.y + (pt.y - this._startMouse.y);
    this.updateBox();
  }

  _onUp() {
    if (this._dragging) {
      this._dragging = false;
      this.editor.saveHistory();
      this._dragLayer = null;
    }
  }

  updateBox() {
    const l = this.editor.selectedLayer;
    if (!l || this.editor.activeTool !== 'select') {
      this._box.classList.add('hidden');
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
    this._box.style.left = `${cx - w/2}px`;
    this._box.style.top = `${cy - h/2}px`;
    this._box.style.transform = `rotate(${l.transform.rotation}deg)`;
  }
}
