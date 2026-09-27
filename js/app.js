/**
 * DailyDesk - Main Application Bootstrapper
 * Event listeners, Auth handlers, Toast notifications, Modal controls & Theme.
 */

class Application {
  constructor() {
    this.init();
  }

  async init() {
    console.log('DailyDesk: Starting application...');

    // 1. Theme initialization
    const savedTheme = localStorage.getItem('dailydesk_theme') || 'dark';
    window.appState.setTheme(savedTheme);

    // 2. Setup Date Widget
    this.updateDateDisplay();

    // 3. Initialize Global Search
    window.searchUI.init();

    // 4. Setup Auth & Session
    await this.setupAuthentication();

    // 5. Initialize Router
    window.router.init();

    // 6. Setup Modal backdrop click handlers
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // 7. Setup Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop.open');
        if (openModal) this.closeModal(openModal.id);
      }
    });

    console.log('DailyDesk: Application ready.');
  }

  updateDateDisplay() {
    const el = document.getElementById('header-current-date');
    if (el) {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      el.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  async setupAuthentication() {
    const session = await window.supabaseService.getSession();
    if (session && session.user) {
      this.handleUserLoggedIn(session.user);
    } else {
      // Check if demo user was active
      const cachedDemo = localStorage.getItem('dailydesk_demo_user');
      if (cachedDemo) {
        this.handleUserLoggedIn(JSON.parse(cachedDemo));
      }
    }

    // Subscribe to auth state changes from Supabase
    window.supabaseService.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' && session) {
        this.handleUserLoggedIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.handleUserLoggedOut();
      }
    });
  }

  async handleUserLoggedIn(user) {
    window.appState.setUser(user);
    const profile = await window.supabaseService.getProfile(user.id);
    if (profile) {
      window.appState.setProfile(profile);
    } else {
      window.appState.setProfile({
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        role: user.email.toLowerCase().includes('admin') ? 'admin' : 'user'
      });
    }

    this.updateUserUI();

    // Fetch user's data from Supabase
    const tasks = await window.supabaseService.getTasks(user.id);
    const expenses = await window.supabaseService.getExpenses(user.id);
    const notes = await window.supabaseService.getNotes(user.id);
    const goals = await window.supabaseService.getGoals(user.id);

    window.appState.setTasks(tasks);
    window.appState.setExpenses(expenses);
    window.appState.setNotes(notes);
    window.appState.setGoals(goals);

    const pending = tasks.filter(t => !t.completed).length;
    const badge = document.getElementById('sidebar-tasks-count');
    if (badge) badge.textContent = pending;

    // If on landing or auth, navigate to dashboard
    if (window.router.currentRoute === 'landing') {
      window.router.navigate('dashboard');
    } else {
      window.router.navigate(window.router.currentRoute);
    }
  }

  handleUserLoggedOut() {
    localStorage.removeItem('dailydesk_demo_user');
    window.appState.setUser(null);
    window.router.navigate('landing');
    this.showToast('You have been logged out.', 'info');
  }

  updateUserUI() {
    const profile = window.appState.profile;
    const nameEls = document.querySelectorAll('.user-name-display');
    const emailEls = document.querySelectorAll('.user-email-display');
    const avatarEls = document.querySelectorAll('.user-avatar-display');
    const roleEls = document.querySelectorAll('.user-role-display');

    nameEls.forEach(el => el.textContent = profile.full_name || 'DailyDesk User');
    emailEls.forEach(el => el.textContent = profile.email || 'user@dailydesk.app');
    avatarEls.forEach(el => el.textContent = (profile.full_name || 'U').charAt(0).toUpperCase());
    roleEls.forEach(el => {
      el.textContent = profile.role || 'user';
      el.className = `badge ${profile.role === 'admin' ? 'badge-danger' : 'badge-primary'} user-role-display`;
    });

    // Show/hide admin link in sidebar
    const adminNavItem = document.getElementById('nav-item-admin');
    if (adminNavItem) {
      adminNavItem.style.display = 'flex'; // Visible with role lock inside view
    }
  }

  // ================= DEMO LOGIN (FOR EVALUATOR PRESENTATION) =================
  loginDemo(role = 'user') {
    const demoUser = {
      id: role === 'admin' ? 'admin_demo_uuid' : 'evaluator_demo_uuid',
      email: role === 'admin' ? 'admin@dailydesk.app' : 'evaluator@dailydesk.app',
      user_metadata: {
        full_name: role === 'admin' ? 'Administrator' : 'Competition Evaluator',
        role: role
      }
    };
    localStorage.setItem('dailydesk_demo_user', JSON.stringify(demoUser));
    this.closeModal('modal-auth');
    this.handleUserLoggedIn(demoUser);
    this.showToast(`Logged in as ${role === 'admin' ? 'Administrator' : 'Competition Evaluator'} (Demo Mode)`, 'success');
  }

  // ================= SUPABASE AUTH FORM HANDLERS =================
  async handleEmailAuth(e) {
    e.preventDefault();
    const isSignUp = document.getElementById('auth-mode-signup').checked;
    const email = document.getElementById('auth-input-email').value.trim();
    const password = document.getElementById('auth-input-password').value;
    const fullName = document.getElementById('auth-input-name').value.trim();

    if (!email || !password) {
      this.showToast('Please enter both email and password.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    try {
      if (isSignUp) {
        await window.supabaseService.signUp(email, password, fullName);
        this.showToast('Account registered! Please sign in or check confirmation email.', 'success');
        document.getElementById('auth-mode-signin').checked = true;
        this.toggleAuthMode(false);
      } else {
        const { user } = await window.supabaseService.signIn(email, password);
        this.closeModal('modal-auth');
        this.showToast('Welcome back to DailyDesk!', 'success');
        if (user) this.handleUserLoggedIn(user);
      }
    } catch (err) {
      this.showToast(err.message || 'Authentication error', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
      }
    }
  }

  toggleAuthMode(isSignUp) {
    const nameGroup = document.getElementById('auth-name-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const titleEl = document.getElementById('auth-modal-title');

    if (nameGroup) nameGroup.style.display = isSignUp ? 'block' : 'none';
    if (submitBtn) submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    if (titleEl) titleEl.textContent = isSignUp ? 'Create DailyDesk Account' : 'Sign In to DailyDesk';
  }

  async logout() {
    await window.supabaseService.signOut();
    this.handleUserLoggedOut();
  }

  // ================= PROFILE EDIT =================
  renderProfileView() {
    const profile = window.appState.profile;
    document.getElementById('profile-input-name').value = profile.full_name || '';
    document.getElementById('profile-input-email').value = profile.email || '';
    document.getElementById('profile-input-currency').value = profile.currency || '$';
    document.getElementById('profile-input-quote').value = profile.daily_quote || '';
    document.getElementById('profile-role-badge').textContent = profile.role || 'user';
  }

  async saveProfile(e) {
    if (e) e.preventDefault();
    const fullName = document.getElementById('profile-input-name').value.trim();
    const currency = document.getElementById('profile-input-currency').value;
    const dailyQuote = document.getElementById('profile-input-quote').value.trim();
    const userId = window.appState.user?.id || 'demo_user';

    const updates = {
      full_name: fullName,
      currency: currency,
      daily_quote: dailyQuote
    };

    try {
      await window.supabaseService.updateProfile(userId, updates);
      window.appState.setProfile(updates);
      this.updateUserUI();
      window.dashboardUI.render();
      this.showToast('Profile updated successfully!', 'success');
    } catch (err) {
      this.showToast('Failed to update profile: ' + err.message, 'error');
    }
  }

  // ================= THEME TOGGLE =================
  toggleTheme() {
    const current = window.appState.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    window.appState.setTheme(next);
    this.showToast(`Theme changed to ${next} mode.`, 'info');
  }

  // ================= MODALS & TOASTS =================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  }
}

// Global App Instance
window.app = new Application();
