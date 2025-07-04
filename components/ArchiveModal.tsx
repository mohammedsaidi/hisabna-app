
import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { AlertTriangleIcon } from './Icons';
import { CURRENCY } from '../constants';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
  categoryMap: Map<string, string>;
  onArchive: (startDate: string, endDate: string) => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, startDate, endDate, transactions, categoryMap, onArchive }) => {
  const [confirmText, setConfirmText] = useState('');

  const summary = useMemo(() => {
    const transactionsToArchive = transactions.filter(t => {
      const txDate = new Date(t.date).toISOString().split('T')[0];
      return txDate >= startDate && txDate <= endDate;
    });

    const summaries: { [key: string]: { name: string, income: number, expense: number } } = {};

    transactionsToArchive.forEach(t => {
      if (!summaries[t.categoryId]) {
        summaries[t.categoryId] = {
          name: categoryMap.get(t.categoryId) || 'غير مصنف',
          income: 0,
          expense: 0
        };
      }
      summaries[t.categoryId][t.type] += t.amount;
    });
    
    return {
        count: transactionsToArchive.length,
        details: Object.values(summaries).filter(s => s.income > 0 || s.expense > 0)
    };

  }, [startDate, endDate, transactions, categoryMap]);

  const handleArchive = () => {
    if (confirmText === 'أرشفة') {
      onArchive(startDate, endDate);
      onClose();
    } else {
      alert('النص الذي أدخلته غير مطابق.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-light-border dark:border-gray-600 text-center">
            <AlertTriangleIcon className="w-12 h-12 mx-auto text-yellow-500 mb-2"/>
            <h2 className="text-2xl font-bold">تأكيد الأرشفة</h2>
        </div>
        <div className="p-6 overflow-y-auto">
            <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-4">
                أنت على وشك أرشفة <strong className="text-light-text-primary dark:text-white">{summary.count}</strong> معاملة. سيتم حذف المعاملات الأصلية بشكل دائم واستبدالها بملخصات. <strong className="text-red-500">لا يمكن التراجع عن هذا الإجراء.</strong>
            </p>

            {summary.count > 0 ? (
                 <div className="bg-light-interactive dark:bg-gray-800 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <h4 className="font-bold mb-2">الملخص:</h4>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-light-border dark:border-gray-600">
                                <th className="text-right p-2">الفئة</th>
                                <th className="text-left p-2">الدخل</th>
                                <th className="text-left p-2">المصروفات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.details.map((s, i) => (
                                <tr key={i} className="border-b border-light-border dark:border-gray-700 last:border-b-0">
                                    <td className="p-2 font-medium">{s.name}</td>
                                    <td className="p-2 text-left text-green-600 dark:text-green-500">{s.income > 0 ? `${s.income.toLocaleString()} ${CURRENCY}` : '-'}</td>
                                    <td className="p-2 text-left text-red-600 dark:text-red-500">{s.expense > 0 ? `${s.expense.toLocaleString()} ${CURRENCY}` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            ) : (
                <p className="text-center font-semibold text-light-text-secondary dark:text-gray-400 p-8 bg-light-interactive dark:bg-gray-800 rounded-lg">
                    لا توجد معاملات في النطاق المحدد للأرشفة.
                </p>
            )}

            {summary.count > 0 && (
                 <div className="mt-6">
                     <p className="mb-2 text-center">للتأكيد، يرجى كتابة "<strong className="text-yellow-500 dark:text-yellow-400">أرشفة</strong>" في الحقل أدناه.</p>
                     <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full p-3 text-center bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-red-500 focus:outline-none"
                    />
                 </div>
            )}
        </div>
        <div className="p-4 flex justify-end gap-4 bg-light-interactive/50 dark:bg-gray-900/50 rounded-b-2xl">
            <button onClick={onClose} className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
            <button 
                onClick={handleArchive}
                disabled={confirmText !== 'أرشفة' || summary.count === 0}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-800 dark:disabled:bg-red-900 disabled:cursor-not-allowed"
            >
                تأكيد الأرشفة
            </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;