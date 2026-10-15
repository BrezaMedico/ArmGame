// client/src/three/SceneManager.js
import * as THREE from 'three';
import { ParkEnvironment } from './ParkEnvironment.js';
import { ArmTable } from './ArmTable.js';
import { ArmWrestlers } from './ArmWrestlers.js';
import { ParticleSystem } from './ParticleSystem.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || window.innerWidth;
    this.height = canvasContainer.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.isRunning = true;

    // Camera settings
    this.camera = new THREE.PerspectiveCamera(54, this.width / this.height, 0.1, 200);
    
    // View modes: 'menu' | 'match' | 'finish'
    this.viewMode = 'menu';
    this.targetCameraPos = new THREE.Vector3(0.55, 1.62, 1.15);
    this.targetCameraLookAt = new THREE.Vector3(-0.05, 1.32, -0.05);
    this.currentCameraLookAt = new THREE.Vector3(-0.05, 1.32, -0.05);

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    this.initRenderer();
    this.initComponents();
    this.initEvents();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.targetCameraLookAt);
  }

  initComponents() {
    this.environment = new ParkEnvironment(this.scene);
    this.table = new ArmTable(this.scene);
    this.wrestlers = new ArmWrestlers(this.scene, this.table);
    this.particles = new ParticleSystem(this.scene);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'menu') {
      // Cinematic 3D angled view for home screen
      this.targetCameraPos.set(0.55, 1.62, 1.15);
      this.targetCameraLookAt.set(-0.05, 1.32, -0.05);
    } else if (mode === 'match') {
      // Direct First-Person Perspective over the table
      this.targetCameraPos.set(0.0, 1.58, 0.62);
      this.targetCameraLookAt.set(0.0, 1.34, -0.15);
    } else if (mode === 'finish') {
      // Dramatic dynamic low-angle zoom towards the winning pin
      const isPlayerWin = this.wrestlers.currentTilt > 0;
      if (isPlayerWin) {
        this.targetCameraPos.set(-0.15, 1.45, 0.45);
        this.targetCameraLookAt.set(-0.29, 1.16, -0.05);
      } else {
        this.targetCameraPos.set(0.15, 1.45, 0.45);
        this.targetCameraLookAt.set(0.29, 1.16, 0.05);
      }
    }
  }

  triggerShake(intensity = 0.02, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  onHitSuccess() {
    const gripPos = this.wrestlers.gripGroup.position.clone();
    this.particles.spawnHitBurst(gripPos);
    this.triggerShake(0.015, 0.2);
  }

  onHitMiss() {
    this.triggerShake(0.01, 0.15);
  }

  onPinSlam(isPlayerWin) {
    const pinPos = isPlayerWin ? this.table.pinPadLeftPos : this.table.pinPadRightPos;
    this.particles.spawnPinSlam(pinPos);
    this.triggerShake(0.045, 0.45);
    this.setViewMode('finish');
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    };

    window.addEventListener('resize', this.handleResize);
  }

  animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update scene objects
    this.environment.update(delta);
    this.wrestlers.update(delta);
    this.particles.update(delta);

    // Smooth camera transition towards target position & lookAt
    this.camera.position.lerp(this.targetCameraPos, delta * 4.5);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, delta * 4.5);

    // Apply screen shake if active
    if (this.shakeDuration > 0) {
      this.shakeDuration -= delta;
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity
      );
      this.camera.position.add(shakeOffset);
    }

    this.camera.lookAt(this.currentCameraLookAt);

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer?.domElement && this.container?.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose();
  }
}
