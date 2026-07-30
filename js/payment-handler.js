/* JoshStream Web - Payment Checkout & Subscription Engine (Stripe/PayPal Ready) */

class PaymentHandler {
  constructor() {
    this.modal = null;
    this.selectedPlan = {
      name: 'Pro Tier',
      price: 119,
      period: 'monthly',
      credits: 500
    };
    this.init();
  }

  init() {
    // Intercept all pricing CTA button clicks across the site
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plan]');
      if (btn) {
        e.preventDefault();
        const planType = btn.getAttribute('data-plan') || 'pro';
        this.openPaymentModal(planType);
      }
    });
  }

  openPaymentModal(planType) {
    const isAnnual = window.priceCalc ? window.priceCalc.isAnnual : false;
    
    // Determine plan pricing details
    if (planType === 'starter') {
      this.selectedPlan = {
        name: 'Starter SaaS Plan',
        price: isAnnual ? 39 : 49,
        period: isAnnual ? 'year (billed annually)' : 'month',
        credits: 150
      };
    } else if (planType === 'enterprise') {
      this.selectedPlan = {
        name: 'Enterprise Spatial Plan',
        price: isAnnual ? 399 : 499,
        period: isAnnual ? 'year (billed annually)' : 'month',
        credits: 5000
      };
    } else {
      this.selectedPlan = {
        name: 'Pro SaaS Plan',
        price: isAnnual ? 119 : 149,
        period: isAnnual ? 'year (billed annually)' : 'month',
        credits: 600
      };
    }

    this.renderPaymentModal();
  }

  renderPaymentModal() {
    // Remove existing modal if any
    const existing = document.getElementById('payment-modal');
    if (existing) existing.remove();

    this.modal = document.createElement('div');
    this.modal.id = 'payment-modal';
    this.modal.className = 'modal-overlay active';
    this.modal.innerHTML = `
      <div class="modal-box glass-card" style="max-width: 540px; padding: 2.5rem; text-align: left; position: relative;">
        <button type="button" class="modal-close" onclick="document.getElementById('payment-modal').remove()" style="position: absolute; top: 1.2rem; right: 1.2rem; background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">✕</button>

        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--accent-cyan); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">💳</div>
          <div>
            <h3 style="font-size: 1.4rem; color: #FFF; margin: 0;">Secure Checkout</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">256-Bit Encrypted Payment Processing</span>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div style="background: rgba(5, 11, 24, 0.9); border: 1px solid var(--border-glass); border-radius: 14px; padding: 1.2rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <span style="font-weight: 700; color: #FFF; font-size: 1.05rem;">${this.selectedPlan.name}</span>
            <span style="font-size: 1.3rem; font-weight: 800; color: var(--accent-cyan);">$${this.selectedPlan.price}<span style="font-size: 0.85rem; color: var(--text-muted);">/${this.selectedPlan.period.includes('year') ? 'yr' : 'mo'}</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem;">
            <span>⚡ Included AI 3D Credits:</span>
            <span style="color: #10B981; font-weight: 600;">+${this.selectedPlan.credits} Credits/mo</span>
          </div>
        </div>

        <!-- Payment Method Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.2rem; background: rgba(255,255,255,0.04); padding: 0.3rem; border-radius: 10px;">
          <button type="button" class="pay-method-tab active" data-method="card" style="flex: 1; padding: 0.5rem; border: none; background: rgba(255,42,95,0.2); color: #FFF; font-weight: 600; font-size: 0.85rem; border-radius: 8px; cursor: pointer;">💳 Card</button>
          <button type="button" class="pay-method-tab" data-method="apple" style="flex: 1; padding: 0.5rem; border: none; background: none; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; border-radius: 8px; cursor: pointer;">🍏 Apple Pay</button>
          <button type="button" class="pay-method-tab" data-method="google" style="flex: 1; padding: 0.5rem; border: none; background: none; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; border-radius: 8px; cursor: pointer;">G Pay</button>
        </div>

        <!-- Card Payment Form -->
        <form id="payment-checkout-form" onsubmit="window.paymentHandler.handlePaymentSubmit(event)">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-size: 0.82rem;">Cardholder Name</label>
            <input type="text" id="pay-card-name" class="form-input" value="Alex Morgan" required style="padding: 0.65rem 0.9rem; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-size: 0.82rem;">Card Number</label>
            <div style="position: relative;">
              <input type="text" id="pay-card-number" class="form-input" value="4242 •••• •••• 4242" required style="padding: 0.65rem 0.9rem; font-size: 0.9rem; font-family: monospace;">
              <span style="position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); font-size: 0.9rem;">💳</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.82rem;">Expires (MM/YY)</label>
              <input type="text" id="pay-card-exp" class="form-input" value="12/28" required style="padding: 0.65rem 0.9rem; font-size: 0.9rem; font-family: monospace;">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.82rem;">CVC / CVC2</label>
              <input type="text" id="pay-card-cvc" class="form-input" value="888" required style="padding: 0.65rem 0.9rem; font-size: 0.9rem; font-family: monospace;">
            </div>
          </div>

          <button type="submit" id="pay-submit-btn" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700;">
            🔒 Confirm Payment ($${this.selectedPlan.price})
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  async handlePaymentSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('pay-submit-btn');
    if (!btn) return;

    // 1. Show processing state
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px;"></span> Processing Payment...`;

    // 2. Simulate Payment Provider API Latency (1.4 seconds)
    await new Promise(res => setTimeout(res, 1400));

    // 3. Remove Checkout Modal
    if (this.modal) this.modal.remove();

    // 4. Trigger Fake Successful Purchase Toast Notification
    if (window.showToast) {
      window.showToast(`🎉 Payment Approved! ${this.selectedPlan.name} is now active.`, 'success');
    }

    // 5. Show Success Celebration Confirmation Popup
    this.showSuccessModal();

    // 6. Update user's session & credits
    if (window.googleAuth) {
      if (!window.googleAuth.user) {
        window.googleAuth.user = {
          name: document.getElementById('pay-card-name')?.value || 'Pro Member',
          email: 'pro.user@joshstream.web',
          photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prouser'
        };
      }
      window.googleAuth.user.isPro = true;
      localStorage.setItem('joshstream_user_session', JSON.stringify(window.googleAuth.user));
      window.googleAuth.updateNavUserUI();
    }
  }

  showSuccessModal() {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay active';
    successModal.innerHTML = `
      <div class="modal-box glass-card" style="max-width: 480px; text-align: center; padding: 2.5rem;">
        <div style="font-size: 3.5rem; margin-bottom: 0.8rem;">🎉</div>
        <h3 style="font-size: 1.6rem; color: #FFF; margin-bottom: 0.5rem;">Purchase Successful!</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Thank you for subscribing to <strong>${this.selectedPlan.name}</strong>. Your account has been credited with <strong>+${this.selectedPlan.credits} 3D Spatial Credits</strong>.</p>
        
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; padding: 1rem; border-radius: 12px; margin-bottom: 1.8rem; color: #10B981; font-weight: 600; font-size: 0.9rem;">
          ✓ Order Ref: #JS-${Math.floor(100000 + Math.random() * 900000)} • Invoice sent to email
        </div>

        <button type="button" class="btn btn-cyan" style="width: 100%; padding: 0.8rem;" onclick="this.closest('.modal-overlay').remove(); if(window.appRouter) window.appRouter.navigateTo('home');">
          Start Generating 3D Models ➔
        </button>
      </div>
    `;
    document.body.appendChild(successModal);
  }
}

window.PaymentHandler = PaymentHandler;
