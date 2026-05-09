export class MiniMap {
  constructor(walkableZones, mapBounds) {
    this._zones = walkableZones;
    this._bounds = mapBounds; // { minX, maxX, minZ, maxZ }
    this._canvas = null;
    this._ctx = null;
    this._bgCanvas = null;
    this._bgCtx = null;
    this._updateTimer = 0;
    this._blinkTimer = 0;
    this._panel = null;

    this._create();
    this._drawStaticLayer();
  }

  _create() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed; bottom: 60px; left: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 8px; overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.6);
      z-index: 101; pointer-events: none;
    `;

    this._canvas = document.createElement('canvas');
    this._canvas.width = 140;
    this._canvas.height = 105;
    this._canvas.style.display = 'block';
    this._ctx = this._canvas.getContext('2d');

    panel.appendChild(this._canvas);
    document.body.appendChild(panel);
    this._panel = panel;

    // Static background layer (pre-rendered map)
    this._bgCanvas = document.createElement('canvas');
    this._bgCanvas.width = 140;
    this._bgCanvas.height = 105;
    this._bgCtx = this._bgCanvas.getContext('2d');
  }

  _worldToMap(wx, wz) {
    const b = this._bounds;
    const px = ((wx - b.minX) / (b.maxX - b.minX)) * 140;
    const py = ((wz - b.minZ) / (b.maxZ - b.minZ)) * 105;
    return { x: px, y: py };
  }

  _drawStaticLayer() {
    const ctx = this._bgCtx;

    // Background (buildings/city blocks)
    ctx.fillStyle = '#2A2A3A';
    ctx.fillRect(0, 0, 140, 105);

    // Draw walkable zones (roads) as lighter strips
    ctx.fillStyle = '#666677';
    for (const zone of this._zones) {
      const p1 = this._worldToMap(zone.x, zone.z);
      const p2 = this._worldToMap(zone.x + zone.w, zone.z + zone.h);
      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.abs(p2.x - p1.x);
      const rh = Math.abs(p2.y - p1.y);
      ctx.fillRect(rx, ry, rw, rh);
    }
  }

  update(junePos, destPos) {
    this._blinkTimer += 0.016; // ~60fps assumption
    this._updateTimer += 0.016;

    // Only redraw every 3 frames (~50ms)
    if (this._updateTimer < 0.05) return;
    this._updateTimer = 0;

    const ctx = this._ctx;

    // Draw static background
    ctx.drawImage(this._bgCanvas, 0, 0);

    // Destination dot (blinking gold)
    if (destPos) {
      const dp = this._worldToMap(destPos.x, destPos.z);
      if (Math.sin(this._blinkTimer * 5) > 0) {
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#FF8800';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // June dot (green circle)
    if (junePos) {
      const jp = this._worldToMap(junePos.x, junePos.z);
      ctx.beginPath();
      ctx.arc(jp.x, jp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#44FF88';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 140, 105);
  }

  show() {
    this._panel.style.display = 'block';
  }

  hide() {
    this._panel.style.display = 'none';
  }

  dispose() {
    if (this._panel && this._panel.parentNode) {
      this._panel.parentNode.removeChild(this._panel);
    }
    this._panel = null;
    this._canvas = null;
    this._ctx = null;
    this._bgCanvas = null;
    this._bgCtx = null;
  }
}
