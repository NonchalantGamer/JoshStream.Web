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
    this.currentColor = '#8B5CF6';
    this.currentProduct = 'sneaker';

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
    this.camera.position.set(0, 2, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight1.position.set(5, 5, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 1.0);
    dirLight2.position.set(-5, -2, -5);
    this.scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(10, 20, 0x00f0ff, 0x241e52);
    gridHelper.position.y = -1.2;
    this.scene.add(gridHelper);

    // Load initial 3D Mesh
    this.loadProductModel(this.currentProduct);

    // Handle Window Resize
    window.addEventListener('resize', () => this.onResize());

    // Mouse Drag Controls
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

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentColor),
      roughness: 0.2,
      metalness: 0.8,
      wireframe: this.isWireframe
    });

    if (productType === 'sneaker') {
      // Procedural 3D Sneaker Mesh geometry representation
      const soleGeo = new THREE.BoxGeometry(2.4, 0.4, 1.0);
      const soleMesh = new THREE.Mesh(soleGeo, material);
      soleMesh.position.y = -0.8;
      group.add(soleMesh);

      const upperGeo = new THREE.CylinderGeometry(0.5, 0.9, 1.2, 16);
      const upperMesh = new THREE.Mesh(upperGeo, material);
      upperMesh.rotation.z = Math.PI / 6;
      upperMesh.position.set(-0.2, -0.1, 0);
      group.add(upperMesh);

      const toeGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const toeMesh = new THREE.Mesh(toeGeo, material);
      toeMesh.position.set(0.7, -0.6, 0);
      group.add(toeMesh);
    } else if (productType === 'chair') {
      // Procedural Lounge Chair Geometry
      const seatGeo = new THREE.BoxGeometry(1.6, 0.2, 1.6);
      const seatMesh = new THREE.Mesh(seatGeo, material);
      seatMesh.position.y = -0.3;
      group.add(seatMesh);

      const backGeo = new THREE.BoxGeometry(1.6, 1.4, 0.2);
      const backMesh = new THREE.Mesh(backGeo, material);
      backMesh.position.set(0, 0.4, -0.7);
      backMesh.rotation.x = -0.1;
      group.add(backMesh);
    } else if (productType === 'watch') {
      // Luxury Smartwatch Geometry
      const bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32);
      const bodyMesh = new THREE.Mesh(bodyGeo, material);
      group.add(bodyMesh);

      const strapGeo = new THREE.BoxGeometry(0.6, 0.05, 3.2);
      const strapMesh = new THREE.Mesh(strapGeo, material);
      strapMesh.position.y = -0.1;
      group.add(strapMesh);
    } else if (productType === 'headset') {
      // Spatial Vision Headset
      const visorGeo = new THREE.SphereGeometry(0.9, 32, 16);
      visorGeo.scale(1.4, 0.7, 0.8);
      const visorMesh = new THREE.Mesh(visorGeo, material);
      group.add(visorMesh);
    }

    this.currentMesh = group;
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
    let previousMousePosition = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.currentMesh) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      this.currentMesh.rotation.y += deltaX * 0.01;
      this.currentMesh.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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
      ctx.fillStyle = '#17113A';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.save();
      ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      ctx.rotate(angle);
      
      // Draw 3D wireframe box placeholder
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -50, 160, 100);
      
      ctx.strokeStyle = '#8B5CF6';
      ctx.strokeRect(-50, -80, 100, 160);

      ctx.restore();

      angle += 0.01;
      requestAnimationFrame(draw);
    };
    draw();
  }
}

// Global reference for page controls
window.Product3DViewer = Product3DViewer;
