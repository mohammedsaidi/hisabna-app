import React, { useState, useMemo } from 'react';
import { Budget, Category, Transaction } from '../types';
import { CURRENCY } from '../constants';
import { PiggyBankIcon, EditIcon } from './Icons';

// Props for the main page component
interface BudgetPageProps {
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  transactions: Transaction[];
  categories: Category[];
}

// Props for the modal to edit budgets
interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentBudgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
}

// Props for a single budget card
interface BudgetCardProps {
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
}


const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ isOpen, onClose, categories, currentBudgets, setBudgets }) => {
    // State to hold budget values while editing in the modal
    const [localBudgets, setLocalBudgets] = useState<Record<string, string>>(() => {
        const budgetMap: Record<string, string> = {};
        currentBudgets.forEach(b => {
            budgetMap[b.categoryId] = String(b.amount);
        });
        return budgetMap;
    });

    const handleInputChange = (categoryId: string, value: string) => {
        setLocalBudgets(prev => ({ ...prev, [categoryId]: value }));
    };

    const handleSave = () => {
        const newBudgets: Budget[] = Object.entries(localBudgets)
            .map(([categoryId, amountStr]) => ({
                categoryId,
                amount: parseFloat(amountStr) || 0,
            }))
            .filter(b => b.amount > 0); // Only save budgets with a positive amount

        setBudgets(newBudgets);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-light-border dark:border-gray-600">
                    <h2 className="text-2xl font-bold">تعديل الميزانيات الشهرية</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <p className="text-light-text-secondary dark:text-brand-text-secondary">أدخل حدود الإنفاق الشهرية لكل فئة. اترك الحقل فارغًا أو صفرًا لعدم تعيين ميزانية.</p>
                    {categories
                        .filter(c => c.name.toLowerCase() !== 'راتب' && c.name.toLowerCase() !== 'salary' && c.name.toLowerCase() !== 'income')
                        .map(category => (
                        <div key={category.id} className="flex items-center justify-between gap-4 bg-light-interactive dark:bg-gray-800 p-3 rounded-lg">
                            <label htmlFor={`budget-${category.id}`} className="font-medium">{category.name}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    id={`budget-${category.id}`}
                                    value={localBudgets[category.id] || ''}
                                    onChange={(e) => handleInputChange(category.id, e.target.value)}
                                    placeholder="0"
                                    className="w-32 p-2 text-left dir-ltr bg-light-surface dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
                                    min="0"
                                    step="10"
                                />
                                <span className="text-light-text-secondary dark:text-brand-text-secondary">{CURRENCY}</span>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                    <button type="button" onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-bold">حفظ الميزانيات</button>
                </div>
            </div>
        </div>
    );
};


const BudgetCard: React.FC<BudgetCardProps> = ({ categoryName, budgetAmount, spentAmount }) => {
    const progress = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    const remainingAmount = budgetAmount - spentAmount;

    let progressBarColor = 'bg-green-500';
    if (progress > 100) {
        progressBarColor = 'bg-red-500';
    } else if (progress >= 80) {
        progressBarColor = 'bg-yellow-500';
    }

    return (
        <div className="bg-light-interactive/50 dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="font-bold text-lg mb-2">{categoryName}</h3>
            <div className="w-full bg-light-interactive-darker dark:bg-gray-600 rounded-full h-3 my-2">
                <div className={`${progressBarColor} h-3 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between items-baseline text-sm mt-2">
                <span className="text-light-text-secondary dark:text-brand-text-secondary">المصروف:</span>
                <span className="font-semibold">{spentAmount.toLocaleString()} {CURRENCY}</span>
            </div>
            <div className="flex justify-between items-baseline text-sm">
                <span className="text-light-text-secondary dark:text-brand-text-secondary">الميزانية:</span>
                 <span className="font-semibold">{budgetAmount.toLocaleString()} {CURRENCY}</span>
            </div>
            <div className="mt-4 pt-3 border-t border-light-border dark:border-gray-700 flex justify-between items-baseline font-bold">
                 {remainingAmount >= 0 ? (
                    <>
                        <span className="text-green-500 dark:text-green-400">المتبقي:</span>
                        <span className="text-green-500 dark:text-green-400">{remainingAmount.toLocaleString()} {CURRENCY}</span>
                    </>
                ) : (
                    <>
                         <span className="text-red-500 dark:text-red-400">تجاوز:</span>
                         <span className="text-red-500 dark:text-red-400">{Math.abs(remainingAmount).toLocaleString()} {CURRENCY}</span>
                    </>
                )}
            </div>
        </div>
    );
};


const BudgetPage: React.FC<BudgetPageProps> = ({ budgets, setBudgets, transactions, categories }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAllBudgets, setShowAllBudgets] = useState(false);

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    // Calculate total spending for the current month per category
    const monthlySpending = useMemo(() => {
        const spendingMap = new Map<string, number>();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (
                t.type === 'expense' &&
                transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear
            ) {
                spendingMap.set(t.categoryId, (spendingMap.get(t.categoryId) || 0) + t.amount);
            }
        });
        return spendingMap;
    }, [transactions]);

    const { totalBudgeted, totalSpent } = useMemo(() => {
        let budgeted = 0;
        let spent = 0;
        budgets.forEach(b => {
            budgeted += b.amount;
            spent += monthlySpending.get(b.categoryId) || 0;
        });
        return { totalBudgeted: budgeted, totalSpent: spent };
    }, [budgets, monthlySpending]);
    
    const budgetCardsData = useMemo(() => {
        return budgets
            .map(budget => ({
                budget,
                categoryName: categoryMap.get(budget.categoryId) || 'غير مصنف',
                spentAmount: monthlySpending.get(budget.categoryId) || 0,
            }))
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }, [budgets, categoryMap, monthlySpending]);

    const displayedBudgetCardsData = useMemo(() => {
        return showAllBudgets ? budgetCardsData : budgetCardsData.slice(0, 5);
    }, [showAllBudgets, budgetCardsData]);

    return (
        <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
             <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold">تتبع الميزانية الشهرية</h2>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary">تحكم في نفقاتك من خلال تحديد ميزانيات للفئات.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200"
                >
                    <EditIcon className="w-5 h-5" />
                    <span>إعداد/تعديل الميزانيات</span>
                </button>
            </div>

            {/* Summary Section */}
             <div className="bg-light-interactive dark:bg-gray-800 p-6 rounded-xl mb-6">
                <h3 className="text-xl font-bold text-center mb-4">ملخص الميزانية لهذا الشهر</h3>
                <div className="flex justify-around items-center flex-wrap gap-4">
                    <div className="text-center">
                        <p className="text-light-text-secondary dark:text-brand-text-secondary text-sm">إجمالي المصروفات</p>
                        <p className="text-2xl font-bold text-red-500 dark:text-red-400">{totalSpent.toLocaleString()} {CURRENCY}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-light-text-secondary dark:text-brand-text-secondary text-sm">إجمالي الميزانية</p>
                        <p className="text-2xl font-bold text-green-500 dark:text-green-400">{totalBudgeted.toLocaleString()} {CURRENCY}</p>
                    </div>
                </div>
             </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {budgetCardsData.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {displayedBudgetCardsData.map(({ budget, categoryName, spentAmount }) => (
                                <BudgetCard 
                                    key={budget.categoryId}
                                    categoryName={categoryName}
                                    budgetAmount={budget.amount}
                                    spentAmount={spentAmount}
                                />
                            ))}
                        </div>
                        {budgetCardsData.length > 5 && !showAllBudgets && (
                           <div className="mt-6 text-center">
                             <button
                               onClick={() => setShowAllBudgets(true)}
                               className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                             >
                               إظهار كل الميزانيات ({budgetCardsData.length})
                             </button>
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-brand-text-secondary">
                        <PiggyBankIcon className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" />
                        <p className="text-lg">لم تقم بتعيين أي ميزانيات بعد.</p>
                        <p>انقر على "إعداد الميزانيات" للبدء.</p>
                    </div>
                )}
            </div>

            <EditBudgetModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                categories={categories}
                currentBudgets={budgets}
                setBudgets={setBudgets}
            />
        </div>
    );
};

export default BudgetPage;