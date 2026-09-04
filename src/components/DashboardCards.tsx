import React from 'react';
import { FinancialSummary } from '../types';
import { formatBRL } from '../lib/utils';
import { ArrowDownRight, ArrowUpRight, Wallet, Percent, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardsProps {
  summary: FinancialSummary;
}

export function DashboardCards({ summary }: DashboardCardsProps) {
  const isPositiveBalance = summary.balance >= 0;
  const savingRate = summary.totalIncome > 0 ? Math.max(0, 100 - summary.spentIncomePercentage) : 0;
  const isHighSpend = summary.spentIncomePercentage > 80;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Entradas Totais */}
      <section className="bg-[#18181b] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-center transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">
            Entradas
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        </div>
        <div className="text-lg xs:text-xl sm:text-2xl font-mono font-bold mt-1 text-green-400 tracking-tight truncate">
          {formatBRL(summary.totalIncome)}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 font-mono truncate">
          Receitas do período
        </div>
      </section>

      {/* 2. Saídas Totais */}
      <section className="bg-[#18181b] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-center transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">
            Saídas
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        </div>
        <div className="text-lg xs:text-xl sm:text-2xl font-mono font-bold mt-1 text-red-400 tracking-tight truncate">
          {formatBRL(summary.totalExpense)}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 font-mono truncate">
          {summary.totalIncome > 0
            ? `${summary.spentIncomePercentage.toFixed(1)}% da receita`
            : 'Despesas registradas'}
        </div>
      </section>

      {/* 3. Saldo Líquido */}
      <section className="bg-[#18181b] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-center transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">
            Saldo
          </span>
          <span className={`h-1.5 w-1.5 rounded-full ${isPositiveBalance ? 'bg-blue-400' : 'bg-red-500'}`} />
        </div>
        <div className={`text-lg xs:text-xl sm:text-2xl font-mono font-bold mt-1 tracking-tight truncate ${isPositiveBalance ? 'text-blue-400' : 'text-red-400'}`}>
          {formatBRL(summary.balance)}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 font-mono truncate">
          {isPositiveBalance ? 'Superávit líquido' : 'Déficit orçamentário'}
        </div>
      </section>

      {/* 4. Saving Rate / Taxa de Poupança */}
      <section className="bg-[#18181b] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-center transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">
            Poupança
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 font-bold">
            Meta: 20%
          </span>
        </div>
        <div className="text-lg xs:text-xl sm:text-2xl font-mono font-bold mt-1 text-slate-100 tracking-tight">
          {savingRate.toFixed(1)}%
        </div>
        <div className="w-full mt-1.5">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                savingRate >= 20 ? 'bg-blue-500' : savingRate > 0 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(savingRate, 100)}%` }}
            />
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 font-mono truncate">
          {savingRate >= 20 ? 'Acima da meta (20%)' : 'Abaixo da meta'}
        </div>
      </section>
    </div>
  );
}

