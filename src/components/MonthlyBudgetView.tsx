import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/Button';
import {
  MonthlyBudget,
  MonthlyBudgetSummary,
  Transaction,
  BudgetGroup,
  BudgetItem
} from '../types';
import { saveMonthlyBudget, deleteMonthlyBudget } from '../lib/firebase';
import {
  formatBRL,
  formatMonthName,
  getAdjacentMonth,
  getCurrentMonth
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
  Sliders,
  DollarSign,
  ShieldCheck,
  Percent,
  Plus
} from 'lucide-react';

interface MonthlyBudgetViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlySummary: MonthlyBudgetSummary;
  allBudgets: MonthlyBudget[];
  transactions: Transaction[];
}

type GroupKey = 'essencial' | 'investimento' | 'lazer' | 'educacao' | 'adicional';

interface BudgetItemState {
  id: string;
  name: string;
  amount: number | string;
}

type GroupItemsState = {
  essencial: BudgetItemState[];
  investimento: BudgetItemState[];
  lazer: BudgetItemState[];
  educacao: BudgetItemState[];
  adicional: BudgetItemState[];
};

const BUDGET_GROUPS_CONFIG: {
  key: GroupKey;
  title: string;
  subtitle: string;
  color: string;
  suggestions: string[];
}[] = [
  {
    key: 'essencial',
    title: 'Essencial',
    subtitle: 'Moradia, Alimentação, Luz, etc',
    color: '#3b82f6',
    suggestions: ['Aluguel', 'Água', 'Luz', 'Internet', 'Supermercado', 'Gás', 'Condomínio', 'Celular']
  },
  {
    key: 'investimento',
    title: 'Investimento',
    subtitle: 'Ações, FIIs, Renda Fixa',
    color: '#10b981',
    suggestions: ['CDB', 'Tesouro Direto', 'FIIs', 'Ações', 'Criptomoedas', 'Renda Fixa', 'Previdência']
  },
  {
    key: 'lazer',
    title: 'Lazer',
    subtitle: 'Restaurantes, Viagens, Streaming',
    color: '#ef4444',
    suggestions: ['Restaurantes', 'Netflix / Streaming', 'Passeios', 'Viagens', 'Cinema', 'Delivery']
  },
  {
    key: 'educacao',
    title: 'Educação',
    subtitle: 'Cursos, Livros, Mentorias',
    color: '#f59e0b',
    suggestions: ['Cursos', 'Livros', 'Faculdade', 'Idiomas', 'Mentorias']
  },
  {
    key: 'adicional',
    title: 'Adicional',
    subtitle: 'Vestuário, Imprevistos, Outros',
    color: '#a855f7',
    suggestions: ['Vestuário', 'Farmácia / Saúde', 'Pet', 'Imprevistos', 'Manutenção']
  }
];

