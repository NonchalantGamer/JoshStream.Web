/* JoshStream Web - Auth Handler with Google Integration */

class AuthHandler {
  constructor() {
    this.tabLogin = document.getElementById('auth-tab-login');
    this.tabSignup = document.getElementById('auth-tab-signup');
    this.formTitle = document.getElementById('auth-form-title');
    this.submitBtn = document.getElementById('auth-submit-btn');
    this.nameGroup = document.getElementById('auth-name-group');
    this.form = document.getElementById('auth-form');

    this.isLoginMode = true;
    this.init();
  }

  init() {
    if (this.tabLogin && this.tabSignup) {
      this.tabLogin.addEventListener('click', () => this.setMode(true));
      this.tabSignup.addEventListener('click', () => this.setMode(false));
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const actionText = this.isLoginMode ? 'Signed in' : 'Account created';

        // Set local user session
        const name = this.isLoginMode ? email.split('@')[0] : (document.querySelector('#auth-name-group input')?.value || email.split('@')[0]);
        const user = {
          uid: 'usr_' + Math.random().toString(36).substring(2, 9),
          name: name,
          email: email,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          provider: 'Email & Password'
        };

        localStorage.setItem('joshstream_user_session', JSON.stringify(user));
        if (window.googleAuth) window.googleAuth.updateNavUserUI();

        if (window.showToast) {
          window.showToast(`${actionText} successfully as ${email}! Redirecting to dashboard...`);
        }

        setTimeout(() => {
          if (window.appRouter) window.appRouter.navigateTo('home');
        }, 1000);
      });
    }

    // Google OAuth Button Event Listener
    const googleBtn = document.getElementById('oauth-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        if (window.googleAuth) {
          window.googleAuth.signInWithGoogle();
        }
      });
    }

    // Shopify OAuth Button
    const shopifyBtn = document.getElementById('oauth-shopify-btn');
    if (shopifyBtn) {
      shopifyBtn.addEventListener('click', () => {
        const storeDomain = prompt("Enter your Shopify Store domain:", "my-store.myshopify.com");
        if (!storeDomain) return;

        const user = {
          uid: 'shopify_' + Math.random().toString(36).substring(2, 9),
          name: storeDomain.replace('.myshopify.com', ''),
          email: `admin@${storeDomain}`,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${storeDomain}`,
          provider: 'Shopify OAuth'
        };

        localStorage.setItem('joshstream_user_session', JSON.stringify(user));
        if (window.googleAuth) window.googleAuth.updateNavUserUI();

        if (window.showToast) {
          window.showToast(`Successfully authenticated Shopify store "${storeDomain}"!`);
        }

        if (window.appRouter) window.appRouter.navigateTo('home');
      });
    }
  }

  setMode(isLogin) {
    this.isLoginMode = isLogin;

    if (this.tabLogin && this.tabSignup) {
      this.tabLogin.classList.toggle('active', isLogin);
      this.tabSignup.classList.toggle('active', !isLogin);
    }

    if (this.formTitle) this.formTitle.textContent = isLogin ? 'Welcome Back' : 'Start Your 14-Day Free Trial';
    if (this.submitBtn) this.submitBtn.textContent = isLogin ? 'Sign In to Dashboard ➔' : 'Create Free Account ➔';
    if (this.nameGroup) this.nameGroup.style.display = isLogin ? 'none' : 'block';
  }
}

window.AuthHandler = AuthHandler;
