export class Asset {
  static #blobUrls = [];

  constructor(file) {
    this.id = `asset-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    this.file = file;
    this.name = file.name;
    this.assetType = file.type.startsWith('video/') ? 'video' : 'image';
    this.data = null;
    this.thumbnail = null;
    this.duration = 0;
    this.width = 0;
    this.height = 0;
    this._blobUrl = null;
  }

  async load() {
    return new Promise((resolve, reject) => {
      this._blobUrl = URL.createObjectURL(this.file);
      Asset.#blobUrls.push(this._blobUrl);

      if (this.assetType === 'image') {
        const img = new Image();
        img.onload = () => {
          this.data = img;
          this.width = img.naturalWidth;
          this.height = img.naturalHeight;
          this.thumbnail = this._makeThumbnail(img);
          resolve(this);
        };
        img.onerror = reject;
        img.src = this._blobUrl;
      } else {
        const video = document.createElement('video');
        video.muted = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          this.data = video;
          this.width = video.videoWidth;
          this.height = video.videoHeight;
          this.duration = video.duration;
          video.currentTime = Math.min(1, video.duration * 0.1);
        };
        video.onseeked = () => {
          this.thumbnail = this._makeThumbnail(video);
          resolve(this);
        };
        video.onerror = () => reject(new Error(`Failed to load video: ${this.name}`));
        video.src = this._blobUrl;
        video.load();
      }
    });
  }

  _makeThumbnail(source) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 108;
    canvas.height = 72;
    const srcW = source.videoWidth || source.naturalWidth || source.width;
    const srcH = source.videoHeight || source.naturalHeight || source.height;
    const ratio = srcW / srcH;
    let w = canvas.width, h = canvas.width / ratio;
    if (h > canvas.height) { h = canvas.height; w = canvas.height * ratio; }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas.toDataURL('image/jpeg', 0.75);
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
