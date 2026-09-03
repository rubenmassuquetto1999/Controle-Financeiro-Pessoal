import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { MonthlyBudgetSummary } from '../types';
import { formatBRL, formatMonthName } from '../lib/utils';

interface BudgetAlertBannerProps {
  summary: MonthlyBudgetSummary;
  selectedMonth: string;
  onNavigateToBudget: () => void;
}

export function BudgetAlertBanner({
  summary,
  selectedMonth,
  onNavigateToBudget
}: BudgetAlertBannerProps) {
  if (!summary.hasBudget) {
    return (
      <div className="bg-[#18181b] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-slate-200 font-sans font-semibold">
              Orçamento de {formatMonthName(selectedMonth)} não configurado.
            </span>
            <p className="text-[11px] text-slate-400">
              Defina suas metas de gastos (50-30-20) para receber alertas automáticos de economia.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToBudget}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer text-[11px]"
        >
          <span>Definir Orçamento</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isExceeded = summary.isExceeded;
  const isNearLimit = summary.percentageSpent >= 85 && !isExceeded;
  const exceededGroups = summary.groups.filter((g) => g.isExceeded);

  return (
    <div
      className={`border rounded-xl p-3.5 transition-all text-xs font-mono ${
        isExceeded
          ? 'bg-red-950/40 border-red-800/60 text-red-200'
          : isNearLimit
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          : 'bg-green-950/30 border-green-800/40 text-green-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isExceeded ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-0.5">
            <div className="font-sans font-bold text-slate-100 flex items-center gap-2">
              <span>
                {isExceeded
                  ? `⚠️ Alerta: Você ultrapassou o orçamento de ${formatMonthName(selectedMonth).split(' ')[0]}!`
                  : isNearLimit
                  ? `⚡ Atenção: Você atingiu ${Math.round(summary.percentageSpent)}% do orçamento de ${formatMonthName(selectedMonth).split(' ')[0]}`
                  : `✓ Orçamento sob controle em ${formatMonthName(selectedMonth).split(' ')[0]}`}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                  isExceeded
                    ? 'bg-red-900/60 text-red-300 border border-red-700/60 font-bold'
                    : 'bg-green-900/60 text-green-300 border border-green-700/60 font-bold'
                }`}
              >
                {Math.round(summary.percentageSpent)}% usado
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {isExceeded ? (
                <>
                  Total gasto: <strong className="text-red-300">{formatBRL(summary.totalExpense)}</strong> de{' '}
                  <strong>{formatBRL(summary.totalLimit)}</strong> previstos (
                  <strong className="text-red-400">+{formatBRL(summary.excessAmount)} acima</strong>)
                  {exceededGroups.length > 0 && (
                    <span className="block text-red-300/90 mt-0.5">
                      Categorias estouradas: {exceededGroups.map((g) => g.name).join(', ')}
                    </span>
                  )}
                </>
              ) : (
                <>
                  Total gasto: <strong>{formatBRL(summary.totalExpense)}</strong> de{' '}
                  <strong>{formatBRL(summary.totalLimit)}</strong> previstos (
                  <strong className="text-green-300">{formatBRL(summary.remainingTotal)} restantes</strong>)
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToBudget}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors cursor-pointer text-[11px] ml-auto"
        >
          <span>Ver Orçamento</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
