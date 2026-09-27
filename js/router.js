/**
 * DailyDesk - Client-Side View Router
 * Handles hash navigation, active menu styling, and view transitions.
 */

class Router {
  constructor() {
    this.currentRoute = 'landing';
    this.routes = [
      'landing',
      'dashboard',
      'my-day',
      'tasks',
      'expenses',
      'notes',
      'goals',
      'admin',
      'profile'
    ];
  }

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    // Initial route check
    this.handleHashChange();
  }

  handleHashChange() {
    let hash = window.location.hash.replace('#', '').trim();
    if (!hash) {
      // If user is authenticated or demo mode, default to dashboard, otherwise landing
      hash = window.appState.user ? 'dashboard' : 'landing';
    }
    if (this.routes.includes(hash)) {
      this.navigate(hash, false);
    } else {
      this.navigate('dashboard', false);
    }
  }

  navigate(route, updateHash = true) {
    if (!this.routes.includes(route)) route = 'dashboard';
    this.currentRoute = route;

    if (updateHash) {
      window.location.hash = '#' + route;
    }

    // Toggle Landing vs App Layout
    const landingEl = document.getElementById('landing-page-container');
    const appShellEl = document.getElementById('app-shell-container');

    if (route === 'landing') {
      if (landingEl) landingEl.style.display = 'block';
      if (appShellEl) appShellEl.style.display = 'none';
      return;
    }

    if (landingEl) landingEl.style.display = 'none';
    if (appShellEl) appShellEl.style.display = 'flex';

    // Show/hide view containers
    document.querySelectorAll('.view-container').forEach(el => {
      el.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${route}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === route);
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Trigger renderers for target view
    window.appState.setView(route);

    if (route === 'dashboard') {
      window.dashboardUI.render();
    } else if (route === 'my-day') {
      window.dashboardUI.renderMyDay();
    } else if (route === 'tasks') {
      window.tasksUI.render();
    } else if (route === 'expenses') {
      window.expensesUI.render();
    } else if (route === 'notes') {
      window.notesUI.render();
    } else if (route === 'goals') {
      window.goalsUI.render();
    } else if (route === 'admin') {
      window.adminUI.render();
    } else if (route === 'profile') {
      window.app.renderProfileView();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.router = new Router();
