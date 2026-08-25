export class Timeline {
  constructor(editor) {
    this.editor = editor;
    this._ruler = document.getElementById('tl-ruler');
    this._tracksArea = document.getElementById('tl-tracks');
    this._labelsArea = document.getElementById('tl-labels');
    this._playhead = document.getElementById('tl-playhead');
    this._zoom = 1;
    this._basePPS = 80;
    this._tracks = [
      { id: 'video-1', name: 'VIDEO TRACK 1', cls: 'video-track' },
      { id: 'overlay-1', name: 'OVERLAY / TEXT', cls: 'overlay-track' },
      { id: 'audio-1', name: 'AUDIO TRACK', cls: 'audio-track' }
    ];
    this._init();
  }

  get pps() {
    return this._basePPS * this._zoom;
  }

  _init() {
    this._labelsArea.innerHTML = '';
    this._tracksArea.querySelectorAll('.track-row').forEach(r => r.remove());

    this._tracks.forEach(track => {
      const lbl = document.createElement('div');
      lbl.className = `track-label-row ${track.cls}`;
      lbl.textContent = track.name;
      this._labelsArea.appendChild(lbl);

      const row = document.createElement('div');
      row.className = 'track-row';
      row.dataset.trackId = track.id;
      this._tracksArea.appendChild(row);
    });

    this._bindScrub();
    this._bindZoom();
  }

  _bindScrub() {
    let isScrubbing = false;

    const doScrub = (e) => {
      const rect = this._tracksArea.getBoundingClientRect();
      const x = e.clientX - rect.left + this._tracksArea.scrollLeft;
      const t = Math.max(0, x / this.pps);
      this.editor.timeline.seek(t);
    };

    this._tracksArea.addEventListener('mousedown', e => {
      if (e.target.closest('.track-clip')) return;
      isScrubbing = true;
      doScrub(e);
    });

    this._ruler.addEventListener('mousedown', e => {
      isScrubbing = true;
      doScrub(e);
    });

    window.addEventListener('mousemove', e => {
      if (isScrubbing) doScrub(e);
    });

    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
  }

  _bindZoom() {
    document.getElementById('tl-zoom-in')?.addEventListener('click', () => {
      this._zoom = Math.min(3, this._zoom + 0.25);
      this.redraw();
    });

    document.getElementById('tl-zoom-out')?.addEventListener('click', () => {
      this._zoom = Math.max(0.4, this._zoom - 0.25);
      this.redraw();
    });
  }

  setPlayheadPosition(t) {
    if (!this._playhead) return;
    const px = t * this.pps;
    this._playhead.style.left = `${px}px`;

    // Auto scroll timeline during playback
    const rect = this._tracksArea.getBoundingClientRect();
    if (px > this._tracksArea.scrollLeft + rect.width - 80) {
      this._tracksArea.scrollLeft = px - rect.width + 80;
    } else if (px < this._tracksArea.scrollLeft) {
      this._tracksArea.scrollLeft = px;
    }
  }

  placeClip(layer) {
    let trackId = 'overlay-1';
    if (layer.assetType === 'video') trackId = 'video-1';
    else if (layer.assetType === 'audio') trackId = 'audio-1';

    const track = this._tracksArea.querySelector(`[data-track-id="${trackId}"]`);
    if (!track) return;

    let clip = this._tracksArea.querySelector(`[data-layer-id="${layer.id}"]`);
    if (!clip) {
      clip = document.createElement('div');
      clip.className = `track-clip ${layer.assetType === 'text' ? 'overlay-clip' : (layer.assetType === 'audio' ? 'audio-clip' : '')}`;
      clip.dataset.layerId = layer.id;
      clip.innerHTML = `
        <div class="clip-thumb-strip"></div>
        <span class="clip-label">${layer.name}</span>
      `;
      clip.addEventListener('click', e => {
        e.stopPropagation();
        this.editor.selectLayer(layer.id);
      });
      track.appendChild(clip);
    }

    this._updateClipPosition(clip, layer);
    this.redraw();
  }

  _updateClipPosition(clipEl, layer) {
    const left = layer.startTime * this.pps;
    const width = Math.max(20, layer.duration * this.pps);
    clipEl.style.left = `${left}px`;
    clipEl.style.width = `${width}px`;

    const label = clipEl.querySelector('.clip-label');
    if (label) label.textContent = layer.name;

    const strip = clipEl.querySelector('.clip-thumb-strip');
    if (strip && layer.asset?.thumbnail) {
      strip.innerHTML = '';
      const count = Math.ceil(width / 44);
      for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = layer.asset.thumbnail;
        strip.appendChild(img);
      }
    }
  }

  redraw() {
    this.editor.compositor.layers.forEach(layer => {
      const clip = this._tracksArea.querySelector(`[data-layer-id="${layer.id}"]`);
      if (clip) {
        this._updateClipPosition(clip, layer);
      } else {
        this.placeClip(layer);
      }
    });

    this._updateRuler();
    this.setPlayheadPosition(this.editor.timeline.currentTime);
  }

  _updateRuler() {
    if (!this._ruler) return;
    this._ruler.innerHTML = '';
    const totalSec = Math.max(30, this.editor.timeline.totalDuration + 10);
    const stepSec = this.pps >= 80 ? 1 : (this.pps >= 40 ? 2 : 5);

    for (let s = 0; s <= totalSec; s += stepSec) {
      const tick = document.createElement('div');
      tick.style.position = 'absolute';
      tick.style.left = `${s * this.pps}px`;
      tick.style.bottom = '0';
      tick.style.height = '14px';
      tick.style.borderLeft = '1px solid rgba(245, 176, 65, 0.2)';
      tick.style.fontSize = '0.62rem';
      tick.style.fontFamily = 'JetBrains Mono, monospace';
      tick.style.color = '#8e9bb0';
      tick.style.paddingLeft = '4px';
      tick.textContent = `${s}s`;
      this._ruler.appendChild(tick);
    }
  }

  highlightClip(id) {
    this._tracksArea.querySelectorAll('.track-clip').forEach(c => {
      c.classList.toggle('selected', c.dataset.layerId === id);
    });
  }

  removeClip(id) {
    this._tracksArea.querySelector(`[data-layer-id="${id}"]`)?.remove();
  }
}
