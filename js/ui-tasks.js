/**
 * DailyDesk - Task Management UI
 * Full CRUD, Filter by Status/Category/Priority, Search, and Sort.
 */

class TasksUI {
  constructor() {
    this.editingTaskId = null;
  }

  render() {
    const container = document.getElementById('view-tasks');
    if (!container) return;

    const filter = window.appState.taskFilter;
    let list = [...window.appState.tasks];
    const todayStr = new Date().toISOString().split('T')[0];

    // Status filter
    if (filter.status === 'today') {
      list = list.filter(t => t.due_date === todayStr);
    } else if (filter.status === 'upcoming') {
      list = list.filter(t => t.due_date && t.due_date > todayStr && !t.completed);
    } else if (filter.status === 'completed') {
      list = list.filter(t => t.completed);
    } else if (filter.status === 'pending') {
      list = list.filter(t => !t.completed);
    }

    // Category filter
    if (filter.category !== 'all') {
      list = list.filter(t => t.category === filter.category);
    }

    // Priority filter
    if (filter.priority !== 'all') {
      list = list.filter(t => t.priority === filter.priority);
    }

    // Search query
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    if (filter.sort === 'priority-desc') {
      list.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    } else if (filter.sort === 'date-asc') {
      list.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
    } else if (filter.sort === 'date-desc') {
      list.sort((a, b) => (b.due_date || '').localeCompare(a.due_date || ''));
    }

    // Update Counts in tabs
    const allCount = window.appState.tasks.length;
    const todayCount = window.appState.tasks.filter(t => t.due_date === todayStr).length;
    const completedCount = window.appState.tasks.filter(t => t.completed).length;
    const upcomingCount = window.appState.tasks.filter(t => t.due_date && t.due_date > todayStr && !t.completed).length;

    const elAll = document.getElementById('task-tab-count-all');
    if (elAll) elAll.textContent = allCount;
    const elToday = document.getElementById('task-tab-count-today');
    if (elToday) elToday.textContent = todayCount;
    const elUpcoming = document.getElementById('task-tab-count-upcoming');
    if (elUpcoming) elUpcoming.textContent = upcomingCount;
    const elCompleted = document.getElementById('task-tab-count-completed');
    if (elCompleted) elCompleted.textContent = completedCount;
    const elSidebarCount = document.getElementById('sidebar-tasks-count');
    if (elSidebarCount) elSidebarCount.textContent = allCount - completedCount;

    // Render List
    const listContainer = document.getElementById('tasks-items-list');
    if (!listContainer) return;

    if (list.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <h3>No tasks match your filters</h3>
          <p>Try switching filter tabs or create a new task to get things done!</p>
          <button class="btn btn-primary btn-sm" onclick="window.tasksUI.openCreateModal()">+ Create New Task</button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = list.map(t => {
      const isOverdue = t.due_date && t.due_date < todayStr && !t.completed;
      return `
        <div class="task-item ${t.completed ? 'completed' : ''}" id="task-node-${t.id}">
          <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="window.tasksUI.toggleTaskComplete('${t.id}')">
            ${t.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </div>
          <div class="task-content">
            <div class="task-title">${this.escape(t.title)}</div>
            ${t.description ? `<p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.2rem;">${this.escape(t.description)}</p>` : ''}
            <div class="task-meta">
              <span class="badge ${t.priority === 'High' ? 'badge-danger' : t.priority === 'Medium' ? 'badge-warning' : 'badge-primary'}">${t.priority}</span>
              <span class="badge badge-purple">${t.category}</span>
              <span style="${isOverdue ? 'color: var(--danger); font-weight: 700;' : ''}">
                ${isOverdue ? '⚠️ Overdue: ' : '📅 '} ${t.due_date || 'No due date'}
              </span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn btn-ghost btn-sm btn-icon" title="Edit Task" onclick="window.tasksUI.openEditModal('${t.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" title="Delete Task" onclick="window.tasksUI.deleteTask('${t.id}')" style="color: var(--danger);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  setFilterStatus(status) {
    window.appState.taskFilter.status = status;
    document.querySelectorAll('.task-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
    this.render();
  }

  setFilterCategory(cat) {
    window.appState.taskFilter.category = cat;
    this.render();
  }

  setFilterPriority(pri) {
    window.appState.taskFilter.priority = pri;
    this.render();
  }

  setFilterSort(sort) {
    window.appState.taskFilter.sort = sort;
    this.render();
  }

  setSearchQuery(q) {
    window.appState.taskFilter.search = q;
    this.render();
  }

  async toggleTaskComplete(id) {
    const task = window.appState.tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = !task.completed;
    
    // Optimistic UI update
    task.completed = newStatus;
    window.appState.setTasks([...window.appState.tasks]);
    window.dashboardUI.render();

    try {
      await window.supabaseService.updateTask(id, { completed: newStatus }, window.appState.user?.id || 'demo');
      window.app.showToast(newStatus ? 'Task marked complete! 🎉' : 'Task marked pending.', 'info');
    } catch (err) {
      window.app.showToast('Failed to update task: ' + err.message, 'error');
    }
  }

  openCreateModal(defaultDate = '') {
    this.editingTaskId = null;
    document.getElementById('task-modal-title').textContent = 'Create New Task';
    document.getElementById('task-input-title').value = '';
    document.getElementById('task-input-desc').value = '';
    document.getElementById('task-input-category').value = 'Work';
    document.getElementById('task-input-priority').value = 'Medium';
    document.getElementById('task-input-date').value = defaultDate || new Date().toISOString().split('T')[0];
    window.app.openModal('modal-task');
  }

  openEditModal(id) {
    const task = window.appState.tasks.find(t => t.id === id);
    if (!task) return;
    this.editingTaskId = id;
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-input-title').value = task.title || '';
    document.getElementById('task-input-desc').value = task.description || '';
    document.getElementById('task-input-category').value = task.category || 'Work';
    document.getElementById('task-input-priority').value = task.priority || 'Medium';
    document.getElementById('task-input-date').value = task.due_date || '';
    window.app.openModal('modal-task');
  }

  async saveTaskFromModal(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('task-input-title').value.trim();
    if (!title) {
      window.app.showToast('Please provide a task title.', 'warning');
      return;
    }
    const description = document.getElementById('task-input-desc').value.trim();
    const category = document.getElementById('task-input-category').value;
    const priority = document.getElementById('task-input-priority').value;
    const due_date = document.getElementById('task-input-date').value;

    const userId = window.appState.user?.id || 'demo_user';

    try {
      if (this.editingTaskId) {
        await window.supabaseService.updateTask(
          this.editingTaskId,
          { title, description, category, priority, due_date },
          userId
        );
        window.app.showToast('Task updated successfully!', 'success');
      } else {
        await window.supabaseService.createTask({
          user_id: userId,
          title,
          description,
          category,
          priority,
          due_date,
          completed: false
        });
        window.app.showToast('Task created successfully!', 'success');
      }

      // Refresh list
      const tasks = await window.supabaseService.getTasks(userId);
      window.appState.setTasks(tasks);
      window.app.closeModal('modal-task');
      this.render();
      window.dashboardUI.render();
    } catch (err) {
      window.app.showToast('Error saving task: ' + err.message, 'error');
    }
  }

  async deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.deleteTask(id, userId);
      const tasks = await window.supabaseService.getTasks(userId);
      window.appState.setTasks(tasks);
      this.render();
      window.dashboardUI.render();
      window.app.showToast('Task deleted.', 'info');
    } catch (err) {
      window.app.showToast('Error deleting task: ' + err.message, 'error');
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

window.tasksUI = new TasksUI();
