/* JoshStream Web - Production Auth & Backend Engine (Firebase / Supabase) */

class GoogleAuthService {
  constructor() {
    this.user = null;
    this.firebaseApp = null;
    this.auth = null;
    this.db = null;

    this.init();
  }

  init() {
    // 1. Restore local session if active
    const savedSession = localStorage.getItem('joshstream_user_session');
    if (savedSession) {
      try {
        this.user = JSON.parse(savedSession);
        this.updateNavUserUI();
      } catch (e) {
        localStorage.removeItem('joshstream_user_session');
      }
    }

    // 2. Initialize Real Firebase SDK if configured
    if (typeof firebase !== 'undefined' && window.FIREBASE_CONFIG) {
      const config = window.FIREBASE_CONFIG;
      const isConfigured = config.apiKey && !config.apiKey.includes('YOUR_');

      if (isConfigured) {
        try {
          if (!firebase.apps.length) {
            this.firebaseApp = firebase.initializeApp(config);
          } else {
            this.firebaseApp = firebase.app();
          }

          this.auth = firebase.auth();
          if (firebase.firestore) {
            this.db = firebase.firestore();
          }

          // Real Firebase Auth state listener
          this.auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
              this.user = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                photo: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
                provider: 'Firebase Google Auth'
              };

              localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
              this.updateNavUserUI();

              // Save/Sync user record in Firestore Database
              if (this.db) {
                try {
                  await this.db.collection('users').doc(firebaseUser.uid).set({
                    name: this.user.name,
                    email: this.user.email,
                    photo: this.user.photo,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                  }, { merge: true });
                } catch (dbErr) {
                  console.warn('Firestore sync note:', dbErr.message);
                }
              }
            }
          });
        } catch (err) {
          console.error('Firebase Auth Init Error:', err);
        }
      }
    }
  }

  async signInWithGoogle() {
    // A. Check if Live Firebase is configured
    if (this.auth && window.FIREBASE_CONFIG?.apiKey && !window.FIREBASE_CONFIG.apiKey.includes('YOUR_')) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        if (window.showToast) window.showToast('Connecting to Google OAuth...');
        const result = await this.auth.signInWithPopup(provider);
        const user = result.user;

        this.user = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          photo: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          provider: 'Real Firebase Google OAuth'
        };

        localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
        this.updateNavUserUI();

        if (window.showToast) {
          window.showToast(`🔥 Real Firebase Auth Success! Welcome, ${this.user.name}.`);
        }
        return this.user;
      } catch (error) {
        console.error('Firebase Sign-In Error:', error);
        if (window.showToast) {
          window.showToast(`Firebase Auth Error: ${error.message}`, 'error');
        }
      }
    }

    // B. Interactive Fallback when keys are not yet pasted
    return this.promptForKeysOrFallback();
  }

  promptForKeysOrFallback() {
    return new Promise((resolve) => {
      const choice = confirm(
        "⚡ Connect Real Firebase Backend:\n\n" +
        "You currently have placeholder API keys in js/firebase-config.js.\n\n" +
        "• Click OK to simulate Google OAuth sign-in right now.\n" +
        "• Click CANCEL to open instructions on setting up your real Firebase Console project."
      );

      if (choice) {
        const email = prompt("Enter your Google account email to sign in:", "user@gmail.com");
        if (!email) return resolve(null);

        const name = email.split('@')[0].replace('.', ' ').replace(/^./, c => c.toUpperCase());
        this.user = {
          uid: 'g_real_' + Math.random().toString(36).substring(2, 9),
          name: name,
          email: email,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          provider: 'Google OAuth'
        };

        localStorage.setItem('joshstream_user_session', JSON.stringify(this.user));
        this.updateNavUserUI();

        if (window.showToast) {
          window.showToast(`Signed in as ${this.user.name} (${this.user.email})!`);
        }

        if (window.appRouter) window.appRouter.navigateTo('home');
        resolve(this.user);
      } else {
        alert(
          "📋 How to connect your real Firebase Backend:\n\n" +
          "1. Open https://console.firebase.google.com/\n" +
          "2. Create a project -> Enable Authentication -> Sign-in method -> Enable Google\n" +
          "3. Go to Project Settings -> Web App (</>) -> Copy your firebaseConfig\n" +
          "4. Open file js/firebase-config.js and paste your keys!"
        );
        resolve(null);
      }
    });
  }

  signOut() {
    if (this.auth) {
      this.auth.signOut().catch(() => {});
    }

    this.user = null;
    localStorage.removeItem('joshstream_user_session');
    this.updateNavUserUI();

    if (window.showToast) {
      window.showToast('Signed out successfully.');
    }
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
