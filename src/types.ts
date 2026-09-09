export type TransactionType = 'entrada' | 'saida';
export type LocalType = 'fisico' | 'online';
export type BudgetGroup = 'essencial' | 'investimento' | 'educacao' | 'lazer' | 'adicional' | 'receita';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  local_name: string;
  local_type: LocalType;
  description: string;
  category: string;
  subcategory: string;
  budget_group: BudgetGroup;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  parent_category: string;
  type: 'income' | 'expense';
  budget_group: BudgetGroup;
}

export interface SavedLocal {
  id: string;
  name: string;
  local_type: LocalType;
  category: string;
  subcategory?: string;
  budget_group: BudgetGroup;
  type?: TransactionType;
  last_description?: string;
  count: number;
  last_used: string;
}

export interface AIClassificationResult {
  category: string;
  subcategory: string;
  budget_group: BudgetGroup;
  local_type: LocalType;
  fallbackUsed?: boolean;
  errorMessage?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  spentIncomePercentage: number;
}

export interface BudgetGroupSummary {
  name: string;
  key: BudgetGroup;
  value: number;
  percentage: number;
  color: string;
}

export interface TopLocalSummary {
  local_name: string;
  total: number;
  count: number;
  local_type: LocalType;
}

export type TransactionFilter = {
  month: string; // 'all' or 'YYYY-MM'
  type: 'all' | 'entrada' | 'saida';
  search: string;
  budgetGroup: 'all' | BudgetGroup;
};

export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
}

export interface MonthlyBudget {
  id: string; // 'YYYY-MM'
  month: string; // 'YYYY-MM'
  total_expense_limit: number;
  expected_income: number;
  group_limits: {
    essencial: number;
    investimento: number;
    educacao: number;
    lazer: number;
    adicional: number;
  };
  group_items?: {
    essencial?: BudgetItem[];
    investimento?: BudgetItem[];
    educacao?: BudgetItem[];
    lazer?: BudgetItem[];
    adicional?: BudgetItem[];
  };
  notes?: string;
  updated_at?: string;
}

export interface BudgetStatusGroup {
  name: string;
  key: BudgetGroup;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  color: string;
}

export interface MonthlyBudgetSummary {
  month: string;
  hasBudget: boolean;
  budget: MonthlyBudget | null;
  totalExpense: number;
  totalIncome: number;
  totalLimit: number;
  expectedIncome: number;
  remainingTotal: number;
  percentageSpent: number;
  isExceeded: boolean;
  excessAmount: number;
  groups: BudgetStatusGroup[];
}

export interface AdvisorPillar {
  title: string;
  mentor: string;
  advice: string;
  impact: 'alto' | 'medio' | 'critico';
}

export interface AdvisorActionItem {
  title: string;
  description: string;
  priority: 'urgente' | 'alta' | 'estrategica';
  targetDate?: string;
}

export interface StrategicAdvisorAnalysis {
  headline: string;
  summary: string;
  financialHealthScore: number; // 0 - 100
  kpis: {
    monthlySavingsRate: string;
    budgetDiscipline: string;
    debtTargetProgress: string;
    runwaySecurity: string;
  };
  pillars: AdvisorPillar[];
  actionPlan8020: AdvisorActionItem[];
  debtStrategy: {
    avalancheRecommendation: string;
    estimatedRunway: string;
  };
  ecommerceOpportunity: {
    scalingRecommendation: string;
    immediateStep: string;
  };
  timestamp: string;
  modelUsed?: string;
  fallbackUsed?: boolean;
}

export interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
