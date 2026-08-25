export class TextTool {
  constructor(editor) {
    this.editor = editor;
  }

  addText(text = '4D TESSERACT', preset = 'title') {
    const layer = this.editor.compositor.addTextLayer(text, preset);
    layer.startTime = this.editor.timeline.currentTime;
    layer.duration = 5;

    this.editor.selectedLayer = layer;
    this.editor.ui.mediaPool.refreshLayerList();
    this.editor.ui.inspector.refresh(layer);
    this.editor.ui.timeline.placeClip(layer);
    this.editor.saveHistory();

    // Auto-switch inspector to Text tab
    document.querySelector('[data-itab="text"]')?.click();
  }
}
