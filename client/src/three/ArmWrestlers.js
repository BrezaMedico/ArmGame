// client/src/three/ArmWrestlers.js
import * as THREE from 'three';
import {
  createHumanHeadGeometry,
  createNoseMesh,
  createEarMesh,
  createStylizedHair,
  createEyePair,
  createAthleticTorso,
  createOrganicHand,
  createMuscularForearmGeometry,
  createClothTexture,
  createSkinBumpTexture,
} from './CharacterGeometry.js';

export class ArmWrestlers {
  constructor(scene, table) {
    this.scene = scene;
    this.table = table;
    this.group = new THREE.Group();

    // Tilt value between -1.0 (Opponent winning) to +1.0 (Player winning)
    this.currentTilt = 0.0;
    this.targetTilt = 0.0;
    this.strainLevel = 0.5;
    this.animTime = 0;

    // Appearance configurations
    this.opponentConfig = {
      skinColor: 0xe0ac69, // Warm skin tone
      shirtColor: 0x2563eb, // Blue athletic jersey
      shirtSecondary: 0x1d4ed8,
      hairColor: 0x1e293b, // Dark hair
      expression: 'determined',
    };

    this.playerConfig = {
      skinColor: 0xd99b66,
    };

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.initMaterials();
    this.buildGripAndForearms();
    this.buildOpponentCharacter();
  }

