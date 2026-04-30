export class TextTool {
  constructor(editor) {
    this.editor = editor;
  }

  addText(text = 'Your Text Here') {
    const layer = this.editor.compositor.addTextLayer(text);
    this.editor.selectedLayer = layer;
    this.editor.ui.mediaPool.refreshLayerList();
    this.editor.ui.inspector.refresh(layer);
    this.editor.ui.timeline.placeClip(layer);
    this.editor.saveHistory();
    // Switch to Text tab in left panel
    document.querySelector('[data-lptab="text"]')?.click();
  }
}
