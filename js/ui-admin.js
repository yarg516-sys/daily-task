/**
 * DailyDesk - Admin Panel UI
 * Authorized administration, System metrics, User management,
 * Supabase Health check, SQL Schema viewer & Demo seeding.
 */

class AdminUI {
  constructor() {
    this.logs = [
      { time: 'Just now', event: 'Database health check performed', type: 'info' },
      { time: '2 mins ago', event: 'User logged in to DailyDesk session', type: 'success' },
      { time: '10 mins ago', event: 'Task status updated: quarterly mockups', type: 'info' },
      { time: '25 mins ago', event: 'New expense transaction verified', type: 'info' },
      { time: '1 hour ago', event: 'Goal milestone updated: Cloud Architecture', type: 'success' }
    ];
  }

  render() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    const isAdmin = window.appState.profile.role === 'admin';
    const accessDeniedEl = document.getElementById('admin-access-denied');
    const panelEl = document.getElementById('admin-panel-content');

    if (!isAdmin) {
      if (accessDeniedEl) accessDeniedEl.style.display = 'block';
      if (panelEl) panelEl.style.display = 'none';
      return;
    }

    if (accessDeniedEl) accessDeniedEl.style.display = 'none';
    if (panelEl) panelEl.style.display = 'block';

    const stats = window.appState.getStats();
    const currency = window.appState.profile.currency || '$';

    // 1. System KPI Cards
    const userCountEl = document.getElementById('admin-kpi-users');
    if (userCountEl) userCountEl.textContent = '3 Active';

    const tasksKpiEl = document.getElementById('admin-kpi-tasks');
    if (tasksKpiEl) {
      const rate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      tasksKpiEl.textContent = `${stats.totalTasks} (${rate}% done)`;
    }

    const expKpiEl = document.getElementById('admin-kpi-expenses');
    if (expKpiEl) {
      expKpiEl.textContent = `${currency}${stats.totalExpenses.toFixed(2)}`;
    }

    const goalsKpiEl = document.getElementById('admin-kpi-goals');
    if (goalsKpiEl) {
      goalsKpiEl.textContent = `${stats.totalGoals} (${stats.avgGoalProgress}% avg)`;
    }

    // 2. Supabase Health Check
    this.checkDatabaseHealth();

    // 3. Registered Users Table
    this.renderUsersTable();

    // 4. Activity Logs
    this.renderActivityLogs();
  }

  async checkDatabaseHealth() {
    const statusContainer = document.getElementById('admin-db-health-status');
    if (!statusContainer) return;

    statusContainer.innerHTML = '<span style="color: var(--text-muted);">Pinging Supabase tables...</span>';

    const start = performance.now();
    const tableStatus = await window.supabaseService.checkTables();
    const duration = Math.round(performance.now() - start);

    const tables = ['profiles', 'tasks', 'expenses', 'notes', 'goals'];
    const activeCount = tables.filter(t => tableStatus[t]).length;

    let badgeClass = activeCount === tables.length ? 'badge-success' : (activeCount > 0 ? 'badge-warning' : 'badge-danger');
    let statusText = activeCount === tables.length ? 'Healthy & Connected' : `${activeCount}/${tables.length} Tables Active`;

    statusContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="badge ${badgeClass}">${statusText}</span>
          <span style="font-size: 0.8125rem; color: var(--text-muted);">${duration}ms latency</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="window.adminUI.openSqlModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            View SQL Schema
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.adminUI.checkDatabaseHealth()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Recheck
          </button>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
        ${tables.map(t => `
          <span class="badge ${tableStatus[t] ? 'badge-success' : 'badge-warning'}">
            ${tableStatus[t] ? '✓' : '⚠️'} ${t}
          </span>
        `).join('')}
      </div>
    `;
  }

  renderUsersTable() {
    const tableBody = document.getElementById('admin-users-table-body');
    if (!tableBody) return;

    const currentEmail = window.appState.user?.email || 'admin@dailydesk.app';
    const users = [
      { name: window.appState.profile.full_name || 'Admin Lead', email: currentEmail, role: window.appState.profile.role, date: 'Today', status: 'Active (Current)' },
      { name: 'Sarah Lin', email: 'sarah.lin@example.com', role: 'user', date: '2 days ago', status: 'Active' },
      { name: 'Marcus Vance', email: 'marcus.v@example.com', role: 'user', date: '5 days ago', status: 'Active' }
    ];

    tableBody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.75rem;">${u.name.charAt(0)}</div>
            <div>
              <div style="font-weight: 700;">${this.escape(u.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${u.role}</span></td>
        <td>${u.date}</td>
        <td><span class="badge badge-success">${u.status}</span></td>
      </tr>
    `).join('');
  }

  renderActivityLogs() {
    const logList = document.getElementById('admin-logs-list');
    if (!logList) return;

    logList.innerHTML = this.logs.map(l => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.8125rem;">
        <div style="display: flex; align-items: center; gap: 0.625rem;">
          <span class="status-dot ${l.type === 'success' ? '' : 'warning'}"></span>
          <span>${this.escape(l.event)}</span>
        </div>
        <span style="color: var(--text-muted); font-size: 0.75rem;">${l.time}</span>
      </div>
    `).join('');
  }

  openSqlModal() {
    window.app.openModal('modal-sql-schema');
  }

  async copySqlSchema() {
    const code = document.getElementById('sql-schema-code').textContent;
    try {
      await navigator.clipboard.writeText(code);
      window.app.showToast('SQL Schema copied to clipboard! Paste in Supabase SQL Editor.', 'success');
    } catch (err) {
      window.app.showToast('Unable to copy automatically. Please select and copy manually.', 'info');
    }
  }

  async seedDemoData() {
    if (!confirm('This will load a fresh set of realistic sample tasks, expenses, notes, and goals. Continue?')) return;
    const userId = window.appState.user?.id || 'demo_user';

    try {
      // Seed Tasks
      for (const t of CONFIG.SAMPLE_DATA.tasks) {
        await window.supabaseService.createTask({ ...t, user_id: userId });
      }
      // Seed Expenses
      for (const e of CONFIG.SAMPLE_DATA.expenses) {
        await window.supabaseService.createExpense({ ...e, user_id: userId });
      }
      // Seed Notes
      for (const n of CONFIG.SAMPLE_DATA.notes) {
        await window.supabaseService.createNote({ ...n, user_id: userId });
      }
      // Seed Goals
      for (const g of CONFIG.SAMPLE_DATA.goals) {
        await window.supabaseService.createGoal({ ...g, user_id: userId });
      }

      // Refresh all state
      const tasks = await window.supabaseService.getTasks(userId);
      const expenses = await window.supabaseService.getExpenses(userId);
      const notes = await window.supabaseService.getNotes(userId);
      const goals = await window.supabaseService.getGoals(userId);

      window.appState.setTasks(tasks);
      window.appState.setExpenses(expenses);
      window.appState.setNotes(notes);
      window.appState.setGoals(goals);

      window.app.showToast('Sample dataset loaded successfully! 🎉', 'success');
      this.render();
      window.dashboardUI.render();
    } catch (err) {
      window.app.showToast('Seeding error: ' + err.message, 'error');
    }
  }

  switchRoleToAdmin() {
    window.appState.setProfile({ role: 'admin' });
    window.app.showToast('Switched to Administrator Mode!', 'success');
    this.render();
  }

  switchRoleToUser() {
    window.appState.setProfile({ role: 'user' });
    window.app.showToast('Switched to Standard User Mode.', 'info');
    this.render();
  }

  escape(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }
}

window.adminUI = new AdminUI();
