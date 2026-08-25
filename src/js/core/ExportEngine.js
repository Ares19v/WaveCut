import { notify } from '../ui/Notifications.js';

export class ExportEngine {
  constructor(compositor) {
    this.compositor = compositor;
    this._selectedFormat = 'png';
    this._quality = 0.95;
    this._mode = 'video';
    this._filename = 'interstellar-master';
  }

  setMode(mode) {
    this._mode = mode;
  }

  setFormat(fmt) {
    this._selectedFormat = fmt.toLowerCase();
  }

  setQuality(q) {
    this._quality = Math.max(0.2, Math.min(1, q));
  }

  setFilename(name) {
    this._filename = (name || 'wavecut-render').trim();
  }

  async export(onProgress) {
    if (this._mode === 'image' || this._selectedFormat === 'png' || this._selectedFormat === 'jpg' || this._selectedFormat === 'webp') {
      return this._exportImage(onProgress);
    }
    return this._exportVideo(onProgress);
  }

  async takeSnapshot() {
    try {
      const blob = await this.compositor.toBlob('image/png', 1.0);
      if (!blob) throw new Error('Canvas render failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wavecut-snapshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      notify('Snapshot saved to Downloads!', 'success');
    } catch (err) {
      notify(`Snapshot error: ${err.message}`, 'error');
    }
  }

  async _exportImage(onProgress) {
    if (onProgress) onProgress(0.2, 'Rasterizing canvas...');
    const fmt = this._selectedFormat;
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    };
    const mime = mimeMap[fmt] || 'image/png';
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;
    const filename = this._filename || 'wavecut-master';

    if (onProgress) onProgress(0.6, 'Encoding color matrices...');
    const blob = await this.compositor.toBlob(mime, this._quality);
    if (!blob) throw new Error('Failed to generate image buffer');

    if (onProgress) onProgress(1.0, 'Download starting...');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    notify(`Exported ${filename}.${ext} successfully!`, 'success');
  }

  async _exportVideo(onProgress) {
    const canvas = this.compositor.canvas;
    
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    }

    const stream = canvas.captureStream(30);
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 });
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }

    const chunks = [];
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = this._filename || 'wavecut-video';
        a.download = `${filename}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        if (onProgress) onProgress(1.0, 'Render Complete!');
        notify(`Video rendered and downloaded (${filename}.webm)`, 'success');
        resolve();
      };

      recorder.onerror = err => {
        reject(err);
      };

      // Calculate total rendering duration
      const layers = this.compositor.layers;
      const maxEnd = layers.reduce((max, l) => Math.max(max, (l.startTime || 0) + (l.duration || 5)), 0);
      const totalSec = Math.max(maxEnd, 3);
      const totalMs = totalSec * 1000;

      recorder.start(100);
      if (onProgress) onProgress(0.05, 'Encoding frames...');

      // Reset playback state for video assets
      layers.forEach(l => {
        if (l.asset?.assetType === 'video' && l.asset.data) {
          l.asset.data.currentTime = 0;
          l.asset.data.play().catch(() => {});
        }
      });

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 200;
        const pct = Math.min(0.95, elapsed / totalMs);
        if (onProgress) onProgress(pct, `Encoding 4D stream (${Math.round(pct * 100)}%)...`);
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        layers.forEach(l => {
          if (l.asset?.assetType === 'video' && l.asset.data) {
            l.asset.data.pause();
          }
        });
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, totalMs);
    });
  }
}
