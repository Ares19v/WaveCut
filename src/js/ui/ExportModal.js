export class ExportModal {
  constructor(exportEngine) {
    this._engine = exportEngine;
    this._overlay = document.getElementById('export-modal');
    this._selectedFormat = 'png';
    this._mode = 'image';
    this._bind();
  }

  setMode(mode) {
    this._mode = mode;
    this._engine.setMode(mode);
  }

  open() {
    this._renderFormats();
    this._overlay.classList.remove('hidden');
  }

  close() {
    this._overlay.classList.add('hidden');
  }

  _renderFormats() {
    const el = document.getElementById('format-btns');
    if (!el) return;
    el.innerHTML = '';
    
    const formats = this._mode === 'image' ? ['png', 'jpg', 'webp'] : ['webm', 'png'];

    this._selectedFormat = formats[0];
    this._engine.setFormat(this._selectedFormat);

    formats.forEach(fmt => {
      const btn = document.createElement('button');
      btn.className = `format-btn ${fmt === this._selectedFormat ? 'selected' : ''}`;
      btn.textContent = fmt.toUpperCase();
      btn.addEventListener('click', () => {
        el.querySelectorAll('.format-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._selectedFormat = fmt;
        this._engine.setFormat(fmt);
      });
      el.appendChild(btn);
    });
  }

  _bind() {
    document.getElementById('export-modal-close')?.addEventListener('click', () => this.close());
    this._overlay?.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });

    document.getElementById('export-quality')?.addEventListener('input', e => {
      const v = e.target.value;
      const valEl = document.getElementById('export-quality-val');
      if (valEl) valEl.textContent = `${v}%`;
      this._engine.setQuality(v / 100);
    });

    document.querySelectorAll('.res-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.res-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const res = btn.dataset.res;
        if (res !== 'original') {
          const [w, h] = res.split('x').map(Number);
          this._engine.compositor.compWidth = w;
          this._engine.compositor.compHeight = h;
          this._engine.compositor.canvas.width = w;
          this._engine.compositor.canvas.height = h;
        }
      });
    });

    document.getElementById('btn-do-export')?.addEventListener('click', () => this._doExport());
  }

  async _doExport() {
    const prog = document.getElementById('export-prog');
    const fill = document.getElementById('prog-fill');
    const lbl = document.getElementById('prog-label');
    const btn = document.getElementById('btn-do-export');
    const filename = document.getElementById('export-filename')?.value?.trim() || 'wavecut-render';

    this._engine.setFilename(filename);

    if (prog) prog.classList.remove('hidden');
    if (btn) btn.disabled = true;

    try {
      await this._engine.export((pct, msg) => {
        if (fill) fill.style.width = `${pct * 100}%`;
        if (lbl) lbl.textContent = msg;
      });
      setTimeout(() => this.close(), 1200);
    } catch (err) {
      if (lbl) lbl.textContent = 'Render Error: ' + err.message;
    } finally {
      if (btn) btn.disabled = false;
      setTimeout(() => {
        if (fill) fill.style.width = '0%';
        if (prog) prog.classList.add('hidden');
      }, 2500);
    }
  }
}
