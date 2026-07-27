/* JoshStream Web - Supabase Auth Service */

class GoogleAuthService {
  constructor() {
    this.user = null;
    this.supabase = null;
    this.init();
  }

  async init() {
    if (!window.supabaseClient) {
      console.warn('Supabase client not initialized. Check firebase-config.js.');
      return;
    }

    this.supabase = window.supabaseClient;

    // Listen for auth state changes (handles redirect-back after Google login)
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this._setUser(session.user);

        // Sync profile to database
        await this._syncProfile(session.user);

        if (event === 'SIGNED_IN') {
          if (window.showToast) window.showToast(`Welcome, ${this.user.name}! 🎉`);
          // Navigate home after redirect sign-in
          setTimeout(() => {
            if (window.appRouter) window.appRouter.navigateTo('home');
          }, 300);
        }
      } else if (event === 'SIGNED_OUT') {
        this.user = null;
        localStorage.removeItem('joshstream_user_session');
        this.updateNavUserUI();
      }
    });

    // Restore existing session on page load
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this._setUser(session.user);
    } else {
      // Fallback: restore from localStorage (e.g. before Supabase resolves)
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
             `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.email}`,
      provider: 'Supabase Google OAuth'
    };
    localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
    this.updateNavUserUI();
  }

  async signInWithGoogle() {
    if (!this.supabase) {
      if (window.showToast) window.showToast('Supabase not configured.', 'error');
      return;
    }

    if (window.showToast) window.showToast('Redirecting to Google sign-in...');

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://josh-stream-web.vercel.app/',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Google Sign-In Error:', error);
      if (window.showToast) window.showToast(`Sign-in error: ${error.message}`, 'error');
    }
  }

  async _syncProfile(sbUser) {
    if (!this.supabase) return;
    try {
      await this.supabase.from('profiles').upsert({
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
        email: sbUser.email,
        avatar_url: sbUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Profile sync note:', err.message);
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
    if (!navActions) return;

    if (this.user) {
      navActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255, 255, 255, 0.05); padding: 0.3rem 0.8rem 0.3rem 0.4rem; border-radius: var(--radius-full); border: 1px solid var(--border-purple-glow);">
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
