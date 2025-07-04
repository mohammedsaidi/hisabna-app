


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Transaction,
  Category,
  Goal,
  RecurringTransaction,
  Budget,
  ActiveView,
  UserProfile,
  Debt,
} from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_CATEGORIES } from './constants';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import GoalsList from './components/GoalsList';
import CategoriesList from './components/CategoriesList';
import AIAssistant from './components/AIAssistant';
import BudgetPage from './components/BudgetPage';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import DebtsList from './components/DebtsList';

import {
  HomeIcon,
  WalletIcon,
  TargetIcon,
  TagIcon,
  LogOutIcon,
  BotIcon,
  PiggyBankIcon,
  SettingsIcon,
  MenuIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BarChartIcon,
  LandmarkIcon
} from './components/Icons';

type Theme = 'light' | 'dark';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: ActiveView;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    isSidebarCollapsed: boolean;
    closeMobileMenu: () => void;
}

const TooltipWrapper: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => {
    if (!label) return <>{children}</>;
    return (
        <div className="relative group flex justify-center">
            {children}
            <span className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-auto min-w-max p-2 text-xs font-bold text-white bg-gray-800 dark:bg-gray-900 rounded-md shadow-lg
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50
                            hidden md:block">
                {label}
            </span>
        </div>
    );
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, view, activeView, setActiveView, isSidebarCollapsed, closeMobileMenu }) => {
    const isActive = activeView === view;
    
    const handleClick = () => {
        setActiveView(view);
        closeMobileMenu();
    };

    return (
        <TooltipWrapper label={isSidebarCollapsed ? label : ""}>
            <button
                onClick={handleClick}
                className={`w-full flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} ${
                    isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-light-text-secondary hover:bg-light-interactive dark:text-brand-text-secondary hover:dark:bg-gray-700 hover:text-light-text-primary dark:hover:text-brand-text-primary'
                }`}
                aria-label={label}
            >
                <div className="w-6 h-6 flex-shrink-0">{icon}</div>
                <span className={`mr-4 transition-opacity ${isSidebarCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>{label}</span>
            </button>
        </TooltipWrapper>
    );
};

const App: React.FC = () => {
  const [password, setPassword] = useLocalStorage<string | null>('hisabna_password', null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('hisabna_sidebar_collapsed', false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<Theme>('hisabna_theme', 'light');
  const [autoLockTime, setAutoLockTime] = useLocalStorage<number>('hisabna_auto_lock_time', 15); // minutes, 0 for never

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('hisabna_transactions', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('hisabna_categories', DEFAULT_CATEGORIES);
  const [goals, setGoals] = useLocalStorage<Goal[]>('hisabna_goals', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('hisabna_recurring', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('hisabna_budgets', []);
  const [debts, setDebts] = useLocalStorage<Debt[]>('hisabna_debts', []);
  const [monthlyIncome, setMonthlyIncome] = useLocalStorage<number>('hisabna_monthly_income', 0);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('hisabna_user_profile', { name: 'مستخدم جديد', email: '' });
  
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const logoutTimer = useRef<number | undefined>(undefined);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveView('dashboard');
  }, []);

  const resetLogoutTimer = useCallback(() => {
    if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
    }
    if (autoLockTime > 0) {
        logoutTimer.current = window.setTimeout(() => {
            handleLogout();
        }, autoLockTime * 60 * 1000);
    }
  }, [autoLockTime, handleLogout]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
        root.classList.remove('dark');
    } else {
        root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetLogoutTimer));
        resetLogoutTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetLogoutTimer));
            if (logoutTimer.current) {
                clearTimeout(logoutTimer.current);
            }
        };
    }
  }, [isAuthenticated, resetLogoutTimer]);


  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);
  
  const handleSetPassword = useCallback((newPassword: string) => {
    setPassword(newPassword);
    setIsAuthenticated(true);
  }, [setPassword]);

  const clearAllData = useCallback(() => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف جميع البيانات بشكل دائم؟ لا يمكن التراجع عن هذا الإجراء.")) {
        localStorage.clear();
        window.location.reload();
    }
  }, []);

  const archiveTransactions = useCallback((startDate: string, endDate: string) => {
    const transactionsToArchive = transactions.filter(t => {
      const txDate = new Date(t.date).toISOString().split('T')[0];
      return txDate >= startDate && txDate <= endDate;
    });

    if (transactionsToArchive.length === 0) {
      alert("لا توجد معاملات في النطاق المحدد للأرشفة.");
      return;
    }

    const summaries: { [key: string]: { income: number, expense: number } } = {};
    transactionsToArchive.forEach(t => {
      if (!summaries[t.categoryId]) {
        summaries[t.categoryId] = { income: 0, expense: 0 };
      }
      summaries[t.categoryId][t.type] += t.amount;
    });

    const newSummaryTransactions: Transaction[] = [];
    const archiveDate = new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString();
    
    for (const categoryId in summaries) {
      const { income, expense } = summaries[categoryId];
      const categoryName = categoryMap.get(categoryId) || 'غير مصنف';

      if (income > 0) {
        newSummaryTransactions.push({
          id: `txn-sum-inc-${Date.now()}-${categoryId}`,
          type: 'income',
          amount: income,
          categoryId,
          date: archiveDate,
          description: `ملخص دخل "${categoryName}" للفترة من ${startDate} إلى ${endDate}`,
          invoiceImage: undefined
        });
      }
      if (expense > 0) {
        newSummaryTransactions.push({
          id: `txn-sum-exp-${Date.now()}-${categoryId}`,
          type: 'expense',
          amount: expense,
          categoryId,
          date: archiveDate,
          description: `ملخص مصروفات "${categoryName}" للفترة من ${startDate} إلى ${endDate}`,
          invoiceImage: undefined
        });
      }
    }

    const idsToArchive = new Set(transactionsToArchive.map(t => t.id));
    const transactionsToKeep = transactions.filter(t => !idsToArchive.has(t.id));

    setTransactions([...transactionsToKeep, ...newSummaryTransactions]);
    alert(`تمت أرشفة ${transactionsToArchive.length} معاملة بنجاح.`);

  }, [transactions, setTransactions, categoryMap]);

  
  const viewTitles: Record<ActiveView, string> = {
    dashboard: 'لوحة التحكم',
    transactions: 'المعاملات',
    budget: 'الميزانية',
    goals: 'الأهداف',
    categories: 'الفئات',
    reports: 'التقارير المالية',
    debts: 'إدارة الديون',
    settings: 'الإعدادات'
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
          transactions={transactions} 
          goals={goals}
          recurringTransactions={recurringTransactions}
          categories={categories}
          setTransactions={setTransactions}
          setRecurringTransactions={setRecurringTransactions}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          monthlyIncome={monthlyIncome}
          theme={theme}
          userProfile={userProfile}
          setActiveView={setActiveView}
          budgets={budgets}
          />;
      case 'transactions':
        return <TransactionsList 
          transactions={transactions}
          setTransactions={setTransactions}
          recurringTransactions={recurringTransactions}
          setRecurringTransactions={setRecurringTransactions}
          categories={categories}
          categoryMap={categoryMap}
          />;
      case 'goals':
        return <GoalsList 
          goals={goals}
          setGoals={setGoals}
          setTransactions={setTransactions}
          categories={categories}
          />;
      case 'categories':
        return <CategoriesList 
          categories={categories}
          setCategories={setCategories}
          />;
      case 'budget':
        return <BudgetPage
          budgets={budgets}
          setBudgets={setBudgets}
          transactions={transactions}
          categories={categories}
        />;
       case 'reports':
         return <ReportsPage 
          transactions={transactions}
          categories={categories}
          monthlyIncome={monthlyIncome}
          />;
       case 'debts':
         return <DebtsList
          debts={debts}
          setDebts={setDebts}
          categories={categories}
          setTransactions={setTransactions}
          />;
      case 'settings':
        return <SettingsPage
          monthlyIncome={monthlyIncome}
          setMonthlyIncome={setMonthlyIncome}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          transactions={transactions}
          categoryMap={categoryMap}
          clearAllData={clearAllData}
          theme={theme}
          setTheme={setTheme}
          autoLockTime={autoLockTime}
          setAutoLockTime={setAutoLockTime}
          archiveTransactions={archiveTransactions}
        />;
      default:
        return <Dashboard 
          transactions={transactions} 
          goals={goals}
          recurringTransactions={recurringTransactions}
          categories={categories}
          setTransactions={setTransactions}
          setRecurringTransactions={setRecurringTransactions}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          monthlyIncome={monthlyIncome}
          theme={theme}
          userProfile={userProfile}
          setActiveView={setActiveView}
          budgets={budgets}
          />;
    }
  };

  if (!isAuthenticated && password) {
    return <Auth storedPassword={password} onLogin={handleLogin} onSetPassword={handleSetPassword} />;
  }
  if (!password) {
     return <Auth storedPassword={null} onLogin={handleLogin} onSetPassword={handleSetPassword} />;
  }

  const navItems = [
    { icon: <HomeIcon />, label: 'لوحة التحكم', view: 'dashboard' as ActiveView },
    { icon: <WalletIcon />, label: 'المعاملات', view: 'transactions' as ActiveView },
    { icon: <PiggyBankIcon />, label: 'الميزانية', view: 'budget' as ActiveView },
    { icon: <BarChartIcon />, label: 'التقارير', view: 'reports' as ActiveView },
    { icon: <TargetIcon />, label: 'الأهداف', view: 'goals' as ActiveView },
    { icon: <LandmarkIcon />, label: 'الديون', view: 'debts' as ActiveView },
    { icon: <TagIcon />, label: 'الفئات', view: 'categories' as ActiveView },
    { icon: <SettingsIcon />, label: 'الإعدادات', view: 'settings' as ActiveView },
  ];

  return (
    <div className="flex h-screen bg-light-background dark:bg-brand-background text-light-text-primary dark:text-brand-text-primary overflow-hidden">
      {/* Backdrop for mobile menu */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside className={`
        flex flex-col bg-light-surface dark:bg-brand-surface h-full z-40
        transition-all duration-300 ease-in-out
        w-64 
        fixed top-0 right-0 transform md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        
        <div className={`flex items-center h-20 border-b border-light-border dark:border-gray-700 ${isSidebarCollapsed ? 'justify-center' : 'justify-between md:justify-start'} px-4`}>
            <div className="flex items-center min-w-0">
                <BotIcon className="h-8 w-8 text-brand-primary flex-shrink-0" />
                <span className={`mr-4 text-2xl font-bold whitespace-nowrap transition-opacity ${isSidebarCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>حسابنا</span>
            </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
            {navItems.map(item => (
                <NavItem 
                    key={item.view}
                    icon={item.icon} 
                    label={item.label} 
                    view={item.view} 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    isSidebarCollapsed={isSidebarCollapsed}
                    closeMobileMenu={() => setIsMobileMenuOpen(false)}
                />
            ))}
        </nav>

        <div className={`p-2 border-t border-light-border dark:border-gray-700`}>
            <div className={`flex items-center gap-3 p-2 rounded-lg`}>
                <div className="w-10 h-10 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center font-bold text-xl text-white">
                    {userProfile.name?.charAt(0).toUpperCase() || 'م'}
                </div>
                <div className={`transition-opacity overflow-hidden ${isSidebarCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
                    <p className="font-bold text-sm text-light-text-primary dark:text-brand-text-primary truncate">{userProfile.name || 'مستخدم'}</p>
                    <p className="text-xs text-light-text-secondary dark:text-brand-text-secondary truncate">{userProfile.email || 'لا يوجد بريد إلكتروني'}</p>
                </div>
            </div>
             <TooltipWrapper label={isSidebarCollapsed ? "قفل التطبيق" : ""}>
                <button
                    onClick={() => handleLogout()}
                    className={`w-full flex items-center p-3 text-sm font-medium rounded-lg text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                    <LogOutIcon className="h-5 w-5 flex-shrink-0" />
                    <span className={`mr-4 transition-opacity ${isSidebarCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>قفل التطبيق</span>
                </button>
            </TooltipWrapper>
        </div>
        <div className="hidden md:flex items-center justify-center p-2 border-t border-light-border dark:border-gray-700">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text-primary dark:hover:text-brand-text-primary rounded-full hover:bg-light-interactive dark:hover:bg-gray-700">
                {isSidebarCollapsed ? <ChevronLeftIcon className="w-6 h-6"/> : <ChevronRightIcon className="w-6 h-6"/>}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-light-surface dark:bg-brand-surface flex items-center justify-between px-4 sm:px-6 border-b border-light-border dark:border-gray-700 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold">{viewTitles[activeView]}</h1>
          <button 
            className="p-2 text-light-text-secondary md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="فتح القائمة"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        transactions={transactions}
        categories={categories}
      />
    </div>
  );
};

export default App;