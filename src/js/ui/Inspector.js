export class Inspector {
  constructor(editor) {
    this.editor = editor;
    this._currentLayer = null;
    this._bindControls();
  }

  _bindControls() {
    // Transform Sliders & Inputs
    const sliders = [
      { id: 'prop-rotate', lbl: 'rotate-val', key: 'transform.rotation', fmt: v => `${v}°` },
      { id: 'prop-opacity', lbl: 'opacity-val', key: 'transform.opacity', fmt: v => `${v}%`, scale: 0.01 },
      { id: 'f-brightness', lbl: 'brightness-val', key: 'filters.brightness', fmt: v => v },
      { id: 'f-contrast', lbl: 'contrast-val', key: 'filters.contrast', fmt: v => v },
      { id: 'f-saturation', lbl: 'saturation-val', key: 'filters.saturation', fmt: v => v },
      { id: 'f-hue', lbl: 'hue-val', key: 'filters.hue', fmt: v => `${v}°` },
      { id: 'f-blur', lbl: 'blur-val', key: 'filters.blur', fmt: v => v },
      { id: 'f-sepia', lbl: 'sepia-val', key: 'filters.sepia', fmt: v => `${v}%` },
      { id: 'text-size', lbl: 'text-size-val', key: 'style.fontSize', fmt: v => `${v}px` }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (!this._currentLayer) return;
        const val = s.scale ? el.value * s.scale : parseFloat(el.value);
        this._setDeep(this._currentLayer, s.key, val);
        const lbl = document.getElementById(s.lbl);
        if (lbl) lbl.textContent = s.fmt(el.value);
        this.editor.tools.select.updateBox();
      });
      el.addEventListener('change', () => this.editor.saveHistory());
    });

    ['prop-x', 'prop-y', 'prop-w', 'prop-h'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (!this._currentLayer) return;
        const key = id.replace('prop-', '');
        const map = { x: 'x', y: 'y', w: 'width', h: 'height' };
        this._currentLayer.transform[map[key]] = parseFloat(el.value) || 0;
        this.editor.tools.select.updateBox();
      });
      el.addEventListener('change', () => this.editor.saveHistory());
    });

    // Quick Scaling Buttons
    document.getElementById('btn-scale-fit')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      const cw = this.editor.compositor.compWidth;
      const ch = this.editor.compositor.compHeight;
      const lw = this._currentLayer.transform.width;
      const lh = this._currentLayer.transform.height;
      const s = Math.min(cw / lw, ch / lh);
      this._currentLayer.transform.width = Math.round(lw * s);
      this._currentLayer.transform.height = Math.round(lh * s);
      this._currentLayer.transform.x = 0;
      this._currentLayer.transform.y = 0;
      this.refresh(this._currentLayer);
      this.editor.saveHistory();
    });

    document.getElementById('btn-scale-fill')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      const cw = this.editor.compositor.compWidth;
      const ch = this.editor.compositor.compHeight;
      this._currentLayer.transform.width = cw;
      this._currentLayer.transform.height = ch;
      this._currentLayer.transform.x = 0;
      this._currentLayer.transform.y = 0;
      this.refresh(this._currentLayer);
      this.editor.saveHistory();
    });

    document.getElementById('btn-scale-reset')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      if (this._currentLayer.asset) {
        this._currentLayer.transform.width = this._currentLayer.asset.width || 1280;
        this._currentLayer.transform.height = this._currentLayer.asset.height || 720;
      }
      this._currentLayer.transform.rotation = 0;
      this._currentLayer.transform.x = 0;
      this._currentLayer.transform.y = 0;
      this.refresh(this._currentLayer);
      this.editor.saveHistory();
    });

    // Flip Buttons
    document.getElementById('btn-flip-h')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      this._currentLayer.transform.flipH = !this._currentLayer.transform.flipH;
      this.editor.saveHistory();
    });

    document.getElementById('btn-flip-v')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      this._currentLayer.transform.flipV = !this._currentLayer.transform.flipV;
      this.editor.saveHistory();
    });

    // Reset Filters
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      if (!this._currentLayer) return;
      this._currentLayer.filters = { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0 };
      this.refresh(this._currentLayer);
      this.editor.saveHistory();
    });

    // Text Content & Style
    document.getElementById('text-content')?.addEventListener('input', e => {
      if (this._currentLayer) {
        this._currentLayer.content = e.target.value;
        this._currentLayer.name = `Text: ${e.target.value.slice(0, 10)}`;
        this.editor.ui.mediaPool.refreshLayerList();
        this.editor.ui.timeline.redraw();
      }
    });

    document.getElementById('text-font')?.addEventListener('change', e => {
      if (this._currentLayer && this._currentLayer.style) {
        this._currentLayer.style.fontFamily = e.target.value;
        this.editor.saveHistory();
      }
    });

    document.getElementById('text-color')?.addEventListener('input', e => {
      if (this._currentLayer && this._currentLayer.style) {
        this._currentLayer.style.color = e.target.value;
      }
    });

    document.getElementById('text-bold')?.addEventListener('click', () => {
      if (this._currentLayer?.style) {
        this._currentLayer.style.bold = !this._currentLayer.style.bold;
        document.getElementById('text-bold').classList.toggle('active', this._currentLayer.style.bold);
        this.editor.saveHistory();
      }
    });

    document.getElementById('text-italic')?.addEventListener('click', () => {
      if (this._currentLayer?.style) {
        this._currentLayer.style.italic = !this._currentLayer.style.italic;
        document.getElementById('text-italic').classList.toggle('active', this._currentLayer.style.italic);
        this.editor.saveHistory();
      }
    });

    document.getElementById('text-glow')?.addEventListener('click', () => {
      if (this._currentLayer?.style) {
        this._currentLayer.style.glow = !this._currentLayer.style.glow;
        document.getElementById('text-glow').classList.toggle('active', this._currentLayer.style.glow);
        this.editor.saveHistory();
      }
    });

    document.getElementById('text-shadow')?.addEventListener('click', () => {
      if (this._currentLayer?.style) {
        this._currentLayer.style.shadow = !this._currentLayer.style.shadow;
        document.getElementById('text-shadow').classList.toggle('active', this._currentLayer.style.shadow);
        this.editor.saveHistory();
      }
    });

    // Delete Layer
    document.getElementById('btn-delete-layer')?.addEventListener('click', () => {
      if (this._currentLayer) {
        this.editor.deleteLayer(this._currentLayer.id);
      }
    });
  }

  _setDeep(obj, path, val) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }

  applyPresetFilter(presetKey) {
    if (!this._currentLayer) return;
    const presets = {
      tesseract: { brightness: 110, contrast: 125, saturation: 140, hue: 35, blur: 0, sepia: 30 },
      cyber: { brightness: 105, contrast: 130, saturation: 150, hue: 180, blur: 0, sepia: 0 },
      prism: { brightness: 115, contrast: 135, saturation: 170, hue: 280, blur: 0, sepia: 0 },
      noir: { brightness: 100, contrast: 150, saturation: 0, hue: 0, blur: 0, sepia: 0 },
      singularity: { brightness: 110, contrast: 120, saturation: 130, hue: 15, blur: 0, sepia: 45 },
      reset: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0 }
    };
    const f = presets[presetKey] || presets.reset;
    this._currentLayer.filters = { ...f };
    this.refresh(this._currentLayer);
    this.editor.saveHistory();
  }

  refresh(layer) {
    this._currentLayer = layer;
    const has = !!layer;

    document.querySelectorAll('.insp-fields').forEach(f => f.classList.toggle('hidden', !has));
    document.querySelectorAll('.no-sel').forEach(n => n.classList.toggle('hidden', has));

    if (!layer) return;

    // Transform
    const t = layer.transform || {};
    this._setVal('prop-x', Math.round(t.x || 0));
    this._setVal('prop-y', Math.round(t.y || 0));
    this._setVal('prop-w', Math.round(t.width || 1920));
    this._setVal('prop-h', Math.round(t.height || 1080));
    this._setVal('prop-rotate', t.rotation || 0, 'rotate-val', v => `${v}°`);
    this._setVal('prop-opacity', Math.round((t.opacity ?? 1) * 100), 'opacity-val', v => `${v}%`);

    // Filters
    const f = layer.filters || {};
    this._setVal('f-brightness', f.brightness ?? 100, 'brightness-val');
    this._setVal('f-contrast', f.contrast ?? 100, 'contrast-val');
    this._setVal('f-saturation', f.saturation ?? 100, 'saturation-val');
    this._setVal('f-hue', f.hue ?? 0, 'hue-val', v => `${v}°`);
    this._setVal('f-blur', f.blur ?? 0, 'blur-val');
    this._setVal('f-sepia', f.sepia ?? 0, 'sepia-val', v => `${v}%`);

    // Text
    if (layer.assetType === 'text') {
      const s = layer.style || {};
      this._setVal('text-size', s.fontSize || 72, 'text-size-val', v => `${v}px`);
      const tc = document.getElementById('text-color');
      if (tc) tc.value = s.color || '#ffffff';
      const tf = document.getElementById('text-font');
      if (tf && s.fontFamily) tf.value = s.fontFamily;
      const cont = document.getElementById('text-content');
      if (cont) cont.value = layer.content || '';

      document.getElementById('text-bold')?.classList.toggle('active', !!s.bold);
      document.getElementById('text-italic')?.classList.toggle('active', !!s.italic);
      document.getElementById('text-glow')?.classList.toggle('active', !!s.glow);
      document.getElementById('text-shadow')?.classList.toggle('active', !!s.shadow);
    }

    this.editor.tools.select.updateBox();
  }

  _setVal(id, value, lblId, fmt) {
    const el = document.getElementById(id);
    if (el) el.value = value;
    if (lblId) {
      const lbl = document.getElementById(lblId);
      if (lbl) lbl.textContent = fmt ? fmt(value) : value;
    }
  }

  deselect() {
    this.refresh(null);
  }
}
