import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category, RecurringTransaction, TransactionType, RecurringFrequency } from '../types';
import { CURRENCY } from '../constants';
import { PlusIcon, TrashIcon, EditIcon, CheckCircleIcon, SparklesIcon, CameraIcon, ImageIcon, XIcon } from './Icons';
import { getAICategorySuggestion } from '../services/geminiService';
import { calculateNextDueDate } from '../utils';

type ModalMode = 'add' | 'edit' | null;

interface TransactionsListProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
  categories: Category[];
  categoryMap: Map<string, string>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
    transactions, setTransactions, recurringTransactions, setRecurringTransactions, categories, categoryMap 
}) => {
  const [activeTab, setActiveTab] = useState<'regular' | 'recurring'>('regular');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [currentItem, setCurrentItem] = useState<Transaction | RecurringTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAllRegular, setShowAllRegular] = useState(false);
  const [showAllRecurring, setShowAllRecurring] = useState(false);
  const [recordedItems, setRecordedItems] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');


  const openModal = (mode: ModalMode, item: Transaction | RecurringTransaction | null = null, type: 'regular' | 'recurring') => {
    setModalMode(mode);
    setCurrentItem(item);
    setActiveTab(type); // Ensure the form matches the opened tab
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
    setModalMode(null);
  };

  const handleDelete = (id: string, type: 'regular' | 'recurring') => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      if (type === 'regular') {
        setTransactions(prev => prev.filter(t => t.id !== id));
      } else {
        setRecurringTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };
  
  const handleRecordRecurring = (item: RecurringTransaction) => {
    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId,
      date: new Date().toISOString(),
      description: `(متكرر) ${item.description}`,
    };

    const newNextDueDate = calculateNextDueDate(new Date(item.nextDueDate), item.frequency);

    const updatedRecurringTransaction = {
      ...item,
      nextDueDate: newNextDueDate.toISOString(),
    };

    setTransactions(prev => [...prev, newTransaction]);
    setRecurringTransactions(prev => prev.map(rt => rt.id === item.id ? updatedRecurringTransaction : rt));
    setRecordedItems(prev => [...prev, item.id]);
  };

  const sortedTransactions = useMemo(() => [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions]);
  const sortedRecurring = useMemo(() => [...recurringTransactions].sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()), [recurringTransactions]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const matchesSearch = searchTerm ? t.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesCategory = filterCategory ? t.categoryId === filterCategory : true;
      const matchesDateFrom = dateFrom ? transactionDate >= new Date(dateFrom) : true;
      const matchesDateTo = dateTo ? transactionDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : true;
      const matchesAmountFrom = amountFrom ? t.amount >= parseFloat(amountFrom) : true;
      const matchesAmountTo = amountTo ? t.amount <= parseFloat(amountTo) : true;
      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo && matchesAmountFrom && matchesAmountTo;
    });
  }, [sortedTransactions, searchTerm, filterCategory, dateFrom, dateTo, amountFrom, amountTo]);

  const periodSummary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expense += t.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  
  const filteredRecurring = useMemo(() => {
    return sortedRecurring.filter(rt => {
      const matchesSearch = searchTerm ? rt.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesCategory = filterCategory ? rt.categoryId === filterCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [sortedRecurring, searchTerm, filterCategory]);
  
  const displayedTransactions = showAllRegular ? filteredTransactions : filteredTransactions.slice(0, 5);
  const displayedRecurring = showAllRecurring ? filteredRecurring : filteredRecurring.slice(0, 5);


  return (
    <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة المعاملات</h2>
          <p className="text-light-text-secondary dark:text-brand-text-secondary">أضف وتتبع كل دخلك ومصروفاتك.</p>
        </div>
        <button
          onClick={() => openModal('add', null, activeTab)}
          className="flex items-center gap-2 px-5 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="w-6 h-6" />
          <span>إضافة معاملة جديدة</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-light-border dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('regular')}
          className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'regular' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text-primary dark:hover:text-white'}`}
        >
          عادية
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'recurring' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text-primary dark:hover:text-white'}`}
        >
          متكررة
        </button>
      </div>

      {/* Search and Filter Controls */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
              type="text"
              placeholder="ابحث في الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
          />
          <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
          >
              <option value="">كل الفئات</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="p-3 bg-light-interactive dark:bg-brand-background rounded-lg flex items-center gap-2 border border-light-border dark:border-gray-600">
            <input type="number" placeholder="المبلغ من" value={amountFrom} onChange={e => setAmountFrom(e.target.value)} className="w-full bg-transparent outline-none"/>
            <span>-</span>
            <input type="number" placeholder="إلى" value={amountTo} onChange={e => setAmountTo(e.target.value)} className="w-full bg-transparent outline-none"/>
          </div>
          <div className="md:col-span-2 lg:col-span-2 p-3 bg-light-interactive dark:bg-brand-background rounded-lg flex items-center gap-3 border border-light-border dark:border-gray-600">
             <span className="text-sm text-light-text-secondary">التاريخ من:</span>
             <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent outline-none"/>
             <span className="text-sm text-light-text-secondary">إلى:</span>
             <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent outline-none"/>
          </div>
          <button onClick={() => { setSearchTerm(''); setFilterCategory(''); setDateFrom(''); setDateTo(''); setAmountFrom(''); setAmountTo(''); }} className="p-3 bg-light-interactive-darker dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">مسح الفلاتر</button>
      </div>


      <div className="flex-grow overflow-y-auto">
        {activeTab === 'regular' && (
          <div>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                  <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-8">لا توجد معاملات عادية.</p>
              ) : displayedTransactions.length > 0 ? (
                  displayedTransactions.map(t => (
                <TransactionItem key={t.id} transaction={t} categoryMap={categoryMap} onEdit={() => openModal('edit', t, 'regular')} onDelete={() => handleDelete(t.id, 'regular')} />
              ))) : (
                  <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-8">لا توجد معاملات تطابق بحثك.</p>
              )}
            </div>
            {filteredTransactions.length > 5 && !showAllRegular && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllRegular(true)}
                  className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  إظهار كل المعاملات ({filteredTransactions.length})
                </button>
              </div>
            )}
             {filteredTransactions.length > 0 && (
                <div className="mt-6 pt-4 border-t-2 border-dashed border-light-border dark:border-gray-700">
                    <h3 className="text-lg font-bold text-center mb-3">ملخص الفترة المحددة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-green-500/10 p-4 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">إجمالي الدخل</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{periodSummary.income.toLocaleString()} {CURRENCY}</p>
                        </div>
                        <div className="bg-red-500/10 p-4 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-300">إجمالي المصروفات</p>
                            <p className="text-xl font-bold text-red-500 dark:text-red-400">{periodSummary.expense.toLocaleString()} {CURRENCY}</p>
                        </div>
                        <div className="bg-blue-500/10 p-4 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">الرصيد الصافي</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{(periodSummary.income - periodSummary.expense).toLocaleString()} {CURRENCY}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
        {activeTab === 'recurring' && (
          <div>
            <div className="space-y-3">
              {recurringTransactions.length === 0 ? (
                  <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-8">لا توجد معاملات متكررة.</p>
              ) : displayedRecurring.length > 0 ? (
                  displayedRecurring.map(rt => (
                <RecurringTransactionItem key={rt.id} transaction={rt} categoryMap={categoryMap} onEdit={() => openModal('edit', rt, 'recurring')} onDelete={() => handleDelete(rt.id, 'recurring')} onRecord={() => handleRecordRecurring(rt)} isRecorded={recordedItems.includes(rt.id)} />
              ))) : (
                  <p className="text-light-text-secondary dark:text-brand-text-secondary text-center py-8">لا توجد معاملات متكررة تطابق بحثك.</p>
              )}
            </div>
            {filteredRecurring.length > 5 && !showAllRecurring && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllRecurring(true)}
                  className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  إظهار كل المعاملات ({filteredRecurring.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <TransactionModal
          isOpen={modalOpen}
          onClose={closeModal}
          mode={modalMode!}
          type={activeTab}
          item={currentItem}
          categories={categories}
          setTransactions={setTransactions}
          setRecurringTransactions={setRecurringTransactions}
        />
      )}
    </div>
  );
};


const TransactionItem: React.FC<{transaction: Transaction, categoryMap: Map<string, string>, onEdit: () => void, onDelete: () => void}> = ({ transaction, categoryMap, onEdit, onDelete }) => (
    <div className="bg-light-interactive/50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between flex-wrap gap-2 hover:bg-light-interactive dark:hover:bg-gray-900/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`w-2 h-10 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
                <p className="font-bold flex items-center gap-2">{transaction.description}
                  {transaction.invoiceImage && <ImageIcon className="w-4 h-4 text-blue-500" title="فاتورة مرفقة"/>}
                </p>
                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">
                    {categoryMap.get(transaction.categoryId) || 'غير مصنف'} &bull; {new Date(transaction.date).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} {CURRENCY}
            </p>
            <button onClick={onEdit} className="p-2 rounded-full text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><EditIcon className="w-5 h-5"/></button>
            <button onClick={onDelete} className="p-2 rounded-full text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon className="w-5 h-5"/></button>
        </div>
    </div>
);

const RecurringTransactionItem: React.FC<{
    transaction: RecurringTransaction, 
    categoryMap: Map<string, string>, 
    onEdit: () => void, 
    onDelete: () => void,
    onRecord: () => void,
    isRecorded: boolean
}> = ({ transaction, categoryMap, onEdit, onDelete, onRecord, isRecorded }) => {
    return (
        <div className="bg-light-interactive/50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between flex-wrap gap-2 hover:bg-light-interactive dark:hover:bg-gray-900/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                    <p className="font-bold">{transaction.description} (متكرر)</p>
                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">
                        {categoryMap.get(transaction.categoryId) || 'غير مصنف'} &bull; التالي في: {new Date(transaction.nextDueDate).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} {CURRENCY}
                </p>

                 {isRecorded ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-semibold text-sm" title="تم تسجيل هذه المعاملة لهذه الفترة">
                        <CheckCircleIcon className="w-5 h-5"/>
                        <span>تم التسجيل</span>
                    </div>
                ) : (
                    <button onClick={onRecord} className="p-2 rounded-full text-green-600 hover:text-green-500 dark:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors" title="تأكيد وتسجيل المعاملة الآن">
                        <CheckCircleIcon className="w-5 h-5"/>
                    </button>
                )}
                
                <button onClick={onEdit} className="p-2 rounded-full text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 rounded-full text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};


interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  type: 'regular' | 'recurring';
  item: Transaction | RecurringTransaction | null;
  categories: Category[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen, onClose, mode, type, item, categories, setTransactions, setRecurringTransactions
}) => {
    
  const isRegular = type === 'regular';
  const isEdit = mode === 'edit';
  const initialDate = new Date().toISOString().split('T')[0];

  const [formState, setFormState] = useState<Partial<Transaction & RecurringTransaction>>({
    type: (item as Transaction)?.type || 'expense',
    amount: (item as Transaction)?.amount || 0,
    categoryId: (item as Transaction)?.categoryId || '',
    description: (item as Transaction)?.description || '',
    date: isEdit && isRegular ? (item as Transaction).date.split('T')[0] : initialDate,
    frequency: isEdit && !isRegular ? (item as RecurringTransaction).frequency : 'monthly',
    startDate: isEdit && !isRegular ? (item as RecurringTransaction).startDate.split('T')[0] : initialDate,
    invoiceImage: (item as Transaction)?.invoiceImage || undefined,
  });
  
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };
  
   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, invoiceImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

  const handleAISuggestion = async () => {
      if (!formState.description) {
          alert("يرجى إدخال وصف للمعاملة أولاً.");
          return;
      }
      setIsAISuggesting(true);
      try {
          const suggestedCategoryId = await getAICategorySuggestion(formState.description, categories);
          setFormState(prev => ({ ...prev, categoryId: suggestedCategoryId }));
      } catch (error) {
          alert(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      } finally {
          setIsAISuggesting(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.categoryId) {
      alert("يرجى اختيار فئة.");
      return;
    }

    if (isRegular) {
      const transactionData: Omit<Transaction, 'id'> = {
        type: formState.type!,
        amount: formState.amount!,
        categoryId: formState.categoryId!,
        date: new Date(formState.date!).toISOString(),
        description: formState.description!,
        invoiceImage: formState.invoiceImage,
      };
      if (isEdit) {
        setTransactions(prev => prev.map(t => t.id === item!.id ? { ...t, ...transactionData } : t));
      } else {
        setTransactions(prev => [...prev, { ...transactionData, id: `txn-${Date.now()}` }]);
      }
    } else { // Recurring
      const recurringData = {
        type: formState.type as TransactionType,
        amount: formState.amount!,
        categoryId: formState.categoryId!,
        description: formState.description!,
        frequency: formState.frequency as RecurringFrequency,
        startDate: new Date(formState.startDate!).toISOString(),
      };
      
      const startDateForCalc = new Date(recurringData.startDate);
      const newNextDueDate = calculateNextDueDate(startDateForCalc, recurringData.frequency).toISOString();

      if (isEdit) {
         setRecurringTransactions(prev => prev.map(t => t.id === item!.id ? { ...t, ...recurringData, nextDueDate: newNextDueDate } : t));
      } else {
         setRecurringTransactions(prev => [...prev, { ...recurringData, id: `rec-${Date.now()}`, nextDueDate: newNextDueDate }]);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-0 sm:p-4">
      <div className="bg-light-surface dark:bg-brand-surface rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-light-border dark:border-gray-600">
            <h2 className="text-2xl font-bold">{isEdit ? 'تعديل' : 'إضافة'} معاملة {isRegular ? 'عادية' : 'متكررة'}</h2>
          </div>
          <div className="p-6 space-y-4 flex-grow overflow-y-auto">
             <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormState(p => ({...p, type: 'expense'}))} className={`p-3 rounded-lg font-bold transition-colors ${formState.type === 'expense' ? 'bg-red-500 text-white' : 'bg-light-interactive-darker text-light-text-primary dark:bg-gray-800 dark:text-white'}`}>مصروف</button>
                <button type="button" onClick={() => setFormState(p => ({...p, type: 'income'}))} className={`p-3 rounded-lg font-bold transition-colors ${formState.type === 'income' ? 'bg-green-500 text-white' : 'bg-light-interactive-darker text-light-text-primary dark:bg-gray-800 dark:text-white'}`}>دخل</button>
            </div>
            <input type="number" name="amount" value={formState.amount || ''} onChange={handleChange} placeholder="المبلغ" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required step="0.01"/>
            <input type="text" name="description" value={formState.description} onChange={handleChange} placeholder="الوصف" className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required />
            <div className="flex items-center gap-2">
                <select name="categoryId" value={formState.categoryId} onChange={handleChange} className="flex-grow w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required>
                    <option value="">اختر الفئة</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                 <button type="button" onClick={handleAISuggestion} disabled={isAISuggesting || !formState.description} className="p-3 bg-brand-accent/20 text-brand-accent rounded-lg hover:bg-brand-accent/30 disabled:opacity-50 disabled:cursor-not-allowed" title="اقتراح فئة بالذكاء الاصطناعي">
                    {isAISuggesting ? <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6"/>}
                 </button>
            </div>
             {isRegular ? (
                 <>
                    <input type="date" name="date" value={formState.date} onChange={handleChange} className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required />
                     <div>
                        <input type="file" accept="image/*" onChange={handleImageChange} ref={imageInputRef} className="hidden" />
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 bg-light-interactive dark:bg-gray-800 rounded-lg border-2 border-dashed border-light-border dark:border-gray-600 hover:bg-light-interactive-darker dark:hover:bg-gray-700 transition-colors">
                            <CameraIcon className="w-5 h-5"/>
                            <span>{formState.invoiceImage ? "تغيير الفاتورة" : "إرفاق فاتورة"}</span>
                        </button>
                        {formState.invoiceImage && (
                             <div className="mt-2 relative">
                                <img src={formState.invoiceImage} alt="Invoice preview" className="w-full h-auto max-h-48 object-contain rounded-lg" />
                                <button type="button" onClick={() => setFormState(p => ({...p, invoiceImage: undefined}))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1">
                                    <XIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                 </>
            ) : (
                <>
                    <select name="frequency" value={formState.frequency} onChange={handleChange} className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required>
                        <option value="daily">يومي</option>
                        <option value="weekly">أسبوعي</option>
                        <option value="monthly">شهري</option>
                        <option value="yearly">سنوي</option>
                    </select>
                    <div>
                         <label className="text-sm text-light-text-secondary dark:text-brand-text-secondary">تاريخ البدء</label>
                         <input type="date" name="startDate" value={formState.startDate} onChange={handleChange} className="w-full p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none" required />
                    </div>
                </>
            )}
          </div>
          <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-none sm:rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
            <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-bold">{isEdit ? 'حفظ التعديلات' : 'إضافة'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionsList;