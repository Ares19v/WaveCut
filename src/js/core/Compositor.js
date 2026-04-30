export class Compositor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.layers = [];
    this._running = false;
    this._zoom = 1;
    this.compWidth = 1920;
    this.compHeight = 1080;
    this.currentTime = 0;
    this._fitToContainer();
    window.onresize = () => this._fitToContainer();
  }

  _fitToContainer() {
    const area = document.getElementById('canvas-area');
    if (!area) return;
    const w = area.clientWidth - 40;
    const h = area.clientHeight - 40;
    const scale = Math.min(w / this.compWidth, h / this.compHeight, 1);
    this.canvas.style.width = `${this.compWidth * scale * this._zoom}px`;
    this.canvas.style.height = `${this.compHeight * scale * this._zoom}px`;
    document.getElementById('zoom-level').textContent = `${Math.round(scale * this._zoom * 100)}%`;
  }

  setZoom(z) { this._zoom = Math.max(0.1, z); this._fitToContainer(); }

  start() { this._running = true; this._loop(); }
  stop() { this._running = false; }

  _loop() {
    if (!this._running) return;
    this._render();
    requestAnimationFrame(() => this._loop());
  }

  addLayer(asset) {
    const layer = {
      id: `layer-${Date.now()}`,
      name: asset.name,
      asset,
      assetType: asset.assetType,
      startTime: 0,
      duration: asset.duration || 5,
      transform: { x: 0, y: 0, width: asset.width, height: asset.height, rotation: 0, opacity: 1 },
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0 },
      visible: true
    };
    this.layers.push(layer);
    return layer;
  }

  addTextLayer(content) {
    const layer = {
      id: `text-${Date.now()}`,
      name: `Text: ${content.slice(0, 8)}`,
      assetType: 'text',
      content,
      startTime: 0,
      duration: 5,
      transform: { x: 0, y: 0, width: 600, height: 100, rotation: 0, opacity: 1 },
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0 },
      style: { fontSize: 80, fontFamily: 'Inter', color: '#ffffff', bold: false, italic: false, shadow: false },
      visible: true
    };
    this.layers.push(layer);
    return layer;
  }

  removeLayer(id) { this.layers = this.layers.filter(l => l.id !== id); }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.compWidth, this.compHeight);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.compWidth, this.compHeight);

    this.layers.forEach(l => {
      if (!l.visible) return;
      // Check if current time is within clip range
      if (this.currentTime < l.startTime || this.currentTime > l.startTime + l.duration) return;

      ctx.save();
      const f = l.filters;
      ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) hue-rotate(${f.hue}deg)`;
      ctx.globalAlpha = l.transform.opacity;

      const cx = this.compWidth/2 + l.transform.x;
      const cy = this.compHeight/2 + l.transform.y;
      ctx.translate(cx, cy);
      ctx.rotate(l.transform.rotation * Math.PI / 180);

      if (l.assetType === 'text') {
        const s = l.style;
        ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? 'bold ' : ''}${s.fontSize}px "${s.fontFamily}"`;
        ctx.fillStyle = s.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.content, 0, 0);
      } else if (l.asset?.data) {
        const w = l.transform.width, h = l.transform.height;
        ctx.drawImage(l.asset.data, -w/2, -h/2, w, h);
      }
      ctx.restore();
    });
  }

  toBlob(type, q) { return new Promise(res => this.canvas.toBlob(res, type, q)); }
}
