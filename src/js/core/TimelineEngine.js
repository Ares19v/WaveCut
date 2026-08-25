export class TimelineEngine {
  constructor() {
    this.currentTime = 0;
    this.totalDuration = 0;
    this.isPlaying = false;
    this.pixelsPerSecond = 80;
    this._raf = null;
    this._lastTimestamp = null;
    this._onTick = null; // callback(currentTime)
  }

  setDuration(dur) {
    this.totalDuration = Math.max(dur, 0);
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this._lastTimestamp = performance.now();
    this._tick();
  }

  pause() {
    this.isPlaying = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  seek(t) {
    this.currentTime = Math.max(0, Math.min(t, this.totalDuration > 0 ? this.totalDuration : t));
    if (this._onTick) this._onTick(this.currentTime);
  }

  _tick() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const dt = (now - this._lastTimestamp) / 1000;
    this._lastTimestamp = now;

    this.currentTime += dt;

    if (this.totalDuration > 0 && this.currentTime >= this.totalDuration) {
      this.currentTime = 0;
      if (this._onTick) this._onTick(0);
      this.pause();
      return;
    }

    if (this._onTick) this._onTick(this.currentTime);
    this._raf = requestAnimationFrame(() => this._tick());
  }

  timeToPixel(t) {
    return t * this.pixelsPerSecond;
  }

  pixelToTime(px) {
    return Math.max(0, px / this.pixelsPerSecond);
  }

  formatTime(secs) {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
}
