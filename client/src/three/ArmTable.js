// client/src/three/ArmTable.js
import * as THREE from 'three';

export class ArmTable {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.tableHeight = 1.0;
    this.tableWidth = 0.92;
    this.tableDepth = 0.68;
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.createFrame();
    this.createTableTop();
    this.createPads();
    this.createPegs();
  }

  createFrame() {
    // Heavy industrial steel legs and crossbars
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const legRadius = 0.038;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, this.tableHeight, 16);
    const halfW = this.tableWidth / 2 - 0.06;
    const halfD = this.tableDepth / 2 - 0.06;

    const legPositions = [
      [-halfW, -halfD],
      [halfW, -halfD],
      [-halfW, halfD],
      [halfW, halfD],
    ];

    legPositions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(lx, this.tableHeight / 2, lz);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.group.add(leg);

      // Floor rubber stabilizer pad
      const footGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16);
      const foot = new THREE.Mesh(footGeo, steelMat);
      foot.position.set(lx, 0.02, lz);
      this.group.add(foot);
    });

    // Horizontal Steel Crossbars for table rigidity
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.35,
    });

    // Side crossbars
    const sideBarGeo = new THREE.CylinderGeometry(0.025, 0.025, this.tableDepth - 0.12, 12);
    [-halfW, halfW].forEach(bx => {
      const bar = new THREE.Mesh(sideBarGeo, barMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(bx, 0.35, 0);
      bar.castShadow = true;
      this.group.add(bar);
    });

    // Central crossbar
    const centerBarGeo = new THREE.CylinderGeometry(0.025, 0.025, this.tableWidth - 0.12, 12);
    const centerBar = new THREE.Mesh(centerBarGeo, barMat);
    centerBar.rotation.z = Math.PI / 2;
    centerBar.position.set(0, 0.35, 0);
    centerBar.castShadow = true;
    this.group.add(centerBar);
  }

  createTableTop() {
    const topThickness = 0.06;

    // Dual-colored competition vinyl surface
    // Red half & Blue half split diagonally or along the center
    const baseTopGeo = new THREE.BoxGeometry(this.tableWidth, topThickness, this.tableDepth);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Sleek black leather border
      roughness: 0.45,
      metalness: 0.1,
    });
    const baseTop = new THREE.Mesh(baseTopGeo, borderMat);
    baseTop.position.set(0, this.tableHeight + topThickness / 2, 0);
    baseTop.castShadow = true;
    baseTop.receiveShadow = true;
    this.group.add(baseTop);

    // Inner Competition Mat
    const matW = this.tableWidth - 0.06;
    const matD = this.tableDepth - 0.06;
    const matGeo = new THREE.PlaneGeometry(matW, matD);

    // Canvas texture for dual-tone vinyl mat with tournament logo & center line
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // Dual-tone split (Player side: Bold Crimson Red, Opponent side: Electric Blue)
    ctx.fillStyle = '#dc2626'; // Red side
    ctx.fillRect(0, 0, 1024, 384);
    ctx.fillStyle = '#2563eb'; // Blue side
    ctx.fillRect(0, 384, 1024, 384);

    // Center divider stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 376, 1024, 16);

    // Tournament center crest & logo
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(512, 384, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ARM CLASH 3D', 512, 396);

    const matTexture = new THREE.CanvasTexture(canvas);
    matTexture.anisotropy = 8;

    const vinylMat = new THREE.MeshStandardMaterial({
      map: matTexture,
      roughness: 0.4,
      metalness: 0.05,
    });

    const matMesh = new THREE.Mesh(matGeo, vinylMat);
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(0, this.tableHeight + topThickness + 0.002, 0);
    matMesh.receiveShadow = true;
    this.group.add(matMesh);
  }

  createPads() {
    // Official Dimensions:
    // Elbow pads: 18cm x 18cm x 5cm tall.
    // Touch/Pin pads: 25cm x 10cm x 10cm tall, angled 45 deg.
    const padThickness = 0.055;
    const padSize = 0.18;

    // Leather Elbow Pad Material (Player: Red pad, Opponent: Blue pad)
    const playerElbowMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Crimson leather
      roughness: 0.5,
      metalness: 0.1,
    });
    const oppElbowMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Royal Blue leather
      roughness: 0.5,
      metalness: 0.1,
    });

    // Cushioned, rounded leather elbow pads
    const elbowGeo = new THREE.CylinderGeometry(padSize / 2, (padSize / 2) * 1.05, padThickness, 24);

    // Right-handed setup:
    // Player's right elbow pad is at +X (right side from player view, Z > 0)
    // Opponent's right elbow pad is at -X (right side from opponent view, Z < 0)
    const playerPadY = this.tableHeight + 0.06 + padThickness / 2;

    // Player elbow pad
    this.playerElbowPad = new THREE.Mesh(elbowGeo, playerElbowMat);
    this.playerElbowPad.position.set(0.14, playerPadY, 0.16);
    this.playerElbowPad.castShadow = true;
    this.playerElbowPad.receiveShadow = true;
    this.group.add(this.playerElbowPad);

    // Opponent elbow pad
    this.oppElbowPad = new THREE.Mesh(elbowGeo, oppElbowMat);
    this.oppElbowPad.position.set(-0.14, playerPadY, -0.16);
    this.oppElbowPad.castShadow = true;
    this.oppElbowPad.receiveShadow = true;
    this.group.add(this.oppElbowPad);

    // Pin/Touch Pads: rounded cylindrical tournament bumpers
    const pinPadGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Golden yellow tournament pads
      roughness: 0.45,
      metalness: 0.15,
    });

    // Player's winning pin pad (on the left side from player perspective: -X, Z ~ 0)
    const playerWinPad = new THREE.Mesh(pinPadGeo, pinMat);
    playerWinPad.rotation.z = Math.PI / 2;
    playerWinPad.rotation.y = -Math.PI / 4;
    playerWinPad.position.set(-0.31, playerPadY + 0.02, -0.06);
    playerWinPad.castShadow = true;
    playerWinPad.receiveShadow = true;
    this.group.add(playerWinPad);

    // Opponent's winning pin pad (on the right side from player perspective: +X, Z ~ 0)
    const oppWinPad = new THREE.Mesh(pinPadGeo, pinMat);
    oppWinPad.rotation.z = Math.PI / 2;
    oppWinPad.rotation.y = -Math.PI / 4;
    oppWinPad.position.set(0.31, playerPadY + 0.02, 0.06);
    oppWinPad.castShadow = true;
    oppWinPad.receiveShadow = true;
    this.group.add(oppWinPad);

    // Store world positions of key interaction points
    this.playerElbowPos = this.playerElbowPad.position.clone();
    this.oppElbowPos = this.oppElbowPad.position.clone();
    this.pinPadLeftPos = playerWinPad.position.clone();
    this.pinPadRightPos = oppWinPad.position.clone();
  }

  createPegs() {
    // Steel hand pegs for bracing free left hands
    const pegMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });

    const pegGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.18, 16);

    // Peg 1: Player's left hand peg (left side near edge)
    const peg1 = new THREE.Mesh(pegGeo, pegMat);
    peg1.position.set(-this.tableWidth / 2 + 0.08, this.tableHeight + 0.15, 0.22);
    peg1.castShadow = true;
    this.group.add(peg1);

    // Peg 2: Opponent's left hand peg (right side far edge)
    const peg2 = new THREE.Mesh(pegGeo, pegMat);
    peg2.position.set(this.tableWidth / 2 - 0.08, this.tableHeight + 0.15, -0.22);
    peg2.castShadow = true;
    this.group.add(peg2);
  }
}
