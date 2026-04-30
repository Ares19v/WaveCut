export class Timeline {
  constructor(editor) {
    this.editor = editor;
    this._ruler = document.getElementById('tl-ruler');
    this._tracksArea = document.getElementById('tl-tracks');
    this._labelsArea = document.getElementById('tl-labels');
    this._playhead = document.getElementById('tl-playhead');
    this._zoom = 1;
    this._basePPS = 80;
    this._tracks = ['video-1', 'overlay-1', 'audio-1'];
    this._init();
  }

  get pps() { return this._basePPS * this._zoom; }

  _init() {
    this._tracks.forEach(id => {
      const lbl = document.createElement('div');
      lbl.className = 'track-label-row';
      lbl.textContent = id.replace('-', ' ').toUpperCase();
      this._labelsArea.appendChild(lbl);

      const row = document.createElement('div');
      row.className = 'track-row';
      row.dataset.trackId = id;
      this._tracksArea.appendChild(row);
    });
    this._bindScrub();
  }

  _bindScrub() {
    this._tracksArea.addEventListener('mousedown', e => {
      this._scrubbing = true;
      this._scrub(e);
    });
    window.addEventListener('mousemove', e => { if (this._scrubbing) this._scrub(e); });
    window.addEventListener('mouseup', () => this._scrubbing = false);
  }

  _scrub(e) {
    const rect = this._tracksArea.getBoundingClientRect();
    const x = e.clientX - rect.left + this._tracksArea.scrollLeft;
    this.editor.timeline.seek(x / this.pps);
  }

  setPlayheadPosition(t) {
    this._playhead.style.left = `${t * this.pps}px`;
    // Auto-scroll timeline
    const rect = this._tracksArea.getBoundingClientRect();
    const x = t * this.pps;
    if (x > this._tracksArea.scrollLeft + rect.width - 100) {
      this._tracksArea.scrollLeft = x - rect.width + 100;
    } else if (x < this._tracksArea.scrollLeft) {
      this._tracksArea.scrollLeft = x;
    }
  }

  placeClip(layer) {
    const trackId = layer.assetType === 'video' ? 'video-1' : 'overlay-1';
    const track = this._tracksArea.querySelector(`[data-track-id="${trackId}"]`);
    
    const clip = document.createElement('div');
    clip.className = 'track-clip';
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
    this._updateClipThumbnails(clip, layer);
    this.redraw();
  }

  _updateClipThumbnails(clipEl, layer) {
    const strip = clipEl.querySelector('.clip-thumb-strip');
    if (!layer.asset?.thumbnail) return;
    
    strip.innerHTML = '';
    const dur = layer.duration;
    const width = dur * this.pps;
    const count = Math.ceil(width / 40);
    
    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.src = layer.asset.thumbnail;
      strip.appendChild(img);
    }
  }

  redraw() {
    this.editor.compositor.layers.forEach(layer => {
      const clip = this._tracksArea.querySelector(`[data-layer-id="${layer.id}"]`);
      if (!clip) return;
      clip.style.left = `${layer.startTime * this.pps}px`;
      clip.style.width = `${layer.duration * this.pps}px`;
      this._updateClipThumbnails(clip, layer);
    });
    this._updateRuler();
  }

  _updateRuler() {
    this._ruler.innerHTML = '';
    const width = this._tracksArea.scrollWidth;
    for (let i = 0; i < width; i += this.pps) {
      const tick = document.createElement('div');
      tick.style.position = 'absolute';
      tick.style.left = `${i}px`;
      tick.style.fontSize = '0.6rem';
      tick.style.color = '#555';
      tick.style.borderLeft = '1px solid #333';
      tick.style.height = '10px';
      tick.textContent = `${Math.round(i / this.pps)}s`;
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
