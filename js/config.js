/**
 * DailyDesk - Configuration & Constants
 */
const CONFIG = {
  APP_NAME: 'DailyDesk',
  TAGLINE: 'Everything you need for a more organized day.',
  VERSION: '1.0.0',
  
  // Supabase Credentials
  SUPABASE_URL: 'https://lfinbgixmzqwoqzkwqdx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaW5iZ2l4bXpxd29xemt3cWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDU0NjIsImV4cCI6MjEwNjAyMTQ2Mn0.TM30XGOCenzFI3zLzLbdD8yZCnb08PITuYXDpCkoRSw',

  // Categories
  TASK_CATEGORIES: ['Work', 'Study', 'Personal', 'Shopping', 'Other'],
  TASK_PRIORITIES: ['Low', 'Medium', 'High'],
  
  EXPENSE_CATEGORIES: ['Food', 'Transport', 'Shopping', 'Education', 'Bills', 'Entertainment', 'Other'],
  EXPENSE_PAYMENT_METHODS: ['Card', 'Cash', 'Online Transfer', 'UPI / Wallet', 'Other'],

  NOTE_CATEGORIES: ['Work', 'Personal', 'Ideas', 'Study', 'Meeting', 'General'],
  NOTE_COLORS: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],

  GOAL_CATEGORIES: ['Study', 'Career', 'Personal', 'Savings', 'Fitness', 'Other'],

  CURRENCIES: [
    { symbol: '$', name: 'USD ($)', code: 'USD' },
    { symbol: '€', name: 'EUR (€)', code: 'EUR' },
    { symbol: '£', name: 'GBP (£)', code: 'GBP' },
    { symbol: '₹', name: 'INR (₹)', code: 'INR' },
    { symbol: '¥', name: 'JPY (¥)', code: 'JPY' },
    { symbol: 'AED', name: 'AED (AED)', code: 'AED' }
  ],

  // Realistic sample data for first presentation
  SAMPLE_DATA: {
    tasks: [
      {
        title: 'Review quarterly product design mockups',
        description: 'Check navigation hierarchy, color contrast and responsive mobile states.',
        category: 'Work',
        priority: 'High',
        due_date: new Date().toISOString().split('T')[0],
        completed: false
      },
      {
        title: 'Finish chapters 4 & 5 of System Architecture book',
        description: 'Summarize key takeaways in DailyDesk notes for quick exam reference.',
        category: 'Study',
        priority: 'Medium',
        due_date: new Date().toISOString().split('T')[0],
        completed: true
      },
      {
        title: 'Weekly grocery restock (fruits, oats & almond milk)',
        description: 'Check pantry essentials before visiting local organic market.',
        category: 'Shopping',
        priority: 'Low',
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        completed: false
      },
      {
        title: 'Schedule annual vehicle service & tire rotation',
        description: 'Book appointment with service center before Friday afternoon.',
        category: 'Personal',
        priority: 'Medium',
        due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        completed: false
      }
    ],
    expenses: [
      {
        title: 'Whole Foods Market grocery haul',
        amount: 84.50,
        category: 'Food',
        expense_date: new Date().toISOString().split('T')[0],
        description: 'Fresh organic greens, seasonal fruits and grains',
        payment_method: 'Card'
      },
      {
        title: 'Monthly high-speed fiber internet subscription',
        amount: 65.00,
        category: 'Bills',
        expense_date: new Date().toISOString().split('T')[0],
        description: 'Home workstation fiber 500Mbps connection',
        payment_method: 'Online Transfer'
      },
      {
        title: 'Metro commuter transit pass recharge',
        amount: 32.00,
        category: 'Transport',
        expense_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        description: 'Monthly unlimited commuter train card reload',
        payment_method: 'Card'
      },
      {
        title: 'Cloud computing and domain renewal',
        amount: 28.00,
        category: 'Education',
        expense_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        description: 'Web development portfolio hosting & DNS',
        payment_method: 'Card'
      },
      {
        title: 'Weekend cinema tickets with friends',
        amount: 24.50,
        category: 'Entertainment',
        expense_date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
        description: 'IMAX screening and snacks',
        payment_method: 'UPI / Wallet'
      }
    ],
    notes: [
      {
        title: 'Project Roadmap & Key Milestones',
        content: '1. Supabase database integration & RLS verification\n2. Responsive UI optimization for mobile & tablet\n3. Financial charts & weekly spending analytics\n4. Presentation polish and user experience walkthrough',
        category: 'Work',
        color: '#4f46e5',
        is_pinned: true
      },
      {
        title: 'Morning Productivity Routine',
        content: '- 6:30 AM: Hydrate, 15 min mobility stretch\n- 7:00 AM: Review DailyDesk "My Day" checklist\n- 7:30 AM: Deep work block for highest-priority task\n- 12:00 PM: Balanced meal & 20 min walk',
        category: 'Personal',
        color: '#10b981',
        is_pinned: true
      },
      {
        title: 'Design Philosophy: Minimal & Impactful',
        content: 'Use high contrast, generous white space, clear typography hierarchy, and subtle micro-interactions to make software feel swift, calm, and dependable.',
        category: 'Ideas',
        color: '#8b5cf6',
        is_pinned: false
      }
    ],
    goals: [
      {
        title: 'Master Full-Stack Cloud Architecture',
        description: 'Complete hands-on projects with PostgreSQL, Supabase, and real-time APIs.',
        category: 'Career',
        target_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        target_amount: 0,
        progress: 75,
        status: 'In Progress'
      },
      {
        title: 'Emergency Rainy Day Fund Savings',
        description: 'Accumulate 3 months of essential living expenses in high-yield account.',
        category: 'Savings',
        target_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
        target_amount: 3000,
        progress: 60,
        status: 'In Progress'
      },
      {
        title: 'Run 10K Distance Without Stopping',
        description: 'Follow 8-week structured interval running program 3 days/week.',
        category: 'Fitness',
        target_date: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        target_amount: 0,
        progress: 40,
        status: 'In Progress'
      }
    ]
  }
};
