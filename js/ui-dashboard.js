/**
 * DailyDesk - Dashboard & "My Day" UI Renderers
 */

class DashboardUI {
  constructor() {
    this.taskChart = null;
    this.expenseChart = null;
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  render() {
    this.renderMainDashboard();
    this.renderMyDay();
  }

  renderMainDashboard() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const stats = window.appState.getStats();
    const currency = window.appState.profile.currency || '$';
    const userName = window.appState.profile.full_name || 'User';

    // 1. Welcome Header
    const greetingEl = document.getElementById('dash-greeting-text');
    if (greetingEl) {
      greetingEl.textContent = `${this.getGreeting()}, ${userName}! 👋`;
    }
    const quoteEl = document.getElementById('dash-quote-text');
    if (quoteEl) {
      quoteEl.textContent = `"${window.appState.profile.daily_quote || 'Make each day your masterpiece.'}"`;
    }

    // 2. Stat Cards
    const statCardsHtml = `
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Today's Tasks</span>
          <span class="stat-value">${stats.todayCompletedCount} / ${stats.todayTasksCount}</span>
          <span class="stat-subtitle">${stats.pendingTasks} total pending</span>
        </div>
        <div class="stat-icon icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Today's Spending</span>
          <span class="stat-value">${currency}${stats.todayExpenses.toFixed(2)}</span>
          <span class="stat-subtitle">${currency}${stats.monthlyExpenses.toFixed(2)} this month</span>
        </div>
        <div class="stat-icon icon-emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Active Goals</span>
          <span class="stat-value">${stats.activeGoalsCount}</span>
          <span class="stat-subtitle">${stats.avgGoalProgress}% avg progress</span>
        </div>
        <div class="stat-icon icon-cyan">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Productivity Score</span>
          <span class="stat-value">${stats.productivityScore}%</span>
          <span class="stat-subtitle">${stats.completedTasks} completed tasks</span>
        </div>
        <div class="stat-icon icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
      </div>
    `;
    const statsContainer = document.getElementById('dash-stats-grid');
    if (statsContainer) statsContainer.innerHTML = statCardsHtml;

    // 3. Quick Action Tasks Preview
    this.renderDashTasksPreview();
    // 4. Quick Expenses Preview
    this.renderDashExpensesPreview();
    // 5. Goals Spotlight
    this.renderDashGoalsPreview();
    // 6. Charts
    this.renderCharts(stats);
  }

