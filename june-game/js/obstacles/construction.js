import * as THREE from 'three';
import { COLORS, PHYSICS } from '../constants.js';
import { gameState } from '../gameState.js';

export class Construction {
  /**
   * A construction barricade cluster — no physics body needed because
   * collision is handled with simple distance checks.
   *
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} z
   */
  constructor(scene, x, z) {
    this.scene = scene;
    this._x    = x;
    this._z    = z;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    // How many individual barricades to cluster here
    const barricadeCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < barricadeCount; i++) {
      const bx = (i - barricadeCount / 2) * 1.2;
      const bz = (Math.random() - 0.5) * 0.4; // slight Z scatter
      this._addBarricade(bx, bz);
    }

    // Construction cone(s) in front
    const coneCount = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < coneCount; c++) {
      this._addCone((c - coneCount / 2) * 1.0, -0.9);
    }

    // Warning sign on a post behind the barricades
    this._addWarningSign(0, 0.5);

    scene.add(this.group);
  }

  // ---------------------------------------------------------------------------
  // Sub-object builders
  // ---------------------------------------------------------------------------

  _addBarricade(bx, bz) {
    // Orange main board
    const boardGeo = new THREE.BoxGeometry(1.0, 0.35, 0.10);
    const boardMat = new THREE.MeshToonMaterial({ color: COLORS.CONSTRUCTION });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(bx, 0.70, bz);
    this.group.add(board);

    // White diagonal stripe across the board
    const stripeGeo = new THREE.BoxGeometry(1.0, 0.14, 0.11);
    const stripeMat = new THREE.MeshToonMaterial({ color: 0xFFFFFF });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(bx, 0.70, bz);
    this.group.add(stripe);

    // Second orange band above the stripe
    const topBandGeo = new THREE.BoxGeometry(1.0, 0.14, 0.11);
    const topBand = new THREE.Mesh(topBandGeo, boardMat);
    topBand.position.set(bx, 0.84, bz);
    this.group.add(topBand);

    // Support legs (two grey cylinders)
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.52, 6);
    const legMat = new THREE.MeshToonMaterial({ color: 0x888888 });
    [-0.38, 0.38].forEach(lx => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(bx + lx, 0.26, bz + 0.28);
      this.group.add(leg);
    });

    // Feet (small flat boxes)
    const footGeo = new THREE.BoxGeometry(0.30, 0.04, 0.16);
    const footMat = new THREE.MeshToonMaterial({ color: 0x666666 });
    [-0.38, 0.38].forEach(lx => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(bx + lx, 0.02, bz + 0.28);
      this.group.add(foot);
    });
  }

  _addCone(bx, bz) {
    // Orange traffic cone
    const coneGeo = new THREE.ConeGeometry(0.16, 0.50, 8);
    const coneMat = new THREE.MeshToonMaterial({ color: COLORS.CONSTRUCTION });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(bx, 0.25, bz);
    this.group.add(cone);

    // White stripe near base
    const stripeGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.06, 8);
    const stripeMat = new THREE.MeshToonMaterial({ color: 0xFFFFFF });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(bx, 0.10, bz);
    this.group.add(stripe);

    // Rubber base
    const baseGeo = new THREE.CylinderGeometry(0.20, 0.22, 0.05, 8);
    const baseMat = new THREE.MeshToonMaterial({ color: 0x222222 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(bx, 0.025, bz);
    this.group.add(base);
  }

  _addWarningSign(bx, bz) {
    // Wooden post
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
    const postMat = new THREE.MeshToonMaterial({ color: 0x886644 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(bx, 0.80, bz);
    this.group.add(post);

    // Yellow diamond sign
    const signCanvas = document.createElement('canvas');
    signCanvas.width  = 128;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');

    // Yellow diamond
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(64, 4);
    ctx.lineTo(124, 64);
    ctx.lineTo(64, 124);
    ctx.lineTo(4, 64);
    ctx.closePath();
    ctx.fill();

    // Black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Exclamation mark
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 64, 64);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const sign    = new THREE.Mesh(signGeo, signMat);
    sign.position.set(bx, 1.70, bz);
    this.group.add(sign);
  }

  // ---------------------------------------------------------------------------
  // Collision query
  // ---------------------------------------------------------------------------

  /** @param {{ x: number, z: number }} junePos */
  checkCollision(junePos) {
    if (gameState.isInvincible()) return false;
    const dx = junePos.x - this._x;
    const dz = junePos.z - this._z;
    return Math.sqrt(dx * dx + dz * dz) < PHYSICS.COLLISION_DISTANCE * 2.2;
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
