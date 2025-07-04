
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO string
  description: string;
  invoiceImage?: string; // Base64 encoded image
}

export interface Category {
  id: string;
  name: string;
}

export interface Goal {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string; // ISO String
  nextDueDate: string; // ISO String
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface UserProfile {
    name: string;
    email: string;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    nextPaymentDate: string; // ISO String
}

export type ActiveView = 'dashboard' | 'transactions' | 'goals' | 'categories' | 'budget' | 'settings' | 'reports' | 'debts';