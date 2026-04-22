export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  nameNl: string;
  nameEn: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "income" | "expense";
  date: string;
  categoryId: string;
  userId: string;
  category: Category;
  user: User;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  userId: string;
  category: Category;
  spent?: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}
