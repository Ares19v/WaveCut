import { notify } from '../ui/Notifications.js';

export class ExportEngine {
  constructor(compositor) {
    this.compositor = compositor;
    this._selectedFormat = 'png';
    this._quality = 0.95;
    this._mode = 'image'; // 'image' | 'video'
  }

  setMode(mode) { this._mode = mode; }
  setFormat(fmt) { this._selectedFormat = fmt; }
  setQuality(q) { this._quality = Math.max(0.1, Math.min(1, q)); }
  setFilename(name) { this._filename = name || 'wavecut-export'; }

  async export(onProgress) {
    if (this._mode === 'image') return this._exportImage(onProgress);
    return this._exportVideo(onProgress);
  }

  async _exportImage(onProgress) {
    if (onProgress) onProgress(0.3, 'Rendering canvas...');
    const fmt = this._selectedFormat;
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
    const mime = mimeMap[fmt] || 'image/png';
    const ext = fmt === 'jpg' ? 'jpeg' : fmt;
    const filename = this._filename || 'wavecut-export';

    if (onProgress) onProgress(0.7, 'Encoding image...');
    const blob = await this.compositor.toBlob(mime, this._quality);
    if (onProgress) onProgress(1.0, 'Done!');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    notify('Export complete!', 'success');
  }

  async _exportVideo(onProgress) {
    const canvas = this.compositor.canvas;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this._filename || 'wavecut-export'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        if (onProgress) onProgress(1.0, 'Done!');
        notify('Video export complete!', 'success');
        resolve();
      };
      recorder.onerror = reject;

      // Record for the duration of all video layers or at least 3s
      const layers = this.compositor.layers;
      const videoDur = layers.reduce((max, l) => {
        return l.asset && l.asset.assetType === 'video' ? Math.max(max, l.asset.duration) : max;
      }, 0);
      const dur = Math.max(videoDur, 3) * 1000;

      recorder.start(100);
      if (onProgress) onProgress(0.1, 'Recording...');

      // Play video assets
      layers.forEach(l => { if (l.asset?.assetType === 'video') { l.asset.data.currentTime = 0; l.asset.data.play(); }});

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 200;
        if (onProgress) onProgress(Math.min(0.9, elapsed / dur), 'Encoding...');
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        layers.forEach(l => { if (l.asset?.assetType === 'video') l.asset.data.pause(); });
        recorder.stop();
      }, dur);
    });
  }
}
