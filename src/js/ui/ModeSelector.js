export class ModeSelector {
  constructor(onSelect) {
    this._el = document.getElementById('mode-selector');
    this._app = document.getElementById('editor-app');
    this._badge = document.getElementById('mode-pill');
    this._onSelect = onSelect;
    this._bind();
  }

  _bind() {
    document.querySelectorAll('.mode-card').forEach(card => {
      card.onclick = () => {
        const mode = card.dataset.mode;
        this._activate(mode);
      };
    });
  }

  _activate(mode) {
    this._el.style.opacity = '0';
    this._el.style.transition = '0.3s';
    setTimeout(() => {
      this._el.classList.add('hidden');
      this._app.classList.remove('hidden');
      if (this._badge) {
        this._badge.textContent = mode.toUpperCase();
        this._badge.style.background = mode === 'video' ? '#f59e0b' : '#7c4dff';
      }
      this._onSelect(mode);
    }, 300);
  }

  show() {
    this._app.classList.add('hidden');
    this._el.classList.remove('hidden');
    this._el.style.opacity = '1';
  }
}
