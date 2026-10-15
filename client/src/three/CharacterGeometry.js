// client/src/three/CharacterGeometry.js
import * as THREE from 'three';

/**
 * Procedural Anatomical 3D Mesh Builders for Arm Clash 3D
 * Generates smooth, organic human geometry (head, face, torso, arms, hands)
 * Completely free of rigid boxes - all curves, capsules, and organic surfaces.
 */

// Generate procedural canvas texture for cloth micro-weave
export function createClothTexture(colorHex = '#2563eb', secondaryHex = '#1d4ed8') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base jersey color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle sports mesh dot pattern
  ctx.fillStyle = secondaryHex;
  const dotSpacing = 8;
  for (let y = 0; y < 512; y += dotSpacing) {
    for (let x = 0; x < 512; x += dotSpacing) {
      if ((x / dotSpacing + y / dotSpacing) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Athletic chest stripes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(230, 48, 52, 6);
  ctx.fillRect(240, 58, 32, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Generate procedural skin bump texture for micro skin roughness
export function createSkinBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    const val = Math.max(0, Math.min(255, 128 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/**
 * Creates an organic, rounded head with anatomical skull, jawline, and chin
 */
export function createHumanHeadGeometry() {
  const headGeo = new THREE.SphereGeometry(0.125, 24, 20);
  const pos = headGeo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Cranium elongation (slightly taller and deeper than wide)
    v.y *= 1.18;
    v.z *= 1.1;

    // Taper down towards jaw and chin
    if (v.y < 0) {
      const taper = 1.0 + v.y * 1.6;
      v.x *= Math.max(0.58, taper);
      if (v.z > 0) {
        v.z += (Math.abs(v.y) * 0.035);
      }
    } else {
      v.x *= 1.04;
      if (v.z < -0.05) {
        v.z *= 0.95;
      }
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  headGeo.computeVertexNormals();
  return headGeo;
}

/**
 * Creates an anatomical nose mesh
 */
export function createNoseMesh(skinMat) {
  const noseGroup = new THREE.Group();
  
  // Bridge & dorsum
  const bridgeGeo = new THREE.CylinderGeometry(0.011, 0.016, 0.052, 10);
  const bridge = new THREE.Mesh(bridgeGeo, skinMat);
  bridge.rotation.x = 0.28;
  bridge.position.set(0, 0, 0.012);
  bridge.castShadow = true;
  noseGroup.add(bridge);

  // Tip (cartilage ball)
  const tipGeo = new THREE.SphereGeometry(0.015, 10, 10);
  const tip = new THREE.Mesh(tipGeo, skinMat);
  tip.position.set(0, -0.022, 0.022);
  tip.castShadow = true;
  noseGroup.add(tip);

  // Nostril alae
  [-0.012, 0.012].forEach(nx => {
    const alaGeo = new THREE.SphereGeometry(0.010, 8, 8);
    const ala = new THREE.Mesh(alaGeo, skinMat);
    ala.position.set(nx, -0.022, 0.014);
    ala.scale.set(0.9, 0.8, 1.2);
    ala.castShadow = true;
    noseGroup.add(ala);
  });

  return noseGroup;
}

/**
 * Creates an anatomical ear mesh
 */
export function createEarMesh(skinMat) {
  const earGeo = new THREE.SphereGeometry(0.030, 12, 10);
  const pos = earGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= 0.35;
    v.y *= 1.35;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  earGeo.computeVertexNormals();
  const ear = new THREE.Mesh(earGeo, skinMat);
  ear.castShadow = true;
  return ear;
}

/**
 * Creates sculpted stylized 3D hair that hugs the skull
 */
export function createStylizedHair(hairMat) {
  const hairGroup = new THREE.Group();

  // Cap over cranium
  const capGeo = new THREE.SphereGeometry(0.134, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const cap = new THREE.Mesh(capGeo, hairMat);
  cap.position.set(0, 0.02, -0.005);
  cap.scale.set(1.04, 1.15, 1.1);
  cap.castShadow = true;
  hairGroup.add(cap);

  // Front swept locks
  const quiffGeo = new THREE.DodecahedronGeometry(0.07, 1);
  const quiff = new THREE.Mesh(quiffGeo, hairMat);
  quiff.position.set(0, 0.12, 0.07);
  quiff.scale.set(1.4, 0.65, 0.9);
  quiff.rotation.x = -0.25;
  quiff.castShadow = true;
  hairGroup.add(quiff);

  // Sideburns
  [-0.125, 0.125].forEach(sx => {
    const sideGeo = new THREE.CylinderGeometry(0.016, 0.011, 0.06, 8);
    const side = new THREE.Mesh(sideGeo, hairMat);
    side.position.set(sx, -0.01, 0.02);
    side.castShadow = true;
    hairGroup.add(side);
  });

  return hairGroup;
}

/**
 * Creates sculpted eyes with eyelids, pupils, and glint
 */
export function createEyePair(eyeWhiteMat, pupilMat) {
  const group = new THREE.Group();

  [-0.048, 0.048].forEach(ex => {
    const eyeSub = new THREE.Group();
    eyeSub.position.set(ex, 0, 0);

    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 12), eyeWhiteMat);
    eyeBall.scale.set(1.1, 0.9, 0.9);
    eyeSub.add(eyeBall);

    const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.008, 12), pupilMat);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.set(0, 0, 0.017);
    eyeSub.add(pupil);

    const spec = new THREE.Mesh(
      new THREE.SphereGeometry(0.003, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    spec.position.set(0.003, 0.004, 0.021);
    eyeSub.add(spec);

    group.add(eyeSub);
  });

  return group;
}

/**
 * Creates athletic human torso (muscular chest, ribcage, lats, abdomen, t-shirt with collar and seams)
 */
export function createAthleticTorso(shirtMat, skinMat) {
  const torsoGroup = new THREE.Group();

  // 1. Main Torso - Smooth Curved Athletic Contour
  const torsoGeo = new THREE.CylinderGeometry(0.23, 0.18, 0.52, 20, 8);
  const pos = torsoGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y > 0) {
      const shoulderSpread = 1.0 + (v.y / 0.26) * 0.24;
      v.x *= shoulderSpread;
      if (v.z > 0) {
        v.z *= (1.0 + (v.y / 0.26) * 0.28);
      }
    } else {
      v.x *= 0.92;
      v.z *= 0.88;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // 2. Ribbed Crew-Neck Collar
  const collarGeo = new THREE.TorusGeometry(0.10, 0.020, 12, 24);
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
  });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.26, 0.03);
  collar.castShadow = true;
  torsoGroup.add(collar);

  // 3. Realistic Muscular Pectorals
  const pecGeo = new THREE.SphereGeometry(0.11, 14, 12);
  [-0.09, 0.09].forEach(px => {
    const pec = new THREE.Mesh(pecGeo, shirtMat);
    pec.position.set(px, 0.12, 0.10);
    pec.scale.set(1.15, 0.9, 0.45);
    pec.castShadow = true;
    torsoGroup.add(pec);
  });

  // 4. Neck
  const neckGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.15, 16);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, 0.31, 0.02);
  neck.castShadow = true;
  torsoGroup.add(neck);

  return torsoGroup;
}

/**
 * Creates an articulated, curved anatomical finger
 */
export function createArticulatedFinger(skinMat, length = 0.065, radius = 0.010, curlAngle = 0.65) {
  const finger = new THREE.Group();

  const len1 = length * 0.42;
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.95, len1, 8), skinMat);
  p1.position.y = len1 / 2;
  p1.castShadow = true;
  finger.add(p1);

  const joint1 = new THREE.Group();
  joint1.position.y = len1;
  joint1.rotation.x = curlAngle;

  const len2 = length * 0.35;
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.95, radius * 0.9, len2, 8), skinMat);
  p2.position.y = len2 / 2;
  p2.castShadow = true;
  joint1.add(p2);

  const joint2 = new THREE.Group();
  joint2.position.y = len2;
  joint2.rotation.x = curlAngle * 0.8;

  const len3 = length * 0.23;
  const p3 = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.75, len3, 8), skinMat);
  p3.position.y = len3 / 2;
  p3.castShadow = true;
  joint2.add(p3);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.75, 8, 8), skinMat);
  tip.position.y = len3;
  joint2.add(tip);

  joint1.add(joint2);
  finger.add(joint1);

  return finger;
}

