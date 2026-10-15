// client/src/three/ParticleSystem.js
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 250;

    // Instanced or grouped particle pools
    this.init();
  }

  init() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Shared Materials
    this.dustMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.sweatMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.geoSmall = new THREE.DodecahedronGeometry(0.015, 0);
    this.geoMedium = new THREE.DodecahedronGeometry(0.03, 0);
  }

  // Triggered on successful timing needle hit
  spawnHitBurst(pos) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const isSpark = Math.random() > 0.4;
      const mesh = new THREE.Mesh(this.geoSmall, isSpark ? this.sparkMat : this.dustMat);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.5 + Math.random() * 1.5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        gravity: -3.8,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        scaleSpeed: -0.8,
      });

      this.group.add(mesh);
    }
  }

  // Triggered on table slam / match pin
  spawnPinSlam(pos) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const isSpark = Math.random() > 0.5;
      const mesh = new THREE.Mesh(this.geoMedium, isSpark ? this.sparkMat : this.dustMat);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        1.0 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        gravity: -4.5,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        scaleSpeed: -0.6,
      });

      this.group.add(mesh);
    }
  }

  // High strain sweat droplet
  spawnSweat(pos) {
    if (this.particles.length > this.maxParticles) return;
    const mesh = new THREE.Mesh(this.geoSmall, this.sweatMat);
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 0.1;
    mesh.position.y += (Math.random() - 0.5) * 0.05;

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      0.1 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.3
    );

    this.particles.push({
      mesh,
      velocity,
      gravity: -5.0,
      life: 0.5,
      maxLife: 0.5,
      scaleSpeed: 0,
    });

    this.group.add(mesh);
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose?.();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Fade / scale down
      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.1, progress));
    }
  }

  clear() {
    this.particles.forEach(p => {
      this.group.remove(p.mesh);
    });
    this.particles = [];
  }
}
