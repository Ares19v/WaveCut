export class Asset {
  static #blobUrls = [];

  constructor(file, customType = null) {
    this.id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.file = file;
    this.name = file ? file.name : 'Sample Media';
    
    if (customType) {
      this.assetType = customType;
    } else if (file) {
      if (file.type.startsWith('video/')) this.assetType = 'video';
      else if (file.type.startsWith('audio/')) this.assetType = 'audio';
      else this.assetType = 'image';
    } else {
      this.assetType = 'image';
    }

    this.data = null;
    this.thumbnail = null;
    this.duration = 0;
    this.width = 1920;
    this.height = 1080;
    this._blobUrl = null;
  }

  async load() {
    return new Promise((resolve, reject) => {
      if (!this.file) {
        resolve(this);
        return;
      }

      this._blobUrl = URL.createObjectURL(this.file);
      Asset.#blobUrls.push(this._blobUrl);

      if (this.assetType === 'image') {
        const img = new Image();
        img.onload = () => {
          this.data = img;
          this.width = img.naturalWidth || 1920;
          this.height = img.naturalHeight || 1080;
          this.thumbnail = this._makeThumbnail(img);
          resolve(this);
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${this.name}`));
        img.src = this._blobUrl;

      } else if (this.assetType === 'video') {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        let resolved = false;
        const finalize = () => {
          if (resolved) return;
          resolved = true;
          this.data = video;
          this.width = video.videoWidth || 1920;
          this.height = video.videoHeight || 1080;
          this.duration = video.duration || 5;
          try {
            this.thumbnail = this._makeThumbnail(video);
          } catch (e) {
            this.thumbnail = this._makePlaceholderThumb('#f5b041', 'VIDEO');
          }
          resolve(this);
        };

        video.onloadeddata = () => {
          video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1);
        };

        video.onseeked = () => finalize();
        video.onloadedmetadata = () => {
          if (video.videoWidth) {
            setTimeout(finalize, 200);
          }
        };

        video.onerror = () => reject(new Error(`Failed to load video: ${this.name}`));
        video.src = this._blobUrl;
        video.load();

      } else if (this.assetType === 'audio') {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          this.data = audio;
          this.duration = audio.duration || 8;
          this.thumbnail = this._makePlaceholderThumb('#9d4edd', 'AUDIO');
          resolve(this);
        };
        audio.onerror = () => reject(new Error(`Failed to load audio: ${this.name}`));
        audio.src = this._blobUrl;
        audio.load();
      }
    });
  }

  _makeThumbnail(source) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 90;

    const srcW = source.videoWidth || source.naturalWidth || source.width || 160;
    const srcH = source.videoHeight || source.naturalHeight || source.height || 90;
    const ratio = srcW / srcH;
    
    let w = canvas.width, h = canvas.width / ratio;
    if (h > canvas.height) {
      h = canvas.height;
      w = canvas.height * ratio;
    }

    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawImage(source, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      return this._makePlaceholderThumb('#00f0ff', 'MEDIA');
    }
  }

  _makePlaceholderThumb(color, label) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 90;
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, 160, 90);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 140, 70);
    ctx.fillStyle = color;
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 80, 45);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  static createSampleCosmicImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1100);
    grad.addColorStop(0, '#1a103c');
    grad.addColorStop(0.4, '#0d0e26');
    grad.addColorStop(0.8, '#060712');
    grad.addColorStop(1, '#020204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    const core = ctx.createRadialGradient(960, 540, 10, 960, 540, 450);
    core.addColorStop(0, 'rgba(255, 240, 200, 1)');
    core.addColorStop(0.15, 'rgba(245, 176, 65, 0.9)');
    core.addColorStop(0.4, 'rgba(230, 126, 34, 0.5)');
    core.addColorStop(0.7, 'rgba(0, 240, 255, 0.2)');
    core.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(960, 540, 450, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(960, 540);
    ctx.rotate(-15 * Math.PI / 180);
    ctx.scale(1, 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, 600, 0, Math.PI * 2);
    ctx.lineWidth = 40;
    ctx.strokeStyle = 'rgba(245, 176, 65, 0.85)';
    ctx.shadowColor = '#f5b041';
    ctx.shadowBlur = 50;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 200; i++) {
      const sx = Math.random() * 1920;
      const sy = Math.random() * 1080;
      const sr = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.3 ? '#f5b041' : '#00f0ff';
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    
    const asset = new Asset(null, 'image');
    asset.name = 'Interstellar Singularity.png';
    asset.data = img;
    asset.width = 1920;
    asset.height = 1080;
    asset.duration = 6;
    asset.thumbnail = asset._makeThumbnail(canvas);
    return asset;
  }

  static createSampleTesseractGrid() {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.lineWidth = 2;
    for (let x = 0; x <= 1920; x += 80) {
      const g = ctx.createLinearGradient(x, 0, x, 1080);
      g.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
      g.addColorStop(0.5, 'rgba(245, 176, 65, 0.4)');
      g.addColorStop(1, 'rgba(0, 240, 255, 0.1)');
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 0; y <= 1080; y += 80) {
      const g = ctx.createLinearGradient(0, y, 1920, y);
      g.addColorStop(0, 'rgba(245, 176, 65, 0.1)');
      g.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
      g.addColorStop(1, 'rgba(245, 176, 65, 0.1)');
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    const img = new Image();
    img.src = canvas.toDataURL('image/png');

    const asset = new Asset(null, 'image');
    asset.name = '4D Prism Matrix.png';
    asset.data = img;
    asset.width = 1920;
    asset.height = 1080;
    asset.duration = 6;
    asset.thumbnail = asset._makeThumbnail(canvas);
    return asset;
  }

  static createSynthesizedSound(type) {
    const sampleRate = 44100;
    const duration = 8; // 8 seconds
    const numSamples = sampleRate * duration;
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      if (type === 'gargantua') {
        // 55Hz & 110Hz sub-bass with gentle 0.2Hz beating
        const sub = Math.sin(2 * Math.PI * 55 * t) * 0.5;
        const sub2 = Math.sin(2 * Math.PI * 55.4 * t) * 0.3;
        const drone = Math.sin(2 * Math.PI * 110 * t) * 0.15;
        const noise = (Math.random() * 2 - 1) * 0.03;
        const env = Math.min(1, t / 1.5) * Math.min(1, (duration - t) / 1.5);
        buffer[i] = (sub + sub2 + drone + noise) * env * 0.6;
      } else if (type === 'sweep') {
        // Resonant frequency sweep 150Hz -> 850Hz -> 200Hz
        const freq = 150 + 700 * Math.sin((t / duration) * Math.PI);
        const wave = Math.sin(2 * Math.PI * freq * t);
        const env = Math.min(1, t / 1.0) * Math.min(1, (duration - t) / 1.0);
        buffer[i] = wave * env * 0.4;
      } else if (type === 'pulsar') {
        // Rhythmic cosmic pulse
        const pulse = Math.pow(Math.sin(2 * Math.PI * 2 * t), 12);
        const tone = Math.sin(2 * Math.PI * 440 * t) * 0.4;
        const env = Math.min(1, t / 0.5) * Math.min(1, (duration - t) / 0.5);
        buffer[i] = pulse * tone * env * 0.5;
      }
    }

    // Convert Float32Array to 16-bit PCM WAV Blob
    const wavBlob = Asset._encodeWAV(buffer, sampleRate);
    const audio = new Audio();
    const url = URL.createObjectURL(wavBlob);
    Asset.#blobUrls.push(url);
    audio.src = url;

    const names = {
      gargantua: 'Gargantua Deep Drone.wav',
      sweep: 'Singularity Sweep.wav',
      pulsar: 'Quantum Pulsar.wav'
    };

    const asset = new Asset(null, 'audio');
    asset.name = names[type] || 'Synthesized Audio.wav';
    asset.data = audio;
    asset.duration = duration;
    asset.thumbnail = asset._makePlaceholderThumb('#9d4edd', 'AUDIO');
    return asset;
  }

  static _encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  revoke() {
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
  }

  static revokeAll() {
    Asset.#blobUrls.forEach(u => URL.revokeObjectURL(u));
    Asset.#blobUrls = [];
  }
}
