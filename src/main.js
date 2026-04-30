import { ModeSelector } from './js/ui/ModeSelector.js';
import { Editor } from './js/core/Editor.js';

let currentEditor = null;

const modeSelector = new ModeSelector((mode) => {
  if (currentEditor) currentEditor.destroy();
  currentEditor = new Editor(mode);
});

// Expose for back-button use
window.wavecutModeSelector = modeSelector;

// Revoke all blob URLs on unload
window.addEventListener('beforeunload', () => {
  if (currentEditor) currentEditor.destroy();
});
