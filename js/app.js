/* VoxelFlow AI - Main Client Application Router & Controller */

class AppRouter {
  constructor() {
    this.navLinks = document.querySelectorAll('.nav-link, [data-navigate]');
    this.views = document.querySelectorAll('.view-container');
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    this.mobileNav = document.getElementById('mobile-nav');

    this.currentView = 'home';
    this.init();
  }

  init() {
    // Handle Navigation Clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetView = link.getAttribute('data-navigate');
        if (targetView) {
          e.preventDefault();
          this.navigateTo(targetView);
        }
      });
    });

    // Handle Navbar Scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    });

    // Handle Mobile Menu Toggle
    if (this.mobileMenuBtn && this.mobileNav) {
      this.mobileMenuBtn.addEventListener('click', () => {
        this.mobileNav.classList.toggle('active');
      });
    }

    // Hash change router (for deep links like #pricing, #features)
    window.addEventListener('hashchange', () => this.handleHashRoute());
    this.handleHashRoute();

    // Instantiate Sub-systems
    this.initSubsystems();
  }

  handleHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      this.navigateTo(hash);
    }
  }

  navigateTo(viewId) {
    this.currentView = viewId;
    window.location.hash = viewId;

    // Toggle active view container
    this.views.forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const targetAttr = link.getAttribute('data-navigate');
      link.classList.toggle('active', targetAttr === viewId);
    });

    // Trigger re-layouts if needed
    if (viewId === 'home' && window.heroViewer) {
      setTimeout(() => window.heroViewer.onResize(), 100);
    }
  }

  initSubsystems() {
    // 3D Canvas
    setTimeout(() => {
      if (document.getElementById('hero-3d-canvas')) {
        window.heroViewer = new window.Product3DViewer('hero-3d-canvas');
      }

      window.googleAuth = new window.GoogleAuthService();
      window.simMgr = new window.VideoTo3DSimulator();
      window.priceCalc = new window.PricingCalculator();
      window.useCasesMgr = new window.UseCasesManager();
      window.blogMgr = new window.BlogManager();
      window.contactHandler = new window.ContactFormHandler();
      window.authHandler = new window.AuthHandler();

      // Initialize default use case view
      const firstTab = document.querySelector('.usecase-tab');
      if (firstTab && window.useCasesMgr) {
        firstTab.click();
      }
    }, 100);
  }
}

// Global Toast System
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
});
