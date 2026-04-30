export class MediaPool {
  constructor(editor) {
    this.editor = editor;
    this._grid = document.getElementById('asset-grid');
    this._clipsList = document.getElementById('clips-list');
  }

  addAsset(asset) {
    document.getElementById('pool-empty')?.classList.add('hidden');
    const item = document.createElement('div');
    item.className = 'asset-item';
    item.innerHTML = `
      <img src="${asset.thumbnail}">
      <div class="asset-item-name">${asset.name}</div>
    `;
    item.onclick = () => this.editor.addAssetToTimeline(asset);
    this._grid.appendChild(item);
  }

  refreshLayerList() {
    this._clipsList.innerHTML = '';
    const layers = this.editor.compositor.layers;
    if (!layers.length) {
      this._clipsList.innerHTML = '<div class="pool-empty">No clips on timeline</div>';
      return;
    }
    
    [...layers].reverse().forEach(layer => {
      const item = document.createElement('div');
      item.className = `asset-item ${this.editor.selectedLayer?.id === layer.id ? 'selected' : ''}`;
      item.style.flexDirection = 'row';
      item.style.height = '40px';
      item.style.marginBottom = '5px';
      item.innerHTML = `
        <div style="padding: 10px; font-size: 0.75rem;">${layer.name}</div>
      `;
      item.onclick = () => this.editor.selectLayer(layer.id);
      this._clipsList.appendChild(item);
    });
  }
}
