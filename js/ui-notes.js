/**
 * DailyDesk - Notes Management UI
 * Rich sticky-card grid, Pin/Unpin, Color selection, Search & CRUD.
 */

class NotesUI {
  constructor() {
    this.editingNoteId = null;
    this.selectedColor = '#4f46e5';
  }

  render() {
    const container = document.getElementById('view-notes');
    if (!container) return;

    const filter = window.appState.noteFilter;
    let list = [...window.appState.notes];

    // Category filter
    if (filter.category !== 'all') {
      list = list.filter(n => n.category === filter.category);
    }

    // Search query
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }

    // Sort: Pinned notes always first, then by updated/created date
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    const grid = document.getElementById('notes-cards-grid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3>No notes found</h3>
          <p>Capture thoughts, meeting briefs, ideas, and reminders.</p>
          <button class="btn btn-primary btn-sm" onclick="window.notesUI.openCreateModal()">+ Create Note</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(n => `
      <div class="note-card ${n.is_pinned ? 'pinned' : ''}" style="border-top-color: ${n.color || 'var(--primary)'};">
        <button class="note-pin-btn ${n.is_pinned ? 'pinned' : ''}" title="${n.is_pinned ? 'Unpin' : 'Pin'}" onclick="window.notesUI.togglePin('${n.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${n.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
        </button>
        <div class="note-title">${this.escape(n.title)}</div>
        <div class="note-body">${this.escape(n.content)}</div>
        <div class="note-footer">
          <span class="badge" style="background: ${n.color || '#4f46e5'}20; color: ${n.color || '#4f46e5'};">
            ${n.category || 'General'}
          </span>
          <div style="display: flex; gap: 0.25rem;">
            <button class="btn btn-ghost btn-sm btn-icon" onclick="window.notesUI.openEditModal('${n.id}')" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="window.notesUI.deleteNote('${n.id}')" title="Delete" style="color: var(--danger);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  setFilterCategory(cat) {
    window.appState.noteFilter.category = cat;
    this.render();
  }

  setSearchQuery(q) {
    window.appState.noteFilter.search = q;
    this.render();
  }

  async togglePin(id) {
    const note = window.appState.notes.find(n => n.id === id);
    if (!note) return;
    const newPinned = !note.is_pinned;
    note.is_pinned = newPinned;
    window.appState.setNotes([...window.appState.notes]);
    this.render();

    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.updateNote(id, { is_pinned: newPinned }, userId);
      window.app.showToast(newPinned ? 'Note pinned to top 📌' : 'Note unpinned.', 'info');
    } catch (err) {
      window.app.showToast('Failed to update note pin: ' + err.message, 'error');
    }
  }

  openCreateModal() {
    this.editingNoteId = null;
    this.selectedColor = '#4f46e5';
    document.getElementById('note-modal-title').textContent = 'Create New Note';
    document.getElementById('note-input-title').value = '';
    document.getElementById('note-input-content').value = '';
    document.getElementById('note-input-category').value = 'General';
    document.getElementById('note-input-pinned').checked = false;
    this.renderColorPickers();
    window.app.openModal('modal-note');
  }

  openEditModal(id) {
    const note = window.appState.notes.find(n => n.id === id);
    if (!note) return;
    this.editingNoteId = id;
    this.selectedColor = note.color || '#4f46e5';
    document.getElementById('note-modal-title').textContent = 'Edit Note';
    document.getElementById('note-input-title').value = note.title || '';
    document.getElementById('note-input-content').value = note.content || '';
    document.getElementById('note-input-category').value = note.category || 'General';
    document.getElementById('note-input-pinned').checked = !!note.is_pinned;
    this.renderColorPickers();
    window.app.openModal('modal-note');
  }

  renderColorPickers() {
    const container = document.getElementById('note-color-picker-container');
    if (!container) return;
    container.innerHTML = CONFIG.NOTE_COLORS.map(color => `
      <div 
        onclick="window.notesUI.setColor('${color}')"
        style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; cursor: pointer; border: ${this.selectedColor === color ? '3px solid #fff' : '2px solid transparent'}; box-shadow: 0 0 0 1px var(--border-color); transition: transform 0.15s;"
        class="${this.selectedColor === color ? 'selected-color' : ''}"
      ></div>
    `).join('');
  }

  setColor(color) {
    this.selectedColor = color;
    this.renderColorPickers();
  }

  async saveNoteFromModal(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('note-input-title').value.trim();
    if (!title) {
      window.app.showToast('Please provide a note title.', 'warning');
      return;
    }
    const content = document.getElementById('note-input-content').value.trim();
    const category = document.getElementById('note-input-category').value;
    const is_pinned = document.getElementById('note-input-pinned').checked;
    const color = this.selectedColor;
    const userId = window.appState.user?.id || 'demo_user';

    try {
      if (this.editingNoteId) {
        await window.supabaseService.updateNote(
          this.editingNoteId,
          { title, content, category, is_pinned, color },
          userId
        );
        window.app.showToast('Note updated successfully!', 'success');
      } else {
        await window.supabaseService.createNote({
          user_id: userId,
          title,
          content,
          category,
          is_pinned,
          color
        });
        window.app.showToast('Note saved successfully!', 'success');
      }

      const notes = await window.supabaseService.getNotes(userId);
      window.appState.setNotes(notes);
      window.app.closeModal('modal-note');
      this.render();
    } catch (err) {
      window.app.showToast('Error saving note: ' + err.message, 'error');
    }
  }

  async deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const userId = window.appState.user?.id || 'demo_user';
    try {
      await window.supabaseService.deleteNote(id, userId);
      const notes = await window.supabaseService.getNotes(userId);
      window.appState.setNotes(notes);
      this.render();
      window.app.showToast('Note deleted.', 'info');
    } catch (err) {
      window.app.showToast('Error deleting note: ' + err.message, 'error');
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

window.notesUI = new NotesUI();
