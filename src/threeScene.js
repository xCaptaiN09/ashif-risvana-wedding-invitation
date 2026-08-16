import * as THREE from 'three';

/**
 * 3D Flowing Background Engine
 * Minimal, Organic, High-Fashion Editorial Chiffon & Petal Simulation
 */

export class Wedding3DScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scroll = { current: 0, target: 0 };
    this.clock = new THREE.Clock();

    this.init();
    this.createSilkRibbon();
    this.createBotanicalFlora();
    this.createSunlightDust();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 28);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Warm ambient light & natural directional sun
    const ambientLight = new THREE.AmbientLight(0xfdfaf5, 1.8);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf5e6d3, 1.4);
    sunLight.position.set(15, 25, 20);
    this.scene.add(sunLight);

    const warmBounce = new THREE.DirectionalLight(0xe8d0c0, 0.8);
    warmBounce.position.set(-15, -10, 10);
    this.scene.add(warmBounce);
  }

  // 1. Organic Airy Silk Chiffon Veil
  createSilkRibbon() {
    const geometry = new THREE.PlaneGeometry(55, 35, 60, 40);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0xfcfbf8) }, // Warm Alabaster
        uColor2: { value: new THREE.Color(0xf1e7da) }, // Soft Linen
        uColor3: { value: new THREE.Color(0xd9c2b4) }, // Terracotta hint
        uOpacity: { value: 0.22 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          float wave1 = sin(pos.x * 0.1 + uTime * 0.5) * cos(pos.y * 0.12 + uTime * 0.4) * 2.8;
          float wave2 = sin(pos.x * 0.2 - uTime * 0.3 + pos.y * 0.15) * 1.4;
          pos.z += wave1 + wave2;

          vNormal = normalize(normalMatrix * normal);
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 col = mix(uColor1, uColor2, vUv.y * 0.9 + sin(vPosition.z * 0.4) * 0.15);
          col = mix(col, uColor3, fresnel * 0.4);

          float alpha = uOpacity * (0.5 + fresnel * 0.5);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.silkMesh = new THREE.Mesh(geometry, material);
    this.silkMesh.position.set(0, -1, -5);
    this.silkMesh.rotation.x = -Math.PI * 0.15;
    this.scene.add(this.silkMesh);
  }

  // 2. Botanical Fluttering Olive Leaves & Blush Petals
  createBotanicalFlora() {
    this.flora = [];
    const count = 30;

    // Curved Leaf / Petal Shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.4, 0.3, 0.5, 0.9, 0, 1.4);
    shape.bezierCurveTo(-0.5, 0.9, -0.4, 0.3, 0, 0);

    const geometry = new THREE.ShapeGeometry(shape, 6);
    
    // Add realistic 3D curve
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, -Math.sin(y * 2.0) * 0.15 + (x * x) * 0.1);
    }
    geometry.computeVertexNormals();

    const colors = [
      0x8b9982, // Olive Sage
      0xa4b39b, // Soft Sage
      0xd99587, // Terracotta blush
      0xe5c0b8, // Warm rosewater
      0xdfd3c3, // Dried linen petal
    ];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: Math.random() * 0.3 + 0.55,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const scale = Math.random() * 0.6 + 0.4;
      mesh.scale.set(scale, scale, scale);

      mesh.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 35 - 10,
        (Math.random() - 0.5) * 15 + 4
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.flora.push({
        mesh: mesh,
        vy: -(Math.random() * 0.035 + 0.015),
        vx: (Math.random() - 0.5) * 0.012,
        vz: (Math.random() - 0.5) * 0.008,
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.03,
        rotSpeedZ: (Math.random() - 0.5) * 0.015,
        wobbleSpeed: Math.random() * 1.8 + 0.8,
        wobbleAmp: Math.random() * 0.02 + 0.008,
      });

      this.scene.add(mesh);
    }
  }

  // 3. Subtle Ambient Sunlight Dust
  createSunlightDust() {
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dustGeometry = geometry;

    // Soft round particle
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    grad.addColorStop(0, 'rgba(235, 215, 185, 0.9)');
    grad.addColorStop(0.5, 'rgba(215, 185, 150, 0.3)');
    grad.addColorStop(1, 'rgba(215, 185, 150, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.PointsMaterial({
      size: 0.9,
      map: texture,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      color: 0xf5ebd9,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  setupEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / this.width - 0.5) * 2;
      this.mouse.targetY = -(e.clientY / this.height - 0.5) * 2;
    });

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.scroll.target = maxScroll > 0 ? scrollY / maxScroll : 0;
    }, { passive: true });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.035;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.035;
    this.scroll.current += (this.scroll.target - this.scroll.current) * 0.04;

    if (this.silkMesh && this.silkMesh.material.uniforms) {
      this.silkMesh.material.uniforms.uTime.value = elapsedTime;
      this.silkMesh.rotation.y = this.mouse.x * 0.05;
      this.silkMesh.rotation.x = -Math.PI * 0.15 + this.mouse.y * 0.04 + this.scroll.current * 0.15;
    }

    this.flora.forEach((p) => {
      const mesh = p.mesh;
      mesh.position.y += p.vy;
      mesh.position.x += p.vx + Math.sin(elapsedTime * p.wobbleSpeed) * p.wobbleAmp + (this.mouse.x * 0.015);
      mesh.position.z += p.vz;

      mesh.rotation.x += p.rotSpeedX;
      mesh.rotation.y += p.rotSpeedY;
      mesh.rotation.z += p.rotSpeedZ;

      if (mesh.position.y < -20) {
        mesh.position.y = 22 + Math.random() * 4;
        mesh.position.x = (Math.random() - 0.5) * 40;
        mesh.position.z = (Math.random() - 0.5) * 15 + 4;
      }
    });

    if (this.dustParticles) {
      this.dustParticles.rotation.y = elapsedTime * 0.015 + this.mouse.x * 0.03;
    }

    this.camera.position.x = this.mouse.x * 1.8;
    this.camera.position.y = this.mouse.y * 1.2 - this.scroll.current * 3;
    this.camera.lookAt(0, -this.scroll.current * 3, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
