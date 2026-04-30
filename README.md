<h1 align="center">
  <img src="public/logo.png" alt="WaveCut" width="48" style="vertical-align:middle"/>
  WaveCut
</h1>

<p align="center">
  <b>Professional browser-based media editor — Image & Video, zero installs for users.</b><br/>
  Crop · Trim · Filter · Layer · Export in any format
</p>

<p align="center">
  <a href="https://github.com/Ares19v/WaveCut/actions"><img src="https://github.com/Ares19v/WaveCut/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"/>
  <img src="https://img.shields.io/badge/built%20with-Vite%205-646CFF?logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="Vanilla JS"/>
</p>

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🖼 **Dual Mode** | Switch between Image Editor and Video Editor on the landing screen |
| 🎬 **Multi-track Timeline** | Video / Overlay / Audio tracks with frame thumbnail strips |
| ✂️ **Split Clips** | Cut any clip at the playhead position (`S` key or Split button) |
| 🎨 **Real-time Compositor** | Canvas-based render engine with per-layer transforms and filters |
| 📝 **Text Overlay** | Add styled text with font, colour, shadow, bold/italic controls |
| 🔲 **Crop Tool** | Non-destructive crop via Cropper.js |
| 🎚 **Adjust Panel** | Brightness · Contrast · Saturation · Hue · Blur · Opacity |
| ↩ **Undo / Redo** | 60-step history with `Ctrl+Z` / `Ctrl+Y` |
| 📤 **Export Engine** | PNG · JPEG · WebP (image) and WebM (video via MediaRecorder) |
| ⌨️ **Keyboard Shortcuts** | `Space` play/pause · `S` split · `Del` delete · `V` select · `C` crop |

---

## 🚀 Quick Start

### Option A — Run with the batch file (Windows)
```
double-click INSTALL.bat   # first time only — installs deps
double-click Run_Project.bat   # opens editor in your browser
```

### Option B — Run manually
```bash
npm install
npm run dev
```
Open **http://localhost:5173**

### Option C — Docker
```bash
docker compose up
```
Open **http://localhost:8080**

---

## 🏗 Tech Stack

- **Framework**: [Vite 5](https://vitejs.dev/) + Vanilla JavaScript (ES Modules)
- **Rendering**: HTML5 Canvas 2D API
- **Crop**: [Cropper.js](https://fengyuanchen.github.io/cropperjs/)
- **Video Export**: MediaRecorder API (WebM/VP9)
- **Fonts**: [Inter](https://rsms.me/inter/) via Google Fonts

---

## 📁 Project Structure

```
WaveCut/
├── index.html                # App shell & layout
├── src/
│   ├── main.js               # Entry point — boots ModeSelector → Editor
│   ├── style.css             # Design system (dark theme, CSS vars)
│   └── js/
│       ├── core/
│       │   ├── Asset.js          # File loading, blob URL management
│       │   ├── Compositor.js     # Canvas render loop
│       │   ├── Editor.js         # Main orchestrator
│       │   ├── ExportEngine.js   # PNG/JPEG/WebP/WebM export
│       │   ├── HistoryManager.js # Undo/redo with serialisable snapshots
│       │   └── TimelineEngine.js # Frame-accurate rAF playback
│       ├── tools/
│       │   ├── CropTool.js       # Cropper.js integration
│       │   ├── SelectTool.js     # Canvas hit-test + drag to move
│       │   └── TextTool.js       # Text layer creation
│       └── ui/
│           ├── ExportModal.js    # Format/quality/resolution picker
│           ├── Inspector.js      # Properties panel (transform/adjust/text)
│           ├── MediaPool.js      # Asset grid + clips list
│           ├── ModeSelector.js   # Landing screen transition
│           ├── Notifications.js  # Toast system
│           └── Timeline.js       # Multi-track UI + thumbnail strips
├── Dockerfile
├── docker-compose.yml
├── Run_Project.bat
├── INSTALL.bat
└── .github/workflows/ci.yml
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `S` | Split clip at playhead |
| `Del` | Delete selected clip |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `V` | Select tool |
| `C` | Crop tool |

---

## 📄 License

[MIT](LICENSE) © 2025 Devansh Tyagi
