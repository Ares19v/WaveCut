export class Inspector {
  constructor(editor) {
    this.editor = editor;
    this._currentLayer = null;
    this._bindControls();
  }

  _bindControls() {
    const sliders = [
      { id: 'prop-rotate', lbl: 'rotate-val', key: 'transform.rotation', fmt: v => `${v}°` },
      { id: 'prop-opacity', lbl: 'opacity-val', key: 'transform.opacity', fmt: v => `${v}%`, scale: 0.01 },
      { id: 'f-brightness', lbl: 'brightness-val', key: 'filters.brightness', fmt: v => v },
      { id: 'f-contrast', lbl: 'contrast-val', key: 'filters.contrast', fmt: v => v },
      { id: 'f-saturation', lbl: 'saturation-val', key: 'filters.saturation', fmt: v => v },
      { id: 'f-hue', lbl: 'hue-val', key: 'filters.hue', fmt: v => `${v}°` },
      { id: 'f-blur', lbl: 'blur-val', key: 'filters.blur', fmt: v => v },
      { id: 'text-size', lbl: 'text-size-val', key: 'style.fontSize', fmt: v => `${v}px` }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      if (!el) return;
      el.oninput = () => {
        if (!this._currentLayer) return;
        const val = s.scale ? el.value * s.scale : parseFloat(el.value);
        this._setDeep(this._currentLayer, s.key, val);
        document.getElementById(s.lbl).textContent = s.fmt(el.value);
      };
      el.onchange = () => this.editor.saveHistory();
    });

    ['prop-x', 'prop-y', 'prop-w', 'prop-h'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.oninput = () => {
        if (!this._currentLayer) return;
        const key = id.replace('prop-', '');
        const map = { x: 'x', y: 'y', w: 'width', h: 'height' };
        this._currentLayer.transform[map[key]] = parseFloat(el.value);
      };
      el.onchange = () => this.editor.saveHistory();
    });

    document.getElementById('text-content')?.addEventListener('input', e => {
      if (this._currentLayer) this._currentLayer.content = e.target.value;
    });

    const delBtn = document.getElementById('btn-delete-layer');
    if (delBtn) delBtn.onclick = () => {
      if (this._currentLayer) this.editor.deleteLayer(this._currentLayer.id);
    };
  }

  _setDeep(obj, path, val) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
  }

  refresh(layer) {
    this._currentLayer = layer;
    const has = !!layer;
    document.querySelectorAll('.insp-fields').forEach(f => f.classList.toggle('hidden', !has));
    document.querySelectorAll('.no-sel').forEach(n => n.classList.toggle('hidden', has));
    if (!layer) return;

    // Transform
    const t = layer.transform;
    this._set('prop-x', Math.round(t.x));
    this._set('prop-y', Math.round(t.y));
    this._set('prop-w', Math.round(t.width));
    this._set('prop-h', Math.round(t.height));
    this._set('prop-rotate', t.rotation || 0, 'rotate-val', v => `${v}°`);
    this._set('prop-opacity', Math.round((t.opacity || 1) * 100), 'opacity-val', v => `${v}%`);

    // Filters
    const f = layer.filters;
    this._set('f-brightness', f.brightness, 'brightness-val');
    this._set('f-contrast', f.contrast, 'contrast-val');
    this._set('f-saturation', f.saturation, 'saturation-val');
    this._set('f-hue', f.hue, 'hue-val', v => `${v}°`);
    this._set('f-blur', f.blur, 'blur-val');

    // Text
    if (layer.assetType === 'text' && layer.style) {
      this._set('text-size', layer.style.fontSize, 'text-size-val', v => `${v}px`);
      const tc = document.getElementById('text-color');
      if (tc) tc.value = layer.style.color || '#ffffff';
      const cont = document.getElementById('text-content');
      if (cont) cont.value = layer.content || '';
    }
  }

  _set(id, value, lblId, fmt) {
    const el = document.getElementById(id);
    if (el) el.value = value;
    if (lblId) {
      const lbl = document.getElementById(lblId);
      if (lbl) lbl.textContent = fmt ? fmt(value) : value;
    }
  }

  deselect() { this.refresh(null); }
}
