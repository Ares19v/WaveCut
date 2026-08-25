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
      notify('Select an image layer to crop', 'warn');
      return;
    }

    if (!layer.asset?.data?.src) {
      notify('Image data unavailable for cropping', 'error');
      return;
    }

    this._overlay.classList.remove('hidden');
    this._overlay.innerHTML = '';
    this._overlay.style.cssText = 'position:absolute;inset:0;z-index:40;background:#05060a;display:flex;flex-direction:column;';

    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:20px;';
    
    const img = document.createElement('img');
    img.src = layer.asset.data.src;
    img.style.cssText = 'max-width:100%;max-height:100%;display:block;';
    imgWrap.appendChild(img);
    this._overlay.appendChild(imgWrap);

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(12,15,24,0.95);border-top:1px solid rgba(245,176,65,0.2);flex-shrink:0;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'background:rgba(255,255,255,0.06);color:#fff;padding:8px 18px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);';
    cancelBtn.onclick = () => this.deactivate();

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply Crop';
    applyBtn.style.cssText = 'background:linear-gradient(135deg,#f5b041,#e67e22);color:#000;padding:8px 22px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;border:none;box-shadow:0 0 15px rgba(245,176,65,0.3);';
    applyBtn.onclick = () => this.applyCrop();

    toolbar.appendChild(cancelBtn);
    toolbar.appendChild(applyBtn);
    this._overlay.appendChild(toolbar);

    requestAnimationFrame(() => {
      this._cropper = new Cropper(img, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 0.9,
        responsive: true,
        background: false,
      });
    });
  }

  async applyCrop() {
    if (!this._cropper) return;
    const canvas = this._cropper.getCroppedCanvas({ maxWidth: 3840, maxHeight: 3840 });
    const dataUrl = canvas.toDataURL('image/png');

    const img = new Image();
    await new Promise(resolve => {
      img.onload = resolve;
      img.src = dataUrl;
    });

    const layer = this.editor.selectedLayer;
    if (layer && layer.assetType === 'image') {
      layer.asset.data = img;
      layer.asset.width = img.naturalWidth;
      layer.asset.height = img.naturalHeight;
      layer.transform.width = img.naturalWidth;
      layer.transform.height = img.naturalHeight;
      this.editor.saveHistory();
      notify('Crop applied successfully!', 'success');
    }
    this.deactivate();
  }

  deactivate() {
    if (this._cropper) {
      this._cropper.destroy();
      this._cropper = null;
    }
    this._overlay.classList.add('hidden');
    this._overlay.innerHTML = '';
    this.editor.activeTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === 'select'));
  }
}
