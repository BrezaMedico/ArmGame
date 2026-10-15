// client/src/three/ParkEnvironment.js
import * as THREE from 'three';

export class ParkEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.init();
  }

  init() {
    this.createSky();
    this.createLights();
    this.createGround();
    this.createTrees();
    this.createBushes();
    this.createParkFurniture();
    this.createCitySkyline();
  }

  createSky() {
    // Sky Dome with subtle gradient
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    const uniforms = {
      topColor: { value: new THREE.Color(0x38bdf8) }, // Bright azure sky
      bottomColor: { value: new THREE.Color(0xfef08a) }, // Warm golden horizon
      offset: { value: 33 },
      exponent: { value: 0.6 },
    };

    const skyGeo = new THREE.SphereGeometry(150, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Fluffy procedural clouds
    this.createClouds();
  }

  createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 12; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numPuffs; j++) {
        const puffSize = 3 + Math.random() * 4;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(puffSize, 1), cloudMat);
        puff.position.set(j * 3.5 - 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 160,
        28 + Math.random() * 15,
        -50 + (Math.random() - 0.5) * 120
      );
      cloudGroup.userData = { speed: 0.3 + Math.random() * 0.5 };
      this.clouds.push(cloudGroup);
      this.scene.add(cloudGroup);
    }
  }

  createLights() {
    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(8, 16, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 45;
    const d = 9;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xbae6fd, 0.7);
    this.scene.add(ambientLight);

    // Subtle Ground Bounce Light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x15803d, 0.4);
    this.scene.add(hemiLight);
  }

  createGround() {
    // Lush green park grass with stylized shading
    const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Cobblestone / paving plaza under and around the panco table
    const plazaGeo = new THREE.CylinderGeometry(5.5, 6, 0.15, 24);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1, // Warm stone paving
      roughness: 0.75,
      metalness: 0.1,
      flatShading: true,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Curved Stone Walkway branching through the park
    const pathGeo = new THREE.PlaneGeometry(3.5, 60);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xe7e5e4,
      roughness: 0.8,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(6, 0.02, -15);
    path.receiveShadow = true;
    this.scene.add(path);
  }

  createTrees() {
    // Variety of Stylized Park Trees
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Warm wood bark
      roughness: 0.9,
      flatShading: true,
    });

    const foliageColors = [0x16a34a, 0x15803d, 0x4ade80, 0x22c55e];

    const treePositions = [
      { x: -7, z: -6, scale: 1.1 },
      { x: -11, z: 2, scale: 1.3 },
      { x: 9, z: -5, scale: 1.2 },
      { x: 12, z: 3, scale: 1.4 },
      { x: -8, z: -16, scale: 1.5 },
      { x: 4, z: -20, scale: 1.6 },
      { x: -15, z: -24, scale: 1.8 },
      { x: 16, z: -18, scale: 1.7 },
      { x: -6, z: 12, scale: 1.0 },
      { x: 8, z: 14, scale: 1.2 },
    ];

    treePositions.forEach((pos, idx) => {
      const treeGroup = new THREE.Group();

      // Trunk
      const trunkHeight = 3.2 * pos.scale;
      const trunkGeo = new THREE.CylinderGeometry(0.25 * pos.scale, 0.45 * pos.scale, trunkHeight, 7);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Multi-tier Stylized Foliage Clusters
      const foliageColor = foliageColors[idx % foliageColors.length];
      const foliageMat = new THREE.MeshStandardMaterial({
        color: foliageColor,
        roughness: 0.75,
        flatShading: true,
      });

      // 3 overlapping foliage spheres
      const tiers = [
        { y: trunkHeight * 0.9, r: 1.8 * pos.scale },
        { y: trunkHeight * 1.35, r: 1.4 * pos.scale },
        { y: trunkHeight * 1.7, r: 1.0 * pos.scale },
      ];

      tiers.forEach(tier => {
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(tier.r, 1), foliageMat);
        foliage.position.y = tier.y;
        foliage.position.x = (Math.random() - 0.5) * 0.3;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
      });

      treeGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(treeGroup);
    });
  }

  createBushes() {
    const bushColors = [0x15803d, 0x166534, 0x4ade80];
    const bushPositions = [
      { x: -4.5, z: -3.5, s: 0.8 },
      { x: -4.8, z: -2.8, s: 0.6 },
      { x: 4.8, z: -3.2, s: 0.9 },
      { x: 5.2, z: -2.2, s: 0.7 },
      { x: -3.8, z: 4.2, s: 0.75 },
      { x: 4.2, z: 4.5, s: 0.85 },
      { x: 7.5, z: -10, s: 1.2 },
      { x: -9, z: -12, s: 1.3 },
    ];

    bushPositions.forEach((pos, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: bushColors[idx % bushColors.length],
        roughness: 0.8,
        flatShading: true,
      });
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(pos.s, 1), mat);
      bush.position.set(pos.x, pos.s * 0.7, pos.z);
      bush.castShadow = true;
      bush.receiveShadow = true;
      this.scene.add(bush);
    });
  }

  createParkFurniture() {
    // Classic Wooden Park Benches with Iron Frame
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    const benchLocations = [
      { x: -4.2, z: 1.5, rot: Math.PI / 3 },
      { x: 4.5, z: -0.5, rot: -Math.PI / 4 },
    ];

    benchLocations.forEach(loc => {
      const bench = new THREE.Group();

      // Slats (seat + backrest)
      for (let s = 0; s < 3; s++) {
        const seatSlat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.12), woodMat);
        seatSlat.position.set(0, 0.5, s * 0.14 - 0.14);
        seatSlat.castShadow = true;
        bench.add(seatSlat);
      }
      for (let b = 0; b < 3; b++) {
        const backSlat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.05), woodMat);
        backSlat.position.set(0, 0.65 + b * 0.14, -0.22);
        backSlat.castShadow = true;
        bench.add(backSlat);
      }

      // Iron legs
      [-0.7, 0.7].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.45), ironMat);
        leg.position.set(lx, 0.25, -0.05);
        leg.castShadow = true;
        bench.add(leg);
      });

      bench.position.set(loc.x, 0, loc.z);
      bench.rotation.y = loc.rot;
      this.scene.add(bench);
    });

    // Victorian Park Lampposts
    const lampLocations = [
      { x: -3.8, z: -4.2 },
      { x: 4.2, z: 3.8 },
    ];

    lampLocations.forEach(loc => {
      const lamp = new THREE.Group();

      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.8, 8), ironMat);
      pole.position.y = 1.9;
      pole.castShadow = true;
      lamp.add(pole);

      // Glass Lantern
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.4, 6), lanternMat);
      lantern.position.y = 3.9;
      lamp.add(lantern);

      // Cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 6), ironMat);
      cap.position.y = 4.15;
      lamp.add(cap);

      lamp.position.set(loc.x, 0, loc.z);
      this.scene.add(lamp);
    });
  }

  createCitySkyline() {
    // Stylized distant skyscrapers and buildings
    const buildingColors = [0x94a3b8, 0x64748b, 0xcbd5e1, 0x475569];
    const cityGroup = new THREE.Group();

    for (let i = 0; i < 28; i++) {
      const width = 6 + Math.random() * 8;
      const height = 18 + Math.random() * 32;
      const depth = 6 + Math.random() * 8;

      const mat = new THREE.MeshStandardMaterial({
        color: buildingColors[i % buildingColors.length],
        roughness: 0.6,
        metalness: 0.2,
      });

      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);

      // Distribute in a semi-circle backdrop
      const angle = (i / 28) * Math.PI * 1.4 - Math.PI * 0.7;
      const distance = 65 + (Math.random() - 0.5) * 15;

      building.position.set(
        Math.sin(angle) * distance,
        height / 2 - 2,
        -Math.cos(angle) * distance - 20
      );

      cityGroup.add(building);
    }

    this.scene.add(cityGroup);
  }

  update(delta) {
    // Gentle cloud drifting
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 85) {
        cloud.position.x = -85;
      }
    });
  }
}
