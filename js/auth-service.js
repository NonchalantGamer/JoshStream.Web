/* JoshStream Web - Supabase Auth Engine (Google OAuth + Profile Management) */

class GoogleAuthService {
  constructor() {
    this.user = null;
    this.supabase = null;
    this._sessionHandled = false;
    this.init();
  }

  async init() {
    // ── Step 1: Paint UI instantly from localStorage cache ──────────────────
    const cached = localStorage.getItem('joshstream_user_session');
    if (cached) {
      try {
        this.user = JSON.parse(cached);
        this.updateNavUserUI();
        this._populateProfilePage();
      } catch {
        localStorage.removeItem('joshstream_user_session');
      }
    }

    if (!window.supabaseClient) {
      console.warn('[Auth] Supabase client not ready.');
      return;
    }
    this.supabase = window.supabaseClient;

    // ── Step 2: Listen to ALL future auth state changes ──────────────────────
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange →', event, session?.user?.email ?? 'no user');

      if (session?.user) {
        this._setUser(session.user);
        this._syncProfile(session.user);

        // Strip tokens from URL so the SPA router and bookmarks stay clean
        const dirty = window.location.hash || window.location.search;
        if (dirty && (dirty.includes('access_token') || dirty.includes('code=') || dirty.includes('error='))) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }

        if (!this._sessionHandled) {
          this._sessionHandled = true;
          const isNewSignIn = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
          if (isNewSignIn) {
            if (window.showToast) window.showToast(`Welcome, ${this.user.name}! 🎉`);
            // Navigate to profile page so user can see they are signed in
            setTimeout(() => {
              if (window.appRouter) window.appRouter.navigateTo('profile');
            }, 400);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        this._sessionHandled = false;
        this.user = null;
        localStorage.removeItem('joshstream_user_session');
        this.updateNavUserUI();
        this._populateProfilePage();
      }
    });

