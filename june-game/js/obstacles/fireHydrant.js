import * as THREE from 'three';
import { COLORS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

export class FireHydrant {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} z
   */
  constructor(scene, x, z) {
    this.scene = scene;
    this._x    = x;
    this._z    = z;

    this.group = new THREE.Group();

    const redMat    = new THREE.MeshToonMaterial({ color: COLORS.HYDRANT });
    const silverMat = new THREE.MeshToonMaterial({ color: 0xC0C0C0 });

    // ---- Base flange ----
    const baseGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.12, 10);
    const base = new THREE.Mesh(baseGeo, redMat);
    base.position.y = 0.06;
    this.group.add(base);

    // ---- Lower body ----
    const lowerGeo = new THREE.CylinderGeometry(0.19, 0.22, 0.22, 10);
    const lower = new THREE.Mesh(lowerGeo, redMat);
    lower.position.y = 0.23;
    this.group.add(lower);

    // ---- Upper body (slightly narrower) ----
    const upperGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.28, 10);
    const upper = new THREE.Mesh(upperGeo, redMat);
    upper.position.y = 0.48;
    this.group.add(upper);

    // ---- Dome cap ----
    const capGeo = new THREE.SphereGeometry(0.16, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, redMat);
    cap.position.y = 0.62;
    this.group.add(cap);

    // ---- Flat top disc under the operating nut ----
    const topDiscGeo = new THREE.CylinderGeometry(0.10, 0.16, 0.06, 10);
    const topDisc = new THREE.Mesh(topDiscGeo, redMat);
    topDisc.position.y = 0.65;
    this.group.add(topDisc);

    // ---- Operating nut (pentagon-ish, silver) ----
    const nutGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.10, 5);
    const nut = new THREE.Mesh(nutGeo, silverMat);
    nut.position.y = 0.77;
    this.group.add(nut);

    // ---- Side outlet nozzles (2, one each side) ----
    const nozzleGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.18, 8);
    const nozzleMat = new THREE.MeshToonMaterial({ color: 0xAA1111 });
    const capNozzleGeo = new THREE.SphereGeometry(0.065, 8, 6);

    [-1, 1].forEach(side => {
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.rotation.z = Math.PI / 2; // rotate so it points sideways
      nozzle.position.set(side * 0.25, 0.38, 0);
      this.group.add(nozzle);

      // Cap at the end of each nozzle
      const nozzleCap = new THREE.Mesh(capNozzleGeo, silverMat);
      nozzleCap.position.set(side * 0.34, 0.38, 0);
      this.group.add(nozzleCap);

      // Chain bolt (tiny cylinder)
      const boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 5);
      const bolt = new THREE.Mesh(boltGeo, silverMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(side * 0.19, 0.38, 0);
      this.group.add(bolt);
    });

    // ---- Back nozzle (fire-department connection) ----
    const backNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    backNozzle.rotation.x = Math.PI / 2;
    backNozzle.position.set(0, 0.38, -0.25);
    this.group.add(backNozzle);

    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  // ---------------------------------------------------------------------------
  // Collision query
  // ---------------------------------------------------------------------------

  /** @param {{ x: number, z: number }} junePos */
  checkCollision(junePos) {
    if (gameState.isInvincible()) return false;
    const dx = junePos.x - this._x;
    const dz = junePos.z - this._z;
    return Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE * 0.75;
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

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
