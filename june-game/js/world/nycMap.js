import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TextureFactory } from './textureFactory.js';
import { COLORS, MAP } from '../constants.js';

export class NYCMap {
  constructor(scene, world, levelSeed = 42) {
    this.scene = scene;
    this.world = world;
    this.seed = levelSeed;

    this._physicsBodies = [];
    this._meshes = [];
    this._walkableZones = []; // { x, z, w, h } rectangles (road + sidewalk areas)
    this._blockBounds = [];   // { minX, maxX, minZ, maxZ } for building blocks

    this._rng = this._createRNG(levelSeed);
    this._build();
  }

  // -------------------------------------------------------------------------
  // Seeded RNG (mulberry32)
  // -------------------------------------------------------------------------
  _createRNG(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // -------------------------------------------------------------------------
  // Master build
  // -------------------------------------------------------------------------
  _build() {
    // City layout: 5×5 superblock grid, each superblock 40×40 units.
    // Roads are 12 units wide total (8 road + 2 sidewalk each side).
    // Building blocks fill the remaining 28×28 units inside each superblock.

    const numBlocksX = 5;
    const numBlocksZ = 5;
    const superBlockSize = 40;
    const roadTotal = MAP.ROAD_WIDTH + MAP.SIDEWALK_WIDTH * 2; // 12
    const buildingBlockSize = superBlockSize - roadTotal;       // 28

    const totalW = numBlocksX * superBlockSize; // 200
    const totalD = numBlocksZ * superBlockSize; // 200
    const offsetX = -totalW / 2;               // -100
    const offsetZ = -totalD / 2;               // -100

    this._buildGround(totalW, totalD, offsetX, offsetZ);
    this._buildRoads(numBlocksX, numBlocksZ, superBlockSize, buildingBlockSize, offsetX, offsetZ);
    this._buildBuildings(numBlocksX, numBlocksZ, superBlockSize, buildingBlockSize, offsetX, offsetZ);
    this._buildStreetSigns(numBlocksX, numBlocksZ, superBlockSize, offsetX, offsetZ);
    this._recordWalkableZones(numBlocksX, numBlocksZ, superBlockSize, roadTotal, offsetX, offsetZ);
  }

  // -------------------------------------------------------------------------
  // Ground plane
  // -------------------------------------------------------------------------
  _buildGround(totalW, totalD, offsetX, offsetZ) {
    const geo = new THREE.PlaneGeometry(totalW, totalD);
    const tex = TextureFactory.createRoadTexture();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(totalW / 10, totalD / 10);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(offsetX + totalW / 2, -0.01, offsetZ + totalD / 2);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this._meshes.push(mesh);

    // Physics ground plane (static)
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
    this._physicsBodies.push(groundBody);
  }

  // -------------------------------------------------------------------------
  // Roads + sidewalks
  // -------------------------------------------------------------------------
  _buildRoads(numX, numZ, superBlockSize, buildingBlockSize, offsetX, offsetZ) {
    const roadWidth    = MAP.ROAD_WIDTH;
    const sidewalkW    = MAP.SIDEWALK_WIDTH;
    const totalLength  = numX * superBlockSize;
    const totalLengthZ = numZ * superBlockSize;

    const sidewalkTex = TextureFactory.createSidewalkTexture();
    const sidewalkMat = new THREE.MeshLambertMaterial({
      map: sidewalkTex,
      color: COLORS.SIDEWALK,
    });

    // Avenues — run North-South (along Z axis) at each X grid line
    for (let ix = 0; ix <= numX; ix++) {
      const x = offsetX + ix * superBlockSize;
      this._addRoadStrip(
        'avenue', x, offsetX, offsetZ,
        totalLengthZ, roadWidth, sidewalkW, sidewalkMat,
      );
    }

    // Streets — run East-West (along X axis) at each Z grid line
    for (let iz = 0; iz <= numZ; iz++) {
      const z = offsetZ + iz * superBlockSize;
      this._addRoadStrip(
        'street', z, offsetX, offsetZ,
        totalLength, roadWidth, sidewalkW, sidewalkMat,
      );
    }
  }

  /**
   * Place a single road strip (avenue or street).
   * Avenues are aligned along Z; streets along X.
   *
   * @param {string}  type          'avenue' | 'street'
   * @param {number}  pos           position along the perpendicular axis
   * @param {number}  offsetX       world X origin of the grid
   * @param {number}  offsetZ       world Z origin of the grid
   * @param {number}  length        length of the strip along its main axis
   * @param {number}  roadWidth     width of the driveable road section
   * @param {number}  sidewalkWidth width of each sidewalk edge
   * @param {THREE.Material} sidewalkMat
   */
  _addRoadStrip(type, pos, offsetX, offsetZ, length, roadWidth, sidewalkWidth, sidewalkMat) {
    const totalW = roadWidth + sidewalkWidth * 2;

    // Sidewalk mesh — raised slightly above the road ground plane
    const swW = type === 'avenue' ? totalW  : length;
    const swD = type === 'avenue' ? length  : totalW;
    const swGeo = new THREE.BoxGeometry(swW, 0.08, swD);
    const swMesh = new THREE.Mesh(swGeo, sidewalkMat);

    if (type === 'avenue') {
      swMesh.position.set(pos, 0.04, offsetZ + length / 2);
    } else {
      swMesh.position.set(offsetX + length / 2, 0.04, pos);
    }
    swMesh.receiveShadow = true;
    this.scene.add(swMesh);
    this._meshes.push(swMesh);

    // Road surface — slightly thinner, same dark colour as ground texture
    const rdW = type === 'avenue' ? roadWidth : length;
    const rdD = type === 'avenue' ? length    : roadWidth;
    const rdGeo = new THREE.BoxGeometry(rdW, 0.085, rdD);
    const rdMat = new THREE.MeshLambertMaterial({ color: COLORS.ROAD });
    const rdMesh = new THREE.Mesh(rdGeo, rdMat);

    if (type === 'avenue') {
      rdMesh.position.set(pos, 0.0425, offsetZ + length / 2);
    } else {
      rdMesh.position.set(offsetX + length / 2, 0.0425, pos);
    }
    rdMesh.receiveShadow = true;
    this.scene.add(rdMesh);
    this._meshes.push(rdMesh);
  }

  // -------------------------------------------------------------------------
  // Buildings
  // -------------------------------------------------------------------------
  _buildBuildings(numX, numZ, superBlockSize, buildingBlockSize, offsetX, offsetZ) {
    const brickMat = new THREE.MeshLambertMaterial({
      map: TextureFactory.createBrickTexture(),
    });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });

