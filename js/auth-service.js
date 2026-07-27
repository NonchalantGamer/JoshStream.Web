/* JoshStream Web - Supabase Auth Service */

class GoogleAuthService {
  constructor() {
    this.user = null;
    this.supabase = null;
    this._ready = this.init();
  }

  async init() {
    if (!window.supabaseClient) {
      console.warn('[JoshStream] Supabase client not initialized.');
      return;
    }

    this.supabase = window.supabaseClient;

    // Handle PKCE code exchange on redirect-back from Google
    // Supabase v2 returns ?code= in the URL after OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?').slice(1));

    if (urlParams.get('code')) {
      console.log('[JoshStream] Exchanging auth code for session...');
      try {
        const { data, error } = await this.supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) console.error('[JoshStream] Code exchange error:', error.message);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.warn('[JoshStream] Code exchange exception:', e);
      }
    }

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[JoshStream] Auth event:', event, session?.user?.email);

      if (session?.user) {
        this._setUser(session.user);
        await this._syncProfile(session.user);

        if (event === 'SIGNED_IN') {
          if (window.showToast) window.showToast(`Welcome, ${this.user.name}! 🎉`);
          setTimeout(() => {
            if (window.appRouter) window.appRouter.navigateTo('home');
          }, 400);
        }
      } else if (event === 'SIGNED_OUT') {
        this.user = null;
        localStorage.removeItem('joshstream_user_session');
        this.updateNavUserUI();
      }
    });

    // Check for active session on page load
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) console.error('[JoshStream] getSession error:', error.message);

    if (session?.user) {
      console.log('[JoshStream] Existing session found:', session.user.email);
      this._setUser(session.user);
    } else {
      // Fallback: restore from localStorage while Supabase resolves
      const saved = localStorage.getItem('joshstream_user_session');
      if (saved) {
        try {
          this.user = JSON.parse(saved);
          this.updateNavUserUI();
        } catch {
          localStorage.removeItem('joshstream_user_session');
        }
      }
    }
  }

  _setUser(sbUser) {
    this.user = {
      uid: sbUser.id,
      name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
      email: sbUser.email,
      photo: sbUser.user_metadata?.avatar_url ||
             `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sbUser.email)}`,
      provider: 'Supabase Google OAuth'
    };
    localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
    this.updateNavUserUI();
  }

  async signInWithGoogle() {
    if (!this.supabase) {
      if (window.showToast) window.showToast('Backend not configured.', 'error');
      return;
    }

    if (window.showToast) window.showToast('Redirecting to Google sign-in...');

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('[JoshStream] Google Sign-In Error:', error);
      if (window.showToast) window.showToast(`Sign-in error: ${error.message}`, 'error');
    }
  }

  async _syncProfile(sbUser) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase.from('profiles').upsert({
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
        email: sbUser.email,
        avatar_url: sbUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) console.warn('[JoshStream] Profile sync error:', error.message);
    } catch (err) {
      console.warn('[JoshStream] Profile sync exception:', err.message);
    }
  }

  async signOut() {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.user = null;
    localStorage.removeItem('joshstream_user_session');
    this.updateNavUserUI();
    if (window.showToast) window.showToast('Signed out successfully.');
  }

  updateNavUserUI() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) {
      // DOM might not be ready yet — retry once
      setTimeout(() => this.updateNavUserUI(), 300);
      return;
    }

    if (this.user) {
      navActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.3rem 0.8rem 0.3rem 0.4rem; border-radius: var(--radius-full); border: 1px solid var(--border-purple-glow);">
          <img src="${this.user.photo}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary);">
          <span style="font-weight: 600; font-size: 0.9rem; color: #FFF;">${this.user.name}</span>
          <button class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;" onclick="window.googleAuth.signOut()">Sign Out</button>
        </div>
      `;
    } else {
      navActions.innerHTML = `
        <button class="btn btn-secondary" data-navigate="auth">Sign In</button>
        <button class="btn btn-cyan" data-navigate="auth">Start Free Trial ➔</button>
      `;
      document.querySelectorAll('[data-navigate]').forEach(link => {
        link.addEventListener('click', (e) => {
          const targetView = link.getAttribute('data-navigate');
          if (targetView && window.appRouter) {
            e.preventDefault();
            window.appRouter.navigateTo(targetView);
          }
        });
      });
    }
  }
}

window.GoogleAuthService = GoogleAuthService;
