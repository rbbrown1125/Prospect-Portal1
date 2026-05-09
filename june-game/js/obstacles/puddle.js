import * as THREE from 'three';
import { COLORS } from '../constants.js';

export class Puddle {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} z
   */
  constructor(scene, x, z) {
    this.scene   = scene;
    this._x      = x;
    this._z      = z;
    this._radius = 1.5 + Math.random() * 1.0;
    this._time   = Math.random() * Math.PI * 2; // stagger ripple animation

    // Flat ellipse on ground — slightly non-circular for organic feel
    const scaleX = 0.8 + Math.random() * 0.4;
    const scaleZ = 0.8 + Math.random() * 0.4;

    const geo = new THREE.CircleGeometry(this._radius, 20);
    this._mat = new THREE.MeshBasicMaterial({
      color: COLORS.PUDDLE,
      transparent: true,
      opacity: 0.70,
    });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(x, 0.02, z);
    this.mesh.scale.set(scaleX, 1, scaleZ);

    scene.add(this.mesh);

    // Subtle reflection highlight (a slightly lighter, smaller circle on top)
    const hlGeo = new THREE.CircleGeometry(this._radius * 0.35, 12);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0x6688AA,
      transparent: true,
      opacity: 0.35,
    });
    this._highlight = new THREE.Mesh(hlGeo, hlMat);
    this._highlight.rotation.x = -Math.PI / 2;
    this._highlight.position.set(x - this._radius * 0.15, 0.025, z - this._radius * 0.1);
    scene.add(this._highlight);
  }

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  /**
   * Returns true when June's XZ position is inside the puddle.
   * @param {{ x: number, z: number }} junePos
   */
  isJuneInside(junePos) {
    const dx = junePos.x - this._x;
    const dz = junePos.z - this._z;
    // Use an elliptical test matching the mesh scale
    const scaledDist = Math.sqrt(dx * dx + dz * dz);
    return scaledDist < this._radius;
  }

  // ---------------------------------------------------------------------------
  // Update — gentle opacity ripple
  // ---------------------------------------------------------------------------

  /** @param {number} dt seconds */
  update(dt) {
    this._time += dt;
    // Gentle ripple: opacity oscillates slightly
    this._mat.opacity = 0.60 + Math.sin(this._time * 1.5) * 0.10;
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this._highlight);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this._highlight.geometry.dispose();
    this._highlight.material.dispose();
  }
}
