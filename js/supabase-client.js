/**
 * DailyDesk - Supabase Integration Client
 * Handles Auth, Database operations, RLS, and gracefully handles network/table states.
 */

class SupabaseService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.tableStatus = {
      profiles: false,
      tasks: false,
      expenses: false,
      notes: false,
      goals: false
    };
    this.init();
  }

  init() {
    try {
      if (window.supabase) {
        this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        this.isInitialized = true;
        console.log('DailyDesk: Supabase client initialized successfully.');
      } else {
        console.warn('DailyDesk: window.supabase SDK not loaded yet.');
      }
    } catch (err) {
      console.error('DailyDesk: Error initializing Supabase client:', err);
    }
  }

  // Check table availability in Supabase
  async checkTables() {
    if (!this.client) return this.tableStatus;
    const tables = ['profiles', 'tasks', 'expenses', 'notes', 'goals'];
    
    for (const table of tables) {
      try {
        const { error } = await this.client.from(table).select('id').limit(1);
        if (!error || error.code === 'PGRST116') {
          this.tableStatus[table] = true;
        } else {
          // If error indicates table doesn't exist (e.g. 404 / 42P01)
          this.tableStatus[table] = false;
        }
      } catch (e) {
        this.tableStatus[table] = false;
      }
    }
    return this.tableStatus;
  }

  // ================= AUTH METHODS =================

  async getSession() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.warn('Session check:', err.message);
      return null;
    }
  }

  async signUp(email, password, fullName = '') {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
        }
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    const { error } = await this.client.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  }

  onAuthStateChange(callback) {
    if (!this.client) return { data: { subscription: { unsubscribe: () => {} } } };
    return this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // ================= PROFILE METHODS =================

  async getProfile(userId) {
    if (!this.client || !this.tableStatus.profiles) {
      // Local fallback profile
      return JSON.parse(localStorage.getItem(`dailydesk_profile_${userId}`)) || {
        id: userId,
        full_name: 'Productivity Champion',
        email: 'user@dailydesk.app',
        currency: '$',
        daily_quote: 'Focus on progress, not perfection.',
        role: 'user'
      };
    }
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
      return JSON.parse(localStorage.getItem(`dailydesk_profile_${userId}`));
    }
  }

  async updateProfile(userId, updates) {
    localStorage.setItem(`dailydesk_profile_${userId}`, JSON.stringify(updates));
    if (!this.client || !this.tableStatus.profiles) return updates;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Profile update warning:', err.message);
      return updates;
    }
  }

  // ================= TASKS CRUD =================

  async getTasks(userId) {
    if (!this.client || !this.tableStatus.tasks) {
      const stored = localStorage.getItem(`dailydesk_tasks_${userId}`);
      if (stored) return JSON.parse(stored);
      // Seed initial sample data if brand new
      const sample = CONFIG.SAMPLE_DATA.tasks.map(t => ({
        ...t,
        id: 'task_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem(`dailydesk_tasks_${userId}`, JSON.stringify(sample));
      return sample;
    }
    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      localStorage.setItem(`dailydesk_tasks_${userId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Tasks fetch warning:', err.message);
      return JSON.parse(localStorage.getItem(`dailydesk_tasks_${userId}`) || '[]');
    }
  }

  async createTask(task) {
    const localId = 'task_' + Math.random().toString(36).substr(2, 9);
    const newTask = {
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...task
    };

    // Update local store immediately for instant UI
    const localKey = `dailydesk_tasks_${task.user_id}`;
    const localTasks = JSON.parse(localStorage.getItem(localKey) || '[]');
    localTasks.unshift(newTask);
    localStorage.setItem(localKey, JSON.stringify(localTasks));

    if (!this.client || !this.tableStatus.tasks) return newTask;

    try {
      const payload = { ...task };
      delete payload.id; // Allow Postgres gen_random_uuid() to generate UUID
      const { data, error } = await this.client
        .from('tasks')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      // Sync local id with Supabase id
      const updatedLocal = localTasks.map(t => t.id === localId ? data : t);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
      return data;
    } catch (err) {
      console.error('Task create error in Supabase:', err.message);
      return newTask;
    }
  }

  async updateTask(id, updates, userId) {
    const localKey = `dailydesk_tasks_${userId}`;
    const localTasks = JSON.parse(localStorage.getItem(localKey) || '[]');
    const idx = localTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTasks[idx] = { ...localTasks[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(localTasks));
    }

    if (!this.client || !this.tableStatus.tasks) return localTasks[idx];

    try {
      const { data, error } = await this.client
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Task update warning:', err.message);
      return localTasks[idx];
    }
  }

  async deleteTask(id, userId) {
    const localKey = `dailydesk_tasks_${userId}`;
    const localTasks = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = localTasks.filter(t => t.id !== id);
    localStorage.setItem(localKey, JSON.stringify(filtered));

    if (!this.client || !this.tableStatus.tasks) return true;

    try {
      const { error } = await this.client
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Task delete warning:', err.message);
      return true;
    }
  }

  // ================= EXPENSES CRUD =================

  async getExpenses(userId) {
    if (!this.client || !this.tableStatus.expenses) {
      const stored = localStorage.getItem(`dailydesk_expenses_${userId}`);
      if (stored) return JSON.parse(stored);
      const sample = CONFIG.SAMPLE_DATA.expenses.map(e => ({
        ...e,
        id: 'exp_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem(`dailydesk_expenses_${userId}`, JSON.stringify(sample));
      return sample;
    }
    try {
      const { data, error } = await this.client
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      localStorage.setItem(`dailydesk_expenses_${userId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Expenses fetch warning:', err.message);
      return JSON.parse(localStorage.getItem(`dailydesk_expenses_${userId}`) || '[]');
    }
  }

  async createExpense(expense) {
    const localId = 'exp_' + Math.random().toString(36).substr(2, 9);
    const newExp = {
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...expense
    };

    const localKey = `dailydesk_expenses_${expense.user_id}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    localList.unshift(newExp);
    localStorage.setItem(localKey, JSON.stringify(localList));

    if (!this.client || !this.tableStatus.expenses) return newExp;

    try {
      const payload = { ...expense };
      delete payload.id;
      const { data, error } = await this.client
        .from('expenses')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      const updatedLocal = localList.map(e => e.id === localId ? data : e);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
      return data;
    } catch (err) {
      console.error('Expense create error in Supabase:', err.message);
      return newExp;
    }
  }

  async updateExpense(id, updates, userId) {
    const localKey = `dailydesk_expenses_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const idx = localList.findIndex(e => e.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(localList));
    }

    if (!this.client || !this.tableStatus.expenses) return localList[idx];

    try {
      const { data, error } = await this.client
        .from('expenses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Expense update warning:', err.message);
      return localList[idx];
    }
  }

  async deleteExpense(id, userId) {
    const localKey = `dailydesk_expenses_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = localList.filter(e => e.id !== id);
    localStorage.setItem(localKey, JSON.stringify(filtered));

    if (!this.client || !this.tableStatus.expenses) return true;

    try {
      const { error } = await this.client
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Expense delete warning:', err.message);
      return true;
    }
  }

  // ================= NOTES CRUD =================

  async getNotes(userId) {
    if (!this.client || !this.tableStatus.notes) {
      const stored = localStorage.getItem(`dailydesk_notes_${userId}`);
      if (stored) return JSON.parse(stored);
      const sample = CONFIG.SAMPLE_DATA.notes.map(n => ({
        ...n,
        id: 'note_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem(`dailydesk_notes_${userId}`, JSON.stringify(sample));
      return sample;
    }
    try {
      const { data, error } = await this.client
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      localStorage.setItem(`dailydesk_notes_${userId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Notes fetch warning:', err.message);
      return JSON.parse(localStorage.getItem(`dailydesk_notes_${userId}`) || '[]');
    }
  }

  async createNote(note) {
    const localId = 'note_' + Math.random().toString(36).substr(2, 9);
    const newNote = {
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...note
    };

    const localKey = `dailydesk_notes_${note.user_id}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    localList.unshift(newNote);
    localStorage.setItem(localKey, JSON.stringify(localList));

    if (!this.client || !this.tableStatus.notes) return newNote;

    try {
      const payload = { ...note };
      delete payload.id;
      const { data, error } = await this.client
        .from('notes')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      const updatedLocal = localList.map(n => n.id === localId ? data : n);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
      return data;
    } catch (err) {
      console.error('Note create error in Supabase:', err.message);
      return newNote;
    }
  }

  async updateNote(id, updates, userId) {
    const localKey = `dailydesk_notes_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const idx = localList.findIndex(n => n.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(localList));
    }

    if (!this.client || !this.tableStatus.notes) return localList[idx];

    try {
      const { data, error } = await this.client
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Note update warning:', err.message);
      return localList[idx];
    }
  }

  async deleteNote(id, userId) {
    const localKey = `dailydesk_notes_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = localList.filter(n => n.id !== id);
    localStorage.setItem(localKey, JSON.stringify(filtered));

    if (!this.client || !this.tableStatus.notes) return true;

    try {
      const { error } = await this.client
        .from('notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Note delete warning:', err.message);
      return true;
    }
  }

  // ================= GOALS CRUD =================

  async getGoals(userId) {
    if (!this.client || !this.tableStatus.goals) {
      const stored = localStorage.getItem(`dailydesk_goals_${userId}`);
      if (stored) return JSON.parse(stored);
      const sample = CONFIG.SAMPLE_DATA.goals.map(g => ({
        ...g,
        id: 'goal_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem(`dailydesk_goals_${userId}`, JSON.stringify(sample));
      return sample;
    }
    try {
      const { data, error } = await this.client
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      localStorage.setItem(`dailydesk_goals_${userId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Goals fetch warning:', err.message);
      return JSON.parse(localStorage.getItem(`dailydesk_goals_${userId}`) || '[]');
    }
  }

  async createGoal(goal) {
    const localId = 'goal_' + Math.random().toString(36).substr(2, 9);
    const newGoal = {
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...goal
    };

    const localKey = `dailydesk_goals_${goal.user_id}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    localList.unshift(newGoal);
    localStorage.setItem(localKey, JSON.stringify(localList));

    if (!this.client || !this.tableStatus.goals) return newGoal;

    try {
      const payload = { ...goal };
      delete payload.id;
      const { data, error } = await this.client
        .from('goals')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      const updatedLocal = localList.map(g => g.id === localId ? data : g);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
      return data;
    } catch (err) {
      console.error('Goal create error in Supabase:', err.message);
      return newGoal;
    }
  }

  async updateGoal(id, updates, userId) {
    const localKey = `dailydesk_goals_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const idx = localList.findIndex(g => g.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(localList));
    }

    if (!this.client || !this.tableStatus.goals) return localList[idx];

    try {
      const { data, error } = await this.client
        .from('goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Goal update warning:', err.message);
      return localList[idx];
    }
  }

  async deleteGoal(id, userId) {
    const localKey = `dailydesk_goals_${userId}`;
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = localList.filter(g => g.id !== id);
    localStorage.setItem(localKey, JSON.stringify(filtered));

    if (!this.client || !this.tableStatus.goals) return true;

    try {
      const { error } = await this.client
        .from('goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Goal delete warning:', err.message);
      return true;
    }
  }
}

// Global Supabase service instance
window.supabaseService = new SupabaseService();