    const roadTotal  = MAP.ROAD_WIDTH + MAP.SIDEWALK_WIDTH * 2; // 12
    const blockOffset = roadTotal / 2; // distance from grid line to block centre edge

    for (let ix = 0; ix < numX; ix++) {
      for (let iz = 0; iz < numZ; iz++) {
        // Centre of this building block in world space
        const bx = offsetX + ix * superBlockSize + blockOffset + buildingBlockSize / 2;
        const bz = offsetZ + iz * superBlockSize + blockOffset + buildingBlockSize / 2;

        // Seeded random height
        const height = MAP.BUILDING_MIN_HEIGHT
          + this._rng() * (MAP.BUILDING_MAX_HEIGHT - MAP.BUILDING_MIN_HEIGHT);

        // Footprint — leave 0.5 units clearance from road edge on each side
        const fw = buildingBlockSize - 1;
        const fd = buildingBlockSize - 1;

        // Main building
        const geo = new THREE.BoxGeometry(fw, height, fd);
        const mesh = new THREE.Mesh(geo, brickMat);
        mesh.position.set(bx, height / 2, bz);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this._meshes.push(mesh);

        // Flat roof
        const roofGeo = new THREE.BoxGeometry(fw, 0.5, fd);
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(bx, height + 0.25, bz);
        this.scene.add(roofMesh);
        this._meshes.push(roofMesh);

        // Windows on north & south faces
        this._addWindowsToBuilding(bx, bz, fw, fd, height);

        // Physics AABB for the building
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(new CANNON.Box(new CANNON.Vec3(fw / 2, height / 2, fd / 2)));
        body.position.set(bx, height / 2, bz);
        this.world.addBody(body);
        this._physicsBodies.push(body);

        // Record bounds for query
        this._blockBounds.push({
          minX: bx - fw / 2,
          maxX: bx + fw / 2,
          minZ: bz - fd / 2,
          maxZ: bz + fd / 2,
        });
      }
    }
  }

  _addWindowsToBuilding(bx, bz, fw, fd, height) {
    const windowTex = TextureFactory.createWindowTexture();
    const wm = new THREE.MeshBasicMaterial({ map: windowTex, transparent: true });

    const floorHeight  = 3;
    const numFloors    = Math.floor((height - 1) / floorHeight);
    const windowsPerRow = Math.min(Math.floor(fw / 4), 5);
    const maxFloors    = Math.min(numFloors, 6);

    for (let floor = 0; floor < maxFloors; floor++) {
      const y = 1 + floor * floorHeight + floorHeight / 2;

      for (let w = 0; w < windowsPerRow; w++) {
        const wx = bx - fw / 2 + 2 + w * 4;

        // North face (negative Z)
        const nGeo = new THREE.PlaneGeometry(2.5, 2);
        const nMesh = new THREE.Mesh(nGeo, wm);
        nMesh.position.set(wx, y, bz - fd / 2 - 0.01);
        this.scene.add(nMesh);
        this._meshes.push(nMesh);

        // South face (positive Z)
        const sGeo = new THREE.PlaneGeometry(2.5, 2);
        const sMesh = new THREE.Mesh(sGeo, wm);
        sMesh.position.set(wx, y, bz + fd / 2 + 0.01);
        sMesh.rotation.y = Math.PI;
        this.scene.add(sMesh);
        this._meshes.push(sMesh);
      }
    }

    // Windows on east & west faces
    const windowsPerRowZ = Math.min(Math.floor(fd / 4), 5);
    for (let floor = 0; floor < maxFloors; floor++) {
      const y = 1 + floor * floorHeight + floorHeight / 2;
      for (let w = 0; w < windowsPerRowZ; w++) {
        const wz = bz - fd / 2 + 2 + w * 4;

        // West face (negative X)
        const wGeo = new THREE.PlaneGeometry(2.5, 2);
        const wMesh = new THREE.Mesh(wGeo, wm);
        wMesh.position.set(bx - fw / 2 - 0.01, y, wz);
        wMesh.rotation.y = -Math.PI / 2;
        this.scene.add(wMesh);
        this._meshes.push(wMesh);

        // East face (positive X)
        const eGeo = new THREE.PlaneGeometry(2.5, 2);
        const eMesh = new THREE.Mesh(eGeo, wm);
        eMesh.position.set(bx + fw / 2 + 0.01, y, wz);
        eMesh.rotation.y = Math.PI / 2;
        this.scene.add(eMesh);
        this._meshes.push(eMesh);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Street signs at intersections
  // -------------------------------------------------------------------------
  _buildStreetSigns(numX, numZ, superBlockSize, offsetX, offsetZ) {
    const avenueNames = ['8th Ave', '7th Ave', '6th Ave', 'Madison Ave', 'Park Ave', 'Lex Ave'];
    const streetNames = ['W 34th St', 'W 33rd St', 'W 32nd St', 'W 31st St', 'W 30th St', 'W 29th St'];

    for (let ix = 0; ix <= Math.min(numX, avenueNames.length - 1); ix++) {
      for (let iz = 0; iz <= Math.min(numZ, streetNames.length - 1); iz++) {
        const x = offsetX + ix * superBlockSize;
        const z = offsetZ + iz * superBlockSize;

        const canvas = document.createElement('canvas');
        canvas.width  = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,50,0.85)';
        ctx.fillRect(0, 0, 256, 64);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`${avenueNames[ix]} & ${streetNames[iz]}`, 8, 22);
        ctx.font = '14px sans-serif';
        ctx.fillText('New York City', 8, 44);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, 4, z);
        sprite.scale.set(8, 2, 1);
        this.scene.add(sprite);
        this._meshes.push(sprite);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Walkable zone registry
  // -------------------------------------------------------------------------
  _recordWalkableZones(numX, numZ, superBlockSize, roadWidth, offsetX, offsetZ) {
    const totalW = numX * superBlockSize;
    const totalD = numZ * superBlockSize;

    // Avenue strips (North-South)
    for (let ix = 0; ix <= numX; ix++) {
      const x = offsetX + ix * superBlockSize;
      this._walkableZones.push({
        x: x - roadWidth / 2,
        z: offsetZ,
        w: roadWidth,
        h: totalD,
      });
    }

    // Street strips (East-West)
    for (let iz = 0; iz <= numZ; iz++) {
      const z = offsetZ + iz * superBlockSize;
      this._walkableZones.push({
        x: offsetX,
        z: z - roadWidth / 2,
        w: totalW,
        h: roadWidth,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Public helpers
  // -------------------------------------------------------------------------
  getRandomWalkablePosition() {
    const zone = this._walkableZones[Math.floor(this._rng() * this._walkableZones.length)];
    return {
      x: zone.x + this._rng() * zone.w,
      z: zone.z + this._rng() * zone.h,
    };
  }

  /** Returns true if world-space point (x, z) is inside any building block. */
  isInsideBuilding(x, z) {
    for (const b of this._blockBounds) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
    }
    return false;
  }

  get physicsBodies()  { return this._physicsBodies; }
  get blockBounds()    { return this._blockBounds; }
  get walkableZones()  { return this._walkableZones; }

  // -------------------------------------------------------------------------
  // Dispose
  // -------------------------------------------------------------------------
  dispose() {
    this._physicsBodies.forEach(b => this.world.removeBody(b));
    this._physicsBodies = [];

    this._meshes.forEach(m => {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach(mt => mt.dispose());
        else m.material.dispose();
      }
    });
    this._meshes = [];
  }
}
