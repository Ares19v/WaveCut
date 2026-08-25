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
      card.addEventListener('click', () => {
        const mode = card.dataset.mode || 'video';
        this._activate(mode);
      });
    });

    document.getElementById('btn-quick-demo')?.addEventListener('click', () => {
      this._activate('video', true);
    });
  }

  _activate(mode, loadSample = false) {
    this._el.style.opacity = '0';
    this._el.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      this._el.classList.add('hidden');
      this._app.classList.remove('hidden');
      
      if (this._badge) {
        this._badge.textContent = mode.toUpperCase();
        this._badge.style.color = mode === 'video' ? '#f5b041' : '#00f0ff';
        this._badge.style.borderColor = mode === 'video' ? 'rgba(245, 176, 65, 0.4)' : 'rgba(0, 240, 255, 0.4)';
        this._badge.style.background = mode === 'video' ? 'rgba(245, 176, 65, 0.15)' : 'rgba(0, 240, 255, 0.15)';
      }
      
      this._onSelect(mode);

      if (loadSample && window.currentWaveCutEditor) {
        window.currentWaveCutEditor.loadSampleProject();
      }
    }, 300);
  }

  show() {
    this._app.classList.add('hidden');
    this._el.classList.remove('hidden');
    this._el.style.opacity = '1';
  }
}