/**
 * Creates a completely organic, rounded hand without ANY BoxGeometry!
 * Sculpted with curved palm ellipsoid, soft thenar muscles, and articulated fingers.
 */
export function createOrganicHand(skinMat, isPlayer = true) {
  const handGroup = new THREE.Group();

  // 1. Organic Curved Palm (Ellipsoid with natural human palm proportions)
  const palmGeo = new THREE.SphereGeometry(0.045, 16, 14);
  palmGeo.scale(0.9, 1.25, 0.55); // Width: ~0.08m, Height: ~0.11m, Thickness: ~0.05m
  const palmMesh = new THREE.Mesh(palmGeo, skinMat);
  palmMesh.castShadow = true;
  handGroup.add(palmMesh);

  // Thenar Eminence (Fleshy muscle base of thumb)
  const thenarGeo = new THREE.SphereGeometry(0.022, 10, 10);
  thenarGeo.scale(0.85, 1.3, 0.75);
  const thenar = new THREE.Mesh(thenarGeo, skinMat);
  thenar.position.set(isPlayer ? 0.028 : -0.028, -0.012, 0.014);
  thenar.castShadow = true;
  handGroup.add(thenar);

  // Hypothenar Muscle (Little finger side padding)
  const hypo = new THREE.Mesh(thenarGeo.clone(), skinMat);
  hypo.position.set(isPlayer ? -0.028 : 0.028, -0.014, 0.010);
  hypo.scale.set(0.7, 1.1, 0.65);
  handGroup.add(hypo);

  // Wrist transition cuff (smooth connector from forearm into the palm)
  const wristGeo = new THREE.CylinderGeometry(0.034, 0.036, 0.035, 16);
  const wrist = new THREE.Mesh(wristGeo, skinMat);
  wrist.position.set(0, -0.055, 0);
  wrist.castShadow = true;
  handGroup.add(wrist);

  // 2. Four Articulated Curved Fingers
  const fingerConfigs = [
    { x: isPlayer ? -0.028 : 0.028, len: 0.065, rad: 0.0105, rotZ: isPlayer ? 0.06 : -0.06 },
    { x: isPlayer ? -0.009 : 0.009, len: 0.072, rad: 0.0110, rotZ: 0.0 },
    { x: isPlayer ? 0.010 : -0.010, len: 0.068, rad: 0.0105, rotZ: isPlayer ? -0.05 : 0.05 },
    { x: isPlayer ? 0.028 : -0.028, len: 0.056, rad: 0.0095, rotZ: isPlayer ? -0.09 : 0.09 },
  ];

  fingerConfigs.forEach(fc => {
    // Smooth rounded knuckle
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(fc.rad * 1.05, 8, 8), skinMat);
    knuckle.position.set(fc.x, 0.046, 0.006);
    knuckle.castShadow = true;
    handGroup.add(knuckle);

    // Finger curling tightly around opponent hand
    const fingerMesh = createArticulatedFinger(skinMat, fc.len, fc.rad, 0.85);
    fingerMesh.position.set(fc.x, 0.046, 0.006);
    fingerMesh.rotation.x = isPlayer ? Math.PI * 0.58 : -Math.PI * 0.58;
    fingerMesh.rotation.z = fc.rotZ;
    fingerMesh.castShadow = true;
    handGroup.add(fingerMesh);
  });

  // 3. Articulated Thumb (clamping down firmly across the top of the locked hands)
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(isPlayer ? 0.034 : -0.034, -0.002, 0.016);
  thumbGroup.rotation.y = isPlayer ? Math.PI * 0.32 : -Math.PI * 0.32;
  thumbGroup.rotation.z = isPlayer ? -0.22 : 0.22;

  const thumbP1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.014, 0.038, 10), skinMat);
  thumbP1.position.y = 0.019;
  thumbP1.castShadow = true;
  thumbGroup.add(thumbP1);

  const thumbJoint = new THREE.Group();
  thumbJoint.position.y = 0.038;
  thumbJoint.rotation.x = 0.65;

  const thumbP2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.0125, 0.032, 10), skinMat);
  thumbP2.position.y = 0.016;
  thumbP2.castShadow = true;
  thumbJoint.add(thumbP2);

  const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), skinMat);
  thumbTip.position.y = 0.032;
  thumbJoint.add(thumbTip);

  thumbGroup.add(thumbJoint);
  handGroup.add(thumbGroup);

  return handGroup;
}

/**
 * Creates an anatomical muscular forearm mesh with smooth curves and brachioradialis bulge
 */
export function createMuscularForearmGeometry() {
  const geo = new THREE.CylinderGeometry(0.048, 0.034, 1.0, 16, 12);
  geo.translate(0, 0.5, 0); // pivot at elbow
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const h = v.y; // 0 (elbow) to 1.0 (wrist)

    // Muscle belly bulge at upper 1/3 near elbow
    if (h > 0.12 && h < 0.65) {
      const bellCurve = Math.sin((h - 0.12) / 0.53 * Math.PI);
      const bulge = 1.0 + bellCurve * 0.38;
      v.x *= bulge;
      v.z *= (1.0 + bellCurve * 0.22);
    } else if (h >= 0.85) {
      v.z *= 0.88;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}
