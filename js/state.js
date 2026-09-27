/**
 * DailyDesk - Central Reactive State Management
 */

class StateStore {
  constructor() {
    this.user = null;
    this.profile = {
      full_name: 'Alex Morgan',
      email: 'alex@dailydesk.app',
      currency: '$',
      daily_quote: 'Focus on progress, not perfection.',
      role: 'user'
    };
    this.tasks = [];
    this.expenses = [];
    this.notes = [];
    this.goals = [];

    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('dailydesk_theme') || 'dark';

    // Filters
    this.taskFilter = { status: 'all', category: 'all', priority: 'all', search: '', sort: 'date-desc' };
    this.expenseFilter = { category: 'all', range: 'all', search: '' };
    this.noteFilter = { category: 'all', search: '' };
    this.goalFilter = { category: 'all', status: 'all', search: '' };

    this.listeners = {};
  }

  // Subscribe to changes: 'user', 'tasks', 'expenses', 'notes', 'goals', 'view', 'all'
  subscribe(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data, this));
    }
    if (event !== 'all' && this.listeners['all']) {
      this.listeners['all'].forEach(cb => cb({ event, data }, this));
    }
  }

  setUser(user) {
    this.user = user;
    this.notify('user', user);
  }

  setProfile(profile) {
    this.profile = { ...this.profile, ...profile };
    this.notify('profile', this.profile);
  }

  setView(viewName) {
    this.currentView = viewName;
    this.notify('view', viewName);
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('dailydesk_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify('theme', theme);
  }

  setTasks(tasks) {
    this.tasks = tasks;
    this.notify('tasks', tasks);
  }

  setExpenses(expenses) {
    this.expenses = expenses;
    this.notify('expenses', expenses);
  }

  setNotes(notes) {
    this.notes = notes;
    this.notify('notes', notes);
  }

  setGoals(goals) {
    this.goals = goals;
    this.notify('goals', goals);
  }

  // Computed Properties & Statistics
  getStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Tasks metrics
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const todayTasks = this.tasks.filter(t => t.due_date === todayStr);
    const todayCompleted = todayTasks.filter(t => t.completed).length;

    // Expenses metrics
    const todayExpenses = this.expenses
      .filter(e => e.expense_date === todayStr)
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const monthlyExpenses = this.expenses
      .filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const totalExpenses = this.expenses
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Goals metrics
    const activeGoals = this.goals.filter(g => g.status !== 'Completed');
    const completedGoals = this.goals.filter(g => g.status === 'Completed');
    const avgGoalProgress = this.goals.length > 0
      ? Math.round(this.goals.reduce((sum, g) => sum + (g.progress || 0), 0) / this.goals.length)
      : 0;

    // Productivity Score (0 - 100%)
    let taskScore = todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 60 : (totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 40);
    let goalScore = (avgGoalProgress / 100) * 40;
    let productivityScore = Math.min(100, Math.round(taskScore + goalScore));

    return {
      todayStr,
      totalTasks,
      completedTasks,
      pendingTasks,
      todayTasksCount: todayTasks.length,
      todayCompletedCount: todayCompleted,
      todayExpenses,
      monthlyExpenses,
      totalExpenses,
      totalGoals: this.goals.length,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      avgGoalProgress,
      totalNotes: this.notes.length,
      pinnedNotes: this.notes.filter(n => n.is_pinned).length,
      productivityScore
    };
  }
}

// Global App State
window.appState = new StateStore();