  renderDashTasksPreview() {
    const listEl = document.getElementById('dash-tasks-preview-list');
    if (!listEl) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const tasks = window.appState.tasks.slice(0, 4);

    if (tasks.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p style="margin-bottom: 0.75rem;">No tasks scheduled yet.</p>
          <button class="btn btn-primary btn-sm" onclick="window.tasksUI.openCreateModal()">+ Add Your First Task</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = tasks.map(t => `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="window.tasksUI.toggleTaskComplete('${t.id}')">
          ${t.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${this.escape(t.title)}</div>
          <div class="task-meta">
            <span class="badge ${t.priority === 'High' ? 'badge-danger' : t.priority === 'Medium' ? 'badge-warning' : 'badge-primary'}">${t.priority}</span>
            <span>${t.category}</span>
            <span>📅 ${t.due_date || 'No date'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderDashExpensesPreview() {
    const listEl = document.getElementById('dash-expenses-preview-list');
    if (!listEl) return;

    const currency = window.appState.profile.currency || '$';
    const recent = window.appState.expenses.slice(0, 4);

    if (recent.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p style="margin-bottom: 0.75rem;">No expenses recorded yet.</p>
          <button class="btn btn-primary btn-sm" onclick="window.expensesUI.openCreateModal()">+ Log Expense</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = recent.map(e => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="badge badge-info">${e.category}</span>
          <div>
            <div style="font-weight: 600; font-size: 0.875rem;">${this.escape(e.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${e.expense_date} • ${e.payment_method || 'Card'}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: var(--danger); font-size: 0.9375rem;">
          -${currency}${parseFloat(e.amount).toFixed(2)}
        </div>
      </div>
    `).join('');
  }

  renderDashGoalsPreview() {
    const listEl = document.getElementById('dash-goals-preview-list');
    if (!listEl) return;

    const goals = window.appState.goals.slice(0, 3);
    if (goals.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p style="margin-bottom: 0.75rem;">No active goals set yet.</p>
          <button class="btn btn-primary btn-sm" onclick="window.goalsUI.openCreateModal()">+ Create A Goal</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = goals.map(g => `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.35rem;">
          <span>${this.escape(g.title)}</span>
          <span style="color: var(--primary);">${g.progress || 0}%</span>
        </div>
        <div class="goal-progress-bar" style="margin: 0;">
          <div class="goal-progress-fill" style="width: ${g.progress || 0}%;"></div>
        </div>
      </div>
    `).join('');
  }

  renderCharts(stats) {
    if (typeof Chart === 'undefined') return;

    // 1. Task Donut Chart
    const taskCanvas = document.getElementById('dashTaskDistributionChart');
    if (taskCanvas) {
      const ctx = taskCanvas.getContext('2d');
      if (this.taskChart) this.taskChart.destroy();

      const completed = stats.completedTasks;
      const pending = stats.pendingTasks;
      const dataValues = (completed === 0 && pending === 0) ? [1, 0] : [completed, pending];

      this.taskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: dataValues,
            backgroundColor: ['#10b981', '#6366f1'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12 } } }
          },
          cutout: '72%'
        }
      });
    }

    // 2. Spending Trend Chart (last 6 months or categories)
    const expenseCanvas = document.getElementById('dashExpenseTrendChart');
    if (expenseCanvas) {
      const ctx = expenseCanvas.getContext('2d');
      if (this.expenseChart) this.expenseChart.destroy();

      // Aggregate expenses by category
      const catTotals = {};
      CONFIG.EXPENSE_CATEGORIES.forEach(c => catTotals[c] = 0);
      window.appState.expenses.forEach(e => {
        const c = e.category || 'Other';
        catTotals[c] = (catTotals[c] || 0) + parseFloat(e.amount || 0);
      });

      const labels = Object.keys(catTotals).filter(c => catTotals[c] > 0);
      const data = labels.map(c => catTotals[c]);

      this.expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['Food', 'Bills', 'Transport'],
          datasets: [{
            label: 'Spending',
            data: data.length > 0 ? data : [0, 0, 0],
            backgroundColor: 'rgba(79, 70, 229, 0.75)',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(150, 150, 150, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  // ================= "MY DAY" DEDICATED VIEW =================
  renderMyDay() {
    const container = document.getElementById('view-my-day');
    if (!container) return;

    const stats = window.appState.getStats();
    const currency = window.appState.profile.currency || '$';
    const todayStr = stats.todayStr;

    // 1. Productivity Ring / Score
    const scoreVal = stats.productivityScore;
    const offset = 220 - (220 * scoreVal) / 100;
    const ringBar = document.getElementById('myday-score-bar');
    if (ringBar) ringBar.style.strokeDashoffset = offset;
    const scoreText = document.getElementById('myday-score-text');
    if (scoreText) scoreText.textContent = `${scoreVal}%`;

    // 2. Today's Tasks
    const todayTasks = window.appState.tasks.filter(t => t.due_date === todayStr);
    const tasksListEl = document.getElementById('myday-tasks-list');
    if (tasksListEl) {
      if (todayTasks.length === 0) {
        tasksListEl.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <div class="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
            <h3>All clear for today!</h3>
            <p>No tasks due today. Schedule one now to stay ahead.</p>
            <button class="btn btn-primary btn-sm" onclick="window.tasksUI.openCreateModal('${todayStr}')">+ Add Task For Today</button>
          </div>
        `;
      } else {
        tasksListEl.innerHTML = todayTasks.map(t => `
          <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="window.tasksUI.toggleTaskComplete('${t.id}')">
              ${t.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </div>
            <div class="task-content">
              <div class="task-title">${this.escape(t.title)}</div>
              <div class="task-meta">
                <span class="badge ${t.priority === 'High' ? 'badge-danger' : t.priority === 'Medium' ? 'badge-warning' : 'badge-primary'}">${t.priority}</span>
                <span>🏷️ ${t.category}</span>
                ${t.description ? `<span>📝 ${this.escape(t.description)}</span>` : ''}
              </div>
            </div>
            <div class="task-actions">
              <button class="btn btn-ghost btn-sm" onclick="window.tasksUI.openEditModal('${t.id}')">✏️</button>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Today's Expenses
    const todayExpenses = window.appState.expenses.filter(e => e.expense_date === todayStr);
    const expListEl = document.getElementById('myday-expenses-list');
    const expTotalEl = document.getElementById('myday-expenses-total');
    if (expTotalEl) {
      expTotalEl.textContent = `${currency}${stats.todayExpenses.toFixed(2)}`;
    }
    if (expListEl) {
      if (todayExpenses.length === 0) {
        expListEl.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <p>No spending logged yet today.</p>
            <button class="btn btn-primary btn-sm" onclick="window.expensesUI.openCreateModal('${todayStr}')">+ Log Today's Expense</button>
          </div>
        `;
      } else {
        expListEl.innerHTML = todayExpenses.map(e => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem;">${this.escape(e.title)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${e.category} • ${e.payment_method || 'Card'}</div>
            </div>
            <div style="font-weight: 700; color: var(--danger);">
              -${currency}${parseFloat(e.amount).toFixed(2)}
            </div>
          </div>
        `).join('');
      }
    }
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

window.dashboardUI = new DashboardUI();
