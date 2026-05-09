import * as THREE from 'three';
import { COLORS, SPEEDS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

export class Cyclist {
  /**
   * @param {THREE.Scene} scene
   * @param {number} startX  initial X position
   * @param {number} z       fixed Z lane position
   * @param {number} direction  1 = eastward (positive X), -1 = westward
   */
  constructor(scene, startX, z, direction = 1) {
    this.scene      = scene;
    this._z         = z;
    this._direction = direction;
    this._speed     = SPEEDS.CYCLIST;
    this._time      = 0;

    this.group = new THREE.Group();

    // ---- Wheels ----
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.06, 6, 16);
    const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });

    this.frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    this.frontWheel.position.set(0.55, 0.35, 0);
    this.frontWheel.rotation.y = Math.PI / 2;

    this.backWheel = new THREE.Mesh(wheelGeo, wheelMat);
    this.backWheel.position.set(-0.55, 0.35, 0);
    this.backWheel.rotation.y = Math.PI / 2;

    this.group.add(this.frontWheel, this.backWheel);

    // ---- Frame (horizontal tube) ----
    const frameLongGeo = new THREE.BoxGeometry(1.2, 0.06, 0.06);
    const frameMat = new THREE.MeshToonMaterial({ color: COLORS.CYCLIST });
    const frameLong = new THREE.Mesh(frameLongGeo, frameMat);
    frameLong.position.y = 0.55;
    this.group.add(frameLong);

    // Seat tube (diagonal)
    const seatTubeGeo = new THREE.BoxGeometry(0.06, 0.55, 0.06);
    const seatTube = new THREE.Mesh(seatTubeGeo, frameMat);
    seatTube.position.set(-0.15, 0.60, 0);
    seatTube.rotation.z = 0.18;
    this.group.add(seatTube);

    // Fork (connects front wheel to frame)
    const forkGeo = new THREE.BoxGeometry(0.06, 0.40, 0.06);
    const fork = new THREE.Mesh(forkGeo, frameMat);
    fork.position.set(0.55, 0.55, 0);
    this.group.add(fork);

    // Handlebars
    const handleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.40);
    const handle = new THREE.Mesh(handleGeo, frameMat);
    handle.position.set(0.45, 0.92, 0);
    this.group.add(handle);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.28, 0.05, 0.14);
    const seatMat = new THREE.MeshToonMaterial({ color: 0x111111 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(-0.1, 0.87, 0);
    this.group.add(seat);

    // ---- Rider ----
    // Torso (leaning forward)
    const torsoGeo = new THREE.CapsuleGeometry(0.18, 0.45, 4, 8);
    const torsoMat = new THREE.MeshToonMaterial({ color: 0x44AA44 }); // green jacket
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0.05, 1.10, 0);
    torso.rotation.z = 0.35; // lean forward
    this.group.add(torso);

    // Legs (two cylinders, simplified)
    const thighGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.42, 6);
    const legMat   = new THREE.MeshToonMaterial({ color: 0x334466 });

    this._leftThigh = new THREE.Mesh(thighGeo, legMat);
    this._leftThigh.position.set(-0.05, 0.72, 0.10);
    this.group.add(this._leftThigh);

    this._rightThigh = new THREE.Mesh(thighGeo, legMat);
    this._rightThigh.position.set(-0.05, 0.72, -0.10);
    this.group.add(this._rightThigh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.20, 8, 6);
    const headMat = new THREE.MeshToonMaterial({ color: 0xFFDBAA });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.30, 1.52, 0);
    this.group.add(head);

    // Helmet
    const helmGeo = new THREE.SphereGeometry(0.23, 8, 6);
    const helmMat = new THREE.MeshToonMaterial({ color: 0xFF4444 });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    helm.scale.y = 0.7;
    helm.position.set(0.30, 1.62, 0);
    this.group.add(helm);

    // ---- Positioning ----
    this.group.position.set(startX, 0, z);
    // Face direction of travel
    this.group.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;

    scene.add(this.group);
  }

  // ---------------------------------------------------------------------------
  // Collision query
  // ---------------------------------------------------------------------------

  /** @param {{ x: number, z: number }} junePos */
  checkCollision(junePos) {
    if (gameState.isInvincible()) return false;
    const dx = junePos.x - this.group.position.x;
    const dz = junePos.z - this.group.position.z;
    return Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE;
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /** @param {number} dt seconds */
  update(dt) {
    this._time += dt;

    // Translate along X axis
    this.group.position.x += this._direction * this._speed * dt;

    // Wheel spin: angular velocity = linear speed / wheel radius
    const wheelRadius = 0.35;
    const spin = (this._direction * this._speed * dt) / wheelRadius;
    this.frontWheel.rotation.z += spin;
    this.backWheel.rotation.z  += spin;

    // Pedalling legs (simple crank animation)
    const crank = this._time * this._speed * 1.5;
    this._leftThigh.rotation.x  =  Math.sin(crank)       * 0.5;
    this._rightThigh.rotation.x = -Math.sin(crank)       * 0.5;

    // Wrap around world edges so the cyclist keeps going indefinitely
    if (this.group.position.x >  115) this.group.position.x = -115;
    if (this.group.position.x < -115) this.group.position.x =  115;
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
