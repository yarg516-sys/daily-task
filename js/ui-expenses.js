/**
 * DailyDesk - Expense Tracker UI
 * CRUD, Analytics charts, Summary metrics, Multi-filter & CSV Export.
 */

class ExpensesUI {
  constructor() {
    this.editingExpenseId = null;
    this.catChart = null;
    this.timeChart = null;
  }

  render() {
    const container = document.getElementById('view-expenses');
    if (!container) return;

    const stats = window.appState.getStats();
    const currency = window.appState.profile.currency || '$';
    const filter = window.appState.expenseFilter;
    let list = [...window.appState.expenses];

    // Weekly spending calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySpending = window.appState.expenses
      .filter(e => new Date(e.expense_date) >= oneWeekAgo)
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Summary Cards
    const elToday = document.getElementById('exp-stat-today');
    if (elToday) elToday.textContent = `${currency}${stats.todayExpenses.toFixed(2)}`;
    const elWeek = document.getElementById('exp-stat-week');
    if (elWeek) elWeek.textContent = `${currency}${weeklySpending.toFixed(2)}`;
    const elMonth = document.getElementById('exp-stat-month');
    if (elMonth) elMonth.textContent = `${currency}${stats.monthlyExpenses.toFixed(2)}`;
    const elTotal = document.getElementById('exp-stat-total');
    if (elTotal) elTotal.textContent = `${currency}${stats.totalExpenses.toFixed(2)}`;

    // Filters
    if (filter.category !== 'all') {
      list = list.filter(e => e.category === filter.category);
    }

    const todayStr = stats.todayStr;
    const now = new Date();
    if (filter.range === 'today') {
      list = list.filter(e => e.expense_date === todayStr);
    } else if (filter.range === 'week') {
      list = list.filter(e => new Date(e.expense_date) >= oneWeekAgo);
    } else if (filter.range === 'month') {
      list = list.filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.payment_method && e.payment_method.toLowerCase().includes(q))
      );
    }

    // Render Table
    const tableBody = document.getElementById('expenses-table-body');
    if (tableBody) {
      if (list.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
              No expenses found matching the current filters.
              <br><br>
              <button class="btn btn-primary btn-sm" onclick="window.expensesUI.openCreateModal()">+ Log New Expense</button>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = list.map(e => `
          <tr>
            <td>
              <div style="font-weight: 700;">${this.escape(e.title)}</div>
              ${e.description ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${this.escape(e.description)}</div>` : ''}
            </td>
            <td>
              <span class="badge ${this.getCategoryBadgeClass(e.category)}">${e.category}</span>
            </td>
            <td>${e.expense_date}</td>
            <td>
              <span style="font-size: 0.8125rem; color: var(--text-secondary);">${e.payment_method || 'Card'}</span>
            </td>
            <td>
              <span style="font-weight: 800; color: var(--danger); font-size: 0.9375rem;">
                -${currency}${parseFloat(e.amount).toFixed(2)}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="window.expensesUI.openEditModal('${e.id}')" title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="window.expensesUI.deleteExpense('${e.id}')" title="Delete" style="color: var(--danger);">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Render Expense Charts
    this.renderExpenseCharts(list);
  }

  getCategoryBadgeClass(cat) {
    switch (cat) {
      case 'Food': return 'badge-warning';
      case 'Bills': return 'badge-danger';
      case 'Transport': return 'badge-info';
      case 'Shopping': return 'badge-purple';
      case 'Education': return 'badge-primary';
      default: return 'badge-success';
    }
  }

  renderExpenseCharts(expenses) {
    if (typeof Chart === 'undefined') return;

    // 1. By Category Chart
    const catCanvas = document.getElementById('expenseCategoryChart');
    if (catCanvas) {
      const ctx = catCanvas.getContext('2d');
      if (this.catChart) this.catChart.destroy();

      const catTotals = {};
      expenses.forEach(e => {
        const cat = e.category || 'Other';
        catTotals[cat] = (catTotals[cat] || 0) + parseFloat(e.amount || 0);
      });

      const labels = Object.keys(catTotals);
      const data = Object.values(catTotals);

      this.catChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels.length > 0 ? labels : ['No Expenses'],
          datasets: [{
            data: data.length > 0 ? data : [1],
            backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
          },
          cutout: '65%'
        }
      });
    }

    // 2. Spending by Date / Time Chart
    const timeCanvas = document.getElementById('expenseTimelineChart');
    if (timeCanvas) {
      const ctx = timeCanvas.getContext('2d');
      if (this.timeChart) this.timeChart.destroy();

      // Aggregate by recent dates
      const dateTotals = {};
      expenses.slice(0, 10).reverse().forEach(e => {
        dateTotals[e.expense_date] = (dateTotals[e.expense_date] || 0) + parseFloat(e.amount || 0);
      });

      this.timeChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Object.keys(dateTotals),
          datasets: [{
            label: 'Amount Spent',
            data: Object.values(dateTotals),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ef4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(150, 150, 150, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  setFilterCategory(cat) {
    window.appState.expenseFilter.category = cat;
    this.render();
  }

  setFilterRange(range) {
    window.appState.expenseFilter.range = range;
    document.querySelectorAll('.exp-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.range === range);
    });
    this.render();
  }

  setSearchQuery(q) {
    window.appState.expenseFilter.search = q;
    this.render();
  }

  openCreateModal(defaultDate = '') {
    this.editingExpenseId = null;
    document.getElementById('expense-modal-title').textContent = 'Log New Expense';
    document.getElementById('expense-input-title').value = '';
    document.getElementById('expense-input-amount').value = '';
    document.getElementById('expense-input-category').value = 'Food';
    document.getElementById('expense-input-date').value = defaultDate || new Date().toISOString().split('T')[0];
    document.getElementById('expense-input-payment').value = 'Card';
    document.getElementById('expense-input-desc').value = '';
    window.app.openModal('modal-expense');
  }

  openEditModal(id) {
    const expense = window.appState.expenses.find(e => e.id === id);
    if (!expense) return;
    this.editingExpenseId = id;
    document.getElementById('expense-modal-title').textContent = 'Edit Expense';
    document.getElementById('expense-input-title').value = expense.title || '';
    document.getElementById('expense-input-amount').value = expense.amount || '';
    document.getElementById('expense-input-category').value = expense.category || 'Food';
    document.getElementById('expense-input-date').value = expense.expense_date || '';
    document.getElementById('expense-input-payment').value = expense.payment_method || 'Card';
    document.getElementById('expense-input-desc').value = expense.description || '';
    window.app.openModal('modal-expense');
  }

  async saveExpenseFromModal(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('expense-input-title').value.trim();
    const amountVal = parseFloat(document.getElementById('expense-input-amount').value);

    if (!title || isNaN(amountVal) || amountVal <= 0) {
      window.app.showToast('Please enter a valid title and positive amount.', 'warning');
      return;
    }

    const category = document.getElementById('expense-input-category').value;
    const expense_date = document.getElementById('expense-input-date').value;
    const payment_method = document.getElementById('expense-input-payment').value;
    const description = document.getElementById('expense-input-desc').value.trim();
    const userId = window.appState.user?.id || 'demo_user';

    try {
      if (this.editingExpenseId) {
        await window.supabaseService.updateExpense(
          this.editingExpenseId,
          { title, amount: amountVal, category, expense_date, payment_method, description },
          userId
        );
        window.app.showToast('Expense updated successfully!', 'success');
      } else {
        await window.supabaseService.createExpense({
          user_id: userId,
          title,
          amount: amountVal,
          category,
          expense_date,
          payment_method,
          description
        });
        window.app.showToast('Expense logged successfully!', 'success');
      }

      const expenses = await window.supabaseService.getExpenses(userId);
      window.appState.setExpenses(expenses);
      window.app.closeModal('modal-expense');
      this.render();
      window.dashboardUI.render();
    } catch (err) {
      window.app.showToast('Error saving expense: ' + err.message, 'error');
    }
  }

  async deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.deleteExpense(id, userId);
      const expenses = await window.supabaseService.getExpenses(userId);
      window.appState.setExpenses(expenses);
      this.render();
      window.dashboardUI.render();
      window.app.showToast('Expense record deleted.', 'info');
    } catch (err) {
      window.app.showToast('Error deleting expense: ' + err.message, 'error');
    }
  }

  exportCSV() {
    const expenses = window.appState.expenses;
    if (expenses.length === 0) {
      window.app.showToast('No expenses available to export.', 'warning');
      return;
    }

    const headers = ['Title', 'Amount', 'Category', 'Date', 'Payment Method', 'Description'];
    const rows = expenses.map(e => [
      `"${(e.title || '').replace(/"/g, '""')}"`,
      parseFloat(e.amount).toFixed(2),
      `"${e.category}"`,
      e.expense_date,
      `"${e.payment_method || 'Card'}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DailyDesk_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.app.showToast('Expenses exported to CSV!', 'success');
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

window.expensesUI = new ExpensesUI();
