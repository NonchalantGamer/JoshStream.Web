/* JoshStream Web - Supabase Google Auth & Session Engine */

class GoogleAuthService {
  constructor() {
    this.user = null;
    this.supabase = null;
    this.init();
  }

  async init() {
    // 1. Restore local session cache immediately for fast render
    const savedSession = localStorage.getItem('joshstream_user_session');
    if (savedSession) {
      try {
        this.user = JSON.parse(savedSession);
        this.updateNavUserUI();
      } catch {
        localStorage.removeItem('joshstream_user_session');
      }
    }

    if (!window.supabaseClient) {
      console.warn('[JoshStream] Supabase client not found.');
      return;
    }

    this.supabase = window.supabaseClient;

    // 2. Attach Auth State Change listener FIRST before processing URL session
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[JoshStream] Supabase Auth Event:', event, session?.user?.email);

      if (session?.user) {
        this._setUser(session.user);
        await this._syncProfile(session.user);

        // Clean up OAuth tokens from URL location bar
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          if (window.showToast) window.showToast(`Signed in as ${this.user.name}! 🎉`);
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

    // 3. Explicitly verify current active session from Supabase
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) console.warn('[JoshStream] getSession warning:', error.message);
      if (session?.user) {
        this._setUser(session.user);
        this._syncProfile(session.user);
      }
    } catch (err) {
      console.warn('[JoshStream] Auth session check note:', err.message);
    }
  }

  _setUser(sbUser) {
    const displayName = sbUser.user_metadata?.full_name || 
                        sbUser.user_metadata?.name || 
                        (sbUser.email ? sbUser.email.split('@')[0] : 'User');
                        
    const avatar = sbUser.user_metadata?.avatar_url || 
                   sbUser.user_metadata?.picture || 
                   `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sbUser.email || 'user')}`;

    this.user = {
      uid: sbUser.id,
      name: displayName,
      email: sbUser.email || '',
      photo: avatar,
      provider: 'Google OAuth (Supabase)'
    };

    localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
    this.updateNavUserUI();
  }

  async signInWithGoogle() {
    if (!this.supabase) {
      if (window.showToast) window.showToast('Supabase backend not initialized.', 'error');
      return;
    }

    if (window.showToast) window.showToast('Redirecting to Google sign-in...');

    const redirectUrl = window.location.origin + window.location.pathname;

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
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
      const displayName = sbUser.user_metadata?.full_name || 
                          sbUser.user_metadata?.name || 
                          (sbUser.email ? sbUser.email.split('@')[0] : 'User');
      const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null;

      const { error } = await this.supabase.from('profiles').upsert({
        id: sbUser.id,
        name: displayName,
        email: sbUser.email,
        avatar_url: avatar,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) console.warn('[JoshStream] Profile sync note:', error.message);
    } catch (err) {
      console.warn('[JoshStream] Profile sync exception:', err.message);
    }
  }

  async signOut() {
    if (this.supabase) {
      try {
        await this.supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out note:', e);
      }
    }
    this.user = null;
    localStorage.removeItem('joshstream_user_session');
    this.updateNavUserUI();
    if (window.showToast) window.showToast('Signed out successfully.');
  }

  updateNavUserUI() {
    const navActionsList = document.querySelectorAll('.nav-actions, .mobile-nav-actions');
    if (!navActionsList.length) {
      setTimeout(() => this.updateNavUserUI(), 300);
      return;
    }

    navActionsList.forEach(container => {
      if (this.user) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.4rem 1rem; border-radius: var(--radius-full); border: 1px solid var(--border-purple-glow); width: 100%;">
            <img src="${this.user.photo}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary);">
            <span style="font-weight: 600; font-size: 0.9rem; color: #FFF;">${this.user.name}</span>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;" onclick="window.googleAuth.signOut()">Sign Out</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button class="btn btn-secondary" style="${container.classList.contains('mobile-nav-actions') ? 'width:100%;' : ''}" data-navigate="auth">Sign In</button>
          <button class="btn btn-cyan" style="${container.classList.contains('mobile-nav-actions') ? 'width:100%;' : ''}" data-navigate="auth">Start Free Trial ➔</button>
        `;
      }
    });

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

window.GoogleAuthService = GoogleAuthService;
