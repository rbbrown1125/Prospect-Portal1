import * as THREE from 'three';
import { COLORS, SPEEDS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

export class PigeonFlock {
  constructor(scene, count, getRandomPos) {
    this.scene  = scene;
    this.count  = count;

    // Per-pigeon runtime state
    this._positions  = []; // THREE.Vector3[]
    this._velocities = []; // THREE.Vector3[]
    this._timers     = []; // seconds until next direction change

    this._dummy = new THREE.Object3D();

    /** Set by ObstacleManager to fire VFX on pigeon hit */
    this.onHit = null;

    // Rolling batch index for staggered AI updates
    this._batchCursor = 0;

    this._setupInstances(count, getRandomPos);
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  _setupInstances(count, getRandomPos) {
    // Body — grey sphere
    const bodyGeo = new THREE.SphereGeometry(0.18, 8, 6);
    const bodyMat = new THREE.MeshToonMaterial({ color: COLORS.PIGEON });
    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
    this.bodyMesh.castShadow = false;
    this.bodyMesh.receiveShadow = false;

    // Head — slightly darker, smaller sphere
    const headGeo = new THREE.SphereGeometry(0.10, 6, 5);
    const headMat = new THREE.MeshToonMaterial({ color: 0x777777 });
    this.headMesh = new THREE.InstancedMesh(headGeo, headMat, count);
    this.headMesh.castShadow = false;

    for (let i = 0; i < count; i++) {
      const pos   = getRandomPos();
      const angle = Math.random() * Math.PI * 2;

      this._positions.push(new THREE.Vector3(pos.x, 0.18, pos.z));
      this._velocities.push(new THREE.Vector3(
        Math.cos(angle) * SPEEDS.PIGEON,
        0,
        Math.sin(angle) * SPEEDS.PIGEON,
      ));
      this._timers.push(1 + Math.random() * 2); // 1–3 s

      this._writeBodyMatrix(i);
      this._writeHeadMatrix(i);
    }

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate  = true;

    this.scene.add(this.bodyMesh);
    this.scene.add(this.headMesh);
  }

  // ---------------------------------------------------------------------------
  // Per-frame matrix helpers
  // ---------------------------------------------------------------------------

  _writeBodyMatrix(i) {
    this._dummy.position.copy(this._positions[i]);
    this._dummy.rotation.set(0, Math.atan2(this._velocities[i].x, this._velocities[i].z), 0);
    this._dummy.scale.setScalar(1);
    this._dummy.updateMatrix();
    this.bodyMesh.setMatrixAt(i, this._dummy.matrix);
  }

  _writeHeadMatrix(i) {
    const vel = this._velocities[i];
    // Head is placed slightly forward and above the body
    const forward = 0.15;
    this._dummy.position.set(
      this._positions[i].x + vel.x / SPEEDS.PIGEON * forward,
      this._positions[i].y + 0.20,
      this._positions[i].z + vel.z / SPEEDS.PIGEON * forward,
    );
    this._dummy.rotation.set(0, Math.atan2(vel.x, vel.z), 0);
    this._dummy.scale.setScalar(1);
    this._dummy.updateMatrix();
    this.headMesh.setMatrixAt(i, this._dummy.matrix);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * @param {number} dt - delta time in seconds
   * @param {{ x: number, y: number, z: number }} junePosition
   */
  update(dt, junePosition) {
    // Staggered AI: update a fixed batch each frame to spread CPU cost
    const batchSize = Math.max(1, Math.ceil(this.count / 8));

    for (let i = 0; i < this.count; i++) {
      const pos = this._positions[i];
      const vel = this._velocities[i];

      // --- Collision with June (checked every frame) ---
      if (!gameState.isInvincible()) {
        const dx = pos.x - junePosition.x;
        const dz = pos.z - junePosition.z;
        if (Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE) {
          if (gameState.applySick() && this.onHit) this.onHit();
          // Scatter the pigeon away from June
          const scatterAngle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 1.0;
          vel.set(
            Math.cos(scatterAngle) * SPEEDS.PIGEON * 2.5,
            0,
            Math.sin(scatterAngle) * SPEEDS.PIGEON * 2.5,
          );
          this._timers[i] = 1.0 + Math.random() * 1.5;
        }
      }

      // --- Staggered direction AI ---
      const inBatch = (i >= this._batchCursor) && (i < this._batchCursor + batchSize);
      if (inBatch) {
        this._timers[i] -= dt * (this.count / batchSize); // compensate for skipping frames
        if (this._timers[i] <= 0) {
          const angle = Math.random() * Math.PI * 2;
          vel.set(
            Math.cos(angle) * SPEEDS.PIGEON,
            0,
            Math.sin(angle) * SPEEDS.PIGEON,
          );
          this._timers[i] = 1.5 + Math.random() * 2.5;
        }
      }

      // --- Movement ---
      pos.x += vel.x * dt;
      pos.z += vel.z * dt;

      // Bounce off world boundaries
      if (pos.x >  95) { pos.x =  95; vel.x = -Math.abs(vel.x); }
      if (pos.x < -95) { pos.x = -95; vel.x =  Math.abs(vel.x); }
      if (pos.z >  95) { pos.z =  95; vel.z = -Math.abs(vel.z); }
      if (pos.z < -95) { pos.z = -95; vel.z =  Math.abs(vel.z); }

      this._writeBodyMatrix(i);
      this._writeHeadMatrix(i);
    }

    // Advance batch cursor
    this._batchCursor = (this._batchCursor + batchSize) % this.count;

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate  = true;
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

  dispose() {
    this.scene.remove(this.bodyMesh);
    this.scene.remove(this.headMesh);
    this.bodyMesh.geometry.dispose();
    this.bodyMesh.material.dispose();
    this.headMesh.geometry.dispose();
    this.headMesh.material.dispose();
  }
}