    // ── Step 3: Eagerly resolve any existing or redirected session ────────────
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) console.warn('[Auth] getSession:', error.message);
      if (session?.user) {
        this._setUser(session.user);
        this._syncProfile(session.user);
        this._populateProfilePage();
      }
    } catch (err) {
      console.warn('[Auth] getSession exception:', err.message);
    }
  }

  // ── Build local user object from Supabase user ──────────────────────────────
  _setUser(sbUser) {
    const displayName =
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      (sbUser.email ? sbUser.email.split('@')[0] : 'User');

    const avatar =
      sbUser.user_metadata?.avatar_url ||
      sbUser.user_metadata?.picture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sbUser.email || 'user')}`;

    this.user = {
      uid: sbUser.id,
      name: displayName,
      email: sbUser.email || '',
      photo: avatar,
      provider: sbUser.app_metadata?.provider || 'Supabase',
      created_at: sbUser.created_at || new Date().toISOString()
    };

    localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
    this.updateNavUserUI();
    this._populateProfilePage();
  }

  // ── Google OAuth sign-in via Supabase (implicit flow for static SPA) ────────
  async signInWithGoogle() {
    if (!this.supabase) {
      if (window.showToast) window.showToast('Auth service not ready. Please refresh.', 'error');
      return;
    }
    if (window.showToast) window.showToast('Redirecting to Google sign-in…');

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to this exact page (no trailing hash)
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('[Auth] signInWithOAuth error:', error);
      if (window.showToast) window.showToast(`Sign-in failed: ${error.message}`, 'error');
    }
  }

  // ── Sync Google profile data to Supabase profiles table ────────────────────
  async _syncProfile(sbUser) {
    if (!this.supabase) return;
    try {
      const displayName =
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'User';
      const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null;

      await this.supabase.from('profiles').upsert(
        { id: sbUser.id, name: displayName, email: sbUser.email, avatar_url: avatar, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('[Auth] Profile sync:', err.message);
    }
  }

  // ── Save profile edits from the profile form ────────────────────────────────
  async saveProfileEdits(newName, newEmail, newCompany, newAvatar) {
    if (!this.user) {
      if (window.showToast) window.showToast('You must be signed in to update your profile.', 'error');
      return;
    }

    if (newName) this.user.name = newName;
    if (newEmail) this.user.email = newEmail;
    if (newAvatar) this.user.photo = newAvatar;
    if (newCompany) this.user.company = newCompany;

    localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));

    // Persist to Supabase if available
    if (this.supabase) {
      try {
        await this.supabase.from('profiles').upsert(
          {
            id: this.user.uid,
            name: this.user.name,
            email: this.user.email,
            avatar_url: this.user.photo,
            company: this.user.company || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('[Auth] Save profile:', err.message);
      }
    }

    this.updateNavUserUI();
    this._populateProfilePage();
    if (window.showToast) window.showToast('Profile updated successfully! ✅');
  }

  // ── Sign out ────────────────────────────────────────────────────────────────
  async signOut() {
    if (this.supabase) {
      try { await this.supabase.auth.signOut(); } catch (e) { /* silent */ }
    }
    this._sessionHandled = false;
    this.user = null;
    localStorage.removeItem('joshstream_user_session');
    this.updateNavUserUI();
    this._populateProfilePage();
    if (window.showToast) window.showToast('Signed out successfully. See you soon! 👋');
    if (window.appRouter) window.appRouter.navigateTo('home');
  }

  // ── Populate the #view-profile page fields with live user data ─────────────
  _populateProfilePage() {
    const user = this.user;

    const avatarImg = document.getElementById('profile-avatar-img');
    const displayName = document.getElementById('profile-display-name');
    const displayEmail = document.getElementById('profile-display-email');
    const inputName = document.getElementById('profile-input-name');
    const inputEmail = document.getElementById('profile-input-email');
    const inputCompany = document.getElementById('profile-input-company');
    const inputAvatar = document.getElementById('profile-input-avatar');
    const profileForm = document.getElementById('profile-edit-form');
    const signedOutBanner = document.getElementById('profile-signed-out-banner');
    const profileGrid = document.querySelector('#view-profile .profile-dashboard-grid');

    // Show/hide the My Profile nav links
    const navProfileLink = document.getElementById('nav-profile-link');
    const mobileNavProfileLink = document.getElementById('mobile-nav-profile-link');
    if (navProfileLink) navProfileLink.style.display = user ? '' : 'none';
    if (mobileNavProfileLink) mobileNavProfileLink.style.display = user ? '' : 'none';

    if (user) {
      if (avatarImg) avatarImg.src = user.photo;
      if (displayName) displayName.textContent = user.name;
      if (displayEmail) displayEmail.textContent = user.email;
      if (inputName) inputName.value = user.name || '';
      if (inputEmail) inputEmail.value = user.email || '';
      if (inputCompany) inputCompany.value = user.company || '';
      if (inputAvatar) inputAvatar.value = user.photo || '';
      if (profileForm) profileForm.style.display = 'block';
      if (profileGrid) profileGrid.style.display = 'grid';
      if (signedOutBanner) signedOutBanner.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest';
      if (displayName) displayName.textContent = 'Guest User';
      if (displayEmail) displayEmail.textContent = 'Not signed in';
      if (profileForm) profileForm.style.display = 'none';
      if (profileGrid) profileGrid.style.display = 'none';
      if (signedOutBanner) signedOutBanner.style.display = 'block';
    }

    // Attach form submit handler (idempotent via flag)
    if (profileForm && !profileForm._listenerAttached) {
      profileForm._listenerAttached = true;
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const n = document.getElementById('profile-input-name')?.value;
        const em = document.getElementById('profile-input-email')?.value;
        const co = document.getElementById('profile-input-company')?.value;
        const av = document.getElementById('profile-input-avatar')?.value;
        this.saveProfileEdits(n, em, co, av);
      });
    }

    // Avatar live preview from URL input
    if (inputAvatar && avatarImg && !inputAvatar._previewAttached) {
      inputAvatar._previewAttached = true;
      inputAvatar.addEventListener('input', () => {
        if (inputAvatar.value) avatarImg.src = inputAvatar.value;
      });
    }
  }

  // ── Update navbar with signed-in user chip or sign-in buttons ──────────────
  updateNavUserUI() {
    const containers = document.querySelectorAll('.nav-actions, .mobile-nav-actions');
    if (!containers.length) {
      setTimeout(() => this.updateNavUserUI(), 250);
      return;
    }

    containers.forEach(container => {
      const isMobile = container.classList.contains('mobile-nav-actions');
      const w = isMobile ? 'width:100%;' : '';

      if (this.user) {
        container.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.7rem;background:rgba(255,255,255,0.06);padding:0.35rem 0.9rem;border-radius:var(--radius-full);border:1px solid rgba(255,42,95,0.3);cursor:pointer;" onclick="if(window.appRouter)window.appRouter.navigateTo('profile')" title="View Profile">
            <img src="${this.user.photo}" alt="avatar" style="width:30px;height:30px;border-radius:50%;border:2px solid var(--primary);flex-shrink:0;" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=user'">
            <span style="font-weight:600;font-size:0.88rem;color:#FFF;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${this.user.name}</span>
          </div>
          <button class="btn btn-secondary" style="${w}padding:0.35rem 0.9rem;font-size:0.82rem;" onclick="window.googleAuth.signOut()">Sign Out</button>
        `;
      } else {
        container.innerHTML = `
          <button class="btn btn-secondary" style="${w}" data-navigate="auth">Sign In</button>
          <button class="btn btn-cyan" style="${w}" data-navigate="auth">Start Free Trial ➔</button>
        `;
      }
    });

    // Re-attach data-navigate listeners after innerHTML swap
    document.querySelectorAll('[data-navigate]').forEach(el => {
      if (el._navListenerAttached) return;
      el._navListenerAttached = true;
      el.addEventListener('click', (e) => {
        const v = el.getAttribute('data-navigate');
        if (v && window.appRouter) { e.preventDefault(); window.appRouter.navigateTo(v); }
      });
    });
  }
}

window.GoogleAuthService = GoogleAuthService;
