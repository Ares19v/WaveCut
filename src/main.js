import { ModeSelector } from './js/ui/ModeSelector.js';
import { Editor } from './js/core/Editor.js';
import { TesseractBg } from './js/ui/TesseractBg.js';

// Boot 4D Tesseract background engine
const bgCanvas = document.getElementById('tesseract-bg');
if (bgCanvas) {
  const tesseractBg = new TesseractBg('tesseract-bg');
  tesseractBg.start();
}

let currentEditor = null;

const modeSelector = new ModeSelector((mode) => {
  if (currentEditor) currentEditor.destroy();
  currentEditor = new Editor(mode);
  window.currentWaveCutEditor = currentEditor;
});

// Expose for back-button & demo use
window.wavecutModeSelector = modeSelector;

// Revoke all blob URLs on unload
window.addEventListener('beforeunload', () => {
  if (currentEditor) currentEditor.destroy();
});

