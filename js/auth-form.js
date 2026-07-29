/* JoshStream Web - Email / Password Auth Form (Supabase) */

class AuthHandler {
  constructor() {
    this.tabLogin  = document.getElementById('auth-tab-login');
    this.tabSignup = document.getElementById('auth-tab-signup');
    this.formTitle = document.getElementById('auth-form-title');
    this.submitBtn = document.getElementById('auth-submit-btn');
    this.nameGroup = document.getElementById('auth-name-group');
    this.form      = document.getElementById('auth-form');
    this.isLoginMode = true;
    this.init();
  }

  init() {
    // Tab toggles
    if (this.tabLogin && this.tabSignup) {
      this.tabLogin.addEventListener('click',  () => this.setMode(true));
      this.tabSignup.addEventListener('click', () => this.setMode(false));
    }

    // ── Email / Password form submit ────────────────────────────────────────
    if (this.form) {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email    = document.getElementById('auth-email')?.value?.trim();
        const password = document.querySelector('#auth-form input[type="password"]')?.value;
        const nameVal  = document.querySelector('#auth-name-group input')?.value?.trim();

        if (!email || !password) {
          if (window.showToast) window.showToast('Please enter your email and password.', 'error');
          return;
        }

        if (!window.supabaseClient) {
          if (window.showToast) window.showToast('Auth service not ready. Please refresh.', 'error');
          return;
        }

        // Disable button to prevent double-submit
        if (this.submitBtn) {
          this.submitBtn.disabled = true;
          this.submitBtn.textContent = 'Please wait…';
        }

        try {
          if (this.isLoginMode) {
            await this._signIn(email, password);
          } else {
            await this._signUp(email, password, nameVal);
          }
        } finally {
          if (this.submitBtn) {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.isLoginMode ? 'Sign In to Dashboard ➔' : 'Create Free Account ➔';
          }
        }
      });
    }

    // ── Google OAuth button ─────────────────────────────────────────────────
    const googleBtn = document.getElementById('oauth-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        if (window.googleAuth) window.googleAuth.signInWithGoogle();
      });
    }

    // ── Shopify OAuth button (kept as UX demo) ──────────────────────────────
    const shopifyBtn = document.getElementById('oauth-shopify-btn');
    if (shopifyBtn) {
      shopifyBtn.addEventListener('click', () => {
        const storeDomain = prompt('Enter your Shopify Store domain:', 'my-store.myshopify.com');
        if (!storeDomain) return;
        if (window.showToast) window.showToast(`Shopify OAuth for "${storeDomain}" coming soon!`);
      });
    }
  }

  // ── Supabase sign-in with email + password ────────────────────────────────
  async _signIn(email, password) {
    if (window.showToast) window.showToast('Signing in…');

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[Auth] signInWithPassword:', error);
      const msg = error.message?.includes('Invalid login')
        ? 'Incorrect email or password. Please try again.'
        : error.message || 'Sign-in failed.';
      if (window.showToast) window.showToast(msg, 'error');
      return;
    }

    // onAuthStateChange in auth-service.js will fire and handle everything
    // (set user, update nav, navigate to profile) — no extra work needed here.
    console.log('[Auth] signInWithPassword success:', data.user?.email);
  }

  // ── Supabase sign-up (creates account + auto signs in) ───────────────────
  async _signUp(email, password, displayName) {
    if (password.length < 6) {
      if (window.showToast) window.showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (window.showToast) window.showToast('Creating your account…');

    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName || email.split('@')[0] }
      }
    });

    if (error) {
      console.error('[Auth] signUp:', error);
      const msg = error.message?.includes('already registered')
        ? 'An account with this email already exists. Try signing in instead.'
        : error.message || 'Sign-up failed.';
      if (window.showToast) window.showToast(msg, 'error');
      return;
    }

    // Supabase may require email confirmation depending on project settings
    if (data.user && !data.session) {
      if (window.showToast) window.showToast('Account created! Check your email to confirm your address, then sign in. 📧');
    } else {
      // Auto-confirmed (email confirmation disabled in Supabase dashboard) — session is live
      console.log('[Auth] signUp + auto-confirmed:', data.user?.email);
      // onAuthStateChange fires automatically
    }
  }

  // ── Toggle login / signup mode ────────────────────────────────────────────
  setMode(isLogin) {
    this.isLoginMode = isLogin;

    if (this.tabLogin && this.tabSignup) {
      this.tabLogin.classList.toggle('active', isLogin);
      this.tabSignup.classList.toggle('active', !isLogin);
    }

    if (this.formTitle) {
      this.formTitle.textContent = isLogin ? 'Welcome Back' : 'Start Your 14-Day Free Trial';
    }
    if (this.submitBtn) {
      this.submitBtn.textContent = isLogin ? 'Sign In to Dashboard ➔' : 'Create Free Account ➔';
    }
    if (this.nameGroup) {
      this.nameGroup.style.display = isLogin ? 'none' : 'block';
    }
  }
}

window.AuthHandler = AuthHandler;
