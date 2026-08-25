export class Compositor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);
    this.ctx = this.canvas.getContext('2d');
    this.layers = [];
    this._running = false;
    this._zoom = 1;
    this.compWidth = 1920;
    this.compHeight = 1080;
    this.aspectRatio = '16:9';
    this.currentTime = 0;

    // Set internal resolution buffer
    this.canvas.width = this.compWidth;
    this.canvas.height = this.compHeight;

    this._fitToContainer();
    window.addEventListener('resize', () => this._fitToContainer());
  }

  setAspectRatio(ratio) {
    this.aspectRatio = ratio;
    const map = {
      '16:9': [1920, 1080],
      '9:16': [1080, 1920],
      '1:1': [1080, 1080],
      '4:5': [1080, 1350],
      '21:9': [2560, 1080]
    };
    const dims = map[ratio] || [1920, 1080];
    this.compWidth = dims[0];
    this.compHeight = dims[1];
    this.canvas.width = this.compWidth;
    this.canvas.height = this.compHeight;
    
    const badge = document.getElementById('monitor-res-badge');
    if (badge) badge.textContent = `${this.compWidth} × ${this.compHeight}`;
    
    this._fitToContainer();
  }

  _fitToContainer() {
    const area = document.getElementById('canvas-area');
    if (!area || !this.canvas) return;
    const w = area.clientWidth - 48;
    const h = area.clientHeight - 48;
    if (w <= 0 || h <= 0) return;
    
    const scale = Math.min(w / this.compWidth, h / this.compHeight, 1);
    const renderW = Math.round(this.compWidth * scale * this._zoom);
    const renderH = Math.round(this.compHeight * scale * this._zoom);

    this.canvas.style.width = `${renderW}px`;
    this.canvas.style.height = `${renderH}px`;
    
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = `${Math.round(scale * this._zoom * 100)}%`;
  }

  setZoom(z) {
    this._zoom = Math.max(0.1, Math.min(5, z));
    this._fitToContainer();
  }

  start() {
    this._running = true;
    this._loop();
  }

  stop() {
    this._running = false;
  }

  _loop() {
    if (!this._running) return;
    this._render();
    requestAnimationFrame(() => this._loop());
  }

  addLayer(asset) {
    // Determine reasonable initial scale that fits within composition
    let w = asset.width || 1280;
    let h = asset.height || 720;
    if (w > this.compWidth || h > this.compHeight) {
      const s = Math.min(this.compWidth / w, this.compHeight / h) * 0.9;
      w = Math.round(w * s);
      h = Math.round(h * s);
    }

    const layer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: asset.name,
      asset,
      assetType: asset.assetType,
      startTime: 0,
      duration: asset.duration || 5,
      transform: {
        x: 0,
        y: 0,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        flipH: false,
        flipV: false
      },
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        sepia: 0
      },
      visible: true
    };
    this.layers.push(layer);
    return layer;
  }

  addTextLayer(content = '4D TESSERACT', stylePreset = 'title') {
    const styleDefaults = {
      title: { fontSize: 80, fontFamily: 'Space Grotesk', color: '#ffffff', bold: true, italic: false, glow: true, shadow: true },
      hologram: { fontSize: 72, fontFamily: 'Outfit', color: '#00f0ff', bold: true, italic: false, glow: true, shadow: false },
      timecode: { fontSize: 60, fontFamily: 'JetBrains Mono', color: '#f5b041', bold: false, italic: false, glow: false, shadow: true },
      minimal: { fontSize: 52, fontFamily: 'Inter', color: '#ffffff', bold: false, italic: false, glow: false, shadow: false }
    };

    const style = styleDefaults[stylePreset] || styleDefaults.title;

    const layer = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `Text: ${content.slice(0, 10)}`,
      assetType: 'text',
      content,
      startTime: 0,
      duration: 5,
      transform: {
        x: 0,
        y: 0,
        width: 800,
        height: 140,
        rotation: 0,
        opacity: 1,
        flipH: false,
        flipV: false
      },
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        sepia: 0
      },
      style: { ...style },
      visible: true
    };
    this.layers.push(layer);
    return layer;
  }

  removeLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
  }

  _render() {
    const ctx = this.ctx;
    const w = this.compWidth;
    const h = this.compHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const time = this.currentTime;

    this.layers.forEach(l => {
      if (!l.visible) return;
      // If duration is defined and time is out of range, skip
      if (l.duration > 0 && (time < l.startTime || time > l.startTime + l.duration)) {
        return;
      }

      ctx.save();
      const f = l.filters || {};
      const brightness = f.brightness ?? 100;
      const contrast = f.contrast ?? 100;
      const saturate = f.saturation ?? 100;
      const hue = f.hue ?? 0;
      const blur = f.blur ?? 0;
      const sepia = f.sepia ?? 0;

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg) blur(${blur}px) sepia(${sepia}%)`;
      ctx.globalAlpha = l.transform.opacity ?? 1;

      const cx = w / 2 + l.transform.x;
      const cy = h / 2 + l.transform.y;
      ctx.translate(cx, cy);
      ctx.rotate((l.transform.rotation || 0) * Math.PI / 180);

      const scaleX = l.transform.flipH ? -1 : 1;
      const scaleY = l.transform.flipV ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      if (l.assetType === 'text') {
        const s = l.style || {};
        const fontSize = s.fontSize || 60;
        const fontFam = s.fontFamily || 'Space Grotesk';
        const weight = s.bold ? 'bold ' : '';
        const italic = s.italic ? 'italic ' : '';
        
        ctx.font = `${italic}${weight}${fontSize}px "${fontFam}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (s.glow) {
          ctx.shadowColor = s.color || '#f5b041';
          ctx.shadowBlur = 20;
        } else if (s.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = s.color || '#ffffff';
        
        // Multi-line support
        const lines = (l.content || '').split('\n');
        const lineHeight = fontSize * 1.2;
        const startY = -((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, idx) => {
          ctx.fillText(line, 0, startY + idx * lineHeight);
        });

      } else if (l.assetType === 'image' && l.asset?.data) {
        const lw = l.transform.width;
        const lh = l.transform.height;
        ctx.drawImage(l.asset.data, -lw / 2, -lh / 2, lw, lh);

      } else if (l.assetType === 'video' && l.asset?.data) {
        const lw = l.transform.width;
        const lh = l.transform.height;
        const vid = l.asset.data;
        if (vid.readyState >= 2) {
          ctx.drawImage(vid, -lw / 2, -lh / 2, lw, lh);
        }
      }

      ctx.restore();
    });
  }

  toBlob(type = 'image/png', quality = 0.95) {
    return new Promise(resolve => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }
}
