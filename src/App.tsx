import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { TransactionForm } from './components/TransactionForm';
import { DashboardCards } from './components/DashboardCards';
import { BudgetPieChart } from './components/BudgetPieChart';
import { TopLocalsBarChart } from './components/TopLocalsBarChart';
import { TransactionsTable } from './components/TransactionsTable';
import { MonthlyBudgetView } from './components/MonthlyBudgetView';
import { BudgetAlertBanner } from './components/BudgetAlertBanner';
import { AuthGate } from './components/AuthGate';
import {
  Transaction,
  FinancialSummary,
  BudgetGroupSummary,
  TopLocalSummary,
  BudgetGroup,
  MonthlyBudget,
  MonthlyBudgetSummary,
  BudgetStatusGroup
} from './types';
import {
  subscribeTransactions,
  subscribeMonthlyBudgets,
  syncExistingTransactionsToLocals
} from './lib/firebase';
import {
  getBudgetGroupColor,
  getBudgetGroupLabel,
  getCurrentMonth
} from './lib/utils';
import { AlertCircle } from 'lucide-react';

function AuthenticatedDashboard({
  user,
  onLogout
}: {
  user: User;
  onLogout: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'finance' | 'budget'>('finance');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Firestore real-time listeners for Transactions and Budgets
  useEffect(() => {
    let unsubscribeTx: (() => void) | undefined;
    let unsubscribeBudgets: (() => void) | undefined;

    try {
      // 1. Realtime Transactions subscription
      unsubscribeTx = subscribeTransactions(
        (data) => {
          setTransactions(data);
          setErrorMessage(null);
          if (data && data.length > 0) {
            syncExistingTransactionsToLocals(data);
          }
        },
        (err) => {
          console.error('Erro de conexão (Transações):', err);
          setErrorMessage('Falha na sincronização de transações: ' + err.message);
        }
      );

      // 2. Realtime Monthly Budgets subscription
      unsubscribeBudgets = subscribeMonthlyBudgets(
        (data) => {
          setBudgets(data);
        },
        (err) => {
          console.error('Erro de conexão (Orçamentos):', err);
        }
      );
    } catch (err: any) {
      console.error('Falha ao inicializar listeners:', err);
      setErrorMessage('Falha na inicialização do sistema: ' + err.message);
    }

    return () => {
      if (unsubscribeTx) unsubscribeTx();
      if (unsubscribeBudgets) unsubscribeBudgets();
    };
  }, [user?.uid]);

  // 1. Calculate Monthly Budget vs Actual Summary for the selected month
  const monthlyBudgetSummary: MonthlyBudgetSummary = useMemo(() => {
    const currentBudget = budgets.find((b) => b.month === selectedMonth) || null;
    const monthTransactions = transactions.filter((tx) => tx.date.startsWith(selectedMonth));

    let totalIncome = 0;
    let totalExpense = 0;
    const groupSpentMap: Record<BudgetGroup, number> = {
      essencial: 0,
      investimento: 0,
      educacao: 0,
      lazer: 0,
      adicional: 0,
      receita: 0
    };

    monthTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'entrada') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        const g = (tx.budget_group || 'essencial') as BudgetGroup;
        if (groupSpentMap[g] !== undefined) {
          groupSpentMap[g] += amount;
        } else {
          groupSpentMap['essencial'] += amount;
        }
      }
    });

    const totalLimit = currentBudget?.total_expense_limit || 0;
    const expectedIncome = currentBudget?.expected_income || 0;
    const hasBudget = currentBudget !== null && totalLimit > 0;
    const isExceeded = hasBudget && totalExpense > totalLimit;
    const excessAmount = isExceeded ? totalExpense - totalLimit : 0;
    const remainingTotal = hasBudget ? Math.max(0, totalLimit - totalExpense) : 0;
    const percentageSpent = totalLimit > 0 ? (totalExpense / totalLimit) * 100 : 0;

    // Groups breakdown
    const groupKeys: BudgetGroup[] = ['essencial', 'investimento', 'lazer', 'educacao', 'adicional'];
    const groups: BudgetStatusGroup[] = groupKeys.map((key) => {
      const limit = currentBudget?.group_limits ? Number(currentBudget.group_limits[key as keyof typeof currentBudget.group_limits]) || 0 : 0;
      const spent = groupSpentMap[key] || 0;
      const grpExceeded = limit > 0 && spent > limit;
      const remaining = limit > 0 ? Math.max(0, limit - spent) : 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        name: getBudgetGroupLabel(key),
        key,
        limit,
        spent,
        remaining,
        percentage,
        isExceeded: grpExceeded,
        color: getBudgetGroupColor(key)
      };
    });

    return {
      month: selectedMonth,
      hasBudget,
      budget: currentBudget,
      totalExpense,
      totalIncome,
      totalLimit,
      expectedIncome,
      remainingTotal,
      percentageSpent,
      isExceeded,
      excessAmount,
      groups
    };
  }, [budgets, transactions, selectedMonth]);

  // 2. Global Resumo Financeiro
  const financialSummary: FinancialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'entrada') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const spentIncomePercentage = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      spentIncomePercentage
    };
  }, [transactions]);

  // 3. Gráfico de Pizza (Saídas por budget_group)
  const budgetGroupData: BudgetGroupSummary[] = useMemo(() => {
    const expenseTxs = transactions.filter((tx) => tx.type === 'saida');
    const totalExpense = expenseTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const groupTotals: Record<string, number> = {
      essencial: 0,
      investimento: 0,
      educacao: 0,
      lazer: 0,
      adicional: 0
    };

    expenseTxs.forEach((tx) => {
      const group = (tx.budget_group || 'essencial') as BudgetGroup;
      if (groupTotals[group] !== undefined) {
        groupTotals[group] += Number(tx.amount) || 0;
      } else {
        groupTotals['essencial'] += Number(tx.amount) || 0;
      }
    });

    return Object.entries(groupTotals)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: getBudgetGroupLabel(key),
        key: key as BudgetGroup,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: getBudgetGroupColor(key)
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 4. Gráfico de Barras (Top 5 Locais com maior volume de saídas)
  const topLocalsData: TopLocalSummary[] = useMemo(() => {
    const expenseTxs = transactions.filter((tx) => tx.type === 'saida');
    const localMap: Record<string, { total: number; count: number; local_type: 'fisico' | 'online' }> = {};

    expenseTxs.forEach((tx) => {
      const local = tx.local_name || 'Desconhecido';
      if (!localMap[local]) {
        localMap[local] = {
          total: 0,
          count: 0,
          local_type: tx.local_type || 'fisico'
        };
      }
      localMap[local].total += Number(tx.amount) || 0;
      localMap[local].count += 1;
    });

    return Object.entries(localMap)
      .map(([local_name, data]) => ({
        local_name,
        total: data.total,
        count: data.count,
        local_type: data.local_type
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Bento Header with Navigation Tabs & Live Alert Indicator */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMonth={selectedMonth}
        monthlySummary={monthlyBudgetSummary}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Bento Grid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-500 hover:text-slate-300 font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* View 1: Controle Financeiro */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            {/* Live Budget Comparison Banner (Ties Budget to Financial Tracking) */}
            <BudgetAlertBanner
              summary={monthlyBudgetSummary}
              selectedMonth={selectedMonth}
              onNavigateToBudget={() => setActiveTab('budget')}
            />

            {/* 1. Bento Metric Cards (Top 4 stats) */}
            <DashboardCards summary={financialSummary} />

            {/* 2. Main Middle Bento Row: Left Form & Right Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left Column: Transaction Form (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col">
                <TransactionForm />
              </div>

              {/* Right Column: 2 Visual Bento Chart Modules (7 cols on lg) */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <BudgetPieChart
                  data={budgetGroupData}
                  totalExpense={financialSummary.totalExpense}
                />
                <TopLocalsBarChart data={topLocalsData} />
              </div>
            </div>

            {/* 3. Bottom Bento Row: Full Width Transactions Table */}
            <TransactionsTable transactions={transactions} />
          </div>
        )}

        {/* View 2: Orçamento Mensal */}
        {activeTab === 'budget' && (
          <MonthlyBudgetView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            monthlySummary={monthlyBudgetSummary}
            allBudgets={budgets}
            transactions={transactions}
          />
        )}
      </main>

      {/* Bento Footer */}
      <footer className="border-t border-slate-800/80 bg-[#09090b] py-3.5 text-center text-slate-500 text-xs font-mono">
        FIN-AI • CONTROLE FINANCEIRO COM CLASSIFICAÇÃO INTELIGENTE • GESTÃO DE ORÇAMENTO MENSAL
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      {({ user, onLogout }) => (
        <AuthenticatedDashboard user={user} onLogout={onLogout} />
      )}
    </AuthGate>
  );
}

