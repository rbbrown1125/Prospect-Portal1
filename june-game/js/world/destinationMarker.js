import * as THREE from 'three';
import { COLORS } from '../constants.js';

export class DestinationMarker {
  constructor(scene, x, z, label) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this._time = 0;

    // Sub-group for pin + label so we can bob them independently
    this._pinGroup = new THREE.Group();
    this._pinGroup.position.y = 0;
    this.group.add(this._pinGroup);

    this._buildStar();
    this._buildPin();
    this._buildLabel(label);

    scene.add(this.group);
  }

  // ---------------------------------------------------------------------------
  // Construction helpers
  // ---------------------------------------------------------------------------

  _buildStar() {
    // 5-pointed gold star lying flat on the ground
    const starShape = new THREE.Shape();
    const outerR = 1.2;
    const innerR = 0.5;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    starShape.closePath();

    const geo = new THREE.ShapeGeometry(starShape);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.DESTINATION,
      side: THREE.DoubleSide,
    });
    this.starMesh = new THREE.Mesh(geo, mat);
    this.starMesh.rotation.x = -Math.PI / 2; // lay flat
    this.starMesh.position.y = 0.15;
    this.group.add(this.starMesh);

    // Pulsing inner glow ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLORS.DESTINATION,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.y = 0.05;
    this.group.add(this.ringMesh);

    // Outer ring for depth
    const outerRingGeo = new THREE.RingGeometry(1.8, 2.6, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: COLORS.DESTINATION,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    this.outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.outerRingMesh.rotation.x = -Math.PI / 2;
    this.outerRingMesh.position.y = 0.04;
    this.group.add(this.outerRingMesh);

    // Vertical light beam (tapered cylinder, open-ended)
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.9, 10, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: COLORS.DESTINATION,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 5;
    this.group.add(beam);
  }

  _buildPin() {
    // Red map pin inside the pin group (which bobs up/down)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xFF3333 });

    // Spherical head
    const headGeo = new THREE.SphereGeometry(0.5, 12, 8);
    const head = new THREE.Mesh(headGeo, pinMat);
    head.position.y = 5.0;
    this._pinGroup.add(head);

    // Downward spike
    const spikeGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const spike = new THREE.Mesh(spikeGeo, pinMat);
    spike.rotation.x = Math.PI; // point downward
    spike.position.y = 4.35;
    this._pinGroup.add(spike);

    // White dot inside head
    const dotGeo = new THREE.SphereGeometry(0.2, 8, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.y = 5.08;
    this._pinGroup.add(dot);
  }

  _buildLabel(label) {
    const canvas = document.createElement('canvas');
    canvas.width  = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Dark rounded background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this._roundRect(ctx, 0, 0, 512, 128, 18);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    this._roundRect(ctx, 2, 2, 508, 124, 16);
    ctx.stroke();

    // Destination name
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, 256, 54);

    // Sub-label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px sans-serif';
    ctx.fillText('⭐ DESTINATION ⭐', 256, 100);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this._labelSprite = new THREE.Sprite(mat);
    this._labelSprite.position.y = 7.5;
    this._labelSprite.scale.set(10, 2.5, 1);
    this._pinGroup.add(this._labelSprite);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns true when June is within `threshold` units of the marker origin.
   * @param {{ x: number, z: number }} junePosition
   * @param {number} threshold
   */
  isJuneNear(junePosition, threshold = 3) {
    const dx = junePosition.x - this.group.position.x;
    const dz = junePosition.z - this.group.position.z;
    return Math.sqrt(dx * dx + dz * dz) < threshold;
  }

  /** Call once per frame with the elapsed delta time (seconds). */
  update(dt) {
    this._time += dt;
    const t = this._time;

    // Star: spin slowly and pulse scale
    const starScale = 1 + Math.sin(t * 3.0) * 0.15;
    this.starMesh.scale.setScalar(starScale);
    this.starMesh.rotation.z = t * 0.8; // appears to spin around world-Y because rotation.x = -PI/2

    // Inner ring: pulse size and opacity
    const ringScale = 1 + Math.sin(t * 2.0) * 0.22;
    this.ringMesh.scale.setScalar(ringScale);
    this.ringMesh.material.opacity = 0.2 + Math.abs(Math.sin(t * 2.0)) * 0.25;

    // Outer ring: slower counter-pulse
    const outerScale = 1 + Math.sin(t * 1.3 + Math.PI) * 0.18;
    this.outerRingMesh.scale.setScalar(outerScale);
    this.outerRingMesh.material.opacity = 0.05 + Math.abs(Math.sin(t * 1.3)) * 0.12;

    // Pin group: gentle bob up and down
    this._pinGroup.position.y = Math.sin(t * 2.2) * 0.25;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
