/* VoxelFlow AI - Three.js & Canvas 3D Product Viewer Engine */

class Product3DViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentMesh = null;
    this.isRotating = true;
    this.isWireframe = false;
    this.currentColor = '#FF2A5F';
    this.currentProduct = 'chair';

    this.init();
  }

  init() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded. Falling back to Canvas 2D render engine.');
      this.initFallback2DCanvas();
      return;
    }

    const width = this.canvas.clientWidth || 600;
    const height = this.canvas.clientHeight || 480;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 4.8);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting Setup for Photo-Realism
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Studio Light
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.4);
    keyLight.position.set(5, 8, 6);
    this.scene.add(keyLight);

    // Fill Crimson Rim Light
    const fillLight = new THREE.DirectionalLight(0xff2a5f, 0.85);
    fillLight.position.set(-6, 2, -4);
    this.scene.add(fillLight);

    // Gold Top/Back Rim Light
    const rimLight = new THREE.DirectionalLight(0xffb800, 1.0);
    rimLight.position.set(2, 6, -5);
    this.scene.add(rimLight);

    // Grid Floor & Soft Shadow Disc
    this.gridHelper = new THREE.GridHelper(10, 24, 0xffb800, 0x3d0d1b);
    this.gridHelper.position.y = -1.5;
    this.scene.add(this.gridHelper);

    // Soft Studio Contact Shadow Floor Disc
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = -1.49;
    this.scene.add(this.contactShadow);

    // Load initial 3D Mesh
    this.loadProductModel(this.currentProduct);

    // Handle Window Resize
    window.addEventListener('resize', () => this.onResize());

    // Mouse & Touch Drag Controls
    this.initMouseDrag();

    // Render Loop
    this.animate();
  }

  loadProductModel(productType) {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
    }

    this.currentProduct = productType;
    const group = new THREE.Group();

    // Realistic PBR Materials Setup
    const primaryMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.currentColor),
      roughness: 0.35,
      metalness: 0.25,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      wireframe: this.isWireframe
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: this.isWireframe
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.95,
      wireframe: this.isWireframe
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffb800,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: this.isWireframe
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x111122,
      metalness: 0.9,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      wireframe: this.isWireframe
    });

    const fabricMat = new THREE.MeshStandardMaterial({
      color: 0x2a2830,
      roughness: 0.9,
      metalness: 0.05,
      wireframe: this.isWireframe
    });

    if (productType === 'sneaker') {
      // --- Realistic Air-Cushioned Performance Sneaker ---
      // Outsole
      const soleGeo = new THREE.BoxGeometry(2.6, 0.35, 1.1, 8, 2, 4);
      const soleMesh = new THREE.Mesh(soleGeo, rubberMat);
      soleMesh.position.y = -0.6;
      group.add(soleMesh);

      // Midsole Air Unit Cushioning Window
      const airGeo = new THREE.BoxGeometry(1.6, 0.22, 0.98);
      const airMesh = new THREE.Mesh(airGeo, glassMat);
      airMesh.position.set(-0.2, -0.38, 0);
      group.add(airMesh);

      // Main Upper Body
      const upperGeo = new THREE.CylinderGeometry(0.55, 0.95, 1.25, 32);
      const upperMesh = new THREE.Mesh(upperGeo, primaryMat);
      upperMesh.rotation.z = Math.PI / 6.5;
      upperMesh.position.set(-0.25, 0.28, 0);
      group.add(upperMesh);

      // Sculpted Toe Cap
      const toeGeo = new THREE.SphereGeometry(0.56, 32, 16);
      toeGeo.scale(1.2, 0.7, 0.95);
      const toeMesh = new THREE.Mesh(toeGeo, primaryMat);
      toeMesh.position.set(0.75, -0.3, 0);
      group.add(toeMesh);

      // Ankle Collar Cushion
      const collarGeo = new THREE.TorusGeometry(0.48, 0.12, 16, 32);
      const collarMesh = new THREE.Mesh(collarGeo, fabricMat);
      collarMesh.rotation.x = Math.PI / 2;
      collarMesh.rotation.y = Math.PI / 6;
      collarMesh.position.set(-0.7, 0.75, 0);
      group.add(collarMesh);

      // Gold Metallic Side Chevron / Branding Swoosh
      const stripeGeo = new THREE.BoxGeometry(1.2, 0.12, 1.05);
      const stripeMesh = new THREE.Mesh(stripeGeo, goldMat);
      stripeMesh.rotation.z = -Math.PI / 10;
      stripeMesh.position.set(0.1, 0.1, 0);
      group.add(stripeMesh);

      // Criss-Cross Lacing Loops
      for (let i = 0; i < 4; i++) {
        const laceGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12);
        const laceMesh = new THREE.Mesh(laceGeo, chromeMat);
        laceMesh.rotation.x = Math.PI / 2;
        laceMesh.rotation.z = -Math.PI / 12;
        laceMesh.position.set(-0.1 + i * 0.22, 0.25 + i * 0.12, 0);
        group.add(laceMesh);
      }
    } else if (productType === 'chair') {
      // --- Realistic Mid-Century Lounge Chair & Ottoman Frame ---
      // Cushion Seat Body
      const seatGeo = new THREE.BoxGeometry(1.8, 0.28, 1.7, 4, 2, 4);
      const seatMesh = new THREE.Mesh(seatGeo, primaryMat);
      seatMesh.position.set(0, -0.1, 0);
      group.add(seatMesh);

      // Ergonomic Backrest Cushion
      const backGeo = new THREE.BoxGeometry(1.7, 1.5, 0.25, 4, 4, 2);
      const backMesh = new THREE.Mesh(backGeo, primaryMat);
      backMesh.position.set(0, 0.75, -0.75);
      backMesh.rotation.x = -0.15;
      group.add(backMesh);

      // Side Armrest Pads
      const armLeftGeo = new THREE.BoxGeometry(0.22, 0.35, 1.4);
      const armLeft = new THREE.Mesh(armLeftGeo, primaryMat);
      armLeft.position.set(-0.95, 0.25, 0);
      group.add(armLeft);

      const armRight = armLeft.clone();
      armRight.position.set(0.95, 0.25, 0);
      group.add(armRight);

      // Polished Chrome Metallic Angled Legs
      const legGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.85, 16);
      const legPositions = [
        [-0.8, -0.6, -0.75, 0.2, -0.2],
        [0.8, -0.6, -0.75, 0.2, 0.2],
        [-0.8, -0.6, 0.75, -0.2, -0.2],
        [0.8, -0.6, 0.75, -0.2, 0.2]
      ];
      legPositions.forEach(([x, y, z, rx, rz]) => {
        const leg = new THREE.Mesh(legGeo, chromeMat);
        leg.position.set(x, y, z);
        leg.rotation.x = rx;
        leg.rotation.z = rz;
        group.add(leg);

        // Rubber Floor Caps
        const capGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
        const cap = new THREE.Mesh(capGeo, rubberMat);
        cap.position.set(x, y - 0.4, z);
        group.add(cap);
      });
    } else if (productType === 'watch') {
      // --- Realistic Premium Smartwatch ---
      // Anodized Aluminum Watch Body Case
      const caseGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.25, 64);
      const caseMesh = new THREE.Mesh(caseGeo, chromeMat);
      group.add(caseMesh);

      // Bezel Accent Ring
      const bezelGeo = new THREE.TorusGeometry(0.96, 0.05, 16, 64);
      const bezelMesh = new THREE.Mesh(bezelGeo, goldMat);
      bezelMesh.rotation.x = Math.PI / 2;
      group.add(bezelMesh);

      // Curved Sapphire Glass Screen Face
      const screenGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.06, 64);
      const screenMesh = new THREE.Mesh(screenGeo, glassMat);
      screenMesh.position.y = 0.11;
      group.add(screenMesh);

      // Side Crown Control Dial Button
      const crownGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 24);
      const crownMesh = new THREE.Mesh(crownGeo, goldMat);
      crownMesh.rotation.z = Math.PI / 2;
      crownMesh.position.set(1.05, 0, 0);
      group.add(crownMesh);

      // Flexible Textured Rubber / Leather Watch Strap
      const strapGeo = new THREE.BoxGeometry(0.72, 0.08, 3.4);
      const strapMesh = new THREE.Mesh(strapGeo, primaryMat);
      strapMesh.position.y = -0.06;
      group.add(strapMesh);

      // Metallic Strap Clasp / Buckle
      const buckleGeo = new THREE.BoxGeometry(0.78, 0.12, 0.18);
      const buckleMesh = new THREE.Mesh(buckleGeo, chromeMat);
      buckleMesh.position.set(0, -0.06, 1.6);
      group.add(buckleMesh);
    } else if (productType === 'headset') {
      // --- Realistic Spatial Vision AR/VR Headset ---
      // Curved Continuous Mirror Glass Front Visor
      const visorGeo = new THREE.SphereGeometry(1.0, 64, 32);
      visorGeo.scale(1.45, 0.72, 0.85);
      const visorMesh = new THREE.Mesh(visorGeo, glassMat);
      group.add(visorMesh);

      // Fabric Cushion Face Seal Gasket
      const gasketGeo = new THREE.TorusGeometry(0.95, 0.15, 16, 64);
      const gasketMesh = new THREE.Mesh(gasketGeo, fabricMat);
      gasketMesh.position.set(0, 0, -0.45);
      group.add(gasketMesh);

      // Precision Aluminum Frame Accent Ring
      const frameGeo = new THREE.TorusGeometry(1.22, 0.05, 16, 64);
      const frameMesh = new THREE.Mesh(frameGeo, chromeMat);
      frameMesh.position.set(0, 0, -0.15);
      group.add(frameMesh);

      // Gold Metallic Dial Adjuster Knob
      const dialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 32);
      const dialMesh = new THREE.Mesh(dialGeo, goldMat);
      dialMesh.rotation.z = Math.PI / 2;
      dialMesh.position.set(1.42, 0.25, -0.2);
      group.add(dialMesh);

      // Spatial Audio Elastic Headband Strap
      const bandGeo = new THREE.TorusGeometry(1.3, 0.12, 16, 64, Math.PI);
      const bandMesh = new THREE.Mesh(bandGeo, primaryMat);
      bandMesh.rotation.x = Math.PI / 2;
      bandMesh.position.set(0, 0, -0.5);
      group.add(bandMesh);
    }

    // Centering: Calculate Bounding Box and offset group so origin is dead center
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    group.position.sub(center);

    // Adjust Grid Floor and Shadow Plane to sit right under the model
    if (this.gridHelper) {
      this.gridHelper.position.y = -(size.y / 2) - 0.2;
    }
    if (this.contactShadow) {
      this.contactShadow.position.y = -(size.y / 2) - 0.19;
    }

    // Outer wrapper for smooth rotation around origin (0, 0, 0)
    const wrapper = new THREE.Group();
    wrapper.add(group);

    this.currentMesh = wrapper;
    this.scene.add(this.currentMesh);
  }

  toggleRotation() {
    this.isRotating = !this.isRotating;
    return this.isRotating;
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    if (this.currentMesh) {
      this.currentMesh.traverse((child) => {
        if (child.isMesh) child.material.wireframe = this.isWireframe;
      });
    }
    return this.isWireframe;
  }

  setMaterialColor(hexColor) {
    this.currentColor = hexColor;
    if (this.currentMesh) {
      this.currentMesh.traverse((child) => {
        if (child.isMesh) child.material.color.set(hexColor);
      });
    }
  }

  initMouseDrag() {
    let isDragging = false;
    let previousPos = { x: 0, y: 0 };

    const startDrag = (x, y) => {
      isDragging = true;
      previousPos = { x, y };
    };

    const moveDrag = (x, y) => {
      if (!isDragging || !this.currentMesh) return;
      const deltaX = x - previousPos.x;
      const deltaY = y - previousPos.y;

      this.currentMesh.rotation.y += deltaX * 0.01;
      this.currentMesh.rotation.x += deltaY * 0.01;

      previousPos = { x, y };
    };

    const stopDrag = () => { isDragging = false; };

    // Mouse Events
    this.canvas.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', stopDrag);

    // Touch Events for Mobile Centered Control
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', stopDrag);
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.canvas?.parentElement) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.camera.lookAt(0, 0, 0);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.currentMesh && this.isRotating) {
      this.currentMesh.rotation.y += 0.008;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  initFallback2DCanvas() {
    const ctx = this.canvas.getContext('2d');
    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#3A0C1A';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.save();
      ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      ctx.rotate(angle);
      
      // Draw 3D wireframe box placeholder
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -50, 160, 100);
      
      ctx.restore();

      angle += 0.01;
      requestAnimationFrame(draw);
    };
    draw();
  }

  openARModal() {
    let modal = document.getElementById('webar-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'webar-modal';
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
        <div class="modal-box glass-card" style="max-width: 440px; text-align: center; padding: 2.2rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">📱</div>
          <h3 style="font-size: 1.4rem; color: #FFF; margin-bottom: 0.5rem;">Scan to View in Your Space</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Scan this QR code with your iOS (QuickLook USDZ) or Android (SceneViewer GLTF) device camera to place this 3D model in Augmented Reality.</p>
          
          <div style="background: #FFF; padding: 1.2rem; border-radius: 16px; display: inline-block; margin-bottom: 1.5rem; box-shadow: 0 0 25px rgba(255, 42, 95, 0.4);">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://josh-stream-web.vercel.app/%23webar" alt="WebAR QR Code" style="width: 180px; height: 180px; display: block;">
          </div>

          <div style="display: flex; gap: 0.8rem;">
            <button class="btn btn-primary" style="flex: 1;" onclick="document.getElementById('webar-modal').remove()">Done</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.classList.add('active');
    }
  }
}

// Global reference for page controls
window.Product3DViewer = Product3DViewer;
