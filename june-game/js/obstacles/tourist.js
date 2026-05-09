import * as THREE from 'three';
import { COLORS, SPEEDS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

// ---------------------------------------------------------------------------
// Single tourist pedestrian
// ---------------------------------------------------------------------------

class TouristPerson {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} z
   * @param {number} shirtColor  hex color for shirt
   */
  constructor(scene, x, z, shirtColor) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    // Legs (two dark cylinders)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6);
    const legMat = new THREE.MeshToonMaterial({ color: 0x334466 }); // dark jeans
    [-0.12, 0.12].forEach(lx => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.25, 0);
      this.group.add(leg);
    });

    // Body / torso (capsule)
    const bodyGeo = new THREE.CapsuleGeometry(0.20, 0.55, 4, 8);
    const bodyMat = new THREE.MeshToonMaterial({ color: shirtColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    this.group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.20, 8, 6);
    const headMat = new THREE.MeshToonMaterial({ color: 0xFFDBAA });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    this.group.add(head);

    // Backpack
    const packGeo = new THREE.BoxGeometry(0.25, 0.40, 0.15);
    const packMat = new THREE.MeshToonMaterial({ color: 0x334455 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.90, -0.22);
    this.group.add(pack);

    // Camera slung around neck
    const camGeo = new THREE.BoxGeometry(0.15, 0.10, 0.08);
    const camMat = new THREE.MeshToonMaterial({ color: 0x222222 });
    const cam = new THREE.Mesh(camGeo, camMat);
    cam.position.set(0.12, 1.22, 0.22);
    this.group.add(cam);

    // Tourist hat (flat-brim cap)
    const brimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 12);
    const hatMat  = new THREE.MeshToonMaterial({ color: 0xFFFFEE });
    const brim    = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 1.70;
    this.group.add(brim);

    scene.add(this.group);
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

// ---------------------------------------------------------------------------
// Tourist group — a cluster of 2–4 tourists that wander together
// ---------------------------------------------------------------------------

export class TouristGroup {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x   initial centre X
   * @param {number} z   initial centre Z
   * @param {number} count number of tourists in this group (default 3)
   */
  constructor(scene, x, z, count = 3) {
    this.scene    = scene;
    this._persons = [];

    // Group centre in world space
    this._centerX = x;
    this._centerZ = z;

    // Wandering velocity (XZ plane)
    this._velocity = new THREE.Vector2(
      (Math.random() - 0.5) * SPEEDS.TOURIST * 2,
      (Math.random() - 0.5) * SPEEDS.TOURIST * 2,
    );

    // Direction-change timer
    this._timer = 3 + Math.random() * 4;

    // Foot-step animation phase
    this._walkPhase = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 1.6;
      const offsetZ = (Math.random() - 0.5) * 1.6;
      const shirtColor = COLORS.TOURIST_SHIRT[i % COLORS.TOURIST_SHIRT.length];
      this._persons.push(new TouristPerson(scene, x + offsetX, z + offsetZ, shirtColor));
    }
  }

  // ---------------------------------------------------------------------------
  // Collision query
  // ---------------------------------------------------------------------------

  /**
   * Returns true if June is close enough to collide with this group.
   * @param {{ x: number, z: number }} junePos
   */
  checkCollision(junePos) {
    if (gameState.isInvincible()) return false;
    const dx = junePos.x - this._centerX;
    const dz = junePos.z - this._centerZ;
    return Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE * 1.5;
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /** @param {number} dt seconds */
  update(dt) {
    // Wander AI
    this._timer -= dt;
    if (this._timer <= 0) {
      this._velocity.set(
        (Math.random() - 0.5) * SPEEDS.TOURIST * 2,
        (Math.random() - 0.5) * SPEEDS.TOURIST * 2,
      );
      this._timer = 3 + Math.random() * 5;
    }

    // Move centre
    this._centerX += this._velocity.x * dt;
    this._centerZ += this._velocity.y * dt;

    // Soft world-boundary bounce
    if (this._centerX >  90) { this._centerX =  90; this._velocity.x = -Math.abs(this._velocity.x); }
    if (this._centerX < -90) { this._centerX = -90; this._velocity.x =  Math.abs(this._velocity.x); }
    if (this._centerZ >  90) { this._centerZ =  90; this._velocity.y = -Math.abs(this._velocity.y); }
    if (this._centerZ < -90) { this._centerZ = -90; this._velocity.y =  Math.abs(this._velocity.y); }

    // Walk animation phase
    this._walkPhase += dt * 4;

    const speed2D = this._velocity.length();
    const isMoving = speed2D > 0.05;
    const yaw = isMoving ? Math.atan2(this._velocity.x, this._velocity.y) : 0;

    // Move each person toward their offset around the centre
    this._persons.forEach((p, i) => {
      const angle  = (i / this._persons.length) * Math.PI * 2;
      const radius = 0.7;
      const tx = this._centerX + Math.cos(angle) * radius;
      const tz = this._centerZ + Math.sin(angle) * radius;

      // Smooth follow
      p.group.position.x += (tx - p.group.position.x) * Math.min(1, dt * 4);
      p.group.position.z += (tz - p.group.position.z) * Math.min(1, dt * 4);

      // Face direction of travel
      if (isMoving) {
        p.group.rotation.y += (yaw - p.group.rotation.y) * Math.min(1, dt * 6);
      }

      // Simple walk bob
      if (isMoving) {
        p.group.position.y = Math.abs(Math.sin(this._walkPhase + i * 1.0)) * 0.06;
      } else {
        p.group.position.y = 0;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

  dispose() {
    this._persons.forEach(p => p.dispose());
    this._persons = [];
  }
}
