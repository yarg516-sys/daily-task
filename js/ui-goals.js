/**
 * DailyDesk - Goals Management UI
 * Progress tracking, Milestones, Target countdowns, Category filters & CRUD.
 */

class GoalsUI {
  constructor() {
    this.editingGoalId = null;
  }

  render() {
    const container = document.getElementById('view-goals');
    if (!container) return;

    const filter = window.appState.goalFilter;
    let list = [...window.appState.goals];

    // Status filter
    if (filter.status === 'in_progress') {
      list = list.filter(g => g.status !== 'Completed');
    } else if (filter.status === 'completed') {
      list = list.filter(g => g.status === 'Completed');
    }

    // Category filter
    if (filter.category !== 'all') {
      list = list.filter(g => g.category === filter.category);
    }

    // Search query
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(g =>
        (g.title && g.title.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    }

    const grid = document.getElementById('goals-cards-grid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </div>
          <h3>No goals found</h3>
          <p>Set meaningful milestones for your career, health, finances and learning.</p>
          <button class="btn btn-primary btn-sm" onclick="window.goalsUI.openCreateModal()">+ Create New Goal</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(g => {
      const isCompleted = g.status === 'Completed' || g.progress >= 100;
      const daysLeft = this.calculateDaysLeft(g.target_date);

      return `
        <div class="goal-card ${isCompleted ? 'goal-completed' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <span class="badge ${this.getCategoryBadgeClass(g.category)}">${g.category || 'Personal'}</span>
            <span class="badge ${isCompleted ? 'badge-success' : 'badge-primary'}">
              ${isCompleted ? 'Completed' : 'In Progress'}
            </span>
          </div>

          <h3 style="font-size: 1.15rem; margin-bottom: 0.35rem;">${this.escape(g.title)}</h3>
          ${g.description ? `<p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem; flex: 1;">${this.escape(g.description)}</p>` : '<div style="flex: 1;"></div>'}

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.25rem;">
              <span>Target: ${g.target_date || 'No deadline'} (${daysLeft})</span>
              <span style="color: var(--primary);">${g.progress || 0}%</span>
            </div>

            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width: ${g.progress || 0}%;"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.875rem;">
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.goalsUI.adjustProgress('${g.id}', -10)" title="-10%">-10%</button>
                <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.goalsUI.adjustProgress('${g.id}', 10)" title="+10%">+10%</button>
                <button class="btn ${isCompleted ? 'btn-outline' : 'btn-primary'} btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.goalsUI.toggleGoalComplete('${g.id}')">
                  ${isCompleted ? 'Reopen' : '✓ Finish'}
                </button>
              </div>

              <div style="display: flex; gap: 0.25rem;">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="window.goalsUI.openEditModal('${g.id}')" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon" onclick="window.goalsUI.deleteGoal('${g.id}')" title="Delete" style="color: var(--danger);">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  calculateDaysLeft(targetDateStr) {
    if (!targetDateStr) return 'Ongoing';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    if (diff === 0) return 'Due today';
    return `${diff}d left`;
  }

  getCategoryBadgeClass(cat) {
    switch (cat) {
      case 'Career': return 'badge-info';
      case 'Savings': return 'badge-success';
      case 'Fitness': return 'badge-warning';
      case 'Study': return 'badge-purple';
      default: return 'badge-primary';
    }
  }

  setFilterStatus(status) {
    window.appState.goalFilter.status = status;
    document.querySelectorAll('.goal-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
    this.render();
  }

  setFilterCategory(cat) {
    window.appState.goalFilter.category = cat;
    this.render();
  }

  setSearchQuery(q) {
    window.appState.goalFilter.search = q;
    this.render();
  }

  async adjustProgress(id, delta) {
    const goal = window.appState.goals.find(g => g.id === id);
    if (!goal) return;
    const current = goal.progress || 0;
    const nextVal = Math.min(100, Math.max(0, current + delta));
    const status = nextVal === 100 ? 'Completed' : 'In Progress';

    goal.progress = nextVal;
    goal.status = status;
    window.appState.setGoals([...window.appState.goals]);
    this.render();
    window.dashboardUI.render();

    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.updateGoal(id, { progress: nextVal, status }, userId);
    } catch (err) {
      window.app.showToast('Failed to update progress: ' + err.message, 'error');
    }
  }

  async toggleGoalComplete(id) {
    const goal = window.appState.goals.find(g => g.id === id);
    if (!goal) return;
    const isNowCompleted = goal.status !== 'Completed';
    const nextProgress = isNowCompleted ? 100 : Math.min(goal.progress, 90);
    const status = isNowCompleted ? 'Completed' : 'In Progress';

    goal.progress = nextProgress;
    goal.status = status;
    window.appState.setGoals([...window.appState.goals]);
    this.render();
    window.dashboardUI.render();

    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.updateGoal(id, { progress: nextProgress, status }, userId);
      window.app.showToast(isNowCompleted ? 'Goal completed! 🏆' : 'Goal reopened.', 'success');
    } catch (err) {
      window.app.showToast('Failed to update goal: ' + err.message, 'error');
    }
  }

  openCreateModal() {
    this.editingGoalId = null;
    document.getElementById('goal-modal-title').textContent = 'Create New Goal';
    document.getElementById('goal-input-title').value = '';
    document.getElementById('goal-input-desc').value = '';
    document.getElementById('goal-input-category').value = 'Career';
    document.getElementById('goal-input-date').value = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    document.getElementById('goal-input-progress').value = 0;
    document.getElementById('goal-progress-display').textContent = '0%';
    window.app.openModal('modal-goal');
  }

  openEditModal(id) {
    const goal = window.appState.goals.find(g => g.id === id);
    if (!goal) return;
    this.editingGoalId = id;
    document.getElementById('goal-modal-title').textContent = 'Edit Goal';
    document.getElementById('goal-input-title').value = goal.title || '';
    document.getElementById('goal-input-desc').value = goal.description || '';
    document.getElementById('goal-input-category').value = goal.category || 'Career';
    document.getElementById('goal-input-date').value = goal.target_date || '';
    document.getElementById('goal-input-progress').value = goal.progress || 0;
    document.getElementById('goal-progress-display').textContent = `${goal.progress || 0}%`;
    window.app.openModal('modal-goal');
  }

  async saveGoalFromModal(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('goal-input-title').value.trim();
    if (!title) {
      window.app.showToast('Please provide a goal title.', 'warning');
      return;
    }
    const description = document.getElementById('goal-input-desc').value.trim();
    const category = document.getElementById('goal-input-category').value;
    const target_date = document.getElementById('goal-input-date').value;
    const progress = parseInt(document.getElementById('goal-input-progress').value, 10) || 0;
    const status = progress >= 100 ? 'Completed' : 'In Progress';
    const userId = window.appState.user?.id || 'demo_user';

    try {
      if (this.editingGoalId) {
        await window.supabaseService.updateGoal(
          this.editingGoalId,
          { title, description, category, target_date, progress, status },
          userId
        );
        window.app.showToast('Goal updated successfully!', 'success');
      } else {
        await window.supabaseService.createGoal({
          user_id: userId,
          title,
          description,
          category,
          target_date,
          progress,
          status
        });
        window.app.showToast('Goal created successfully!', 'success');
      }

      const goals = await window.supabaseService.getGoals(userId);
      window.appState.setGoals(goals);
      window.app.closeModal('modal-goal');
      this.render();
      window.dashboardUI.render();
    } catch (err) {
      window.app.showToast('Error saving goal: ' + err.message, 'error');
    }
  }

  async deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.deleteGoal(id, userId);
      const goals = await window.supabaseService.getGoals(userId);
      window.appState.setGoals(goals);
      this.render();
      window.dashboardUI.render();
      window.app.showToast('Goal deleted.', 'info');
    } catch (err) {
      window.app.showToast('Error deleting goal: ' + err.message, 'error');
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

window.goalsUI = new GoalsUI();
