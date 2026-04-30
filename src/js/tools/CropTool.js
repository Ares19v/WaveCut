import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';
import { notify } from '../ui/Notifications.js';

export class CropTool {
  constructor(editor) {
    this.editor = editor;
    this._cropper = null;
    this._overlay = document.getElementById('crop-overlay');
  }

  activate() {
    const layer = this.editor.selectedLayer;
    if (!layer || layer.assetType !== 'image') {
      notify('Select an image layer first', 'warn');
      return;
    }

    // Build crop UI inside overlay
    this._overlay.classList.remove('hidden');
    this._overlay.innerHTML = '';
    this._overlay.style.cssText = 'position:absolute;inset:0;z-index:20;background:#000;display:flex;flex-direction:column;';

    const img = document.createElement('img');
    img.src = layer.asset.data.src;
    img.style.cssText = 'max-width:100%;max-height:calc(100% - 52px);display:block;';
    this._overlay.appendChild(img);

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'height:52px;display:flex;align-items:center;justify-content:center;gap:12px;background:#141416;border-top:1px solid #26262e;flex-shrink:0;';

    this._applyBtn = document.createElement('button');
    this._applyBtn.textContent = 'Apply Crop';
    this._applyBtn.style.cssText = 'background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;padding:8px 20px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;border:none;';
    this._applyBtn.onclick = () => this.applyCrop();

    this._cancelBtn = document.createElement('button');
    this._cancelBtn.textContent = 'Cancel';
    this._cancelBtn.style.cssText = 'background:#1a1a1e;color:#8888a0;padding:8px 20px;border-radius:6px;font-weight:500;font-size:13px;cursor:pointer;border:1px solid #26262e;';
    this._cancelBtn.onclick = () => this.deactivate();

    toolbar.appendChild(this._cancelBtn);
    toolbar.appendChild(this._applyBtn);
    this._overlay.appendChild(toolbar);

    // Instantiate cropper after DOM settles
    requestAnimationFrame(() => {
      this._cropper = new Cropper(img, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 0.85,
        responsive: true,
        background: false,
      });
    });
  }

  async applyCrop() {
    if (!this._cropper) return;
    const canvas = this._cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
    const dataUrl = canvas.toDataURL('image/png');

    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = dataUrl; });

    const layer = this.editor.selectedLayer;
    if (layer && layer.assetType === 'image') {
      layer.asset.data = img;
      layer.asset.width = img.naturalWidth;
      layer.asset.height = img.naturalHeight;
      layer.transform.width = img.naturalWidth;
      layer.transform.height = img.naturalHeight;
      this.editor.saveHistory();
      import('../ui/Notifications.js').then(m => m.notify('Crop applied!', 'success'));
    }
    this.deactivate();
  }

  deactivate() {
    if (this._cropper) { this._cropper.destroy(); this._cropper = null; }
    this._overlay.classList.add('hidden');
    this._overlay.innerHTML = '';
  }
}
