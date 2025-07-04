import React, { useState, useEffect } from 'react';
import { SparklesIcon, InfoIcon } from './Icons';
import { Transaction, Category } from '../types';
import { getAISpendingAnalysis } from '../services/geminiService';

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    categories: Category[];
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, transactions, categories }) => {
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        try {
            const result = await getAISpendingAnalysis(transactions, categories);
            setAnalysis(result);
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
            setAnalysis('');
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
                        <SparklesIcon className="w-8 h-8 text-brand-accent"/>
                        <h2 className="text-2xl font-bold">تحليل الإنفاق الذكي</h2>
                    </div>
                    <button onClick={onClose} className="text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {analysis === '' && !isLoading && !error && (
                        <div className="text-center flex flex-col items-center justify-center h-full">
                            <InfoIcon className="w-12 h-12 text-brand-accent mb-4"/>
                            <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6 max-w-md">
                                هل تريد معرفة أين تذهب أموالك؟ احصل على تحليل مخصص لعادات الإنفاق الخاصة بك ونصائح عملية لتحسينها.
                            </p>
                            <button
                                onClick={handleGenerateAnalysis}
                                className="px-6 py-3 font-bold text-brand-accent bg-yellow-400/20 rounded-lg hover:bg-yellow-400/30 text-yellow-900 dark:text-yellow-300 transition-all duration-200 transform hover:scale-105"
                            >
                                حلل إنفاقي الآن
                            </button>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent mb-4"></div>
                            <p className="text-light-text-secondary dark:text-brand-text-secondary">يقوم المستشار المالي بتحليل بياناتك... لحظات من فضلك.</p>
                        </div>
                    )}
                    
                    {error && (
                         <div className="flex flex-col items-center justify-center h-full text-center bg-red-500/10 dark:bg-red-900/20 p-4 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 font-semibold">حدث خطأ</p>
                            <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
                            <button
                                onClick={handleGenerateAnalysis}
                                className="mt-6 px-4 py-2 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary"
                            >
                                حاول مرة أخرى
                            </button>
                        </div>
                    )}
                    
                    {analysis && !isLoading && (
                       <div className="prose prose-lg prose-p:text-light-text-primary prose-strong:text-light-text-primary dark:prose-invert max-w-none whitespace-pre-wrap text-right leading-relaxed">
                          {analysis}
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

export default AIAnalysisModal;