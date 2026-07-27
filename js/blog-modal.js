/* VoxelFlow AI - Blog Search, Filter & Reader Modal Engine */

const BLOG_ARTICLES = [
  {
    id: 1,
    category: "Conversion ROI",
    title: "How 3D Product Viewers Boost E-Commerce Conversion Rates by 94%",
    author: "Elena Rostova",
    date: "July 22, 2026",
    readTime: "5 min read",
    excerpt: "Discover the empirical conversion data behind 3D product visualization across 500+ top Shopify Plus stores.",
    content: `
      <h2>The Shift from Static Images to Interactive Spatial Commerce</h2>
      <p>Traditional e-commerce photography has hit a conversion plateau. Modern consumers are no longer satisfied with flat 2D images or passive 10-second video loops. They want to inspect product details from every conceivable angle, zoom into material grain, and test fit in their physical space.</p>

      <h3>Key Data Points from 2026 Retail Benchmark Report:</h3>
      <ul>
        <li><strong>+94% Add-to-Cart Conversion Lift</strong> when users interact with 3D product models.</li>
        <li><strong>2.8x Higher Buyer Engagement Time</strong> compared to standard video carousel players.</li>
        <li><strong>40% Drop in Returns</strong> due to accurate physical scale and material transparency.</li>
      </ul>

      <h3>Why Video-to-3D AI is a Game-Changer</h3>
      <p>Historically, creating custom 3D models required hiring expensive CAD designers, costing $300–$800 per SKU. With VoxelFlow’s neural reconstruction engine, merchants simply capture a 30-second video on an iPhone, and AI generates production-ready GLTF/USDZ models in minutes.</p>
    `
  },
  {
    id: 2,
    category: "Spatial AR",
    title: "The Future of AR Shopping: Preparing Your Store for Spatial Computing",
    author: "Dr. Marcus Vance",
    date: "July 18, 2026",
    readTime: "7 min read",
    excerpt: "How WebXR, VisionOS, and browser-native WebAR are removing friction from virtual try-ons.",
    content: `
      <h2>WebAR is No Longer an App-Required Luxury</h2>
      <p>With native WebXR support across iOS Safari QuickLook and Android SceneViewer, customers no longer need to download third-party mobile apps to view products in Augmented Reality.</p>

      <h3>3 Steps to Prepare Your E-Commerce Stack for 2026+</h3>
      <ol>
        <li><strong>Standardize on GLTF and USDZ formats:</strong> Universal compatibility ensures smooth rendering across Apple Vision Pro, Meta Quest, and mobile browsers.</li>
        <li><strong>Implement No-Code Web Components:</strong> Use standard <code>&lt;model-viewer&gt;</code> tags with automated fallback images.</li>
        <li><strong>Track Spatial Interaction Heatmaps:</strong> Monitor rotation events and AR placement attempts to discover high-intent buyers.</li>
      </ol>
    `
  },
  {
    id: 3,
    category: "E-Commerce Logistics",
    title: "Reducing Return Rates by 40% using Interactive 3D Fit & Scale",
    author: "Sarah Jenkins",
    date: "July 12, 2026",
    readTime: "4 min read",
    excerpt: "Learn how footwear and home decor brands saved millions in reverse logistics costs.",
    content: `
      <h2>The True Cost of E-Commerce Returns</h2>
      <p>Return rates in fashion and furniture frequently exceed 30%, costing retailers billions in shipping, restocking, and damaged inventory. Over 65% of returns stem from 'product didn't match expectation' or 'wrong size'.</p>

      <h3>The Interactive Solution</h3>
      <p>By offering 3D scale verification and true-to-life lighting reflections, buyers gain 100% confidence before pressing the checkout button.</p>
    `
  },
  {
    id: 4,
    category: "AI & NeRF Tech",
    title: "From Video to Photorealistic 3D: NeRF & Gaussian Splatting Explained",
    author: "Alexandre Dubois",
    date: "July 05, 2026",
    readTime: "8 min read",
    excerpt: "A deep dive into modern neural radiance fields and sub-millimeter 3D mesh reconstruction.",
    content: `
      <h2>Demystifying Neural Radiance Fields (NeRFs)</h2>
      <p>NeRF technology represents 3D scenes as continuous volumetric functions represented by neural networks. When combined with 3D Gaussian Splatting, processing speeds jump from hours to seconds while maintaining 4K photorealism.</p>
    `
  },
  {
    id: 5,
    category: "Integration Guides",
    title: "Shopify & WooCommerce 3D Integration Guide for 2026",
    author: "Devon Miller",
    date: "June 28, 2026",
    readTime: "6 min read",
    excerpt: "Step-by-step tutorial on embedding VoxelFlow 3D viewers into your store without touching code.",
    content: `
      <h2>1-Click App Store Integration</h2>
      <p>Integrating 3D models into Shopify liquid templates or WooCommerce themes takes less than 2 minutes with VoxelFlow’s automated sync plugin.</p>
    `
  }
];

class BlogManager {
  constructor() {
    this.grid = document.getElementById('blog-cards-grid');
    this.modal = document.getElementById('blog-modal');
    this.modalContent = document.getElementById('blog-modal-content');
    this.modalClose = document.getElementById('blog-modal-close');
    this.filterBtns = document.querySelectorAll('.blog-filter-btn');

    this.init();
  }

  init() {
    if (!this.grid) return;
    this.renderArticles(BLOG_ARTICLES);

    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.getAttribute('data-category');
        if (cat === 'all') {
          this.renderArticles(BLOG_ARTICLES);
        } else {
          const filtered = BLOG_ARTICLES.filter(a => a.category.toLowerCase().includes(cat.toLowerCase()));
          this.renderArticles(filtered);
        }
      });
    });

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
  }

  renderArticles(articles) {
    if (!this.grid) return;
    this.grid.innerHTML = articles.map(article => `
      <div class="blog-card glass-card">
        <div class="blog-img-box">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        </div>
        <div class="blog-content">
          <div class="blog-tag">${article.category}</div>
          <h4 class="blog-title">${article.title}</h4>
          <p class="blog-excerpt">${article.excerpt}</p>
          <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border-glass); font-size: 0.82rem; color: var(--text-muted);">
            <span>${article.author}</span>
            <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="window.blogMgr.openArticle(${article.id})">
              Read Article ➔
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  openArticle(id) {
    const article = BLOG_ARTICLES.find(a => a.id === id);
    if (!article || !this.modal || !this.modalContent) return;

    this.modalContent.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <span class="blog-tag">${article.category}</span>
        <h1 style="font-size: 2.2rem; margin: 0.5rem 0 1rem 0;">${article.title}</h1>
        <div style="display: flex; gap: 1.5rem; color: var(--text-muted); font-size: 0.88rem;">
          <span>✍️ ${article.author}</span>
          <span>📅 ${article.date}</span>
          <span>⏱️ ${article.readTime}</span>
        </div>
      </div>
      <hr style="border-color: var(--border-glass); margin-bottom: 2rem;">
      <div class="article-body" style="color: var(--text-main); line-height: 1.8; font-size: 1.05rem;">
        ${article.content}
      </div>
    `;

    this.modal.classList.add('active');
  }

  closeModal() {
    if (this.modal) this.modal.classList.remove('active');
  }
}

window.BlogManager = BlogManager;
