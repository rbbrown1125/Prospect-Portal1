import * as THREE from 'three';

export class TextureFactory {
  static _textures = [];

  static createRoadTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark gray background
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, size, size);

    // Yellow edge lines (6px from each side, 3px thick)
    ctx.strokeStyle = '#FFCC00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(6, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size - 6, 0);
    ctx.lineTo(size - 6, size);
    ctx.stroke();

    // White dashed center line: vertical, dashes every 40px, 4px wide
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 16]);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.setLineDash([]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    TextureFactory._textures.push(tex);
    return tex;
  }

  static createSidewalkTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Beige base
    ctx.fillStyle = '#D4C5A9';
    ctx.fillRect(0, 0, size, size);

    // Grid score lines every 32px
    ctx.strokeStyle = '#B8AA94';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Slight noise for concrete look
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i]     = Math.max(0, Math.min(255, data[i]     + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    TextureFactory._textures.push(tex);
    return tex;
  }

  static createBrickTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const brickW = 32;
    const brickH = 16;
    const mortarColor = '#5C3D1E';
    const brickColor = '#8B5E3C';

    // Fill with mortar color
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, size, size);

    // Draw bricks
    const rows = Math.ceil(size / brickH) + 1;
    const cols = Math.ceil(size / brickW) + 2;
    for (let row = 0; row < rows; row++) {
      const offsetX = (row % 2 === 0) ? 0 : brickW / 2;
      for (let col = -1; col < cols; col++) {
        const x = col * brickW + offsetX;
        const y = row * brickH;
        // Slight color variation per brick
        const r = Math.floor(139 + (Math.random() - 0.5) * 20);
        const g = Math.floor(94  + (Math.random() - 0.5) * 15);
        const b = Math.floor(60  + (Math.random() - 0.5) * 15);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        // Leave 1px mortar gap on all sides
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    TextureFactory._textures.push(tex);
    return tex;
  }

  static createWindowTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#222233';
    ctx.fillRect(0, 0, size, size);

    // 4 window panes in a 2x2 grid, warm yellow
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FFE060';
    // Top-left pane
    ctx.fillRect(4,  4,  26, 26);
    // Top-right pane
    ctx.fillRect(34, 4,  26, 26);
    // Bottom-left pane
    ctx.fillRect(4,  34, 26, 26);
    // Bottom-right pane
    ctx.fillRect(34, 34, 26, 26);
    ctx.globalAlpha = 1.0;

    // Black frame lines between panes (cross)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    // Vertical center
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    TextureFactory._textures.push(tex);
    return tex;
  }

  static createGroundTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Road background
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, size, size);

    // Beige sidewalk strips (simulate the NYC grid from above)
    // Horizontal sidewalk bands
    const bandPositions = [0.2, 0.5, 0.8];
    ctx.fillStyle = '#D4C5A9';
    bandPositions.forEach(p => {
      const y = p * size;
      ctx.fillRect(0, y - 20, size, 40);
    });
    // Vertical sidewalk bands
    bandPositions.forEach(p => {
      const x = p * size;
      ctx.fillRect(x - 20, 0, 40, size);
    });

    // Crosswalk markings at intersections
    ctx.fillStyle = '#FFFFFF';
    bandPositions.forEach(px => {
      bandPositions.forEach(py => {
        const cx = px * size;
        const cy = py * size;
        // Crosswalk stripes around each intersection
        for (let s = -3; s <= 3; s++) {
          // Horizontal crosswalk (above/below intersection)
          ctx.fillRect(cx - 40 + s * 10, cy - 28, 8, 16);
          ctx.fillRect(cx - 40 + s * 10, cy + 12, 8, 16);
          // Vertical crosswalk (left/right of intersection)
          ctx.fillRect(cx - 28, cy - 40 + s * 10, 16, 8);
          ctx.fillRect(cx + 12, cy - 40 + s * 10, 16, 8);
        }
      });
    });

    // Yellow center lines on road sections
    ctx.strokeStyle = '#FFCC00';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 14]);
    // Horizontal roads
    const roadCenters = [0.2, 0.5, 0.8];
    roadCenters.forEach(p => {
      const y = p * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    });
    // Vertical roads
    roadCenters.forEach(p => {
      const x = p * size;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    TextureFactory._textures.push(tex);
    return tex;
  }

  static disposePending() {
    TextureFactory._textures.forEach(t => t.dispose());
    TextureFactory._textures = [];
  }
}
