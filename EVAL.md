# EVAL — WaveCut

> **Evaluation Date:** 2026-05-29
> **Maturity Level:** Production-Ready Client-Side Media Suite

---

## 1. Project Purpose & Problem Statement

WaveCut is a professional-grade, browser-based media suite that allows users to crop, trim, layer, filter, synthesize audio, and export images and videos without any external software installs or server uploads. It solves the privacy and processing bottlenecks of traditional cloud editors by conducting all operations entirely client-side using Web APIs (HTML5 Canvas, Web Audio API, Cropper.js, and MediaRecorder).

---

## 2. Technical Architecture

WaveCut is built using modern **Vanilla JavaScript (ES Modules)** with Vite 5, avoiding framework bloat to minimize boot time and maintain direct, lightweight control over DOM elements and canvas buffers.

- **Compositor Engine (`Compositor.js`):** High-performance render loop drawing assets, overlays, adjustments, and transforms onto an HTML5 2D Canvas context.
- **Timeline Engine (`TimelineEngine.js`):** Implements frame-accurate playback, maintaining playhead position, running duration calculations, and syncing frame-by-frame asset states.
- **Audio Synthesizer (`Asset.js`):** Procedural Web Audio API sound generator creating in-memory PCM WAV audio streams.
- **Export Engine (`ExportEngine.js`):**
  - **Images:** Draws active canvas frames directly to blobs (`canvas.toBlob()`) supporting PNG, JPEG, and WebP.
  - **Videos:** Captures a canvas stream (`canvas.captureStream()`) and utilizes the **MediaRecorder API** to encode frames into standard WebM/VP9 videos.
- **History Manager (`HistoryManager.js`):** Command-pattern undo/redo stack using serializable structural state snapshots.

---

## 3. License

MIT License © 2026 WaveCut Contributors
