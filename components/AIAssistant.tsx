
import React, { useState, useEffect } from 'react';
import { BotIcon, InfoIcon } from './Icons';
import { Transaction, Category } from '../types';
import { getAIBudgetSuggestion, BudgetSuggestion } from '../services/geminiService';
import { CURRENCY } from '../constants';


interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    categories: Category[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, transactions, categories }) => {
    const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await getAIBudgetSuggestion(transactions, categories);
            setSuggestions(result);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('حدث خطأ غير متوقع.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setSuggestions([]);
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-brand-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-light-text-primary dark:text-brand-text-primary">
                <div className="p-6 border-b border-light-border dark:border-gray-600 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <BotIcon className="w-8 h-8 text-brand-primary"/>
                        <h2 className="text-2xl font-bold">مساعد الميزانية الذكي</h2>
                    </div>
                    <button onClick={onClose} className="text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {suggestions.length === 0 && !isLoading && !error && (
                        <div className="text-center flex flex-col items-center justify-center h-full">
                            <InfoIcon className="w-12 h-12 text-brand-primary mb-4"/>
                            <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6 max-w-md">
                                احصل على اقتراحات ميزانية شهرية مخصصة بناءً على عادات الإنفاق الخاصة بك. سيقوم مساعد الذكاء الاصطناعي بتحليل معاملاتك لتقديم رؤى مفيدة.
                            </p>
                            <button
                                onClick={handleGenerateSuggestions}
                                className="px-6 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-brand-surface focus:ring-brand-primary transition-all duration-200 transform hover:scale-105"
                            >
                                تحليل وإنشاء الميزانية
                            </button>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mb-4"></div>
                            <p className="text-light-text-secondary dark:text-brand-text-secondary">يقوم الذكاء الاصطناعي بتحليل بياناتك... قد يستغرق هذا بضع لحظات.</p>
                        </div>
                    )}
                    
                    {error && (
                         <div className="flex flex-col items-center justify-center h-full text-center bg-red-500/10 dark:bg-red-900/20 p-4 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 font-semibold">حدث خطأ</p>
                            <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
                            <button
                                onClick={handleGenerateSuggestions}
                                className="mt-6 px-4 py-2 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary"
                            >
                                حاول مرة أخرى
                            </button>
                        </div>
                    )}
                    
                    {suggestions.length > 0 && !isLoading && (
                       <div>
                            <h3 className="text-xl font-bold mb-4">ميزانيتك الشهرية المقترحة</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="border-b border-light-border dark:border-gray-600">
                                        <tr>
                                            <th className="p-3 text-sm font-bold tracking-wider text-light-text-secondary dark:text-brand-text-secondary">الفئة</th>
                                            <th className="p-3 text-sm font-bold tracking-wider text-light-text-secondary dark:text-brand-text-secondary">المبلغ المقترح</th>
                                            <th className="p-3 text-sm font-bold tracking-wider text-light-text-secondary dark:text-brand-text-secondary">السبب</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-light-border dark:divide-gray-700">
                                        {suggestions.map((s, index) => (
                                            <tr key={index} className="hover:bg-light-interactive dark:hover:bg-gray-800/50">
                                                <td className="p-3 whitespace-nowrap font-medium">{s.category}</td>
                                                <td className="p-3 whitespace-nowrap font-bold text-brand-primary">{s.suggested_amount.toLocaleString()} {CURRENCY}</td>
                                                <td className="p-3 text-sm text-light-text-secondary dark:text-brand-text-secondary">{s.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                       </div>
                    )}
                </div>

                <div className="p-4 border-t border-light-border dark:border-gray-600 text-right">
                     <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-light-interactive-darker text-light-text-primary dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;