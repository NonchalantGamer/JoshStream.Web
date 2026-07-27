/* VoxelFlow AI - Interactive Pricing & Credit Calculator Engine */

class PricingCalculator {
  constructor() {
    this.toggleSwitch = document.getElementById('pricing-toggle');
    this.pricingCards = document.querySelectorAll('.pricing-card');
    this.videoSlider = document.getElementById('calc-video-slider');
    this.arSlider = document.getElementById('calc-ar-slider');
    this.videoValDisplay = document.getElementById('calc-video-val');
    this.arValDisplay = document.getElementById('calc-ar-val');
    this.recommendedTierDisplay = document.getElementById('calc-recommended-tier');
    this.estimatedPriceDisplay = document.getElementById('calc-est-price');

    this.isAnnual = false;
    this.initEvents();
  }

  initEvents() {
    if (this.toggleSwitch) {
      this.toggleSwitch.addEventListener('click', () => {
        this.isAnnual = !this.isAnnual;
        this.toggleSwitch.classList.toggle('annual', this.isAnnual);
        this.updateCardPrices();
        this.calculateCustomEstimate();
      });
    }

    if (this.videoSlider) {
      this.videoSlider.addEventListener('input', () => this.onSliderChange());
    }

    if (this.arSlider) {
      this.arSlider.addEventListener('input', () => this.onSliderChange());
    }
  }

  updateCardPrices() {
    const starterPrice = document.getElementById('price-starter');
    const proPrice = document.getElementById('price-pro');

    if (starterPrice && proPrice) {
      if (this.isAnnual) {
        starterPrice.textContent = '$39'; // $49/mo billed annually
        proPrice.textContent = '$119'; // $149/mo billed annually
      } else {
        starterPrice.textContent = '$49';
        proPrice.textContent = '$149';
      }
    }
  }

  onSliderChange() {
    const videoCount = parseInt(this.videoSlider.value, 10);
    const arViews = parseInt(this.arSlider.value, 10);

    if (this.videoValDisplay) this.videoValDisplay.textContent = `${videoCount} videos/mo`;
    if (this.arValDisplay) this.arValDisplay.textContent = `${(arViews / 1000).toFixed(0)}k AR views/mo`;

    this.calculateCustomEstimate();
  }

  calculateCustomEstimate() {
    if (!this.videoSlider || !this.arSlider) return;

    const videoCount = parseInt(this.videoSlider.value, 10);
    const arViews = parseInt(this.arSlider.value, 10);

    let recommended = 'Starter Tier';
    let basePrice = 49;

    if (videoCount > 50 || arViews > 100000) {
      recommended = 'Enterprise Tier';
      basePrice = 499;
    } else if (videoCount > 15 || arViews > 25000) {
      recommended = 'Pro Tier (Recommended)';
      basePrice = 149;
    }

    if (this.isAnnual) {
      basePrice = Math.round(basePrice * 0.8);
    }

    if (this.recommendedTierDisplay) this.recommendedTierDisplay.textContent = recommended;
    if (this.estimatedPriceDisplay) this.estimatedPriceDisplay.textContent = `$${basePrice}/mo`;
  }
}

window.PricingCalculator = PricingCalculator;
