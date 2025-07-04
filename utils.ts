
import { RecurringFrequency } from './types';

/**
 * Safely adds one month to a given date, handling edge cases like month-end dates.
 * For example, adding a month to Jan 31 results in the last day of February.
 * @param date The original date.
 * @returns A new Date object set to one month later.
 */
export const safeAddMonth = (date: Date): Date => {
    const d = new Date(date);
    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + 1);
    // If the new month doesn't have the original day (e.g., adding a month to Jan 31),
    // it will roll over. We need to set it to the last day of the previous month.
    if (d.getDate() !== originalDay) {
        d.setDate(0); 
    }
    return d;
};


/**
 * Calculates the next due date for a recurring transaction, ensuring it's in the future.
 * @param startDate The start date or last due date of the transaction.
 * @param frequency The recurring frequency ('daily', 'weekly', 'monthly', 'yearly').
 * @returns The next due date that is on or after today.
 */
export const calculateNextDueDate = (startDate: Date, frequency: RecurringFrequency): Date => {
    let nextDueDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Loop until the next due date is in the future (or today)
    while (nextDueDate < today) {
        if (frequency === 'daily') {
            nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (frequency === 'weekly') {
            nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (frequency === 'monthly') {
            nextDueDate = safeAddMonth(nextDueDate);
        } else if (frequency === 'yearly') {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }
    }
    return nextDueDate;
};
