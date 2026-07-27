/* JoshStream Web - Video to 3D Conversion Simulator Engine */

class VideoTo3DSimulator {
  constructor() {
    this.dropzone = document.getElementById('sim-dropzone');
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

    this.chipButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const videoType = e.target.getAttribute('data-sample');
        this.selectSampleVideo(btn, videoType);
      });
    });

    this.dropzone.addEventListener('click', () => {
      if (!this.isProcessing) this.runConversionSimulation('Custom Product Video');
    });

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.style.borderColor = '#00F0FF';
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.style.borderColor = 'rgba(139, 92, 246, 0.4)';
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.runConversionSimulation(files[0].name);
      }
    });
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

    // Reset pipeline UI
    this.progressBar.style.width = '0%';
    this.pipeSteps.forEach(step => {
      step.classList.remove('active', 'done');
      step.querySelector('.pipe-icon').textContent = '•';
    });

    this.pipeSteps[0].classList.add('active');
    this.pipeSteps[0].querySelector('.pipe-icon').textContent = '➔';
    this.progressText.textContent = `Processing "${sourceName}" through JoshStream Spatial AI...`;

    const interval = setInterval(() => {
      progress += 2;
      this.progressBar.style.width = `${progress}%`;

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
        this.progressText.textContent = `✨ 3D Model Generated Successfully! Ready for AR & Web Embed.`;
        
        // Trigger toast notification
        if (window.showToast) {
          window.showToast(`3D GLTF Model generated in 3.2 seconds!`);
        }

        // If 3D Viewer exists, update product model
        if (window.heroViewer) {
          const productMap = {
            'Sneaker': 'sneaker',
            'Lounge Chair': 'chair',
            'Smartwatch': 'watch',
            'Spatial Headset': 'headset'
          };
          const productKey = Object.keys(productMap).find(k => sourceName.includes(k)) || 'sneaker';
          window.heroViewer.loadProductModel(productMap[productKey]);
        }
      }
    }, 50);
  }

  setStepActive(index) {
    if (this.pipeSteps[index]) {
      this.pipeSteps[index].classList.add('active');
      this.pipeSteps[index].querySelector('.pipe-icon').textContent = '➔';
    }
  }

  setStepDone(index) {
    if (this.pipeSteps[index]) {
      this.pipeSteps[index].classList.remove('active');
      this.pipeSteps[index].classList.add('done');
      this.pipeSteps[index].querySelector('.pipe-icon').textContent = '✓';
    }
  }
}

window.VideoTo3DSimulator = VideoTo3DSimulator;
