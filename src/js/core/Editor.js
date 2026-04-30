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
  constructor(mode) {
    this.mode = mode; // 'image' | 'video'
    this.assets = [];
    this.selectedLayer = null;
    this.activeTool = 'select';

    // Core
    this.compositor = new Compositor('main-canvas');
    this.history = new HistoryManager();
    this.timeline = new TimelineEngine();
    this.exportEngine = new ExportEngine(this.compositor);

    // UI
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
      document.getElementById('timeline').style.display = 'none';
      document.getElementById('workspace').style.gridTemplateRows = '1fr';
      document.getElementById('itab-text')?.classList.add('hidden');
    }

    this.compositor.start();
    this._bindUI();
    this.saveHistory();
  }

  _bindUI() {
    // Project Name
    const nameInput = document.getElementById('project-name');
    nameInput?.addEventListener('change', () => {
      notify(`Project renamed to "${nameInput.value}"`, 'info');
      this.saveHistory();
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

    // Tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._switchTool(btn.dataset.tool);
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Import
    const importBtn = document.getElementById('btn-import');
    const mediaInput = document.getElementById('media-input');
    importBtn?.addEventListener('click', () => mediaInput.click());
    mediaInput?.addEventListener('change', e => this._handleImport(e));

    // Playback
    document.getElementById('btn-play')?.addEventListener('click', () => this._togglePlayback());
    document.getElementById('btn-prev')?.addEventListener('click', () => this.timeline.seek(this.timeline.currentTime - 1/30));
    document.getElementById('btn-next')?.addEventListener('click', () => this.timeline.seek(this.timeline.currentTime + 1/30));

    this.timeline._onTick = t => {
      document.getElementById('time-display').textContent = this.timeline.formatTime(t);
      this.ui.timeline.setPlayheadPosition(t);
      this.compositor.currentTime = t;
      this.compositor.layers.forEach(l => {
        if (l.asset?.assetType === 'video') {
          const vid = l.asset.data;
          // Only seek if significantly out of sync to avoid jitter
          if (Math.abs(vid.currentTime - t) > 0.1) vid.currentTime = t;
        }
      });
      this.tools.select.updateBox();
    };

    // Split
    document.getElementById('btn-split')?.addEventListener('click', () => this._splitSelectedClip());

    // Undo/Redo
    document.getElementById('btn-undo')?.addEventListener('click', () => this._undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this._redo());

    // Shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 's' || e.key === 'S') this._splitSelectedClip();
      if (e.key === ' ') { e.preventDefault(); this._togglePlayback(); }
      if (e.key === 'Delete') { if (this.selectedLayer) this.deleteLayer(this.selectedLayer.id); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this._redo(); }
    });

    // Export
    document.getElementById('btn-export')?.addEventListener('click', () => {
      const name = document.getElementById('project-name').value;
      document.getElementById('export-filename').value = name.replace(/\s+/g, '-').toLowerCase();
      this.ui.exportModal.open();
    });

    // Zoom
    document.getElementById('zoom-in')?.addEventListener('click', () => this.compositor.setZoom(this.compositor._zoom + 0.1));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.compositor.setZoom(this.compositor._zoom - 0.1));
    document.getElementById('zoom-fit')?.addEventListener('click', () => { this.compositor._zoom = 1; this.compositor._fitToContainer(); });

    // Home
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      this.destroy();
      window.wavecutModeSelector.show();
    });
  }

  async _handleImport(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    notify(`Importing ${files.length} files...`, 'info');
    for (const file of files) {
      try {
        const asset = new Asset(file);
        await asset.load();
        this.assets.push(asset);
        this.ui.mediaPool.addAsset(asset);
      } catch (err) {
        notify(`Error loading ${file.name}`, 'error');
      }
    }
    e.target.value = '';
  }

  addAssetToTimeline(asset) {
    document.getElementById('canvas-empty')?.classList.add('hidden');
    const layer = this.compositor.addLayer(asset);
    layer.startTime = this.timeline.currentTime;
    layer.duration = asset.duration || 5; // Default 5s for images
    
    this.selectedLayer = layer;
    this.ui.mediaPool.refreshLayerList();
    this.ui.inspector.refresh(layer);
    this.ui.timeline.placeClip(layer);
    this.saveHistory();
    
    // Update total duration
    const end = layer.startTime + layer.duration;
    if (end > this.timeline.totalDuration) {
      this.timeline.setDuration(end);
      document.getElementById('time-total').textContent = this.timeline.formatTime(end);
    }
  }

  selectLayer(id) {
    if (!id) {
      this.selectedLayer = null;
      this.ui.inspector.deselect();
      this.ui.mediaPool.refreshLayerList();
      this.ui.timeline.highlightClip(null);
      return;
    }
    const layer = this.compositor.layers.find(l => l.id === id);
    this.selectedLayer = layer || null;
    this.ui.inspector.refresh(this.selectedLayer);
    this.ui.mediaPool.refreshLayerList();
    this.ui.timeline.highlightClip(id);
  }

  deleteLayer(id) {
    this.compositor.removeLayer(id);
    this.ui.timeline.removeClip(id);
    if (this.selectedLayer?.id === id) this.selectedLayer = null;
    this.ui.inspector.deselect();
    this.ui.mediaPool.refreshLayerList();
    this.saveHistory();
  }

  _splitSelectedClip() {
    if (!this.selectedLayer || this.mode === 'image') return;
    const layer = this.selectedLayer;
    const splitTime = this.timeline.currentTime;

    if (splitTime <= layer.startTime || splitTime >= layer.startTime + layer.duration) {
      notify('Playhead must be inside the clip to split', 'warn');
      return;
    }

    // Create duplicate
    const newLayer = { ...layer, id: `layer-${Date.now()}` };
    const oldDur = layer.duration;
    
    layer.duration = splitTime - layer.startTime;
    newLayer.startTime = splitTime;
    newLayer.duration = oldDur - layer.duration;

    this.compositor.layers.push(newLayer);
    this.ui.timeline.redraw();
    this.ui.mediaPool.refreshLayerList();
    this.saveHistory();
    notify('Clip split', 'success');
  }

  _togglePlayback() {
    if (this.timeline.isPlaying) {
      this.timeline.pause();
      this.compositor.layers.forEach(l => l.asset?.data?.pause?.());
      document.getElementById('play-icon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    } else {
      this.timeline.play();
      this.compositor.layers.forEach(l => l.asset?.data?.play?.());
      document.getElementById('play-icon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    }
  }

  _switchTool(name) {
    if (this.activeTool === 'crop') this.tools.crop.deactivate();
    this.activeTool = name;
    if (name === 'crop') this.tools.crop.activate();
    if (name === 'text') this.tools.text.addText();
  }

  saveHistory() { this.history.saveState(this.compositor.layers); }
  _undo() { const s = this.history.undo(); if (s) this._restore(s); }
  _redo() { const s = this.history.redo(); if (s) this._restore(s); }

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
  }

  destroy() {
    this.compositor.stop();
    this.timeline.pause();
    this.assets.forEach(a => a.revoke());
  }
}
