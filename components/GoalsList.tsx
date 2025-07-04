import React, { useState } from 'react';
import { Goal, Transaction, Category } from '../types';
import { CURRENCY } from '../constants';
import { PlusIcon, TrashIcon, TargetIcon, FilePlusIcon } from './Icons';

interface GoalsListProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: Category[];
}

const GoalsList: React.FC<GoalsListProps> = ({ goals, setGoals, setTransactions, categories }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<Goal | null>(null);
  const [showAllGoals, setShowAllGoals] = useState(false);

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };
  
  const displayedGoals = showAllGoals ? goals : goals.slice(0, 5);

  return (
    <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">أهداف الادخار</h2>
          <p className="text-light-text-secondary dark:text-brand-text-secondary">حدد أهدافك المالية وتتبع تقدمك.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="w-6 h-6" />
          <span>إضافة هدف جديد</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {goals.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {displayedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onDelete={() => handleDelete(goal.id)} onAddFunds={() => setAddFundsModal(goal)} />
              ))}
            </div>
            {goals.length > 5 && !showAllGoals && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setShowAllGoals(true)}
                        className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                    >
                        إظهار كل الأهداف ({goals.length})
                    </button>
                </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary">
            <TargetIcon className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-lg">لم تقم بتحديد أي أهداف بعد.</p>
            <p>انقر على "إضافة هدف جديد" للبدء.</p>
          </div>
        )}
      </div>

      {modalOpen && <GoalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} setGoals={setGoals} />}
      {addFundsModal && <AddFundsModal isOpen={!!addFundsModal} onClose={() => setAddFundsModal(null)} goal={addFundsModal} setGoals={setGoals} setTransactions={setTransactions} categories={categories} />}
    </div>
  );
};

const GoalCard: React.FC<{ goal: Goal, onDelete: () => void, onAddFunds: () => void }> = ({ goal, onDelete, onAddFunds }) => {
  const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  return (
    <div className="bg-light-interactive/50 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-between transition-transform hover:scale-105 duration-300">
      <div>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">{goal.name}</h3>
             <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1"><TrashIcon className="w-5 h-5"/></button>
        </div>
        <div className="my-4">
            <div className="flex justify-between text-sm text-light-text-secondary dark:text-brand-text-secondary mb-1">
                <span>{goal.currentAmount.toLocaleString()} {CURRENCY}</span>
                <span>{goal.targetAmount.toLocaleString()} {CURRENCY}</span>
            </div>
            <div className="w-full bg-light-interactive-darker dark:bg-gray-600 rounded-full h-3">
                <div className="bg-brand-primary h-3 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-center mt-2 font-bold text-brand-primary">{Math.round(progress)}% مكتمل</p>
        </div>
      </div>
      <button onClick={onAddFunds} className="w-full mt-2 py-2 px-4 bg-brand-secondary text-white font-bold rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2">
        <FilePlusIcon className="w-5 h-5" />
        <span>إضافة مبلغ</span>
      </button>
    </div>
  );
};

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, setGoals }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetAmount > 0) {
            const newGoal: Goal = {
                id: `goal-${Date.now()}`,
                name,
                targetAmount,
                currentAmount: 0
            };
            setGoals(prev => [...prev, newGoal]);
            onClose();
        }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-light-border dark:border-gray-600">
                        <h2 className="text-2xl font-bold">هدف جديد</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم الهدف (مثال: شراء سيارة)" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required />
                        <input type="number" value={targetAmount} onChange={e => setTargetAmount(parseFloat(e.target.value))} placeholder="المبلغ المستهدف" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required min="1" />
                    </div>
                    <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-bold">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    )
};


interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal;
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    categories: Category[];
}
const AddFundsModal: React.FC<AddFundsModalProps> = ({isOpen, onClose, goal, setGoals, setTransactions, categories}) => {
    const [amount, setAmount] = useState(0);
    const [createExpense, setCreateExpense] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount > 0) {
            setGoals(prev => prev.map(g => g.id === goal.id ? {...g, currentAmount: g.currentAmount + amount} : g));
            
            if (createExpense) {
                const savingsCategory = categories.find(c => c.name === 'مدخرات واستثمارات');
                if (!savingsCategory) {
                    alert("فئة 'مدخرات واستثمارات' غير موجودة. يرجى إضافتها أولاً.");
                    onClose();
                    return;
                }
                const newTransaction: Transaction = {
                    id: `txn-${Date.now()}`,
                    type: 'expense',
                    amount: amount,
                    categoryId: savingsCategory.id,
                    date: new Date().toISOString(),
                    description: `إضافة مبلغ لهدف: ${goal.name}`,
                };
                setTransactions(prev => [...prev, newTransaction]);
            }
            onClose();
        }
    };
    if (!isOpen) return null;
     return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-light-border dark:border-gray-600">
                        <h2 className="text-2xl font-bold">إضافة مبلغ إلى "{goal.name}"</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-light-text-secondary dark:text-brand-text-secondary">المبلغ الحالي: {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {CURRENCY}</p>
                        <input type="number" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} placeholder="المبلغ المراد إضافته" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required min="1" />
                         <div className="flex items-center gap-2">
                            <input
                                id="createExpenseCheck"
                                type="checkbox"
                                checked={createExpense}
                                onChange={(e) => setCreateExpense(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <label htmlFor="createExpenseCheck" className="text-sm text-light-text-secondary dark:text-brand-text-secondary">إنشاء معاملة مصروفات لهذا المبلغ</label>
                        </div>
                    </div>
                    <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-bold">إضافة المبلغ</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GoalsList;