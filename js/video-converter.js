/* JoshStream Web - Video to 3D Conversion Engine & Upload Pipeline */

class VideoTo3DSimulator {
  constructor() {
    this.dropzone = document.getElementById('sim-dropzone');
    this.fileInput = document.getElementById('sim-file-input');
    this.progressBar = document.getElementById('sim-progress-fill');
    this.progressText = document.getElementById('sim-progress-text');
    this.chipButtons = document.querySelectorAll('.chip-btn');
    this.pipeSteps = document.querySelectorAll('.pipe-step');
    this.resultContainer = document.getElementById('sim-result-box');
    this.isProcessing = false;

    this.initEvents();
  }

  initEvents() {
    if (!this.dropzone) return;

    // Sample video chips
    this.chipButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const videoType = e.target.getAttribute('data-sample');
        this.selectSampleVideo(btn, videoType);
      });
    });

    // Dropzone click triggers hidden file input
    this.dropzone.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      if (!this.isProcessing && this.fileInput) {
        this.fileInput.click();
      }
    });

    // File input change handler
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleVideoFile(file);
      });
    }

    // Drag and drop handlers
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.style.borderColor = 'var(--accent-cyan)';
      this.dropzone.style.background = 'rgba(0, 240, 255, 0.08)';
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.style.borderColor = 'rgba(255, 42, 95, 0.4)';
      this.dropzone.style.background = '';
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.style.borderColor = 'rgba(255, 42, 95, 0.4)';
      this.dropzone.style.background = '';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleVideoFile(files[0]);
      }
    });
  }

  handleVideoFile(file) {
    // 1. Format validation (.mp4, .mov, .webm)
    const validFormats = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isValidFormat = validFormats.includes(file.type) || ['mp4', 'mov', 'webm'].includes(ext);

    if (!isValidFormat) {
      if (window.showToast) window.showToast('Invalid file format. Please upload an .mp4, .mov, or .webm video.', 'error');
      return;
    }

    // 2. File size validation (Max 500MB)
    const maxSizeBytes = 500 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      if (window.showToast) window.showToast('File exceeds 500MB limit. Please compress your video before uploading.', 'error');
      return;
    }

    this.runConversionSimulation(file.name);
  }

  selectSampleVideo(selectedBtn, videoType) {
    if (this.isProcessing) return;
    this.chipButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');

    this.runConversionSimulation(videoType);
  }

  runConversionSimulation(sourceName) {
    this.isProcessing = true;
    let progress = 0;

    // Reset pipeline UI steps
    if (this.progressBar) this.progressBar.style.width = '0%';
    this.pipeSteps.forEach(step => {
      step.classList.remove('active', 'done');
      const iconEl = step.querySelector('.pipe-icon');
      if (iconEl) iconEl.textContent = '•';
    });

    this.setStepActive(0);
    if (this.progressText) {
      this.progressText.textContent = `Processing "${sourceName}" through JoshStream Spatial AI 2.0...`;
    }

    const interval = setInterval(() => {
      progress += 2;
      if (this.progressBar) this.progressBar.style.width = `${progress}%`;

      if (progress === 25) {
        this.setStepDone(0);
        this.setStepActive(1);
      } else if (progress === 55) {
        this.setStepDone(1);
        this.setStepActive(2);
      } else if (progress === 85) {
        this.setStepDone(2);
        this.setStepActive(3);
      } else if (progress >= 100) {
        clearInterval(interval);
        this.setStepDone(3);
        this.isProcessing = false;

        if (this.progressText) {
          this.progressText.textContent = `✨ 3D Model Generated Successfully! Ready for AR & Web Embed.`;
        }
        
        // Trigger toast notification
        if (window.showToast) {
          window.showToast(`3D GLTF Model generated in 3.2 seconds!`, 'success');
        }

        // Map product model key
        const productMap = {
          'Sneaker': 'sneaker',
          'Lounge Chair': 'chair',
          'Smartwatch': 'watch',
          'Spatial Headset': 'headset'
        };
        const productKey = Object.keys(productMap).find(k => sourceName.toLowerCase().includes(k.toLowerCase())) || 'sneaker';
        const modelName = productMap[productKey];

        // Load into 3D viewer
        if (window.heroViewer) {
          window.heroViewer.loadProductModel(modelName);
        }

        // Register new asset into User Dashboard Asset Manager
        if (window.googleAuth) {
          window.googleAuth.registerNewAsset({
            title: sourceName.replace(/\.[^/.]+$/, "") || "Custom 3D Product",
            modelType: modelName,
            status: "Ready",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      }
    }, 45);
  }

  setStepActive(index) {
    if (this.pipeSteps[index]) {
      this.pipeSteps[index].classList.add('active');
      const iconEl = this.pipeSteps[index].querySelector('.pipe-icon');
      if (iconEl) iconEl.textContent = '➔';
    }
  }

  setStepDone(index) {
    if (this.pipeSteps[index]) {
      this.pipeSteps[index].classList.remove('active');
      this.pipeSteps[index].classList.add('done');
      const iconEl = this.pipeSteps[index].querySelector('.pipe-icon');
      if (iconEl) iconEl.textContent = '✓';
    }
  }
}

window.VideoTo3DSimulator = VideoTo3DSimulator;
