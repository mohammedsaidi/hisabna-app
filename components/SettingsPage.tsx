


import React, { useState, useEffect } from 'react';
import { Transaction, UserProfile } from '../types';
import { CURRENCY } from '../constants';
import { DownloadIcon, AlertTriangleIcon, TrashIcon, SunIcon, MoonIcon, ArchiveIcon } from './Icons';
import ArchiveModal from './ArchiveModal';

type Theme = 'light' | 'dark';

interface SettingsPageProps {
  monthlyIncome: number;
  setMonthlyIncome: React.Dispatch<React.SetStateAction<number>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  transactions: Transaction[];
  categoryMap: Map<string, string>;
  clearAllData: () => void;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  autoLockTime: number;
  setAutoLockTime: React.Dispatch<React.SetStateAction<number>>;
  archiveTransactions: (startDate: string, endDate: string) => void;
}

const SettingsInput: React.FC<{
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  children?: React.ReactNode;
}> = ({ label, id, type = 'text', value, onChange, placeholder, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-2">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-grow p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
      />
      {children}
    </div>
  </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  monthlyIncome,
  setMonthlyIncome,
  userProfile,
  setUserProfile,
  transactions,
  categoryMap,
  clearAllData,
  theme,
  setTheme,
  autoLockTime,
  setAutoLockTime,
  archiveTransactions,
}) => {
  const [formData, setFormData] = useState({
    name: userProfile.name || '',
    email: userProfile.email || '',
    income: String(monthlyIncome || ''),
  });
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveStartDate, setArchiveStartDate] = useState('');
  const [archiveEndDate, setArchiveEndDate] = useState('');

  useEffect(() => {
    setFormData({
      name: userProfile.name || '',
      email: userProfile.email || '',
      income: String(monthlyIncome || ''),
    });
  }, [userProfile, monthlyIncome]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({ name: formData.name, email: formData.email });
    const incomeValue = parseFloat(formData.income);
    setMonthlyIncome(isNaN(incomeValue) ? 0 : incomeValue);
    alert('تم حفظ الإعدادات بنجاح.');
  };
  
  const handleExportData = () => {
    const header = "ID,Type,Amount,Category,Date,Description\n";
    const csvContent = transactions.map(t => {
        const row = [
            t.id,
            t.type,
            t.amount,
            `"${categoryMap.get(t.categoryId) || 'Uncategorized'}"`,
            new Date(t.date).toLocaleString('ar-MA'),
            `"${t.description.replace(/"/g, '""')}"`
        ];
        return row.join(',');
    }).join('\n');

    const csv = header + csvContent;
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hisabna-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearDataConfirm = () => {
    if (clearConfirmText === 'مسح') {
        clearAllData();
        setShowClearConfirm(false);
    } else {
        alert('النص الذي أدخلته غير مطابق. لم يتم حذف البيانات.');
    }
  };
  
  const handleStartArchive = () => {
    if (!archiveStartDate || !archiveEndDate) {
        alert('يرجى تحديد تاريخ البدء والانتهاء.');
        return;
    }
    if (new Date(archiveStartDate) > new Date(archiveEndDate)) {
        alert('تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.');
        return;
    }
    setIsArchiveModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <p className="text-light-text-secondary dark:text-brand-text-secondary">إدارة تفضيلات التطبيق وبياناتك.</p>
      </div>

      {/* Appearance and Security Settings */}
      <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-xl font-bold text-light-text-primary dark:text-brand-text-primary mb-4">المظهر</h3>
          <div className="bg-light-interactive dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between">
            <span className="font-medium">الوضع</span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-full text-brand-primary bg-light-interactive-darker dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label={`التبديل إلى الوضع ${theme === 'light' ? 'الليلي' : 'النهاري'}`}
            >
              {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
            </button>
          </div>
        </div>

        {/* Security */}
        <div>
           <h3 className="text-xl font-bold text-light-text-primary dark:text-brand-text-primary mb-4">الأمان</h3>
           <div className="bg-light-interactive dark:bg-gray-800 p-4 rounded-xl">
             <label htmlFor="autoLockTime" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-2">
                قفل تلقائي بعد عدم النشاط
            </label>
            <select
                id="autoLockTime"
                value={autoLockTime}
                onChange={(e) => setAutoLockTime(Number(e.target.value))}
                className="w-full p-3 bg-light-surface dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
            >
                <option value="5">بعد 5 دقائق</option>
                <option value="15">بعد 15 دقيقة</option>
                <option value="30">بعد 30 دقيقة</option>
                <option value="0">أبداً</option>
            </select>
           </div>
        </div>
      </div>


      <form onSubmit={handleSaveSettings} className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg space-y-6">
        <h3 className="text-xl font-bold text-light-text-primary dark:text-brand-text-primary -mb-2">الملف الشخصي والإعدادات المالية</h3>
        
        <div className="bg-light-interactive dark:bg-gray-800 p-6 rounded-xl space-y-4">
            <SettingsInput
                label="الاسم"
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="اسمك الكامل"
            />
            <SettingsInput
                label="البريد الإلكتروني"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
            />
            <div>
              <SettingsInput
                  label="الدخل الشهري المتوقع"
                  id="income"
                  type="number"
                  value={formData.income}
                  onChange={handleChange}
                  placeholder="10000"
              >
                  <span className="text-light-text-secondary dark:text-brand-text-secondary pl-2">{CURRENCY}</span>
              </SettingsInput>
              <p className="text-xs text-light-text-secondary/80 dark:text-gray-400 mt-2">يُستخدم هذا الرقم كقاعدة لحساب مدخراتك الشهرية في لوحة التحكم (الدخل - المصروفات).</p>
            </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-light-border dark:border-gray-700">
            <button
                type="submit"
                className="px-8 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors"
            >
                حفظ الإعدادات الشخصية
            </button>
        </div>
      </form>
      
      {/* Archive Section */}
      <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">تلخيص وأرشفة المعاملات</h3>
        <p className="text-light-text-secondary dark:text-brand-text-secondary mb-4">
            لتقليل مساحة التخزين، يمكنك تلخيص المعاملات القديمة في سجلات مجمعة. سيؤدي هذا إلى حذف المعاملات الأصلية في النطاق المحدد واستبدالها بسجلات ملخصة لكل فئة.
        </p>
        <div className="bg-light-interactive dark:bg-gray-800 p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="archive-start-date" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-2">من تاريخ</label>
                    <input type="date" id="archive-start-date" value={archiveStartDate} onChange={e => setArchiveStartDate(e.target.value)} className="w-full p-3 bg-light-surface dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"/>
                 </div>
                 <div>
                    <label htmlFor="archive-end-date" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-2">إلى تاريخ</label>
                    <input type="date" id="archive-end-date" value={archiveEndDate} onChange={e => setArchiveEndDate(e.target.value)} className="w-full p-3 bg-light-surface dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"/>
                 </div>
            </div>
             <button
                onClick={handleStartArchive}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
                <ArchiveIcon className="w-5 h-5"/>
                <span>بدء عملية الأرشفة</span>
            </button>
        </div>
      </div>


      <div className="bg-light-surface dark:bg-brand-surface p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">إدارة البيانات</h3>
        <div className="flex flex-col md:flex-row gap-4">
            <button
                onClick={handleExportData}
                disabled={transactions.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <DownloadIcon className="w-5 h-5"/>
                <span>تصدير البيانات (CSV)</span>
            </button>
            <button
                onClick={() => setShowClearConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
                <TrashIcon className="w-5 h-5" />
                <span>مسح جميع البيانات</span>
            </button>
        </div>
      </div>
      
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
                <AlertTriangleIcon className="w-16 h-16 mx-auto text-red-500 mb-4"/>
                <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">تحذير!</h2>
                <p className="text-light-text-secondary dark:text-brand-text-secondary my-4">
                    أنت على وشك حذف جميع بياناتك نهائيًا، بما في ذلك المعاملات والأهداف والإعدادات. <strong className="text-light-text-primary dark:text-white">لا يمكن التراجع عن هذا الإجراء.</strong>
                </p>
                <p className="mb-4">للتأكيد، يرجى كتابة "<strong className="text-yellow-500 dark:text-yellow-400">مسح</strong>" في الحقل أدناه.</p>
                <input
                    type="text"
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    className="w-full p-3 text-center bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-red-500 focus:outline-none"
                />
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={() => setShowClearConfirm(false)} className="px-8 py-2 bg-light-interactive-darker dark:bg-gray-600 text-light-text-primary dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                    <button 
                        onClick={handleClearDataConfirm}
                        disabled={clearConfirmText !== 'مسح'}
                        className="px-8 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-800 dark:disabled:bg-red-900 disabled:cursor-not-allowed"
                    >
                        تأكيد المسح
                    </button>
                </div>
            </div>
        </div>
      )}

      {isArchiveModalOpen && (
        <ArchiveModal
            isOpen={isArchiveModalOpen}
            onClose={() => setIsArchiveModalOpen(false)}
            startDate={archiveStartDate}
            endDate={archiveEndDate}
            transactions={transactions}
            categoryMap={categoryMap}
            onArchive={archiveTransactions}
        />
      )}
    </div>
  );
};

export default SettingsPage;