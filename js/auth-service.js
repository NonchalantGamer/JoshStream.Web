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

        // Strip OAuth tokens from URL
        const dirty = window.location.hash || window.location.search;
        if (dirty && (dirty.includes('access_token') || dirty.includes('code=') || dirty.includes('error='))) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }

        // Only trigger welcome toast + navigation once per sign-in/sign-up action
        if (!this._sessionHandled && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          this._sessionHandled = true;
          const isNewAccount = session.user.created_at &&
            (Date.now() - new Date(session.user.created_at).getTime()) < 30000; // created < 30s ago
          const welcomeMsg = isNewAccount
            ? `Account created! Welcome to JoshStream, ${this.user.name}! 🚀`
            : `Welcome back, ${this.user.name}! 🎉`;
          if (window.showToast) window.showToast(welcomeMsg);
          setTimeout(() => {
            if (window.appRouter) window.appRouter.navigateTo('profile');
          }, 400);
        }

        // INITIAL_SESSION = page reload with existing session; just refresh UI silently
        if (event === 'INITIAL_SESSION') {
          this._sessionHandled = true;
        }

      } else if (event === 'SIGNED_OUT') {
        // Only wipe on explicit sign-out, not on INITIAL_SESSION with no user
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
  async saveProfileEdits(newName, newEmail, newCompany) {
    if (!this.user) {
      if (window.showToast) window.showToast('You must be signed in to update your profile.', 'error');
      return;
    }

    if (newName) this.user.name = newName;
    if (newEmail) this.user.email = newEmail;
    if (newCompany) this.user.company = newCompany;
    if (this._pendingAvatarDataUrl) {
      this.user.photo = this._pendingAvatarDataUrl;
      this._pendingAvatarDataUrl = null;
    }

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
    this._pendingAvatarDataUrl = null;
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
    const profileForm = document.getElementById('profile-edit-form');
    const signedOutBanner = document.getElementById('profile-signed-out-banner');
    const profileGrid = document.querySelector('#view-profile .profile-dashboard-grid');

    const fileInput = document.getElementById('profile-avatar-file-input');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const triggerAvatarBtn = document.getElementById('upload-avatar-trigger-btn');

    // Show/hide the My Profile nav links
    const navProfileLink = document.getElementById('nav-profile-link');
    const mobileNavProfileLink = document.getElementById('mobile-nav-profile-link');
    if (navProfileLink) navProfileLink.style.display = user ? '' : 'none';
    if (mobileNavProfileLink) mobileNavProfileLink.style.display = user ? '' : 'none';

    if (user) {
      if (avatarImg) avatarImg.src = this._pendingAvatarDataUrl || user.photo;
      if (displayName) displayName.textContent = user.name;
      if (displayEmail) displayEmail.textContent = user.email;
      if (inputName) inputName.value = user.name || '';
      if (inputEmail) inputEmail.value = user.email || '';
      if (inputCompany) inputCompany.value = user.company || '';
      if (profileForm) profileForm.style.display = 'block';
      if (profileGrid) profileGrid.style.display = 'grid';
      if (signedOutBanner) signedOutBanner.style.display = 'none';

      this.renderDashboardAssets();
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
        this.saveProfileEdits(n, em, co);
      });
    }

    // Bind Gallery File Picker button triggers
    const triggerPicker = () => {
      if (fileInput) fileInput.click();
    };

    if (changeAvatarBtn && !changeAvatarBtn._pickerAttached) {
      changeAvatarBtn._pickerAttached = true;
      changeAvatarBtn.addEventListener('click', triggerPicker);
    }

    if (triggerAvatarBtn && !triggerAvatarBtn._pickerAttached) {
      triggerAvatarBtn._pickerAttached = true;
      triggerAvatarBtn.addEventListener('click', triggerPicker);
    }

    // Handle File Selection & Image Compression
    if (fileInput && !fileInput._changeAttached) {
      fileInput._changeAttached = true;
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          if (window.showToast) window.showToast('Please select a valid image file.', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Resize image to max 250x250 using Canvas
            const canvas = document.createElement('canvas');
            const maxDim = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height *= maxDim / width;
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width *= maxDim / height;
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            this._pendingAvatarDataUrl = compressedDataUrl;

            // Live preview immediately
            if (avatarImg) avatarImg.src = compressedDataUrl;
            if (window.showToast) window.showToast('New profile picture preview loaded! Click "Save Changes" to apply. 📸');
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
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

  // ── Register New Asset ──────────────────────────────────────────────────────
  registerNewAsset(asset) {
    const assets = this.getStoredAssets();
    const newAsset = {
      id: 'asset_' + Date.now(),
      title: asset.title || '3D Product Model',
      modelType: asset.modelType || 'sneaker',
      status: asset.status || 'Ready',
      date: asset.date || new Date().toLocaleDateString()
    };
    assets.unshift(newAsset);
    localStorage.setItem('joshstream_user_assets', JSON.stringify(assets));
    this.renderDashboardAssets();
  }

  getStoredAssets() {
    try {
      const stored = localStorage.getItem('joshstream_user_assets');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }

    // Default sample assets
    return [
      { id: 'asset_1', title: 'Air Jordan Spatial Sneaker', modelType: 'sneaker', status: 'Ready', date: 'May 14, 2026' },
      { id: 'asset_2', title: 'Eames Lounge Chair 3D', modelType: 'chair', status: 'Ready', date: 'May 12, 2026' },
      { id: 'asset_3', title: 'Chronos Smartwatch AR', modelType: 'watch', status: 'Ready', date: 'May 08, 2026' }
    ];
  }

  // ── Render Dashboard Asset List ─────────────────────────────────────────────
  renderDashboardAssets() {
    const container = document.getElementById('dashboard-assets-list');
    if (!container) return;

    const assets = this.getStoredAssets();
    if (!assets.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>No 3D assets generated yet. Upload a video above to create your first spatial model! 🚀</p>
        </div>
      `;
      return;
    }

    container.innerHTML = assets.map(item => `
      <div class="glass-card" style="padding: 1rem 1.2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-radius: 12px; margin-bottom: 0.8rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(0, 240, 255, 0.1); border: 1px solid var(--accent-cyan); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📦</div>
          <div>
            <h5 style="color: #FFF; font-size: 0.98rem; margin-bottom: 0.2rem;">${item.title}</h5>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${item.date} • Format: .GLTF / .USDZ</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
          <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #10B981; font-weight: 700; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px;">
            ✓ ${item.status}
          </span>
          <button class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;" onclick="if(window.heroViewer){ window.heroViewer.loadProductModel('${item.modelType}'); window.appRouter.navigateTo('home'); }">Preview 3D</button>
          <button class="btn btn-cyan" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;" onclick="if(window.embedMgr){ window.appRouter.navigateTo('home'); document.getElementById('embed-section')?.scrollIntoView({behavior:'smooth'}); }">Embed Code</button>
          <button style="background: none; border: none; color: #EF4444; cursor: pointer; padding: 0.3rem;" onclick="window.googleAuth.deleteAsset('${item.id}')" title="Delete Asset">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  deleteAsset(id) {
    let assets = this.getStoredAssets();
    assets = assets.filter(a => a.id !== id);
    localStorage.setItem('joshstream_user_assets', JSON.stringify(assets));
    this.renderDashboardAssets();
    if (window.showToast) window.showToast('Asset removed from dashboard.', 'info');
  }
}

window.GoogleAuthService = GoogleAuthService;
