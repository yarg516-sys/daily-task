/**
 * DailyDesk - Global Search Modal (Ctrl+K)
 * Universal search across Tasks, Expenses, Notes, and Goals.
 */

class SearchUI {
  constructor() {
    this.modalEl = null;
    this.inputEl = null;
    this.resultsEl = null;
  }

  init() {
    this.modalEl = document.getElementById('modal-search');
    this.inputEl = document.getElementById('global-search-input');
    this.resultsEl = document.getElementById('global-search-results');

    if (this.inputEl) {
      this.inputEl.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Keyboard shortcut Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.open();
      }
    });
  }

  open() {
    if (!this.modalEl) return;
    window.app.openModal('modal-search');
    if (this.inputEl) {
      this.inputEl.value = '';
      setTimeout(() => this.inputEl.focus(), 100);
      this.handleSearch('');
    }
  }

  handleSearch(query) {
    if (!this.resultsEl) return;
    const q = (query || '').trim().toLowerCase();

    const tasks = window.appState.tasks.filter(t =>
      !q || (t.title && t.title.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q))
    );

    const expenses = window.appState.expenses.filter(e =>
      !q || (e.title && e.title.toLowerCase().includes(q)) || (e.category && e.category.toLowerCase().includes(q))
    );

    const notes = window.appState.notes.filter(n =>
      !q || (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q))
    );

    const goals = window.appState.goals.filter(g =>
      !q || (g.title && g.title.toLowerCase().includes(q)) || (g.description && g.description.toLowerCase().includes(q))
    );

    const totalCount = tasks.length + expenses.length + notes.length + goals.length;
    if (totalCount === 0) {
      this.resultsEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          No results found for "${this.escape(query)}".
        </div>
      `;
      return;
    }

    const currency = window.appState.profile.currency || '$';
    let html = '';

    // Tasks group
    if (tasks.length > 0) {
      html += `<div class="search-group-title">Tasks (${tasks.length})</div>`;
      tasks.slice(0, 4).forEach(t => {
        html += `
          <div class="search-result-item" onclick="window.searchUI.selectItem('tasks', '${t.id}')">
            <div class="search-result-left">
              <span class="badge ${t.priority === 'High' ? 'badge-danger' : 'badge-primary'}">${t.priority}</span>
              <div>
                <div class="search-result-title">${this.escape(t.title)}</div>
                <div class="search-result-sub">${t.category} • Due: ${t.due_date || 'No date'}</div>
              </div>
            </div>
            <span style="font-size: 0.75rem; color: var(--primary);">View Task →</span>
          </div>
        `;
      });
    }

    // Expenses group
    if (expenses.length > 0) {
      html += `<div class="search-group-title">Expenses (${expenses.length})</div>`;
      expenses.slice(0, 4).forEach(e => {
        html += `
          <div class="search-result-item" onclick="window.searchUI.selectItem('expenses', '${e.id}')">
            <div class="search-result-left">
              <span class="badge badge-info">${e.category}</span>
              <div>
                <div class="search-result-title">${this.escape(e.title)}</div>
                <div class="search-result-sub">${e.expense_date} • ${e.payment_method || 'Card'}</div>
              </div>
            </div>
            <span style="font-weight: 700; color: var(--danger); font-size: 0.875rem;">-${currency}${parseFloat(e.amount).toFixed(2)}</span>
          </div>
        `;
      });
    }

    // Notes group
    if (notes.length > 0) {
      html += `<div class="search-group-title">Notes (${notes.length})</div>`;
      notes.slice(0, 4).forEach(n => {
        html += `
          <div class="search-result-item" onclick="window.searchUI.selectItem('notes', '${n.id}')">
            <div class="search-result-left">
              <span class="badge badge-purple">${n.category}</span>
              <div>
                <div class="search-result-title">${this.escape(n.title)}</div>
                <div class="search-result-sub">${this.escape((n.content || '').substring(0, 45))}...</div>
              </div>
            </div>
            <span style="font-size: 0.75rem; color: var(--primary);">View Note →</span>
          </div>
        `;
      });
    }

    // Goals group
    if (goals.length > 0) {
      html += `<div class="search-group-title">Goals (${goals.length})</div>`;
      goals.slice(0, 4).forEach(g => {
        html += `
          <div class="search-result-item" onclick="window.searchUI.selectItem('goals', '${g.id}')">
            <div class="search-result-left">
              <span class="badge badge-warning">${g.category}</span>
              <div>
                <div class="search-result-title">${this.escape(g.title)}</div>
                <div class="search-result-sub">Progress: ${g.progress || 0}% • Due: ${g.target_date || 'No date'}</div>
              </div>
            </div>
            <span style="font-size: 0.75rem; color: var(--primary);">View Goal →</span>
          </div>
        `;
      });
    }

    this.resultsEl.innerHTML = html;
  }

  selectItem(view, id) {
    window.app.closeModal('modal-search');
    window.router.navigate(view);
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

window.searchUI = new SearchUI();
