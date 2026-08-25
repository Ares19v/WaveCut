export class TesseractBg {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.filaments = [];
    this.particles = [];
    this.gridBeams = [];
    this.time = 0;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.targetMouseX = this.mouseX;
    this.targetMouseY = this.mouseY;
    this._running = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
    window.addEventListener('mousemove', e => {
      this.targetMouseX = e.clientX;
      this.targetMouseY = e.clientY;
    });

    this._initElements();
  }

  _resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  _initElements() {
    const w = this.width;
    const h = this.height;

    // 4D Luminous Time Strands (The Infinite Interstellar Tesseract Loom)
    this.filaments = [];
    const count = 55;
    for (let i = 0; i < count; i++) {
      this.filaments.push({
        x: Math.random() * w,
        depth: Math.random() * 0.9 + 0.1,
        speed: Math.random() * 0.4 + 0.15,
        width: Math.random() * 3 + 0.8,
        colorType: Math.random() > 0.3 ? 'gold' : 'cyan',
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 1.5 + 0.5,
        offset: Math.random() * Math.PI * 2
      });
    }

    // Floating Gravitational Light Motes
    this.particles = [];
    for (let i = 0; i < 110; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        size: Math.random() * 2.8 + 0.8,
        speedY: (Math.random() - 0.5) * 0.6,
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.3,
        color: Math.random() > 0.35 ? '#f5b041' : '#00f0ff'
      });
    }

    // 4D Perspective Infinite Ray Warp Matrix
    this.gridBeams = [];
    const numGrid = 36;
    for (let i = 0; i < numGrid; i++) {
      this.gridBeams.push({
        angle: (i / numGrid) * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.02,
        color: i % 2 === 0 ? 'rgba(245, 176, 65, 0.22)' : 'rgba(0, 240, 255, 0.16)'
      });
    }
  }

  start() {
    if (!this.canvas || this._running) return;
    this._running = true;
    this._loop();
  }

  stop() {
    this._running = false;
  }

  _loop() {
    if (!this._running) return;
    this.time += 0.008;

    // Smooth mouse parallax interpolation
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this._render();
    requestAnimationFrame(() => this._loop());
  }

  _render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Deep Cosmic Void Base with Radiant Singularity Core
    const parallaxX = (this.mouseX - w / 2) * 0.04;
    const parallaxY = (this.mouseY - h / 2) * 0.04;
    const cx = w / 2 + parallaxX;
    const cy = h / 2 + parallaxY;

    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(w, h));
    bgGrad.addColorStop(0, '#101424');
    bgGrad.addColorStop(0.3, '#090c17');
    bgGrad.addColorStop(0.65, '#04050a');
    bgGrad.addColorStop(1, '#010204');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 4D Perspective Infinite Ray Grid
    ctx.save();
    this.gridBeams.forEach((beam, idx) => {
      const angle = beam.angle + Math.sin(this.time * 0.4 + idx) * 0.03;
      const x2 = cx + Math.cos(angle) * Math.max(w, h) * 1.8;
      const y2 = cy + Math.sin(angle) * Math.max(w, h) * 1.8;

      const grad = ctx.createLinearGradient(cx, cy, x2, y2);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.2, beam.color);
      grad.addColorStop(0.8, beam.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.restore();

    // Perspective Cross Grid Ellipses (Tesseract Chamber Ceiling & Floor)
    ctx.save();
    for (let r = 70; r < Math.max(w, h); r += 80) {
      const ringAlpha = Math.max(0, 0.22 - (r / Math.max(w, h)) * 0.16);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.8, r * 0.95, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 176, 65, " + ringAlpha + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // Vertical Luminous Time Strands (The 4D Loom Filaments)
    ctx.save();
    this.filaments.forEach(f => {
      const sway = Math.sin(this.time * f.speed + f.offset) * (25 * f.depth);
      const x = (f.x + sway + parallaxX * (1 - f.depth)) % w;
      const wave = Math.sin(this.time * f.pulseSpeed + f.x) * 0.25;
      
      const grad = ctx.createLinearGradient(x, 0, x, h);
      const isGold = f.colorType === 'gold';
      const rgb = isGold ? '245, 176, 65' : '0, 240, 255';
      const a = f.alpha * (0.8 + wave);

      grad.addColorStop(0, "rgba(" + rgb + ", 0)");
      grad.addColorStop(0.25, "rgba(" + rgb + ", " + (a * 0.6) + ")");
      grad.addColorStop(0.5, "rgba(" + rgb + ", " + (a * 1.3) + ")");
      grad.addColorStop(0.75, "rgba(" + rgb + ", " + (a * 0.6) + ")");
      grad.addColorStop(1, "rgba(" + rgb + ", 0)");

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.strokeStyle = grad;
      ctx.lineWidth = f.width;
      ctx.shadowColor = isGold ? '#f5b041' : '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    });
    ctx.restore();

    // Drifting Gravitational Light Motes
    ctx.save();
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;

      const px = p.x + parallaxX * p.z;
      const py = p.y + parallaxY * p.z;
      const pulse = Math.sin(this.time * 3 + p.x) * 0.3 + 0.7;

      ctx.beginPath();
      ctx.arc(px, py, p.size * p.z, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * pulse;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fill();
    });
    ctx.restore();

    // Singularity Center Prism Flare
    const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 380);
    centerGlow.addColorStop(0, 'rgba(245, 176, 65, 0.16)');
    centerGlow.addColorStop(0.3, 'rgba(0, 240, 255, 0.08)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 380, 0, Math.PI * 2);
    ctx.fill();
  }
}
