import { Asset } from './Asset.js';
import { Compositor } from './Compositor.js';
import { HistoryManager } from './HistoryManager.js';
import { TimelineEngine } from './TimelineEngine.js';
import { ExportEngine } from './ExportEngine.js';
import { CropTool } from '../tools/CropTool.js';
import { TextTool } from '../tools/TextTool.js';
import { SelectTool } from '../tools/SelectTool.js';
import { MediaPool } from '../ui/MediaPool.js';
import { Inspector } from '../ui/Inspector.js';
import { Timeline } from '../ui/Timeline.js';
import { ExportModal } from '../ui/ExportModal.js';
import { notify } from '../ui/Notifications.js';

export class Editor {
  constructor(mode = 'video') {
    this.mode = mode; // 'image' | 'video'
    this.assets = [];
    this.selectedLayer = null;
    this.activeTool = 'select';

    // Core Engines
    this.compositor = new Compositor('main-canvas');
    this.history = new HistoryManager();
    this.timeline = new TimelineEngine();
    this.exportEngine = new ExportEngine(this.compositor);

    // UI Modules
    this.ui = {
      mediaPool: new MediaPool(this),
      inspector: new Inspector(this),
      timeline: new Timeline(this),
      exportModal: new ExportModal(this.exportEngine),
    };

    // Tools
    this.tools = {
      select: new SelectTool(this),
      crop: new CropTool(this),
      text: new TextTool(this),
    };

    this._init();
  }

  _init() {
    this.exportEngine.setMode(this.mode);
    this.ui.exportModal.setMode(this.mode);

    if (this.mode === 'image') {
      const tl = document.getElementById('timeline');
      if (tl) tl.style.display = 'none';
      const ws = document.getElementById('workspace');
      if (ws) ws.style.gridTemplateRows = '1fr';
      const pb = document.getElementById('playback-controls');
      if (pb) pb.style.display = 'none';
    } else {
      const tl = document.getElementById('timeline');
      if (tl) tl.style.display = 'flex';
      const ws = document.getElementById('workspace');
      if (ws) ws.style.gridTemplateRows = '1fr var(--timeline-h)';
      const pb = document.getElementById('playback-controls');
      if (pb) pb.style.display = 'flex';
    }

    this.compositor.start();
    this._bindUI();
    this.saveHistory();
  }

