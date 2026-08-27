<div align="center">

# ?? WaveCut
### 4D Prismatic Browser-Based Media Suite ? Zero Installs, Instant Client-Side Rendering

[![CI](https://github.com/Ares19v/WaveCut/actions/workflows/ci.yml/badge.svg)](https://github.com/Ares19v/WaveCut/actions/workflows/ci.yml)


[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Enabled-FF8800?style=for-the-badge&logo=w3c&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Canvas API](https://img.shields.io/badge/HTML5_Canvas-4K_Rendering-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A lightweight, hyper-fast, privacy-first in-browser creative workstation. Edit, crop, filter, composite layers, synthesize dynamic audio wave patterns, and export videos directly on the client with zero cloud server dependencies.</b>
</p>

</div>

---

## ?? Overview

**WaveCut** solves the privacy vulnerabilities and bandwidth bottlenecks of cloud-based media editors. By executing all image transformations, audio synthesizers, video frame stitching, and canvas compositing directly on the client machine via Web APIs, WaveCut delivers desktop-level rendering speeds inside any standard web browser.

---

## ? Key Features

- **Multi-Track Timeline & Canvas Compositor**: Layer images, video clips, text overlays, and dynamic visualizer shapes with precision drag-and-drop transformations.
- **Client-Side Video & GIF Encoding**: Render and export clips in real-time using the native `MediaRecorder` API and Canvas frame capturing.
- **Audio Synthesizer & Waveform Engine**: Real-time parametric frequency oscillators, dynamic visualizers, and beat-synced canvas ripples using Web Audio API nodes.
- **Lossless Image Cropping & Color Matrix Filters**: Instant aspect ratio transformations, chromatic aberration, PBR neon glows, and custom LUT color adjustments.
- **100% Client-Side Privacy**: No media files, personal audio, or images are ever uploaded to any third-party cloud server.
- **Production Containerization**: Ships with multi-stage Docker build and Nginx configuration for instant global static edge deployment.

---

## ??? Architecture & Tech Stack

```
WaveCut/
??? src/                    # Application source code
?   ??? components/         # Timeline, canvas editor, toolbar & preview viewport
?   ??? hooks/              # Web Audio & Canvas render loops
?   ??? utils/              # Export encoders, filters & transformation math
?   ??? styles/             # Glassmorphic cyberpunk UI styling
??? public/                 # Sound presets, demo clips & icons
??? Dockerfile              # Multi-stage optimized Nginx build
??? docker-compose.yml      # Container orchestration
??? INSTALL.bat             # Quick install script for Windows
??? Run_Project.bat         # Automated local launcher
??? package.json            # Dependencies and build scripts
```

- **Frontend**: React 18, HTML5 Canvas, Web Audio API, Lucide Icons
- **Bundler**: Vite
- **Deployment**: Nginx Alpine Docker Container

---

## ?? Quick Start

### Option 1: Native Node.js

```bash
# Clone repository
git clone https://github.com/Ares19v/WaveCut.git
cd WaveCut

# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Docker Compose

```bash
docker compose up -d --build
```
Access the application at `http://localhost:80` (or `http://localhost:5173` in dev mode).

---

## ?? License

Distributed under the MIT License. See `LICENSE` for details.