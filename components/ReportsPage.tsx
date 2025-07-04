import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { CURRENCY } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DownloadIcon } from './Icons';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: Category[];
  monthlyIncome: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, categories, monthlyIncome }) => {
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const theme = useMemo(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light', []);
    
    const { monthlyExpensesByCategory, topExpenses } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpensesMap = new Map<string, number>();
        const currentMonthTransactions: Transaction[] = [];

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (t.type === 'expense' && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthlyExpensesMap.set(t.categoryId, (monthlyExpensesMap.get(t.categoryId) || 0) + t.amount);
                currentMonthTransactions.push(t);
            }
        });
        
        const topExp = [...currentMonthTransactions].sort((a,b) => b.amount - a.amount).slice(0, 5);

        return { monthlyExpensesByCategory: monthlyExpensesMap, topExpenses: topExp };
    }, [transactions]);
    
    const pieChartData = useMemo(() => {
        return Array.from(monthlyExpensesByCategory.entries())
            .map(([categoryId, amount]) => ({
                name: categoryMap.get(categoryId) || 'غير مصنف',
                value: amount,
            }))
            .sort((a,b) => b.value - a.value);
    }, [monthlyExpensesByCategory, categoryMap]);
    
    const historicalData = useMemo(() => {
        const data: { name: string; income: number; expense: number }[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();

            let monthlyIncomeTotal = 0;
            let monthlyExpenseTotal = 0;

            transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate.getMonth() === month && tDate.getFullYear() === year) {
                    if (t.type === 'income') monthlyIncomeTotal += t.amount;
                    else monthlyExpenseTotal += t.amount;
                }
            });
            
            data.push({
                name: date.toLocaleString('ar-MA', { month: 'short', year: 'numeric' }),
                income: monthlyIncomeTotal,
                expense: monthlyExpenseTotal,
            });
        }
        return data;
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


    return (
        <div className="space-y-8" id="reports-page">
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: #f8f7f4 !important;
                    }
                    body, #root > div, main {
                        background-color: transparent !important;
                        overflow: visible !important;
                        display: block !important;
                    }

                    aside, main > header, .no-print {
                        display: none !important;
                    }
                    
                    #reports-page {
                        color: #1f2937 !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }

                    .bg-light-surface,
                    .bg-white.dark\\:bg-brand-surface {
                        background-color: #ffffff !important;
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                        page-break-inside: avoid;
                    }
                    
                    .text-gray-900, .dark\\:text-brand-text-primary,
                    .text-light-text-primary, .dark\\:text-white {
                         color: #1f2937 !important;
                    }
                     .text-gray-600, .dark\\:text-brand-text-secondary,
                     .text-light-text-secondary {
                         color: #6b7280 !important;
                    }
                    
                    /* Recharts print styles */
                    .recharts-wrapper {
                        color: #1f2937 !important;
                    }
                    .recharts-surface, .recharts-pie-sector text, .recharts-cartesian-axis-tick-value, .recharts-label {
                         fill: #1f2937 !important;
                    }
                    .recharts-legend-item text {
                         color: #1f2937 !important;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center flex-wrap gap-4 no-print">
                <div>
                    <h2 className="text-2xl font-bold">التقارير المالية</h2>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary">نظرة عميقة على وضعك المالي.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    <span>طباعة / حفظ PDF</span>
                </button>
            </div>
            
            {/* Monthly Expense Breakdown */}
            <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-light-text-primary dark:text-brand-text-primary">توزيع مصروفات هذا الشهر</h3>
                {pieChartData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value:number) => [`${value.toLocaleString()} ${CURRENCY}`, 'المبلغ']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                             {pieChartData.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-light-text-primary dark:text-brand-text-primary">{entry.name}</span>
                                    </div>
                                    <span className="font-semibold text-light-text-primary dark:text-brand-text-primary">{entry.value.toLocaleString()} {CURRENCY}</span>
                                </div>
                             ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-light-text-secondary dark:text-brand-text-secondary py-8">لا توجد مصروفات مسجلة لهذا الشهر.</p>
                )}
            </div>
            
            {/* Income vs Expense History */}
            <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-light-text-primary dark:text-brand-text-primary">الدخل مقابل المصروفات (آخر 12 شهرًا)</h3>
                 <div style={{ width: '100%', height: 300 }}>
                     <ResponsiveContainer>
                        <BarChart data={historicalData}>
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString()} ${CURRENCY}`, '']} />
                            <Legend wrapperStyle={{fontSize: "14px", color: theme === 'dark' ? '#d1d5db' : '#374151' }} />
                            <Bar dataKey="income" fill="#22c55e" name="الدخل" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#ef4444" name="المصروفات" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
            </div>

            {/* Top Expenses */}
            <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-light-text-primary dark:text-brand-text-primary">أكبر 5 نفقات هذا الشهر</h3>
                {topExpenses.length > 0 ? (
                    <div className="space-y-3">
                        {topExpenses.map(t => (
                             <div key={t.id} className="flex items-center justify-between p-3 bg-light-interactive dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-light-text-primary dark:text-brand-text-primary">{t.description}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">
                                        {categoryMap.get(t.categoryId) || 'غير مصنف'} &bull; {new Date(t.date).toLocaleDateString('ar-MA')}
                                    </p>
                                </div>
                                <p className="font-bold text-red-500 dark:text-red-400">
                                    {t.amount.toLocaleString()} {CURRENCY}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-light-text-secondary dark:text-brand-text-secondary py-8">لا توجد مصروفات مسجلة لهذا الشهر.</p>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;