  _bindUI() {
    // Project Name
    const nameInput = document.getElementById('project-name');
    nameInput?.addEventListener('change', () => {
      notify(`Project renamed: "${nameInput.value}"`, 'info');
      this.saveHistory();
    });

    // Aspect Ratio Selector
    const aspectSelect = document.getElementById('aspect-ratio-select');
    aspectSelect?.addEventListener('change', e => {
      this.compositor.setAspectRatio(e.target.value);
      notify(`Aspect ratio set to ${e.target.value}`, 'info');
      this.tools.select.updateBox();
    });

    // Left Panel Tabs
    document.querySelectorAll('.lp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.lp-tab, .lp-pane').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`lpane-${tab.dataset.lptab}`)?.classList.add('active');
      });
    });

    // Inspector Tabs
    document.querySelectorAll('.insp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.insp-tab, .insp-pane').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`ipane-${tab.dataset.itab}`)?.classList.add('active');
      });
    });

    // Tool switching
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._switchTool(btn.dataset.tool);
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Import Media
    const importBtn = document.getElementById('btn-import');
    const mediaInput = document.getElementById('media-input');
    importBtn?.addEventListener('click', () => mediaInput.click());
    mediaInput?.addEventListener('change', e => this._handleImport(e));

    // Drag and Drop Upload
    const dropzone = document.getElementById('media-dropzone');
    const canvasArea = document.getElementById('canvas-area');

    [dropzone, canvasArea].forEach(zone => {
      if (!zone) return;
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files?.length) {
          this._importFileList(Array.from(e.dataTransfer.files));
        }
      });
    });

    // Built-in Sample Media Loaders
    document.getElementById('btn-sample-cosmic')?.addEventListener('click', () => {
      const asset = Asset.createSampleCosmicImage();
      this.assets.push(asset);
      this.ui.mediaPool.addAsset(asset);
      this.addAssetToTimeline(asset);
      notify('Loaded Singularity Nebula media', 'success');
    });

    document.getElementById('btn-sample-tesseract')?.addEventListener('click', () => {
      const asset = Asset.createSampleTesseractGrid();
      this.assets.push(asset);
      this.ui.mediaPool.addAsset(asset);
      this.addAssetToTimeline(asset);
      notify('Loaded 4D Prism Matrix media', 'success');
    });

    // Synthesized Soundscapes
    document.querySelectorAll('.sound-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.sound || 'gargantua';
        const asset = Asset.createSynthesizedSound(type);
        this.assets.push(asset);
        this.ui.mediaPool.addAsset(asset);
        this.addAssetToTimeline(asset);
        notify(`Synthesized ${asset.name} and added to audio track`, 'success');
      });
    });

    // Text Presets
    document.querySelectorAll('.text-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset || 'title';
        const labels = {
          title: '4D TESSERACT',
          hologram: 'EVENT HORIZON',
          timecode: 'T+ 00:42:19.4',
          minimal: 'Gargantua Singularity'
        };
        this.tools.text.addText(labels[preset] || '4D TESSERACT', preset);
        notify('Added holographic text layer', 'info');
      });
    });

    // Prism FX Preset Filters
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fx = btn.dataset.fx;
        if (!this.selectedLayer) {
          notify('Select a layer first to apply Prism FX', 'warn');
          return;
        }
        this.ui.inspector.applyPresetFilter(fx);
        notify(`Applied ${fx} prism filter`, 'info');
      });
    });

    // Playback Controls
    document.getElementById('btn-play')?.addEventListener('click', () => this._togglePlayback());
    document.getElementById('btn-prev')?.addEventListener('click', () => this.timeline.seek(this.timeline.currentTime - 1 / 24));
    document.getElementById('btn-next')?.addEventListener('click', () => this.timeline.seek(this.timeline.currentTime + 1 / 24));
    document.getElementById('btn-jump-start')?.addEventListener('click', () => this.timeline.seek(0));
    document.getElementById('btn-jump-end')?.addEventListener('click', () => this.timeline.seek(this.timeline.totalDuration));

    // Timeline Tick Callback
    this.timeline._onTick = t => {
      const curEl = document.getElementById('time-display');
      if (curEl) curEl.textContent = this.timeline.formatTime(t);
      this.ui.timeline.setPlayheadPosition(t);
      this.compositor.currentTime = t;

      this.compositor.layers.forEach(l => {
        if (l.asset?.assetType === 'video' && l.asset.data) {
          const vid = l.asset.data;
          if (Math.abs(vid.currentTime - t) > 0.15) {
            vid.currentTime = t;
          }
        }
        if (l.asset?.assetType === 'audio' && l.asset.data) {
          const aud = l.asset.data;
          if (t >= l.startTime && t <= l.startTime + l.duration) {
            const relTime = t - l.startTime;
            if (this.timeline.isPlaying && aud.paused) {
              aud.currentTime = relTime;
              aud.play().catch(() => {});
            } else if (Math.abs(aud.currentTime - relTime) > 0.3) {
              aud.currentTime = relTime;
            }
          } else {
            if (!aud.paused) aud.pause();
          }
        }
      });
      this.tools.select.updateBox();
    };

    // Split & Delete Clip
    document.getElementById('btn-split')?.addEventListener('click', () => this._splitSelectedClip());
    document.getElementById('btn-delete-clip')?.addEventListener('click', () => {
      if (this.selectedLayer) this.deleteLayer(this.selectedLayer.id);
    });

    // Undo / Redo
    document.getElementById('btn-undo')?.addEventListener('click', () => this._undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this._redo());

    // Instant Snapshot
    document.getElementById('btn-snapshot')?.addEventListener('click', () => {
      this.exportEngine.takeSnapshot();
    });

    // Export Modal Open
    document.getElementById('btn-export')?.addEventListener('click', () => {
      const name = document.getElementById('project-name')?.value || 'wavecut-render';
      const fileInput = document.getElementById('export-filename');
      if (fileInput) fileInput.value = name.replace(/\s+/g, '-').toLowerCase();
      this.ui.exportModal.open();
    });

    // Canvas Zoom Controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.compositor.setZoom(this.compositor._zoom + 0.15));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.compositor.setZoom(this.compositor._zoom - 0.15));
    document.getElementById('zoom-fit')?.addEventListener('click', () => {
      this.compositor._zoom = 1;
      this.compositor._fitToContainer();
    });

    // Keyboard Shortcuts
    this._keyHandler = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this._splitSelectedClip();
      }
      if (e.key === ' ') {
        e.preventDefault();
        this._togglePlayback();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedLayer) {
          e.preventDefault();
          this.deleteLayer(this.selectedLayer.id);
        }
      }
      if (e.key === 'v' || e.key === 'V') this._switchTool('select');
      if (e.key === 'c' || e.key === 'C') this._switchTool('crop');

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this._undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this._redo();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // Back to Portal
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      this.destroy();
      window.wavecutModeSelector?.show();
    });
  }

  loadSampleProject() {
    const cosmic = Asset.createSampleCosmicImage();
    this.assets.push(cosmic);
    this.ui.mediaPool.addAsset(cosmic);
    this.addAssetToTimeline(cosmic);

    const sound = Asset.createSynthesizedSound('gargantua');
    this.assets.push(sound);
    this.ui.mediaPool.addAsset(sound);
    this.addAssetToTimeline(sound);

    setTimeout(() => {
      this.tools.text.addText('INTERSTELLAR 4D', 'title');
    }, 150);
  }

  async _handleImport(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await this._importFileList(files);
    e.target.value = '';
  }

  async _importFileList(files) {
    notify(`Importing ${files.length} asset(s)...', 'info`);
    for (const file of files) {
      try {
        const asset = new Asset(file);
        await asset.load();
        this.assets.push(asset);
        this.ui.mediaPool.addAsset(asset);
        this.addAssetToTimeline(asset);
        notify(`Imported ${file.name}`, 'success');
      } catch (err) {
        notify(`Error loading ${file.name}: ${err.message}`, 'error');
      }
    }
  }

  addAssetToTimeline(asset) {
    document.getElementById('canvas-empty')?.classList.add('hidden');
    const layer = this.compositor.addLayer(asset);
    layer.startTime = this.timeline.currentTime;
    layer.duration = asset.duration || 8;

    this.selectedLayer = layer;
    this.ui.mediaPool.refreshLayerList();
    this.ui.inspector.refresh(layer);
    this.ui.timeline.placeClip(layer);
    this.saveHistory();

    const end = layer.startTime + layer.duration;
    if (end > this.timeline.totalDuration) {
      this.timeline.setDuration(end);
      const totEl = document.getElementById('time-total');
      if (totEl) totEl.textContent = this.timeline.formatTime(end);
    }
  }

  selectLayer(id) {
    if (!id) {
      this.selectedLayer = null;
      this.ui.inspector.deselect();
      this.ui.mediaPool.refreshLayerList();
      this.ui.timeline.highlightClip(null);
      this.tools.select.updateBox();
      return;
    }
    const layer = this.compositor.layers.find(l => l.id === id);
    this.selectedLayer = layer || null;
    this.ui.inspector.refresh(this.selectedLayer);
    this.ui.mediaPool.refreshLayerList();
    this.ui.timeline.highlightClip(id);
    this.tools.select.updateBox();
  }

  deleteLayer(id) {
    this.compositor.removeLayer(id);
    this.ui.timeline.removeClip(id);
    if (this.selectedLayer?.id === id) this.selectedLayer = null;
    this.ui.inspector.deselect();
    this.ui.mediaPool.refreshLayerList();
    this.saveHistory();

    if (this.compositor.layers.length === 0) {
      document.getElementById('canvas-empty')?.classList.remove('hidden');
    }
    notify('Layer removed', 'info');
  }

  _splitSelectedClip() {
    if (!this.selectedLayer || this.mode === 'image') return;
    const layer = this.selectedLayer;
    const splitTime = this.timeline.currentTime;

    if (splitTime <= layer.startTime || splitTime >= layer.startTime + layer.duration) {
      notify('Move playhead inside the clip to split', 'warn');
      return;
    }

    const oldDur = layer.duration;
    layer.duration = splitTime - layer.startTime;

    const newLayer = {
      ...layer,
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${layer.name} (Split)`,
      startTime: splitTime,
      duration: oldDur - layer.duration,
      transform: { ...layer.transform },
      filters: { ...layer.filters },
      style: layer.style ? { ...layer.style } : undefined
    };

    this.compositor.layers.push(newLayer);
    this.ui.timeline.placeClip(newLayer);
    this.ui.timeline.redraw();
    this.ui.mediaPool.refreshLayerList();
    this.saveHistory();
    notify('Clip split successfully', 'success');
  }

  _togglePlayback() {
    if (this.timeline.isPlaying) {
      this.timeline.pause();
      this.compositor.layers.forEach(l => l.asset?.data?.pause?.());
      const icon = document.getElementById('play-icon');
      if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    } else {
      this.timeline.play();
      this.compositor.layers.forEach(l => l.asset?.data?.play?.().catch(() => {}));
      const icon = document.getElementById('play-icon');
      if (icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    }
  }

  _switchTool(name) {
    if (this.activeTool === 'crop' && name !== 'crop') {
      this.tools.crop.deactivate();
    }
    this.activeTool = name;
    if (name === 'crop') {
      this.tools.crop.activate();
    }
  }

  saveHistory() {
    this.history.saveState(this.compositor.layers);
  }

  _undo() {
    const s = this.history.undo();
    if (s) this._restore(s);
  }

  _redo() {
    const s = this.history.redo();
    if (s) this._restore(s);
  }

  _restore(snapshot) {
    const newLayers = snapshot.map(s => {
      if (s.assetType === 'text') return { ...s, asset: null };
      const asset = this.assets.find(a => a.id === s.assetId);
      return { ...s, asset };
    }).filter(l => l.assetType === 'text' || l.asset);

    this.compositor.layers.length = 0;
    this.compositor.layers.push(...newLayers);
    this.ui.mediaPool.refreshLayerList();
    this.ui.timeline.redraw();
    if (this.selectedLayer) {
      this.selectLayer(this.selectedLayer.id);
    }
  }

  destroy() {
    this.compositor.stop();
    this.timeline.pause();
    document.removeEventListener('keydown', this._keyHandler);
    this.assets.forEach(a => a.revoke());
  }
}
