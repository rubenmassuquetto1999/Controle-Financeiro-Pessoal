import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import {
  MonthlyBudget,
  MonthlyBudgetSummary,
  Transaction,
  BudgetGroup
} from '../types';
import { saveMonthlyBudget, deleteMonthlyBudget } from '../lib/firebase';
import {
  formatBRL,
  formatMonthName,
  getAdjacentMonth,
  getCurrentMonth,
  getBudgetGroupColor,
  getBudgetGroupLabel
} from '../lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Sparkles,
  Copy,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sliders,
  DollarSign,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface MonthlyBudgetViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlySummary: MonthlyBudgetSummary;
  allBudgets: MonthlyBudget[];
  transactions: Transaction[];
}

export function MonthlyBudgetView({
  selectedMonth,
  onMonthChange,
  monthlySummary,
  allBudgets,
  transactions
}: MonthlyBudgetViewProps) {
  // Form states for editing
  const [expectedIncome, setExpectedIncome] = useState<string>('');
  const [totalExpenseLimit, setTotalExpenseLimit] = useState<string>('');
  const [groupLimits, setGroupLimits] = useState<{
    essencial: string;
    investimento: string;
    educacao: string;
    lazer: string;
    adicional: string;
  }>({
    essencial: '',
    investimento: '',
    educacao: '',
    lazer: '',
    adicional: ''
  });
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync form with current month's budget when selectedMonth or monthlySummary changes
  useEffect(() => {
    if (monthlySummary.budget) {
      setExpectedIncome(monthlySummary.budget.expected_income ? String(monthlySummary.budget.expected_income) : '');
      setTotalExpenseLimit(monthlySummary.budget.total_expense_limit ? String(monthlySummary.budget.total_expense_limit) : '');
      setGroupLimits({
        essencial: monthlySummary.budget.group_limits?.essencial ? String(monthlySummary.budget.group_limits.essencial) : '',
        investimento: monthlySummary.budget.group_limits?.investimento ? String(monthlySummary.budget.group_limits.investimento) : '',
        educacao: monthlySummary.budget.group_limits?.educacao ? String(monthlySummary.budget.group_limits.educacao) : '',
        lazer: monthlySummary.budget.group_limits?.lazer ? String(monthlySummary.budget.group_limits.lazer) : '',
        adicional: monthlySummary.budget.group_limits?.adicional ? String(monthlySummary.budget.group_limits.adicional) : ''
      });
      setNotes(monthlySummary.budget.notes || '');
    } else {
      // Default / empty template for new month
      // Prepopulate expected income if there are actual income transactions this month
      const currentMonthIncome = transactions
        .filter((tx) => tx.type === 'entrada' && tx.date.startsWith(selectedMonth))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      setExpectedIncome(currentMonthIncome > 0 ? String(currentMonthIncome) : '');
      setTotalExpenseLimit('');
      setGroupLimits({
        essencial: '',
        investimento: '',
        educacao: '',
        lazer: '',
        adicional: ''
      });
      setNotes('');
    }
  }, [selectedMonth, monthlySummary.budget, transactions]);

  // Calculate sum of group limits
  const sumOfGroupLimits = useMemo(() => {
    const e = parseFloat(groupLimits.essencial) || 0;
    const i = parseFloat(groupLimits.investimento) || 0;
    const ed = parseFloat(groupLimits.educacao) || 0;
    const l = parseFloat(groupLimits.lazer) || 0;
    const a = parseFloat(groupLimits.adicional) || 0;
    return e + i + ed + l + a;
  }, [groupLimits]);

  // Apply 50-30-20 Rule preset based on Expected Income or Total Limit
  const handleApply503020Rule = () => {
    const baseValue = parseFloat(expectedIncome) || parseFloat(totalExpenseLimit) || 5000;
    const essencial = Math.round(baseValue * 0.5);
    const investimento = Math.round(baseValue * 0.2);
    const lazer = Math.round(baseValue * 0.2);
    const educacao = Math.round(baseValue * 0.1);

    setGroupLimits({
      essencial: String(essencial),
      investimento: String(investimento),
      lazer: String(lazer),
      educacao: String(educacao),
      adicional: '0'
    });

    if (!totalExpenseLimit || parseFloat(totalExpenseLimit) === 0) {
      setTotalExpenseLimit(String(baseValue));
    }

    setFeedbackNotice({
      type: 'success',
      message: `Regra 50-30-20 aplicada sobre ${formatBRL(baseValue)}!`
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Copy budget from previous month
  const handleCopyPreviousMonth = () => {
    const prevMonth = getAdjacentMonth(selectedMonth, -1);
    const prevBudget = allBudgets.find((b) => b.month === prevMonth);

    if (prevBudget) {
      setExpectedIncome(prevBudget.expected_income ? String(prevBudget.expected_income) : '');
      setTotalExpenseLimit(prevBudget.total_expense_limit ? String(prevBudget.total_expense_limit) : '');
      setGroupLimits({
        essencial: prevBudget.group_limits?.essencial ? String(prevBudget.group_limits.essencial) : '',
        investimento: prevBudget.group_limits?.investimento ? String(prevBudget.group_limits.investimento) : '',
        educacao: prevBudget.group_limits?.educacao ? String(prevBudget.group_limits.educacao) : '',
        lazer: prevBudget.group_limits?.lazer ? String(prevBudget.group_limits.lazer) : '',
        adicional: prevBudget.group_limits?.adicional ? String(prevBudget.group_limits.adicional) : ''
      });
      setNotes(prevBudget.notes || '');
      setFeedbackNotice({
        type: 'success',
        message: `Configurações copiadas de ${formatMonthName(prevMonth)}!`
      });
    } else {
      setFeedbackNotice({
        type: 'error',
        message: `Nenhum orçamento encontrado para ${formatMonthName(prevMonth)}.`
      });
    }
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Save budget handler
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackNotice(null);

    try {
      const parsedTotal = parseFloat(totalExpenseLimit) || sumOfGroupLimits;
      const parsedIncome = parseFloat(expectedIncome) || 0;

      await saveMonthlyBudget({
        month: selectedMonth,
        total_expense_limit: parsedTotal,
        expected_income: parsedIncome,
        group_limits: {
          essencial: parseFloat(groupLimits.essencial) || 0,
          investimento: parseFloat(groupLimits.investimento) || 0,
          educacao: parseFloat(groupLimits.educacao) || 0,
          lazer: parseFloat(groupLimits.lazer) || 0,
          adicional: parseFloat(groupLimits.adicional) || 0
        },
        notes: notes.trim()
      });

      setFeedbackNotice({
        type: 'success',
        message: `Orçamento de ${formatMonthName(selectedMonth)} salvo com sucesso!`
      });
    } catch (err: any) {
      console.error('Erro ao salvar orçamento:', err);
      setFeedbackNotice({
        type: 'error',
        message: 'Falha ao salvar orçamento: ' + err.message
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  // Delete budget handler
  const handleDeleteBudget = async () => {
    if (!window.confirm(`Tem certeza que deseja remover o orçamento de ${formatMonthName(selectedMonth)}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMonthlyBudget(selectedMonth);
      setFeedbackNotice({
        type: 'success',
        message: `Orçamento de ${formatMonthName(selectedMonth)} removido.`
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: 'Falha ao excluir orçamento: ' + err.message
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Month Navigation Header Bento Bar */}
      <div className="bg-[#18181b] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Month Selector Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, -1))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-sm sm:text-base font-bold text-slate-100 font-sans">
                {formatMonthName(selectedMonth)}
              </h2>

              <button
                onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              Planejamento Orçamentário vs Gastos Reais
            </p>
          </div>
        </div>

        {/* Action quick buttons */}
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(getCurrentMonth())}
            className="text-[11px] sm:text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300 px-2 sm:px-3"
          >
            Mês Atual
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPreviousMonth}
            className="text-[11px] sm:text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300 px-2 sm:px-3"
            title="Copiar limites definidos no mês anterior"
          >
            <Copy className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
            <span className="hidden xs:inline">Copiar</span> Mês Ant.
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleApply503020Rule}
            className="text-[11px] sm:text-xs font-mono bg-blue-950/60 border-blue-800/60 hover:bg-blue-900/60 text-blue-300 px-2 sm:px-3"
            title="Calcular distribuição automática: 50% Essencial, 20% Investimentos, 20% Lazer, 10% Educação"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-400 shrink-0" />
            50-30-20
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            feedbackNotice.type === 'success'
              ? 'bg-green-950/40 border-green-800/40 text-green-300'
              : 'bg-red-950/40 border-red-800/40 text-red-300'
          }`}
        >
          {feedbackNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedbackNotice.message}</span>
        </div>
      )}

      {/* 2. Top Bento Summary Cards: Planned vs Actual */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Receita Prevista vs Real */}
        <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>RECEITA MENSAL</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatBRL(monthlySummary.expectedIncome || monthlySummary.totalIncome)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Entradas Reais:</span>
            <span className="text-green-400 font-semibold">{formatBRL(monthlySummary.totalIncome)}</span>
          </div>
        </div>

        {/* Card 2: Teto de Gastos vs Realizado */}
        <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TETO DE GASTOS</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatBRL(monthlySummary.totalLimit)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Saídas Reais:</span>
            <span className={monthlySummary.isExceeded ? 'text-red-400 font-bold' : 'text-slate-200'}>
              {formatBRL(monthlySummary.totalExpense)}
            </span>
          </div>
        </div>

        {/* Card 3: Saldo Disponível no Orçamento */}
        <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>MARGEM DISPONÍVEL</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              monthlySummary.isExceeded
                ? 'text-red-400'
                : monthlySummary.remainingTotal > 0
                ? 'text-green-400'
                : 'text-slate-200'
            }`}
          >
            {monthlySummary.isExceeded
              ? `-${formatBRL(monthlySummary.excessAmount)}`
              : formatBRL(monthlySummary.remainingTotal)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Status:</span>
            <span className={monthlySummary.isExceeded ? 'text-red-400 font-bold' : 'text-green-400'}>
              {monthlySummary.isExceeded ? 'ESTOURO ORÇAMENTÁRIO' : 'DENTRO DO LIMITE'}
            </span>
          </div>
        </div>

        {/* Card 4: Percentual Consumido do Orçamento */}
        <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>EXECUÇÃO DO ORÇAMENTO</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-baseline gap-2">
            <span>{Math.round(monthlySummary.percentageSpent)}%</span>
            <span className="text-xs text-slate-500 font-normal">utilizado</span>
          </div>
          {/* Progress meter */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                monthlySummary.isExceeded
                  ? 'bg-red-500'
                  : monthlySummary.percentageSpent >= 85
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, monthlySummary.percentageSpent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Form & Side-by-Side Comparison Bento Grid */}
      <form onSubmit={handleSaveBudget} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Form Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#18181b] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Configurar Metas de {formatMonthName(selectedMonth).split(' ')[0]}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Mês {selectedMonth}</span>
            </div>

            {/* Expected Income Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Receita Prevista (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expectedIncome}
                onChange={(e) => setExpectedIncome(e.target.value)}
                placeholder="Ex: 8500.00"
                className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Total Expense Limit */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Teto Geral de Gastos (R$)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Soma dos grupos: {formatBRL(sumOfGroupLimits)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalExpenseLimit}
                onChange={(e) => setTotalExpenseLimit(e.target.value)}
                placeholder={sumOfGroupLimits > 0 ? String(sumOfGroupLimits) : 'Ex: 6000.00'}
                className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category Groups Breakdown */}
            <div className="space-y-3 border-t border-slate-800/80 pt-3">
              <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center justify-between">
                <span>Limites por Categoria (50-30-20)</span>
              </h4>

              {/* Essencial */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-blue-400">Essencial (Moradia, Alimentação, Luz, etc)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={groupLimits.essencial}
                  onChange={(e) => setGroupLimits({ ...groupLimits, essencial: e.target.value })}
                  placeholder="Ex: 3000.00"
                  className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Investimento */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-green-400">Investimento (Ações, FIIs, Renda Fixa)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={groupLimits.investimento}
                  onChange={(e) => setGroupLimits({ ...groupLimits, investimento: e.target.value })}
                  placeholder="Ex: 1500.00"
                  className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Lazer */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-red-400">Lazer (Restaurantes, Viagens, Streaming)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={groupLimits.lazer}
                  onChange={(e) => setGroupLimits({ ...groupLimits, lazer: e.target.value })}
                  placeholder="Ex: 1000.00"
                  className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Educação */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-400">Educação (Cursos, Livros, Mentorias)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={groupLimits.educacao}
                  onChange={(e) => setGroupLimits({ ...groupLimits, educacao: e.target.value })}
                  placeholder="Ex: 500.00"
                  className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Adicional */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-purple-400">Adicional (Outros Gastos)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={groupLimits.adicional}
                  onChange={(e) => setGroupLimits({ ...groupLimits, adicional: e.target.value })}
                  placeholder="Ex: 300.00"
                  className="w-full h-9 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Observações / Metas do Mês
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Meta de economizar para viagem no fim do ano..."
                className="w-full bg-[#09090b] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono h-9 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
              </Button>

              {monthlySummary.hasBudget && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDeleteBudget}
                  className="px-3 h-9 text-xs font-mono cursor-pointer"
                  title="Excluir orçamento deste mês"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Tracking & Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#18181b] border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Acompanhamento: Planejado vs Realizado
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Baseado nas transações cadastradas no Controle Financeiro para {formatMonthName(selectedMonth)}
                </p>
              </div>
            </div>

            {/* Over-budget alerts box */}
            {monthlySummary.groups.some((g) => g.isExceeded) && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                  <span>ATENÇÃO: CATEGORIAS ACIMA DO ORÇAMENTO</span>
                </div>
                <div className="space-y-1">
                  {monthlySummary.groups
                    .filter((g) => g.isExceeded)
                    .map((g) => (
                      <div key={g.key} className="text-[11px] font-mono text-red-200 flex justify-between">
                        <span>• {g.name}:</span>
                        <span className="font-bold">
                          {formatBRL(g.spent)} gastos de {formatBRL(g.limit)} (+{formatBRL(g.spent - g.limit)} acima)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Group Progress Bars List */}
            <div className="space-y-4 font-mono text-xs">
              {monthlySummary.groups.map((group) => {
                const isOver = group.isExceeded;
                const pct = Math.min(100, Math.round(group.percentage));

                return (
                  <div key={group.key} className="bg-[#09090b]/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-sans font-bold text-slate-200">{group.name}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-100 font-bold">{formatBRL(group.spent)}</span>
                        <span className="text-slate-500 text-[11px]"> / {formatBRL(group.limit)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : pct >= 85 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-slate-400">
                        {group.limit > 0 ? `${Math.round(group.percentage)}% consumido` : 'Sem limite definido'}
                      </span>

                      {group.limit > 0 && (
                        <span className={isOver ? 'text-red-400 font-bold' : 'text-green-400'}>
                          {isOver
                            ? `+${formatBRL(group.spent - group.limit)} acima do orçamento`
                            : `${formatBRL(group.remaining)} livre`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