  initMaterials() {
    const skinBumpMap = createSkinBumpTexture();
    const clothTexture = createClothTexture('#2563eb', '#1d4ed8');

    // Organic Skin Material with micro-roughness & soft specular sheen
    this.playerSkinMat = new THREE.MeshStandardMaterial({
      color: this.playerConfig.skinColor,
      bumpMap: skinBumpMap,
      bumpScale: 0.0006,
      roughness: 0.52,
      metalness: 0.02,
    });

    this.oppSkinMat = new THREE.MeshStandardMaterial({
      color: this.opponentConfig.skinColor,
      bumpMap: skinBumpMap,
      bumpScale: 0.0006,
      roughness: 0.52,
      metalness: 0.02,
    });

    // Athletic Jersey Cloth Material
    this.oppShirtMat = new THREE.MeshStandardMaterial({
      color: this.opponentConfig.shirtColor,
      map: clothTexture,
      roughness: 0.82,
      metalness: 0.04,
    });

    this.oppHairMat = new THREE.MeshStandardMaterial({
      color: this.opponentConfig.hairColor,
      roughness: 0.88,
      metalness: 0.05,
    });

    this.oppEyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
    });

    this.oppPupilMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
    });

    this.teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  }

  setOpponentAppearance({ skinColor, shirtColor, hairColor }) {
    if (skinColor) this.oppSkinMat.color.set(skinColor);
    if (shirtColor) {
      this.oppShirtMat.color.set(shirtColor);
      this.oppShirtMat.map = createClothTexture(
        `#${new THREE.Color(shirtColor).getHexString()}`,
        `#${new THREE.Color(shirtColor).multiplyScalar(0.8).getHexString()}`
      );
      this.oppShirtMat.needsUpdate = true;
    }
    if (hairColor) this.oppHairMat.color.set(hairColor);
  }

  buildGripAndForearms() {
    // 1. Central Locked Grip Group (holds organic, rounded interlocking hands)
    this.gripGroup = new THREE.Group();
    this.group.add(this.gripGroup);

    // Completely Organic Player Hand (zero boxes, smooth sculpted contours)
    this.playerHand = createOrganicHand(this.playerSkinMat, true);
    this.playerHand.position.set(0, 0, 0.012);
    this.gripGroup.add(this.playerHand);

    // Completely Organic Opponent Hand (facing player)
    this.oppHand = createOrganicHand(this.oppSkinMat, false);
    this.oppHand.position.set(0, 0, -0.012);
    this.oppHand.rotation.y = Math.PI;
    this.gripGroup.add(this.oppHand);

    // 2. Player Forearm (anchored at player's red elbow pad)
    this.playerForearm = new THREE.Group();
    this.group.add(this.playerForearm);

    const forearmGeo = createMuscularForearmGeometry();
    this.playerForearmMesh = new THREE.Mesh(forearmGeo, this.playerSkinMat);
    this.playerForearmMesh.castShadow = true;
    this.playerForearmMesh.receiveShadow = true;
    this.playerForearm.add(this.playerForearmMesh);

    // Smooth rounded elbow olecranon nestled on the pad
    const elbowGeo = new THREE.SphereGeometry(0.046, 16, 16);
    elbowGeo.scale(1.0, 0.88, 1.15);
    const playerElbow = new THREE.Mesh(elbowGeo, this.playerSkinMat);
    playerElbow.position.set(0, 0, 0);
    playerElbow.castShadow = true;
    this.playerForearm.add(playerElbow);

    // 3. Opponent Forearm (anchored at opponent's blue elbow pad)
    this.oppForearm = new THREE.Group();
    this.group.add(this.oppForearm);

    this.oppForearmMesh = new THREE.Mesh(forearmGeo.clone(), this.oppSkinMat);
    this.oppForearmMesh.castShadow = true;
    this.oppForearmMesh.receiveShadow = true;
    this.oppForearm.add(this.oppForearmMesh);

    const oppElbow = new THREE.Mesh(elbowGeo.clone(), this.oppSkinMat);
    oppElbow.castShadow = true;
    this.oppForearm.add(oppElbow);

    // 4. Opponent Right Upper Arm (connecting right shoulder to right elbow)
    // Placed in world group to prevent double-transform offset
    const upperArmGeo = new THREE.CylinderGeometry(0.056, 0.046, 1.0, 16);
    upperArmGeo.translate(0, -0.5, 0); // pivot at shoulder top
    this.oppUpperArm = new THREE.Mesh(upperArmGeo, this.oppSkinMat);
    this.oppUpperArm.castShadow = true;
    this.group.add(this.oppUpperArm);
  }

  buildOpponentCharacter() {
    this.oppBody = new THREE.Group();
    // Position opponent right at the table edge with athletic forward lean
    this.oppBody.position.set(0, 1.05, -0.46);

    // 1. Upper Body Torso with athletic curves, pectorals, and collar
    this.oppTorso = createAthleticTorso(this.oppShirtMat, this.oppSkinMat);
    this.oppTorso.position.set(0, 0.32, 0);
    this.oppTorso.rotation.x = 0.14; // natural forward lean over the table
    this.oppBody.add(this.oppTorso);

    // 2. Shoulders (Anatomical Deltoids wrapped with T-shirt sleeves)
    const deltoidGeo = new THREE.SphereGeometry(0.095, 16, 16);
    deltoidGeo.scale(1.15, 1.25, 1.1);

    // Right Shoulder (Panco Arm)
    this.oppRightShoulder = new THREE.Mesh(deltoidGeo, this.oppShirtMat);
    this.oppRightShoulder.position.set(-0.26, 0.22, 0.04);
    this.oppRightShoulder.castShadow = true;
    this.oppTorso.add(this.oppRightShoulder);

    // Right T-shirt sleeve cuff
    const sleeveCuffGeo = new THREE.TorusGeometry(0.065, 0.015, 12, 20);
    const sleeveCuff = new THREE.Mesh(sleeveCuffGeo, this.oppShirtMat);
    sleeveCuff.rotation.x = Math.PI / 2;
    sleeveCuff.position.set(-0.27, 0.12, 0.04);
    this.oppTorso.add(sleeveCuff);

    // Left Shoulder
    this.oppLeftShoulder = new THREE.Mesh(deltoidGeo.clone(), this.oppShirtMat);
    this.oppLeftShoulder.position.set(0.26, 0.22, 0);
    this.oppLeftShoulder.castShadow = true;
    this.oppTorso.add(this.oppLeftShoulder);

    const leftCuff = new THREE.Mesh(sleeveCuffGeo.clone(), this.oppShirtMat);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.set(0.27, 0.12, 0);
    this.oppTorso.add(leftCuff);

    // 3. Opponent Left Arm (resting naturally along side/hip, clean and human)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.28, 0.18, 0);

    const leftArmGeo = new THREE.CylinderGeometry(0.050, 0.040, 0.44, 14);
    const leftArm = new THREE.Mesh(leftArmGeo, this.oppSkinMat);
    leftArm.position.set(0.04, -0.20, -0.02);
    leftArm.rotation.z = -0.18;
    leftArm.rotation.x = -0.15;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    this.oppTorso.add(leftArmGroup);

    // 4. Anatomical Head with skull contour, ears, nose, eyes, mouth
    this.oppHead = new THREE.Group();
    this.oppHead.position.set(0, 0.46, 0.04);

    const skullGeo = createHumanHeadGeometry();
    const skullMesh = new THREE.Mesh(skullGeo, this.oppSkinMat);
    skullMesh.castShadow = true;
    skullMesh.receiveShadow = true;
    this.oppHead.add(skullMesh);

    // Ears
    const earL = createEarMesh(this.oppSkinMat);
    earL.position.set(-0.128, 0.01, -0.01);
    earL.rotation.y = -0.15;
    this.oppHead.add(earL);

    const earR = createEarMesh(this.oppSkinMat);
    earR.position.set(0.128, 0.01, -0.01);
    earR.rotation.y = 0.15;
    this.oppHead.add(earR);

    // Nose
    const nose = createNoseMesh(this.oppSkinMat);
    nose.position.set(0, 0.014, 0.122);
    this.oppHead.add(nose);

    // Eyes
    this.eyes = createEyePair(this.oppEyeWhiteMat, this.oppPupilMat);
    this.eyes.position.set(0, 0.042, 0.115);
    this.oppHead.add(this.eyes);

    // Eyebrows
    const browGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.046, 8);
    this.browL = new THREE.Mesh(browGeo, this.oppHairMat);
    this.browL.rotation.z = Math.PI / 2 + 0.18;
    this.browL.position.set(-0.048, 0.072, 0.122);
    this.oppHead.add(this.browL);

    this.browR = new THREE.Mesh(browGeo, this.oppHairMat);
    this.browR.rotation.z = Math.PI / 2 - 0.18;
    this.browR.position.set(0.048, 0.072, 0.122);
    this.oppHead.add(this.browR);

    // Mouth
    this.mouthGroup = new THREE.Group();
    this.mouthGroup.position.set(0, -0.052, 0.122);

    const lipGeo = new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI);
    this.upperLip = new THREE.Mesh(lipGeo, this.oppSkinMat);
    this.upperLip.rotation.x = Math.PI / 2;
    this.mouthGroup.add(this.upperLip);

    this.teeth = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12), this.teethMat);
    this.teeth.rotation.x = Math.PI / 2;
    this.teeth.position.set(0, -0.003, -0.002);
    this.mouthGroup.add(this.teeth);

    this.oppHead.add(this.mouthGroup);

    // Stylized 3D Hair
    this.hair = createStylizedHair(this.oppHairMat);
    this.oppHead.add(this.hair);

    this.oppTorso.add(this.oppHead);
    this.group.add(this.oppBody);
  }

  setTilt(target, strain = 0.5) {
    this.targetTilt = Math.max(-1.0, Math.min(1.0, target));
    this.strainLevel = strain;
  }

  setExpression(type) {
    this.opponentConfig.expression = type;
    if (type === 'straining') {
      this.browL.rotation.z = Math.PI / 2 + 0.38;
      this.browR.rotation.z = Math.PI / 2 - 0.38;
      this.mouthGroup.scale.set(1.3, 1.8, 1.0);
      this.teeth.visible = true;
    } else if (type === 'defeated') {
      this.browL.rotation.z = Math.PI / 2 - 0.22;
      this.browR.rotation.z = Math.PI / 2 + 0.22;
      this.mouthGroup.scale.set(1.1, 1.4, 1.0);
      this.teeth.visible = false;
    } else if (type === 'victorious') {
      this.browL.rotation.z = Math.PI / 2 + 0.08;
      this.browR.rotation.z = Math.PI / 2 - 0.08;
      this.mouthGroup.scale.set(1.2, 1.0, 1.0);
      this.teeth.visible = true;
    } else {
      this.browL.rotation.z = Math.PI / 2 + 0.18;
      this.browR.rotation.z = Math.PI / 2 - 0.18;
      this.mouthGroup.scale.set(1.0, 1.0, 1.0);
      this.teeth.visible = true;
    }
  }

  update(delta) {
    this.animTime += delta;

    // Smooth interpolation for arm tilt
    this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, this.targetTilt, delta * 8.5);

    // Natural breathing cycle
    const breath = Math.sin(this.animTime * 2.8) * 0.005;
    this.oppTorso.scale.set(1.0 + breath * 0.5, 1.0 + breath * 0.8, 1.0 + breath * 1.0);

    // Micro-jitter / Muscle Strain shaking proportional to effort
    const strainJitter = Math.sin(this.animTime * 44) * (0.002 + this.strainLevel * 0.004);

    // 1. Calculate Anatomical Grip Position in 3D arc:
    // Neutral center upright: (0.0, 1.38, 0.0)
    // Player win pin pad: (-0.29, 1.155, -0.05)
    // Opponent win pin pad: (0.29, 1.155, 0.05)
    const neutralGrip = new THREE.Vector3(0, 1.38, 0);
    const playerWinGrip = new THREE.Vector3(-0.29, 1.155, -0.05); // Opponent pinned
    const oppWinGrip = new THREE.Vector3(0.29, 1.155, 0.05); // Player pinned

    const gripPos = new THREE.Vector3();
    if (this.currentTilt >= 0) {
      const t = this.currentTilt;
      gripPos.lerpVectors(neutralGrip, playerWinGrip, t);
      gripPos.y += (1 - t * t) * 0.035;
    } else {
      const t = -this.currentTilt;
      gripPos.lerpVectors(neutralGrip, oppWinGrip, t);
      gripPos.y += (1 - t * t) * 0.035;
    }

    gripPos.x += strainJitter;
    gripPos.y += strainJitter * 0.5;

    // Update Grip Model position & roll
    this.gripGroup.position.copy(gripPos);

    const maxRoll = Math.PI * 0.44;
    const rollAngle = -this.currentTilt * maxRoll;
    this.gripGroup.rotation.set(0, 0, rollAngle);

    // 2. Inverse Kinematics for Player Forearm:
    const playerElbow = new THREE.Vector3(0.14, 1.09, 0.16);
    this.playerForearm.position.copy(playerElbow);

    const playerArmVec = new THREE.Vector3().subVectors(gripPos, playerElbow);
    const playerArmLen = playerArmVec.length();

    this.playerForearmMesh.scale.set(1, playerArmLen, 1);
    this.playerForearm.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      playerArmVec.clone().normalize()
    );

    // 3. Inverse Kinematics for Opponent Forearm:
    const oppElbow = new THREE.Vector3(-0.14, 1.09, -0.16);
    this.oppForearm.position.copy(oppElbow);

    const oppArmVec = new THREE.Vector3().subVectors(gripPos, oppElbow);
    const oppArmLen = oppArmVec.length();

    this.oppForearmMesh.scale.set(1, oppArmLen, 1);
    this.oppForearm.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      oppArmVec.clone().normalize()
    );

    // 4. Opponent Torso & Shoulder Lean Dynamics:
    const bodyLeanX = -this.currentTilt * 0.18;
    const bodyLeanZ = 0.14 + (this.currentTilt > 0 ? -0.06 : 0.07) + Math.sin(this.animTime * 3) * 0.01;

    this.oppTorso.rotation.z = bodyLeanX;
    this.oppTorso.rotation.x = bodyLeanZ;
    this.oppTorso.position.x = -this.currentTilt * 0.08;

    // 5. Connect Opponent Right Upper Arm (World coordinates, zero double-offset!)
    const shoulderWorldPos = new THREE.Vector3();
    this.oppRightShoulder.getWorldPosition(shoulderWorldPos);
    const oppUpperArmVec = new THREE.Vector3().subVectors(oppElbow, shoulderWorldPos);
    const oppUpperArmLen = oppUpperArmVec.length();

    this.oppUpperArm.position.copy(shoulderWorldPos);
    this.oppUpperArm.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, -1, 0), // points downward towards elbow
      oppUpperArmVec.clone().normalize()
    );
    this.oppUpperArm.scale.set(1, oppUpperArmLen, 1);

    // Head tracks the grip struggle with intense gaze
    this.oppHead.lookAt(gripPos);

    // Dynamic Facial Expression
    if (this.currentTilt >= 0.82) {
      this.setExpression('defeated');
    } else if (this.currentTilt <= -0.82) {
      this.setExpression('victorious');
    } else if (Math.abs(this.currentTilt) > 0.35 || this.strainLevel > 0.55) {
      this.setExpression('straining');
    } else {
      this.setExpression('determined');
    }
  }
}
