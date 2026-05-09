import * as THREE from 'three';
import { COLORS, TIMERS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

export class Meatball {
  constructor(scene, x, z) {
    this.scene = scene;
    this._x = x;
    this._z = z;
    this._time = 0;
    this._collected = false;
    this._respawnTimer = 0;

    this._buildMesh();
  }

  _buildMesh() {
    this.group = new THREE.Group();

    // Main meatball sphere — brown with slight reddish tint
    const geo = new THREE.SphereGeometry(0.3, 12, 10);
    const mat = new THREE.MeshToonMaterial({
      color: COLORS.MEATBALL,
      emissive: new THREE.Color(COLORS.MEATBALL_GLOW),
      emissiveIntensity: 0.15,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);

    // Highlight (sheen on top-right)
    const highlightGeo = new THREE.SphereGeometry(0.1, 8, 6);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA66,
      transparent: true,
      opacity: 0.6,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(0.12, 0.14, 0.14);
    this.group.add(highlight);

    // Herb flecks (tiny green planes)
    const herbMat = new THREE.MeshBasicMaterial({ color: 0x3A8A3A });
    for (let i = 0; i < 4; i++) {
      const herbGeo = new THREE.PlaneGeometry(0.06, 0.06);
      const herb = new THREE.Mesh(herbGeo, herbMat);
      const angle = (i / 4) * Math.PI * 2;
      herb.position.set(Math.cos(angle) * 0.2, 0.1, Math.sin(angle) * 0.2);
      herb.rotation.x = -Math.PI / 3;
      herb.rotation.z = angle;
      this.group.add(herb);
    }

    // Glow ring on ground
    const ringGeo = new THREE.RingGeometry(0.32, 0.5, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLORS.MEATBALL_GLOW,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.group.add(this.ring);

    this.group.position.set(this._x, 0.3, this._z);
    this.scene.add(this.group);
  }

  checkCollision(junePos) {
    if (this._collected) return false;
    const dx = junePos.x - this._x;
    const dz = junePos.z - this._z;
    return Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE * 0.9;
  }

  collect() {
    this._collected = true;
    this._respawnTimer = TIMERS.MEATBALL_RESPAWN;
    this.group.visible = false;
    gameState.applyBoost(); // applyBoost() already increments meatballsCollected
  }

  update(dt) {
    this._time += dt;

    if (this._collected) {
      this._respawnTimer -= dt;
      if (this._respawnTimer <= 0) {
        this._collected = false;
        this.group.visible = true;
      }
      return;
    }

    // Bounce animation
    const bounce = Math.abs(Math.sin(this._time * 2.5)) * 0.25 + 0.25;
    this.group.position.y = bounce;

    // Slow rotation
    this.mesh.rotation.y = this._time * 0.8;

    // Ring pulse
    const ringScale = 1 + Math.sin(this._time * 3) * 0.15;
    this.ring.scale.setScalar(ringScale);
    this.ring.material.opacity = 0.2 + Math.sin(this._time * 3) * 0.15;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
