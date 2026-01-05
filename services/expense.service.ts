
import { Expense, User } from '../types';
import { apiRequest } from './api';

class ExpenseService {
  private expenses: Expense[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.refresh();
  }

  onChange(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  async refresh() {
    try {
      const data = await apiRequest('GET', '/api/expenses');
      this.expenses = data || [];
      this.notify();
    } catch (e) {
      console.error("Expense Sync Failed", e);
    }
  }

  getExpenses() {
    return this.expenses;
  }

  getExpenseById(id: string) {
    return this.expenses.find(e => e.id === id);
  }

  async createExpense(data: Partial<Expense>, user: User | null) {
    const newExp = {
      ...data,
      id: `EXP-${Date.now()}`,
      status: data.status || 'Paid',
      date: data.date || new Date().toISOString().split('T')[0]
    } as Expense;
    
    const saved = await apiRequest('POST', '/api/expenses', newExp);
    await this.refresh();
    return saved;
  }

  async updateExpense(id: string, data: Partial<Expense>) {
    const saved = await apiRequest('PUT', `/api/expenses/${id}`, data);
    await this.refresh();
    return saved;
  }

  async deleteExpense(id: string) {
    await apiRequest('DELETE', `/api/expenses/${id}`);
    await this.refresh();
  }

  getTotalExpenses() {
    return this.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  getCategories() {
    return [
      'Office Supplies',
      'Rent & Workspace',
      'Salaries & Wages',
      'Marketing & Ads',
      'Utilities (DEWA/Internet)',
      'Travel & Transport',
      'Software Subscriptions',
      'Professional Fees',
      'Miscellaneous'
    ];
  }
}

export const expenseService = new ExpenseService();
