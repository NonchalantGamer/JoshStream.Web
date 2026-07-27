/* JoshStream Web - Use Cases Interactive Manager */

class UseCasesManager {
  constructor() {
    this.tabButtons = document.querySelectorAll('.usecase-tab');
    this.container = document.getElementById('usecase-detail-container');
    
    this.data = {
      fashion: {
        title: "Fashion & Footwear E-Commerce",
        tagline: "Let shoppers inspect stitching, sole texture, and 360° fit before buying.",
        problem: "Flat 2D images fail to convey garment fit, fabric drape, and footwear shape—resulting in a high 42% return rate.",
        solution: "JoshStream Web converts iPhone product videos into photorealistic 3D meshes with interactive WebAR fit projection.",
        metrics: ["+88% Add-to-Cart Rate", "-45% Fit Returns", "+3.2x Time on Page"],
        beforeLabel: "Standard 2D Video",
        afterLabel: "JoshStream 3D + AR"
      },
      furniture: {
        title: "Furniture & Home Decor",
        tagline: "Virtual room placement with true-to-scale AR measurement.",
        problem: "Shoppers struggle to visualize sofa dimensions and material texture in their living rooms.",
        solution: "Instant 3D spatial models allow buyers to drop virtual furniture directly into their room via iOS & Android AR.",
        metrics: ["+112% Conversion Rate", "-52% Delivery Rejections", "99.4% Scale Accuracy"],
        beforeLabel: "Static Studio Photo",
        afterLabel: "True-Scale WebAR"
      },
      electronics: {
        title: "Consumer Electronics & Tech",
        tagline: "Exploded 3D component views and port inspection.",
        problem: "Complex gadgets need interactive feature exploration so buyers understand port layouts and build quality.",
        solution: "Interactive 3D models with clickable hotspots and exploded view animations derived from single turntable videos.",
        metrics: ["+76% Checkout Rate", "4.8m Avg Interaction Time", "+140% Net Promoter Score"],
        beforeLabel: "Manual PDF Specs",
        afterLabel: "Interactive 3D Hotspots"
      },
      jewelry: {
        title: "Luxury & Fine Jewelry",
        tagline: "Micro-detail raytraced reflections for high-ticket items.",
        problem: "High-value jewelry sales require extreme detail in gemstone clarity, ring bands, and light refraction.",
        solution: "Sub-millimeter Gaussian Splatting AI reproduces diamond sparkle and metallic shine in real-time WebGL.",
        metrics: ["+130% High-Ticket Sales", "0.05mm Spatial Precision", "+210% International Orders"],
        beforeLabel: "Low-Res Photo",
        afterLabel: "4K Photorealistic 3D"
      }
    };

    this.initEvents();
  }

  initEvents() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetKey = btn.getAttribute('data-usecase');
        this.setActiveTab(btn, targetKey);
      });
    });
  }

  setActiveTab(selectedBtn, key) {
    this.tabButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');

    const item = this.data[key];
    if (!item || !this.container) return;

    this.container.innerHTML = `
      <div class="usecase-detail-card glass-card">
        <div>
          <span class="section-tag">${key.toUpperCase()} E-COMMERCE</span>
          <h3 class="section-title" style="font-size: 2rem; margin-top: 0.5rem;">${item.title}</h3>
          <p class="section-desc" style="margin-bottom: 1.5rem; font-size: 1.05rem;">${item.tagline}</p>
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="color: var(--accent-pink); font-size: 0.95rem; margin-bottom: 0.4rem;">⚠️ THE PROBLEM</h5>
            <p style="color: var(--text-muted); font-size: 0.92rem;">${item.problem}</p>
          </div>

          <div style="margin-bottom: 2rem;">
            <h5 style="color: var(--accent-cyan); font-size: 0.95rem; margin-bottom: 0.4rem;">⚡ THE JOSHSTREAM SOLUTION</h5>
            <p style="color: var(--text-muted); font-size: 0.92rem;">${item.solution}</p>
          </div>

          <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
            ${item.metrics.map(m => `
              <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid var(--border-glow); padding: 0.6rem 1rem; border-radius: var(--radius-md); font-weight: 700; color: var(--accent-cyan); font-size: 0.9rem;">
                ${m}
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="split-viewer">
            <div class="split-layer split-after">
              <div style="text-align: center; padding: 2rem;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--accent-cyan)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; box-shadow: 0 0 20px var(--accent-cyan);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <h4 style="color: #FFF; font-size: 1.3rem;">${item.afterLabel}</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem;">Interactive 360° Model + Instant AR Portal</p>
                <button class="btn btn-cyan" style="margin-top: 1.2rem; font-size: 0.82rem; padding: 0.5rem 1.2rem;" onclick="if(window.heroViewer) window.heroViewer.loadProductModel('${key === 'furniture' ? 'chair' : key === 'electronics' ? 'watch' : 'sneaker'}')">
                  Launch Interactive Preview ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

window.UseCasesManager = UseCasesManager;
