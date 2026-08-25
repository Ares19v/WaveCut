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
    
    const typeLabel = asset.assetType ? asset.assetType.toUpperCase() : 'IMG';

    item.innerHTML = `
      <div class="asset-thumb-wrap">
        <img src="${asset.thumbnail}" alt="${asset.name}">
        <span class="asset-type-badge">${typeLabel}</span>
      </div>
      <div class="asset-item-name">${asset.name}</div>
    `;

    item.addEventListener('click', () => {
      this.editor.addAssetToTimeline(asset);
    });

    this._grid.appendChild(item);
  }

  refreshLayerList() {
    if (!this._clipsList) return;
    this._clipsList.innerHTML = '';
    const layers = this.editor.compositor.layers;
    
    if (!layers.length) {
      this._clipsList.innerHTML = '<div class="pool-empty"><p>No active layers</p><span>Add media or text</span></div>';
      return;
    }

    [...layers].reverse().forEach(layer => {
      const item = document.createElement('div');
      const isSel = this.editor.selectedLayer?.id === layer.id;
      item.className = `asset-item ${isSel ? 'selected' : ''}`;
      item.style.padding = '8px 12px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.marginBottom = '6px';
      
      const typeTag = layer.assetType.toUpperCase();
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
          <span style="font-size:0.65rem; color:var(--gold); font-weight:700;">[${typeTag}]</span>
          <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px;">${layer.name}</span>
        </div>
        <button class="layer-del-mini" style="color:var(--danger); font-size:0.75rem; padding:2px 6px;">✕</button>
      `;

      item.querySelector('.layer-del-mini').addEventListener('click', e => {
        e.stopPropagation();
        this.editor.deleteLayer(layer.id);
      });

      item.addEventListener('click', () => {
        this.editor.selectLayer(layer.id);
      });

      this._clipsList.appendChild(item);
    });
  }
}
