import * as THREE from 'three';
import { COLORS } from '../constants.js';

export class JuneModel {
  constructor() {
    this.group = new THREE.Group();

    // Mesh references set during build
    this.bodyMesh = null;
    this.chestMesh = null;
    this.headGroup = null;
    this.leftEyeIris = null;
    this.rightEyeIris = null;
    this.leftEar = null;
    this.rightEar = null;
    this.tailMesh = null;
    this.legGroups = []; // [FL, FR, BL, BR]

    this._build();
  }

  // ─── Toon material ────────────────────────────────────────────────────────

  _createToonMaterial(color, emissive = 0x000000, emissiveIntensity = 1) {
    // 4-step gradient map via canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    // Band 1: bright highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 16, 1);
    // Band 2: mid-light
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(16, 0, 16, 1);
    // Band 3: mid-shadow
    ctx.fillStyle = '#888888';
    ctx.fillRect(32, 0, 16, 1);
    // Band 4: deep shadow
    ctx.fillStyle = '#444444';
    ctx.fillRect(48, 0, 16, 1);

    const gradientMap = new THREE.CanvasTexture(canvas);
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.minFilter = THREE.NearestFilter;

    return new THREE.MeshToonMaterial({
      color,
      gradientMap,
      emissive,
      emissiveIntensity,
    });
  }

  // ─── Build entry point ────────────────────────────────────────────────────

  _build() {
    this._buildBody();
    this._buildHead();
    this._buildEars();
    this._buildLegs();
    this._buildTail();
    this._buildHarness();
  }

  // ─── Body ─────────────────────────────────────────────────────────────────

  _buildBody() {
    // Main torso — long, low dachshund silhouette
    const bodyGeo = new THREE.CapsuleGeometry(0.22, 1.0, 8, 16);
    const bodyMat = this._createToonMaterial(COLORS.JUNE_MAIN);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.rotation.z = Math.PI / 2; // horizontal
    this.bodyMesh.position.set(0, 0.35, 0);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = false;
    this.group.add(this.bodyMesh);

    // Dark saddle marking along the back
    const saddleGeo = new THREE.CapsuleGeometry(0.19, 0.7, 6, 12);
    const saddleMat = this._createToonMaterial(COLORS.JUNE_DARK);
    const saddle = new THREE.Mesh(saddleGeo, saddleMat);
    saddle.rotation.z = Math.PI / 2;
    saddle.position.set(0, 0.52, 0);
    saddle.castShadow = false;
    this.group.add(saddle);

    // Cream chest fluff patch
    const chestGeo = new THREE.SphereGeometry(0.26, 16, 12);
    const chestMat = this._createToonMaterial(COLORS.JUNE_CREAM);
    this.chestMesh = new THREE.Mesh(chestGeo, chestMat);
    this.chestMesh.scale.set(1, 0.7, 0.9);
    this.chestMesh.position.set(0, 0.22, 0.42);
    this.chestMesh.castShadow = false;
    this.group.add(this.chestMesh);
  }

  // ─── Head ─────────────────────────────────────────────────────────────────