const DEFAULT_ROUTINE_ITEMS: GroupItemsState = {
  essencial: [
    { id: 'ess-1', name: 'Aluguel / Moradia', amount: '' },
    { id: 'ess-2', name: 'Água', amount: '' },
    { id: 'ess-3', name: 'Luz', amount: '' },
    { id: 'ess-4', name: 'Internet', amount: '' },
    { id: 'ess-5', name: 'Supermercado', amount: '' }
  ],
  investimento: [
    { id: 'inv-1', name: 'CDB', amount: '' },
    { id: 'inv-2', name: 'Tesouro', amount: '' },
    { id: 'inv-3', name: 'FIIs', amount: '' },
    { id: 'inv-4', name: 'Ações', amount: '' },
    { id: 'inv-5', name: 'Criptomoedas', amount: '' },
    { id: 'inv-6', name: 'Renda Fixa', amount: '' }
  ],
  lazer: [
    { id: 'laz-1', name: 'Restaurantes', amount: '' },
    { id: 'laz-2', name: 'Netflix / Streaming', amount: '' },
    { id: 'laz-3', name: 'Viagens & Passeios', amount: '' }
  ],
  educacao: [
    { id: 'edu-1', name: 'Cursos & Treinamentos', amount: '' },
    { id: 'edu-2', name: 'Livros', amount: '' }
  ],
  adicional: [
    { id: 'adi-1', name: 'Vestuário & Pessoal', amount: '' },
    { id: 'adi-2', name: 'Imprevistos', amount: '' }
  ]
};

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
  const [groupItems, setGroupItems] = useState<GroupItemsState>(DEFAULT_ROUTINE_ITEMS);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync form with current month's budget when selectedMonth or monthlySummary changes
  useEffect(() => {
    if (monthlySummary.budget) {
      setExpectedIncome(monthlySummary.budget.expected_income ? String(monthlySummary.budget.expected_income) : '');
      setTotalExpenseLimit(monthlySummary.budget.total_expense_limit ? String(monthlySummary.budget.total_expense_limit) : '');
      setNotes(monthlySummary.budget.notes || '');

      // Load group items
      if (monthlySummary.budget.group_items) {
        setGroupItems({
          essencial: (monthlySummary.budget.group_items.essencial || []).map((it) => ({
            id: it.id || `ess-${Math.random()}`,
            name: it.name || '',
            amount: it.amount || ''
          })),
          investimento: (monthlySummary.budget.group_items.investimento || []).map((it) => ({
            id: it.id || `inv-${Math.random()}`,
            name: it.name || '',
            amount: it.amount || ''
          })),
          lazer: (monthlySummary.budget.group_items.lazer || []).map((it) => ({
            id: it.id || `laz-${Math.random()}`,
            name: it.name || '',
            amount: it.amount || ''
          })),
          educacao: (monthlySummary.budget.group_items.educacao || []).map((it) => ({
            id: it.id || `edu-${Math.random()}`,
            name: it.name || '',
            amount: it.amount || ''
          })),
          adicional: (monthlySummary.budget.group_items.adicional || []).map((it) => ({
            id: it.id || `adi-${Math.random()}`,
            name: it.name || '',
            amount: it.amount || ''
          }))
        });
      } else if (monthlySummary.budget.group_limits) {
        // Fallback for legacy budgets: create starter items with the existing limits so nothing is lost
        const limits = monthlySummary.budget.group_limits;
        setGroupItems({
          essencial: limits.essencial > 0 ? [{ id: 'ess-1', name: 'Despesas Essenciais', amount: limits.essencial }] : DEFAULT_ROUTINE_ITEMS.essencial,
          investimento: limits.investimento > 0 ? [{ id: 'inv-1', name: 'Aplicações / Investimentos', amount: limits.investimento }] : DEFAULT_ROUTINE_ITEMS.investimento,
          lazer: limits.lazer > 0 ? [{ id: 'laz-1', name: 'Gastos com Lazer', amount: limits.lazer }] : DEFAULT_ROUTINE_ITEMS.lazer,
          educacao: limits.educacao > 0 ? [{ id: 'edu-1', name: 'Educação e Cursos', amount: limits.educacao }] : DEFAULT_ROUTINE_ITEMS.educacao,
          adicional: limits.adicional > 0 ? [{ id: 'adi-1', name: 'Gastos Adicionais', amount: limits.adicional }] : DEFAULT_ROUTINE_ITEMS.adicional
        });
      }
    } else {
      // Default / empty template for new month
      const currentMonthIncome = transactions
        .filter((tx) => tx.type === 'entrada' && tx.date.startsWith(selectedMonth))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      setExpectedIncome(currentMonthIncome > 0 ? String(currentMonthIncome) : '');
      setTotalExpenseLimit('');
      setGroupItems(DEFAULT_ROUTINE_ITEMS);
      setNotes('');
    }
  }, [selectedMonth, monthlySummary.budget, transactions]);

  // Calculate sum per group
  const groupTotals = useMemo(() => {
    const totals: Record<GroupKey, number> = {
      essencial: 0,
      investimento: 0,
      lazer: 0,
      educacao: 0,
      adicional: 0
    };

    (Object.keys(groupItems) as GroupKey[]).forEach((key) => {
      totals[key] = (groupItems[key] || []).reduce((acc, item) => {
        const val = parseFloat(String(item.amount)) || 0;
        return acc + val;
      }, 0);
    });

    return totals;
  }, [groupItems]);

  // Sum of all items combined
  const sumOfAllItems = useMemo(() => {
    return (Object.values(groupTotals) as number[]).reduce((a: number, b: number) => a + b, 0);
  }, [groupTotals]);

  // Item manipulation handlers
  const handleAddItem = (groupKey: GroupKey, initialName = '', initialAmount: number | string = '') => {
    const newItem: BudgetItemState = {
      id: `${groupKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: initialName,
      amount: initialAmount
    };

    setGroupItems((prev) => ({
      ...prev,
      [groupKey]: [...prev[groupKey], newItem]
    }));
  };

  const handleRemoveItem = (groupKey: GroupKey, itemId: string) => {
    setGroupItems((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].filter((it) => it.id !== itemId)
    }));
  };

  const handleItemChange = (
    groupKey: GroupKey,
    itemId: string,
    field: 'name' | 'amount',
    value: string
  ) => {
    setGroupItems((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].map((it) => {
        if (it.id === itemId) {
          return { ...it, [field]: value };
        }
        return it;
      })
    }));
  };

  // Add suggestion chip to a group
  const handleAddSuggestion = (groupKey: GroupKey, name: string) => {
    // Check if already exists with exact name
    const existing = groupItems[groupKey].find(
      (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (!existing) {
      handleAddItem(groupKey, name, '');
    } else {
      setFeedbackNotice({
        type: 'error',
        message: `O item "${name}" já está listado em ${groupKey}.`
      });
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  // Apply 50-30-20 Rule preset based on Expected Income or Total Limit
  const handleApply503020Rule = () => {
    const baseValue = parseFloat(expectedIncome) || parseFloat(totalExpenseLimit) || sumOfAllItems || 5000;
    const essencial = Math.round(baseValue * 0.5);
    const investimento = Math.round(baseValue * 0.2);
    const lazer = Math.round(baseValue * 0.2);
    const educacao = Math.round(baseValue * 0.1);

    // Update item budgets or add standard 50-30-20 allocations
    setGroupItems({
      essencial: [
        { id: `ess-${Date.now()}-1`, name: 'Aluguel / Moradia', amount: Math.round(essencial * 0.5) },
        { id: `ess-${Date.now()}-2`, name: 'Supermercado', amount: Math.round(essencial * 0.3) },
        { id: `ess-${Date.now()}-3`, name: 'Contas (Água, Luz, Net)', amount: Math.round(essencial * 0.2) }
      ],
      investimento: [
        { id: `inv-${Date.now()}-1`, name: 'Renda Fixa / CDB', amount: Math.round(investimento * 0.5) },
        { id: `inv-${Date.now()}-2`, name: 'Ações / FIIs', amount: Math.round(investimento * 0.5) }
      ],
      lazer: [
        { id: `laz-${Date.now()}-1`, name: 'Restaurantes & Bares', amount: Math.round(lazer * 0.7) },
        { id: `laz-${Date.now()}-2`, name: 'Streaming & Assinaturas', amount: Math.round(lazer * 0.3) }
      ],
      educacao: [
        { id: `edu-${Date.now()}-1`, name: 'Cursos & Livros', amount: educacao }
      ],
      adicional: [
        { id: `adi-${Date.now()}-1`, name: 'Reserva & Imprevistos', amount: '0' }
      ]
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
      setNotes(prevBudget.notes || '');

      if (prevBudget.group_items) {
        setGroupItems({
          essencial: (prevBudget.group_items.essencial || []).map((it, idx) => ({
            id: `ess-${Date.now()}-${idx}`,
            name: it.name,
            amount: it.amount || ''
          })),
          investimento: (prevBudget.group_items.investimento || []).map((it, idx) => ({
            id: `inv-${Date.now()}-${idx}`,
            name: it.name,
            amount: it.amount || ''
          })),
          lazer: (prevBudget.group_items.lazer || []).map((it, idx) => ({
            id: `laz-${Date.now()}-${idx}`,
            name: it.name,
            amount: it.amount || ''
          })),
          educacao: (prevBudget.group_items.educacao || []).map((it, idx) => ({
            id: `edu-${Date.now()}-${idx}`,
            name: it.name,
            amount: it.amount || ''
          })),
          adicional: (prevBudget.group_items.adicional || []).map((it, idx) => ({
            id: `adi-${Date.now()}-${idx}`,
            name: it.name,
            amount: it.amount || ''
          }))
        });
      } else if (prevBudget.group_limits) {
        const limits = prevBudget.group_limits;
        setGroupItems({
          essencial: limits.essencial > 0 ? [{ id: `ess-${Date.now()}`, name: 'Despesas Essenciais', amount: limits.essencial }] : DEFAULT_ROUTINE_ITEMS.essencial,
          investimento: limits.investimento > 0 ? [{ id: `inv-${Date.now()}`, name: 'Investimentos', amount: limits.investimento }] : DEFAULT_ROUTINE_ITEMS.investimento,
          lazer: limits.lazer > 0 ? [{ id: `laz-${Date.now()}`, name: 'Lazer', amount: limits.lazer }] : DEFAULT_ROUTINE_ITEMS.lazer,
          educacao: limits.educacao > 0 ? [{ id: `edu-${Date.now()}`, name: 'Educação', amount: limits.educacao }] : DEFAULT_ROUTINE_ITEMS.educacao,
          adicional: limits.adicional > 0 ? [{ id: `adi-${Date.now()}`, name: 'Adicional', amount: limits.adicional }] : DEFAULT_ROUTINE_ITEMS.adicional
        });
      }

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
      const parsedTotal = parseFloat(totalExpenseLimit) || sumOfAllItems;
      const parsedIncome = parseFloat(expectedIncome) || 0;

      // Clean and format items for persistence
      const formatItemsList = (items: BudgetItemState[]): BudgetItem[] => {
        return items
          .map((it) => ({
            id: it.id,
            name: it.name.trim() || 'Item sem nome',
            amount: parseFloat(String(it.amount)) || 0
          }))
          .filter((it) => it.name.length > 0);
      };

      const cleanedGroupItems = {
        essencial: formatItemsList(groupItems.essencial),
        investimento: formatItemsList(groupItems.investimento),
        lazer: formatItemsList(groupItems.lazer),
        educacao: formatItemsList(groupItems.educacao),
        adicional: formatItemsList(groupItems.adicional)
      };

      await saveMonthlyBudget({
        month: selectedMonth,
        total_expense_limit: parsedTotal,
        expected_income: parsedIncome,
        group_limits: {
          essencial: groupTotals.essencial,
          investimento: groupTotals.investimento,
          educacao: groupTotals.educacao,
          lazer: groupTotals.lazer,
          adicional: groupTotals.adicional
        },
        group_items: cleanedGroupItems,
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
                type="button"
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
                type="button"
                onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              Planejamento Orçamentário com Itens Rotineiros
            </p>
          </div>
        </div>

        {/* Action quick buttons */}
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(getCurrentMonth())}
            className="text-[11px] sm:text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300 px-2 sm:px-3"
          >
            Mês Atual
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyPreviousMonth}
            className="text-[11px] sm:text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300 px-2 sm:px-3"
            title="Copiar limites e itens rotineiros definidos no mês anterior"
          >
            <Copy className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
            <span className="hidden xs:inline">Copiar</span> Mês Ant.
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleApply503020Rule}
            className="text-[11px] sm:text-xs font-mono bg-blue-950/60 border-blue-800/60 hover:bg-blue-900/60 text-blue-300 px-2 sm:px-3"
            title="Distribuir meta: 50% Essencial, 20% Investimentos, 20% Lazer, 10% Educação"
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
            {formatBRL(monthlySummary.totalLimit || sumOfAllItems)}
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
        {/* Left Column: Hierarchical Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Configurar Metas e Itens de {formatMonthName(selectedMonth).split(' ')[0]}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Mês {selectedMonth}</span>
            </div>

            {/* Income and Total limit header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
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
                  className="w-full h-10 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Total Expense Limit */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Teto Geral de Gastos (R$)
                  </label>
                  <button
                    type="button"
                    onClick={() => setTotalExpenseLimit(String(sumOfAllItems))}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono underline cursor-pointer"
                    title="Preencher com a soma dos itens rotineiros"
                  >
                    Usar soma ({formatBRL(sumOfAllItems)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalExpenseLimit}
                  onChange={(e) => setTotalExpenseLimit(e.target.value)}
                  placeholder={sumOfAllItems > 0 ? String(sumOfAllItems) : 'Ex: 6000.00'}
                  className="w-full h-10 bg-[#09090b] border border-slate-800 rounded-lg px-3 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Groups with Routine Items List */}
            <div className="space-y-5 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 font-sans">
                    Limites por Categoria & Itens Rotineiros
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Adicione ou remova itens específicos. O total do grupo é calculado automaticamente.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-300 font-semibold hidden sm:inline">
                  Soma total: {formatBRL(sumOfAllItems)}
                </span>
              </div>

              {/* Loop through each of the 5 budget groups */}
              {BUDGET_GROUPS_CONFIG.map((group) => {
                const items = groupItems[group.key] || [];
                const currentTotal = groupTotals[group.key];

                return (
                  <div
                    key={group.key}
                    className="bg-[#09090b]/80 border border-slate-800/90 rounded-xl p-3 sm:p-4 space-y-3"
                  >
                    {/* Separation Header: e.g. Lazer (Restaurantes, Viagens, Streaming) - R$ 0,00 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-slate-100 font-sans">
                          {group.title}{' '}
                          <span className="text-slate-400 font-normal text-xs">
                            ({group.subtitle})
                          </span>
                        </span>
                      </div>

                      {/* Real-time total for this group */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-xs sm:text-sm font-bold">
                        <span className="text-slate-400 font-normal text-[11px] sm:text-xs">Total:</span>
                        <span
                          className="px-2 py-0.5 rounded-md border text-xs sm:text-sm font-bold"
                          style={{
                            color: group.color,
                            backgroundColor: `${group.color}15`,
                            borderColor: `${group.color}35`
                          }}
                        >
                          {formatBRL(currentTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Routine Items List */}
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="p-3 text-center rounded-lg border border-dashed border-slate-800/80 text-[11px] text-slate-500 font-mono">
                          Nenhum item cadastrado neste grupo. Clique em adicionar abaixo.
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1.5 sm:gap-2"
                          >
                            {/* Item Name Input */}
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(group.key, item.id, 'name', e.target.value)
                              }
                              placeholder="Nome do item (ex: Aluguel)"
                              className="flex-1 min-w-0 h-9 sm:h-10 bg-[#121215] border border-slate-800 rounded-lg px-2.5 sm:px-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                            />

                            {/* Item Amount Input */}
                            <div className="relative w-28 sm:w-36 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-slate-500 font-mono pointer-events-none">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.amount}
                                onChange={(e) =>
                                  handleItemChange(group.key, item.id, 'amount', e.target.value)
                                }
                                placeholder="0,00"
                                className="w-full h-9 sm:h-10 bg-[#121215] border border-slate-800 rounded-lg pl-8 pr-2.5 text-right text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                              />
                            </div>

                            {/* Remove Item Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(group.key, item.id)}
                              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-colors shrink-0 cursor-pointer"
                              title={`Remover "${item.name || 'item'}"`}
                              aria-label={`Remover item ${item.name || ''}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Item Button */}
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddItem(group.key)}
                        className="py-1.5 px-3 rounded-lg border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-900/40 hover:bg-slate-900 w-full sm:w-auto"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>Adicionar item em {group.title}</span>
                      </button>

                      {/* Suggestion Chips */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                          Sugestões:
                        </span>
                        {group.suggestions.slice(0, 4).map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddSuggestion(group.key, sug)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#121215] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
                            title={`Adicionar "${sug}"`}
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="space-y-1 border-t border-slate-800/80 pt-3">
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
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono h-10 cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? 'Salvando...' : 'Salvar Orçamento e Itens'}
              </Button>

              {monthlySummary.hasBudget && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDeleteBudget}
                  className="px-3.5 h-10 text-xs font-mono cursor-pointer"
                  title="Excluir orçamento deste mês"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Tracking & Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#18181b] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Acompanhamento: Planejado vs Realizado
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Baseado nas transações registradas em {formatMonthName(selectedMonth)}
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

            {/* Group Progress Bars List with Planned Routine Items Preview */}
            <div className="space-y-4 font-mono text-xs">
              {monthlySummary.groups.map((group) => {
                const isOver = group.isExceeded;
                const pct = Math.min(100, Math.round(group.percentage));
                const plannedItems = (monthlySummary.budget?.group_items?.[group.key as keyof typeof monthlySummary.budget.group_items] || []).filter(it => it.amount > 0 || it.name);

                return (
                  <div key={group.key} className="bg-[#09090b]/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2.5">
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

                    {/* Planned Routine Items Mini-Checklist */}
                    {plannedItems.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 mt-1.5 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                          Itens Planejados:
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {plannedItems.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between text-[11px] text-slate-300 bg-[#121215] px-2 py-1 rounded border border-slate-800/50"
                            >
                              <span className="truncate pr-2">{it.name}</span>
                              <span className="font-mono text-slate-200 font-semibold shrink-0">
                                {formatBRL(it.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
