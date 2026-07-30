/* JoshStream Web - Interactive 3D Embed Builder & E-Commerce Integration Manager */

class EmbedBuilderManager {
  constructor() {
    this.modelSelect = document.getElementById('embed-model-select');
    this.themeSelect = document.getElementById('embed-theme-select');
    this.autoRotateCheck = document.getElementById('embed-autorotate-check');
    this.arToggleCheck = document.getElementById('embed-ar-check');
    this.widthInput = document.getElementById('embed-width-input');
    this.heightInput = document.getElementById('embed-height-input');
    this.codeSnippet = document.getElementById('embed-code-snippet');
    this.copyBtn = document.getElementById('copy-embed-code-btn');
    this.previewFrame = document.getElementById('embed-preview-container');

    this.initEvents();
    this.updateEmbedSnippet();
  }

  initEvents() {
    const controls = [
      this.modelSelect,
      this.themeSelect,
      this.autoRotateCheck,
      this.arToggleCheck,
      this.widthInput,
      this.heightInput
    ];

    controls.forEach(ctrl => {
      if (ctrl) {
        ctrl.addEventListener('change', () => this.updateEmbedSnippet());
        ctrl.addEventListener('input', () => this.updateEmbedSnippet());
      }
    });

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => this.copyCodeToClipboard());
    }

    // Platform Tab Switchers (Shopify / WooCommerce / Webflow)
    document.querySelectorAll('.platform-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const platform = e.target.getAttribute('data-platform');
        this.switchPlatformGuide(tab, platform);
      });
    });
  }

  updateEmbedSnippet() {
    if (!this.codeSnippet) return;

    const model = this.modelSelect ? this.modelSelect.value : 'sneaker-3d-v1';
    const theme = this.themeSelect ? this.themeSelect.value : 'dark';
    const autoRotate = this.autoRotateCheck ? this.autoRotateCheck.checked : true;
    const enableAR = this.arToggleCheck ? this.arToggleCheck.checked : true;
    const width = this.widthInput ? this.widthInput.value || '100%' : '100%';
    const height = this.heightInput ? this.heightInput.value || '500px' : '500px';

    const snippet = `<script type="module" src="https://josh-stream-web.vercel.app/cdn/joshstream-3d.js"></script>

<joshstream-viewer
  model-id="${model}"
  theme="${theme}"
  auto-rotate="${autoRotate}"
  enable-ar="${enableAR}"
  style="width: ${width}; height: ${height}; border-radius: 16px; overflow: hidden;"
></joshstream-viewer>`;

    this.codeSnippet.textContent = snippet;
  }

  copyCodeToClipboard() {
    if (!this.codeSnippet) return;

    const textToCopy = this.codeSnippet.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (this.copyBtn) {
        const originalText = this.copyBtn.innerHTML;
        this.copyBtn.innerHTML = `✓ Copied to Clipboard!`;
        this.copyBtn.style.background = '#10B981';
        this.copyBtn.style.color = '#FFF';

        setTimeout(() => {
          this.copyBtn.innerHTML = originalText;
          this.copyBtn.style.background = '';
          this.copyBtn.style.color = '';
        }, 2500);
      }

      if (window.showToast) {
        window.showToast('Embed code snippet copied to clipboard! 🚀', 'success');
      }
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }

  switchPlatformGuide(selectedTab, platform) {
    document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
    selectedTab.classList.add('active');

    document.querySelectorAll('.platform-guide-content').forEach(c => c.style.display = 'none');
    const activeGuide = document.getElementById(`guide-${platform}`);
    if (activeGuide) activeGuide.style.display = 'block';
  }
}

window.EmbedBuilderManager = EmbedBuilderManager;
