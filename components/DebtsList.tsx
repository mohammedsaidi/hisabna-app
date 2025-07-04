import React, { useState } from 'react';
import { Debt, Transaction, Category } from '../types';
import { CURRENCY } from '../constants';
import { PlusIcon, TrashIcon, EditIcon, LandmarkIcon, FilePlusIcon } from './Icons';
import { safeAddMonth } from '../utils';

interface DebtsListProps {
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: Category[];
}

const DebtsList: React.FC<DebtsListProps> = ({ debts, setDebts, setTransactions, categories }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [currentItem, setCurrentItem] = useState<Debt | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<Debt | null>(null);

  const openModal = (mode: 'add' | 'edit', item: Debt | null = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentItem(null);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدين؟')) {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة الديون</h2>
          <p className="text-light-text-secondary dark:text-brand-text-secondary">تتبع قروضك وديونك في مكان واحد.</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="w-6 h-6" />
          <span>إضافة دين جديد</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {debts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {debts.map(debt => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onEdit={() => openModal('edit', debt)}
                onDelete={() => handleDelete(debt.id)}
                onMakePayment={() => setPaymentModalOpen(debt)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-brand-text-secondary">
            <LandmarkIcon className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-lg">لا توجد ديون مسجلة.</p>
            <p>تهانينا! أو يمكنك إضافة دين جديد للبدء في تتبعه.</p>
          </div>
        )}
      </div>

      {modalOpen && <DebtModal isOpen={modalOpen} mode={modalMode!} item={currentItem} onClose={closeModal} setDebts={setDebts} />}
      {paymentModalOpen && <MakePaymentModal isOpen={!!paymentModalOpen} debt={paymentModalOpen} onClose={() => setPaymentModalOpen(null)} setDebts={setDebts} setTransactions={setTransactions} categories={categories} />}
    </div>
  );
};

const DebtCard: React.FC<{ debt: Debt; onEdit: () => void; onDelete: () => void; onMakePayment: () => void; }> = ({ debt, onEdit, onDelete, onMakePayment }) => {
    const progress = debt.totalAmount > 0 ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100 : 0;

    return (
        <div className="bg-light-interactive/50 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{debt.name}</h3>
                    <div className="flex gap-1">
                        <button onClick={onEdit} className="text-blue-500 hover:text-blue-400 p-1"><EditIcon className="w-5 h-5"/></button>
                        <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="my-4">
                    <div className="flex justify-between text-sm text-light-text-secondary dark:text-brand-text-secondary mb-1">
                        <span>المتبقي: {debt.remainingAmount.toLocaleString()} {CURRENCY}</span>
                        <span>الإجمالي: {debt.totalAmount.toLocaleString()} {CURRENCY}</span>
                    </div>
                    <div className="w-full bg-light-interactive-darker dark:bg-gray-600 rounded-full h-3">
                        <div className="bg-brand-primary h-3 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-center mt-2 font-bold text-brand-primary">{Math.round(progress)}% مدفوع</p>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">الدفعة الشهرية: <span className="font-semibold text-light-text-primary dark:text-brand-text-primary">{debt.monthlyPayment.toLocaleString()} {CURRENCY}</span></p>
                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">الدفع التالي: <span className="font-semibold text-light-text-primary dark:text-brand-text-primary">{new Date(debt.nextPaymentDate).toLocaleDateString('ar-MA')}</span></p>
            </div>
            <button onClick={onMakePayment} className="w-full mt-4 py-2 px-4 bg-brand-secondary text-white font-bold rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2">
                 <FilePlusIcon className="w-5 h-5" />
                 <span>تسجيل دفعة</span>
            </button>
        </div>
    );
};

// Modal for Adding/Editing Debts
const DebtModal: React.FC<{ isOpen: boolean, mode: 'add' | 'edit', item: Debt | null, onClose: () => void, setDebts: React.Dispatch<React.SetStateAction<Debt[]>> }> = ({ isOpen, mode, item, onClose, setDebts }) => {
    const [formState, setFormState] = useState({
        name: item?.name || '',
        totalAmount: item?.totalAmount || 0,
        remainingAmount: item?.remainingAmount || 0,
        monthlyPayment: item?.monthlyPayment || 0,
        nextPaymentDate: item ? item.nextPaymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name.includes('Amount') || name.includes('Payment') ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, totalAmount, remainingAmount, monthlyPayment, nextPaymentDate } = formState;

        if (mode === 'add') {
            const newDebt: Debt = {
                id: `debt-${Date.now()}`,
                name, totalAmount, remainingAmount: remainingAmount || totalAmount, monthlyPayment, 
                nextPaymentDate: new Date(nextPaymentDate).toISOString()
            };
            setDebts(prev => [...prev, newDebt]);
        } else {
            setDebts(prev => prev.map(d => d.id === item!.id ? { ...item, ...formState, nextPaymentDate: new Date(nextPaymentDate).toISOString() } : d));
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                     <div className="p-6 border-b border-light-border dark:border-gray-600">
                        <h2 className="text-2xl font-bold">{mode === 'add' ? 'إضافة دين جديد' : 'تعديل الدين'}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <input name="name" value={formState.name} onChange={handleChange} placeholder="اسم الدين (قرض سيارة)" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600" required />
                        <input name="totalAmount" type="number" value={formState.totalAmount || ''} onChange={handleChange} placeholder="المبلغ الإجمالي" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600" required />
                        <input name="remainingAmount" type="number" value={formState.remainingAmount || ''} onChange={handleChange} placeholder="المبلغ المتبقي (أو اتركه فارغًا)" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600" />
                        <input name="monthlyPayment" type="number" value={formState.monthlyPayment || ''} onChange={handleChange} placeholder="الدفعة الشهرية" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600" required />
                        <div>
                           <label className="text-sm text-light-text-secondary">تاريخ الدفعة القادمة</label>
                           <input name="nextPaymentDate" type="date" value={formState.nextPaymentDate} onChange={handleChange} className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600" required />
                        </div>
                    </div>
                    <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg">{mode === 'add' ? 'إضافة' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal for making a payment
const MakePaymentModal: React.FC<{isOpen: boolean, debt: Debt, onClose: () => void, setDebts: React.Dispatch<React.SetStateAction<Debt[]>>, setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>, categories: Category[]}> = ({isOpen, debt, onClose, setDebts, setTransactions, categories}) => {
    const [amount, setAmount] = useState(debt.monthlyPayment);
    const [createExpense, setCreateExpense] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount > 0) {
            setDebts(prev => prev.map(d => {
                if (d.id === debt.id) {
                    const newRemaining = d.remainingAmount - amount;
                    const nextPaymentDate = safeAddMonth(new Date(d.nextPaymentDate));
                    return {...d, remainingAmount: newRemaining > 0 ? newRemaining : 0, nextPaymentDate: nextPaymentDate.toISOString()};
                }
                return d;
            }));
            
            if (createExpense) {
                const debtCategory = categories.find(c => c.name === 'مدفوعات الديون');
                if (!debtCategory) {
                    alert("فئة 'مدفوعات الديون' غير موجودة. يرجى إضافتها أولاً.");
                    onClose();
                    return;
                }
                 const newTransaction: Transaction = {
                    id: `txn-${Date.now()}`,
                    type: 'expense',
                    amount: amount,
                    categoryId: debtCategory.id,
                    date: new Date().toISOString(),
                    description: `دفعة لدين: ${debt.name}`,
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
                        <h2 className="text-2xl font-bold">تسجيل دفعة لـ "{debt.name}"</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-light-text-secondary">المبلغ المتبقي: {(debt.remainingAmount - amount).toLocaleString()} {CURRENCY}</p>
                        <input type="number" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border" required />
                        <div className="flex items-center gap-2">
                            <input id="createExpenseCheckDebt" type="checkbox" checked={createExpense} onChange={e => setCreateExpense(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            <label htmlFor="createExpenseCheckDebt" className="text-sm">إنشاء معاملة مصروفات لهذه الدفعة</label>
                        </div>
                    </div>
                    <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg">تأكيد الدفع</button>
                    </div>
                </form>
            </div>
        </div>
    )
};

export default DebtsList;