  _buildHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.55, 0.58);
    this.group.add(this.headGroup);

    // Skull
    const skullGeo = new THREE.SphereGeometry(0.28, 16, 12);
    const skullMat = this._createToonMaterial(COLORS.JUNE_MAIN);
    const skull = new THREE.Mesh(skullGeo, skullMat);
    skull.castShadow = true;
    this.headGroup.add(skull);

    // Muzzle — cream, slightly flattened
    const muzzleGeo = new THREE.SphereGeometry(0.17, 16, 12);
    const muzzleMat = this._createToonMaterial(COLORS.JUNE_CREAM);
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.scale.set(1, 0.85, 1);
    muzzle.position.set(0, -0.05, 0.2);
    this.headGroup.add(muzzle);

    // Nose — pink sphere
    const noseGeo = new THREE.SphereGeometry(0.055, 12, 8);
    const noseMat = this._createToonMaterial(COLORS.JUNE_NOSE);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.06, 0.35);
    this.headGroup.add(nose);

    // Eyes — white sclera + dark iris + highlight (with emissive for bloom)
    this._buildEye(-0.14); // left
    this._buildEye(0.14);  // right
  }

  _buildEye(xPos) {
    const isLeft = xPos < 0;

    // White sclera
    const scleraGeo = new THREE.SphereGeometry(0.08, 12, 10);
    const scleraMat = new THREE.MeshToonMaterial({ color: 0xffffff });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.position.set(xPos, 0.08, 0.2);
    this.headGroup.add(sclera);

    // Dark iris
    const irisGeo = new THREE.SphereGeometry(0.065, 12, 10);
    const irisMat = this._createToonMaterial(COLORS.JUNE_EYE_DARK);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(xPos, 0.08, 0.22);
    this.headGroup.add(iris);

    if (isLeft) {
      this.leftEyeIris = iris;
    } else {
      this.rightEyeIris = iris;
    }

    // Specular highlight dot — emissive white so bloom picks it up
    const hlGeo = new THREE.SphereGeometry(0.02, 6, 4);
    const hlMat = new THREE.MeshToonMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
    });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(xPos + (isLeft ? 0.025 : -0.025), 0.105, 0.265);
    this.headGroup.add(hl);
  }

  // ─── Ears ─────────────────────────────────────────────────────────────────

  _buildEars() {
    // Long floppy teardrop ear shape via ExtrudeGeometry
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.bezierCurveTo(-0.08, -0.05, -0.1, -0.25, -0.06, -0.5);
    earShape.bezierCurveTo(-0.02, -0.60, 0.02, -0.60, 0.06, -0.5);
    earShape.bezierCurveTo(0.10, -0.25, 0.08, -0.05, 0, 0);

    const extrudeSettings = { depth: 0.02, bevelEnabled: false };
    const earGeo = new THREE.ExtrudeGeometry(earShape, extrudeSettings);
    const earMat = this._createToonMaterial(COLORS.JUNE_DARK);

    // Inner ear — slightly smaller, lighter color
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 0);
    innerShape.bezierCurveTo(-0.05, -0.04, -0.07, -0.18, -0.04, -0.38);
    innerShape.bezierCurveTo(-0.01, -0.46, 0.01, -0.46, 0.04, -0.38);
    innerShape.bezierCurveTo(0.07, -0.18, 0.05, -0.04, 0, 0);
    const innerExtrudeSettings = { depth: 0.01, bevelEnabled: false };
    const innerEarGeo = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
    const innerEarMat = this._createToonMaterial(COLORS.JUNE_MAIN);

    // LEFT ear
    this.leftEar = new THREE.Group();
    const leftEarMesh = new THREE.Mesh(earGeo, earMat);
    const leftInnerMesh = new THREE.Mesh(innerEarGeo, innerEarMat);
    leftInnerMesh.position.set(0.01, -0.04, 0.015); // slightly in front
    leftEarMesh.castShadow = true;
    this.leftEar.add(leftEarMesh);
    this.leftEar.add(leftInnerMesh);
    this.leftEar.position.set(-0.18, 0.12, 0.05);
    this.leftEar.rotation.z = 0.2;
    this.headGroup.add(this.leftEar);

    // RIGHT ear — mirror on X
    this.rightEar = new THREE.Group();
    const rightEarGeo = earGeo.clone();
    // Mirror by negating x scale
    const rightEarMesh = new THREE.Mesh(rightEarGeo, earMat);
    rightEarMesh.scale.x = -1;
    const rightInnerMesh = new THREE.Mesh(innerEarGeo.clone(), innerEarMat);
    rightInnerMesh.scale.x = -1;
    rightInnerMesh.position.set(-0.01, -0.04, 0.015);
    rightEarMesh.castShadow = true;
    this.rightEar.add(rightEarMesh);
    this.rightEar.add(rightInnerMesh);
    this.rightEar.position.set(0.18, 0.12, 0.05);
    this.rightEar.rotation.z = -0.2;
    this.headGroup.add(this.rightEar);
  }

  // ─── Legs ─────────────────────────────────────────────────────────────────

  _buildLegs() {
    const legPositions = [
      { x: -0.18, z:  0.35, label: 'FL' }, // front-left
      { x:  0.18, z:  0.35, label: 'FR' }, // front-right
      { x: -0.18, z: -0.35, label: 'BL' }, // back-left
      { x:  0.18, z: -0.35, label: 'BR' }, // back-right
    ];

    const legMat = this._createToonMaterial(COLORS.JUNE_MAIN);
    const pawMat = this._createToonMaterial(COLORS.JUNE_CREAM);

    for (const pos of legPositions) {
      const legGroup = new THREE.Group();
      legGroup.position.set(pos.x, 0.22, pos.z); // pivot at hip

      // Cylinder leg hanging downward from pivot
      const legGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.22, 8);
      const legMesh = new THREE.Mesh(legGeo, legMat);
      legMesh.position.y = -0.11; // half-length below pivot
      legMesh.castShadow = true;
      legGroup.add(legMesh);

      // Paw at bottom
      const pawGeo = new THREE.SphereGeometry(0.07, 8, 6);
      const pawMesh = new THREE.Mesh(pawGeo, pawMat);
      pawMesh.scale.set(1, 0.5, 1.1);
      pawMesh.position.y = -0.22; // bottom of leg
      legGroup.add(pawMesh);

      this.group.add(legGroup);
      this.legGroups.push(legGroup);
    }
  }

  // ─── Tail ─────────────────────────────────────────────────────────────────

  _buildTail() {
    const tailGeo = new THREE.CapsuleGeometry(0.03, 0.22, 4, 8);
    const tailMat = this._createToonMaterial(COLORS.JUNE_DARK);
    this.tailMesh = new THREE.Mesh(tailGeo, tailMat);
    this.tailMesh.position.set(0, 0.5, -0.62);
    this.tailMesh.rotation.x = -0.5; // angle backward/upward
    this.tailMesh.castShadow = false;
    this.group.add(this.tailMesh);
  }

  // ─── Harness ──────────────────────────────────────────────────────────────

  _buildHarness() {
    const harnessMat = this._createToonMaterial(COLORS.HARNESS);
    const silverMat = new THREE.MeshToonMaterial({ color: 0xC0C0C0, metalness: 0 });

    // Chest ring — torus around the torso at chest level
    const chestRingGeo = new THREE.TorusGeometry(0.2, 0.022, 8, 32);
    const chestRing = new THREE.Mesh(chestRingGeo, harnessMat);
    chestRing.position.set(0, 0.35, 0.3);
    chestRing.rotation.x = Math.PI / 2;
    this.group.add(chestRing);

    // Back strap running along spine
    const backStrapGeo = new THREE.BoxGeometry(0.04, 0.04, 0.5);
    const backStrap = new THREE.Mesh(backStrapGeo, harnessMat);
    backStrap.position.set(0, 0.55, 0.05);
    this.group.add(backStrap);

    // Left shoulder strap
    const lShoulderGeo = new THREE.BoxGeometry(0.03, 0.28, 0.03);
    const lShoulder = new THREE.Mesh(lShoulderGeo, harnessMat);
    lShoulder.position.set(-0.15, 0.4, 0.28);
    lShoulder.rotation.z = 0.15;
    this.group.add(lShoulder);

    // Right shoulder strap
    const rShoulder = lShoulder.clone();
    rShoulder.position.set(0.15, 0.4, 0.28);
    rShoulder.rotation.z = -0.15;
    this.group.add(rShoulder);

    // D-ring on top of harness
    const dRingGeo = new THREE.TorusGeometry(0.035, 0.01, 6, 16);
    const dRing = new THREE.Mesh(dRingGeo, silverMat);
    dRing.position.set(0, 0.62, 0.15);
    this.group.add(dRing);

    // ID tag hanging from D-ring
    const tagGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.01, 16);
    const tagMesh = new THREE.Mesh(tagGeo, silverMat);
    tagMesh.position.set(0, 0.48, 0.22);
    this.group.add(tagMesh);

    // "JUNE" text on a plane in front of the tag
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 64;
    tagCanvas.height = 64;
    const tCtx = tagCanvas.getContext('2d');
    tCtx.fillStyle = '#C0C0C0';
    tCtx.fillRect(0, 0, 64, 64);
    tCtx.fillStyle = '#222222';
    tCtx.font = 'bold 18px Arial';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText('JUNE', 32, 32);
    const tagTexture = new THREE.CanvasTexture(tagCanvas);

    const tagPlaneGeo = new THREE.PlaneGeometry(0.1, 0.1);
    const tagPlaneMat = new THREE.MeshBasicMaterial({ map: tagTexture, transparent: true });
    const tagPlane = new THREE.Mesh(tagPlaneGeo, tagPlaneMat);
    tagPlane.position.set(0, 0.48, 0.232);
    this.group.add(tagPlane);
  }

  // ─── Leg accessors ────────────────────────────────────────────────────────

  get legFL() { return this.legGroups[0]; }
  get legFR() { return this.legGroups[1]; }
  get legBL() { return this.legGroups[2]; }
  get legBR() { return this.legGroups[3]; }

  // ─── Dispose ──────────────────────────────────────────────────────────────

  dispose() {
    this.group.traverse(obj => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m.gradientMap) m.gradientMap.dispose();
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      }
    });
  }
}
