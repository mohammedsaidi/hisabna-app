import { GoogleGenAI } from "@google/genai";
import { Transaction, Category } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set for Gemini. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface BudgetSuggestion {
    category: string;
    suggested_amount: number;
    reason: string;
}

const checkPrerequisites = () => {
     if (!navigator.onLine) {
        throw new Error("أنت غير متصل بالإنترنت. تتطلب هذه الميزة اتصالاً بالشبكة.");
    }
    if (!process.env.API_KEY) {
        // This check is for the developer, the app should not crash for the user.
        console.error("Gemini API Key is not configured.");
        throw new Error("ميزة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقًا.");
    }
}

export const getAIBudgetSuggestion = async (
    transactions: Transaction[],
    categories: Category[]
): Promise<BudgetSuggestion[]> => {
    checkPrerequisites();

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    if (expenseTransactions.length < 5) {
        throw new Error("تحتاج إلى 5 معاملات مصروفات على الأقل للحصول على اقتراح ميزانية ذكي.");
    }

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const formattedTransactions = expenseTransactions.map(t => ({
        category: categoryMap.get(t.categoryId) || 'غير مصنف',
        amount: t.amount,
        date: t.date.split('T')[0],
    }));

    const prompt = `
    أنت "حسابنا"، مساعد مالي خبير بالذكاء الاصطناعي للمستخدمين في المغرب. مهمتك هي تحليل بيانات المصروفات التالية واقتراح ميزانية شهرية واقعية بالدرهم المغربي (MAD).

    البيانات (آخر 30 يومًا):
    ${JSON.stringify(formattedTransactions, null, 2)}

    المهمة:
    1.  حلل أنماط الإنفاق.
    2.  اقترح ميزانية شهرية معقولة لكل فئة.
    3.  قدم سببًا موجزًا لكل اقتراح (مثل: "بناءً على متوسط إنفاقك" أو "مجال للتوفير هنا").
    4.  يجب أن يكون الناتج بتنسيق JSON حصريًا، بدون أي نص إضافي أو علامات markdown.
    5.  يجب أن يكون الناتج عبارة عن مصفوفة من الكائنات، حيث يحتوي كل كائن على المفاتيح التالية: "category" (سلسلة نصية)، "suggested_amount" (رقم)، "reason" (سلسلة نصية).
    
    مثال على التنسيق المطلوب:
    [
      {
        "category": "الطعام والشراب",
        "suggested_amount": 1500,
        "reason": "متوافق مع متوسط إنفاقك الحالي مع مجال بسيط للتحسين."
      },
      {
        "category": "المواصلات",
        "suggested_amount": 400,
        "reason": "يمكن تحسين هذا المبلغ إذا تم تقليل استخدام سيارات الأجرة."
      }
    ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.5,
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);

        if (Array.isArray(parsedData) && parsedData.every(item => 'category' in item && 'suggested_amount' in item && 'reason' in item)) {
            return parsedData as BudgetSuggestion[];
        } else {
            throw new Error("تنسيق الاستجابة من الذكاء الاصطناعي غير صالح.");
        }

    } catch (error) {
        console.error("Error calling Gemini API for budget suggestion:", error);
        throw new Error("حدث خطأ أثناء التواصل مع مساعد الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا.");
    }
};

export const getAICategorySuggestion = async (
    description: string,
    categories: Category[]
): Promise<string> => {
    checkPrerequisites();
    const categoriesForPrompt = categories.map(({ id, name }) => ({ id, name }));

    const prompt = `
    Based on the transaction description, which category is the most appropriate?
    Description: "${description}"
    
    Available Categories:
    ${JSON.stringify(categoriesForPrompt)}
    
    Respond with ONLY the 'id' of the most relevant category. For example: "cat-3". Do not add any other text, explanation or markdown.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
        });
        
        const categoryId = response.text.trim().replace(/"/g, ''); // Clean up response
        // Validate if the returned ID exists
        if (categories.some(c => c.id === categoryId)) {
            return categoryId;
        } else {
            throw new Error("AI returned an invalid category ID.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for category suggestion:", error);
        throw new Error("فشل في الحصول على اقتراح من الذكاء الاصطناعي.");
    }
};

export const getAISpendingAnalysis = async (
    transactions: Transaction[],
    categories: Category[]
): Promise<string> => {
    checkPrerequisites();
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const expenseTransactions = transactions.filter(t => 
        t.type === 'expense' && new Date(t.date) >= oneMonthAgo
    );

    if (expenseTransactions.length < 10) {
        throw new Error("تحتاج إلى 10 معاملات مصروفات على الأقل في الشهر الماضي للحصول على تحليل ذكي.");
    }

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const formattedTransactions = expenseTransactions.map(t => ({
        category: categoryMap.get(t.categoryId) || 'غير مصنف',
        amount: t.amount,
        description: t.description,
        date: t.date.split('T')[0],
    }));

    const prompt = `
    أنت "حسابنا"، مستشار مالي خبير وودود. مهمتك هي تحليل بيانات مصروفات المستخدم للشهر الماضي وتقديم تحليل مختصر ومفيد باللغة العربية.

    بيانات المستخدم (آخر 30 يومًا، بالدرهم المغربي MAD):
    ${JSON.stringify(formattedTransactions, null, 2)}

    المهمة:
    1.  ابدأ بتحية ودية.
    2.  حلل أنماط الإنفاق بشكل عام. ركز على أكبر فئتين أو ثلاث فئات إنفاق.
    3.  قدم 2-3 نصائح عملية ومحددة يمكن للمستخدم تطبيقها. يجب أن تكون النصائح إيجابية ومشجعة.
    4.  أنهِ التحليل بملاحظة تشجيعية.
    5.  يجب أن يكون الناتج نصًا عاديًا (لا تستخدم Markdown). حافظ على التحليل موجزًا وسهل القراءة (حوالي 100-150 كلمة).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for spending analysis:", error);
        throw new Error("حدث خطأ أثناء تحليل إنفاقك. يرجى المحاولة مرة أخرى.");
    }
};