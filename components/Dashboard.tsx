import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, Goal, RecurringTransaction, Category, UserProfile, ActiveView, Budget, RecurringFrequency } from '../types';
import { CURRENCY } from '../constants';
import { BotIcon, CalendarIcon, ChevronRightIcon, BellIcon, CheckCircleIcon, WalletIcon, AlertTriangleIcon, XIcon, SparklesIcon } from './Icons';
import AIAnalysisModal from './AIAnalysisModal';
import { calculateNextDueDate } from '../utils';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  budgets: Budget[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
  onOpenAIAssistant: () => void;
  monthlyIncome: number;
  theme: 'light' | 'dark';
  userProfile: UserProfile;
  setActiveView: (view: ActiveView) => void;
}

const StatCard: React.FC<{ title: string; amount: number; color: string; }> = ({ title, amount, color }) => (
    <div className={`bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg flex flex-col justify-between border-t-4 ${color}`}>
        <h3 className="text-light-text-secondary dark:text-brand-text-secondary font-medium">{title}</h3>
        <p className="text-3xl font-bold text-light-text-primary dark:text-brand-text-primary mt-2">
            {amount.toLocaleString()} <span className="text-xl">{CURRENCY}</span>
        </p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, 
    goals,
    recurringTransactions, 
    categories,
    budgets,
    setTransactions,
    setRecurringTransactions,
    onOpenAIAssistant,
    monthlyIncome,
    theme,
    userProfile,
    setActiveView
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [recordedReminders, setRecordedReminders] = useState<string[]>([]);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    const [showAllDue, setShowAllDue] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);


    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    
    const { monthlyIncomeTotal, monthlyExpenses, monthlySavings, monthlySpendingByCategory } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let income = 0;
        let expenses = 0;
        const spendingByCategory = new Map<string, number>();

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                if (t.type === 'income') {
                    income += t.amount;
                } else {
                    expenses += t.amount;
                    spendingByCategory.set(t.categoryId, (spendingByCategory.get(t.categoryId) || 0) + t.amount);
                }
            }
        });
        
        const savingsBase = monthlyIncome > 0 ? monthlyIncome : income;
        const savings = savingsBase - expenses;

        return { monthlyIncomeTotal: savingsBase, monthlyExpenses: expenses, monthlySavings: savings, monthlySpendingByCategory: spendingByCategory };
    }, [transactions, monthlyIncome]);
    
     useEffect(() => {
        const alerts: any[] = [];
        budgets.forEach(budget => {
            const spent = monthlySpendingByCategory.get(budget.categoryId) || 0;
            const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            if (progress >= 80) {
                alerts.push({
                    categoryId: budget.categoryId,
                    categoryName: categoryMap.get(budget.categoryId) || 'غير مصنف',
                    progress: Math.round(progress),
                });
            }
        });
        setBudgetAlerts(alerts);
    }, [budgets, monthlySpendingByCategory, categoryMap]);


    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTransactions = transactions.filter(t => t.date.startsWith(date));
            return {
                name: new Date(date).toLocaleDateString('ar-MA', { weekday: 'short', day: 'numeric' }),
                income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            };
        });
    }, [transactions]);
    
    const tooltipStyle = theme === 'dark' ? {
        backgroundColor: '#1f2937', // brand-background
        border: '1px solid #4b5563', // gray-600
        color: '#f9fafb' // brand-text-primary
    } : {
        backgroundColor: '#ffffff', // light-surface
        border: '1px solid #e5e7eb', // light-border
        color: '#1f2937' // light-text-primary
    };


    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const dueReminders = useMemo(() => {
        const today = new Date().toISOString();
        return recurringTransactions.filter(rt => rt.nextDueDate <= today);
    }, [recurringTransactions]);
    
    const upcomingReminders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return recurringTransactions
            .filter(rt => {
                const dueDate = new Date(rt.nextDueDate);
                return dueDate > today && dueDate <= thirtyDaysFromNow;
            })
            .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [recurringTransactions]);

    const displayedUpcomingReminders = showAllUpcoming ? upcomingReminders : upcomingReminders.slice(0, 5);
    const displayedDueReminders = showAllDue ? dueReminders : dueReminders.slice(0, 5);

    const handleRecordRecurring = (reminder: RecurringTransaction) => {
        const newTransaction: Transaction = {
            id: `txn-${Date.now()}`,
            type: reminder.type,
            amount: reminder.amount,
            categoryId: reminder.categoryId,
            date: new Date().toISOString(),
            description: `(متكرر) ${reminder.description}`,
        };

        const newNextDueDate = calculateNextDueDate(new Date(reminder.nextDueDate), reminder.frequency);
        
        const updatedReminder = {
            ...reminder,
            nextDueDate: newNextDueDate.toISOString(),
        };

        setTransactions(prev => [...prev, newTransaction]);
        setRecurringTransactions(prev => prev.map(rt => rt.id === reminder.id ? updatedReminder : rt));
        setRecordedReminders(prev => [...prev, reminder.id]);
    };
    
    const handleDismissAlert = (categoryId: string) => {
        setDismissedAlerts(prev => [...prev, categoryId]);
    };

    const activeBudgetAlerts = budgetAlerts.filter(alert => !dismissedAlerts.includes(alert.categoryId));


    return (
        <div className="space-y-6 md:space-y-8">
             {/* Header Section */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold">مرحباً بعودتك، {userProfile.name}!</h2>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary">هذا هو ملخصك المالي لهذا اليوم.</p>
                </div>
                <button
                    onClick={() => setActiveView('transactions')}
                    className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-secondary rounded-lg hover:bg-brand-primary transition-all duration-200"
                >
                    <WalletIcon className="w-5 h-5"/>
                    <span>عرض المعاملات</span>
                </button>
            </div>

            {/* Budget Alerts */}
            {activeBudgetAlerts.length > 0 && (
                <div className="space-y-3">
                    {activeBudgetAlerts.map(alert => (
                         <div key={alert.categoryId} className={`p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 ${alert.progress >= 100 ? 'bg-red-500/20 border-red-500' : 'bg-yellow-500/20 border-yellow-500'} border-l-4`}>
                             <div className="flex items-center gap-3">
                                <AlertTriangleIcon className={`w-6 h-6 flex-shrink-0 ${alert.progress >= 100 ? 'text-red-500' : 'text-yellow-500'}`} />
                                <p className="font-semibold text-sm text-light-text-primary dark:text-brand-text-primary">
                                    لقد استهلكت {alert.progress}% من ميزانية "{alert.categoryName}" لهذا الشهر.
                                </p>
                             </div>
                             <button onClick={() => handleDismissAlert(alert.categoryId)} className="p-1 rounded-full text-light-text-secondary hover:text-light-text-primary dark:text-gray-400 dark:hover:text-white">
                                <XIcon className="w-5 h-5"/>
                             </button>
                         </div>
                    ))}
                </div>
            )}


            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard title="الدخل الشهري" amount={monthlyIncomeTotal} color="border-green-500" />
                <StatCard title="المصروفات الشهرية" amount={monthlyExpenses} color="border-red-500" />
                <StatCard title="المدخرات الشهرية" amount={monthlySavings} color="border-blue-500" />
            </div>

            {/* AI Features Banners */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {isOnline ? (
                    <>
                    <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <BotIcon className="w-10 h-10 text-brand-primary" />
                            <div>
                                <h3 className="text-xl font-bold text-light-text-primary dark:text-white">مساعد الميزانية</h3>
                                <p className="text-light-text-secondary dark:text-brand-text-secondary text-sm">اقتراحات ميزانية ذكية.</p>
                            </div>
                        </div>
                        <button
                            onClick={onOpenAIAssistant}
                            className="px-5 py-2 text-sm font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200"
                        >
                            <span>اطلب اقتراحًا</span>
                        </button>
                    </div>
                     <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <SparklesIcon className="w-10 h-10 text-brand-accent" />
                            <div>
                                <h3 className="text-xl font-bold text-light-text-primary dark:text-white">تحليل الإنفاق</h3>
                                <p className="text-light-text-secondary dark:text-brand-text-secondary text-sm">احصل على نصائح شخصية.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAnalysisModalOpen(true)}
                            className="px-5 py-2 text-sm font-bold text-brand-accent bg-yellow-400/20 rounded-lg hover:bg-yellow-400/30 text-yellow-900 dark:text-yellow-300 transition-all duration-200"
                        >
                            <span>حلّل إنفاقي</span>
                        </button>
                    </div>
                    </>
                ) : (
                    <div className="lg:col-span-2 bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg opacity-60">
                        <div className="flex items-center gap-4">
                            <BotIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">ميزات الذكاء الاصطناعي</h3>
                                <p className="text-gray-400 dark:text-gray-500">غير متاحة حالياً (غير متصل بالإنترنت).</p>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
            
            {/* Due Reminders */}
            {dueReminders.length > 0 && (
                <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-yellow-400"/> تذكيرات مستحقة</h3>
                    <div className="space-y-3">
                        {displayedDueReminders.map(reminder => (
                            <div key={reminder.id} className="bg-light-interactive dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="font-bold">{reminder.description}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{reminder.amount.toLocaleString()} {CURRENCY} &bull; {categoryMap.get(reminder.categoryId) || 'غير مصنف'}</p>
                                    <p className="text-xs text-yellow-500 dark:text-yellow-400">مستحق في: {new Date(reminder.nextDueDate).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                </div>
                                {recordedReminders.includes(reminder.id) ? (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-semibold px-4 py-2">
                                        <CheckCircleIcon className="w-6 h-6"/>
                                        <span>تم التسجيل</span>
                                    </div>
                                ) : (
                                <button
                                    onClick={() => handleRecordRecurring(reminder)}
                                    className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    تأكيد الدفع
                                </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {dueReminders.length > 5 && !showAllDue && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowAllDue(true)}
                                className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                            >
                                إظهار كل التذكيرات المستحقة ({dueReminders.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
                <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BellIcon className="w-6 h-6 text-blue-500 dark:text-blue-400"/> تذكيرات قادمة</h3>
                    <div className="space-y-3">
                        {displayedUpcomingReminders.map(reminder => (
                            <div key={reminder.id} className="bg-light-interactive dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="font-bold">{reminder.description}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{reminder.amount.toLocaleString()} {CURRENCY} &bull; {categoryMap.get(reminder.categoryId) || 'غير مصنف'}</p>
                                </div>
                                <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                                    مستحق في: {new Date(reminder.nextDueDate).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                    {upcomingReminders.length > 5 && !showAllUpcoming && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowAllUpcoming(true)}
                                className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                            >
                                إظهار كل التذكيرات ({upcomingReminders.length})
                            </button>
                        </div>
                    )}
                </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Chart and Recent Transactions */}
                <div className="md:col-span-3 bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4">النشاط المالي (آخر 7 أيام)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    contentStyle={{
                                        ...tooltipStyle,
                                        borderRadius: '0.5rem',
                                        direction: 'rtl',
                                        fontFamily: 'Tajawal, sans-serif'
                                    }}
                                    labelStyle={{ color: tooltipStyle.color, fontWeight: 'bold' }}
                                    formatter={(value: number, name: string, entry: { dataKey: string }) => {
                                        const label = entry.dataKey === 'income' ? 'الدخل' : 'المصروفات';
                                        return [`${value.toLocaleString()} ${CURRENCY}`, label];
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "14px", color: theme === 'dark' ? '#d1d5db' : '#374151' }} />
                                <Bar dataKey="income" fill="#22c55e" name="الدخل" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="#ef4444" name="المصروفات" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Transactions & Goals */}
                <div className="md:col-span-2 space-y-8">
                     <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4">أحدث المعاملات</h3>
                        <div className="space-y-3">
                            {recentTransactions.length > 0 ? recentTransactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{t.description}</p>
                                        <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">
                                            {categoryMap.get(t.categoryId) || 'غير مصنف'} &bull; {new Date(t.date).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <p className={`font-bold ${t.type === 'income' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {CURRENCY}
                                    </p>
                                </div>
                            )) : <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-4">لا توجد معاملات بعد.</p>}
                        </div>
                    </div>
                     <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4">تتبع الأهداف</h3>
                        <div className="space-y-4">
                             {goals.length > 0 ? goals.slice(0, 2).map(goal => {
                                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                                return (
                                    <div key={goal.id}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-medium">{goal.name}</span>
                                            <span className="text-sm font-bold text-brand-primary">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-light-interactive-darker dark:bg-gray-600 rounded-full h-2.5">
                                            <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-4">لم تقم بتحديد أي أهداف بعد.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
             <AIAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                transactions={transactions}
                categories={categories}
            />
        </div>
    );
};

export default Dashboard;