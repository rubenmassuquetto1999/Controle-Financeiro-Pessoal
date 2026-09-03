import React, { useState, useEffect } from 'react';
import {
  X,
  Pencil,
  Calendar,
  DollarSign,
  Store,
  Globe,
  FileText,
  Tag,
  Layers,
  StickyNote,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Check,
  Sparkles,
  Database
} from 'lucide-react';
import { Transaction, TransactionType, LocalType, BudgetGroup, SavedLocal } from '../types';
import { updateTransaction, subscribeSavedLocals, recordLocalUsage } from '../lib/firebase';
import { formatBRL, formatDate } from '../lib/utils';
import { SEED_CATEGORIES } from '../lib/seedData';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface BudgetGroupOption {
  key: BudgetGroup;
  label: string;
  desc: string;
  icon: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  badgeBg: string;
  badgeBorder: string;
}

const BUDGET_GROUPS: BudgetGroupOption[] = [
  {
    key: 'essencial',
    label: 'Essencial',
    desc: 'Moradia, supermercado, luz, água, farmácia, transporte',
    icon: '🏠',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-950/60',
    activeText: 'text-blue-300',
    badgeBg: 'bg-blue-500/15 text-blue-300',
    badgeBorder: 'border-blue-500/30'
  },
  {
    key: 'investimento',
    label: 'Investimento',
    desc: 'Aportes, ações, FIIs, renda fixa, cripto, reserva',
    icon: '📈',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-950/60',
    activeText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 text-emerald-300',
    badgeBorder: 'border-emerald-500/30'
  },
  {
    key: 'educacao',
    label: 'Educação',
    desc: 'Cursos, faculdade, livros, treinamentos, concursos',
    icon: '📚',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-950/60',
    activeText: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 text-amber-300',
    badgeBorder: 'border-amber-500/30'
  },
  {
    key: 'lazer',
    label: 'Lazer',
    desc: 'Restaurantes, viagens, cinema, streaming, passeios',
    icon: '✈️',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-purple-950/60',
    activeText: 'text-purple-300',
    badgeBg: 'bg-purple-500/15 text-purple-300',
    badgeBorder: 'border-purple-500/30'
  },
  {
    key: 'adicional',
    label: 'Adicional',
    desc: 'Revenda/comércio, vestuário, assinaturas extras, imprevistos',
    icon: '🛍️',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-950/60',
    activeText: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 text-rose-300',
    badgeBorder: 'border-rose-500/30'
  },
  {
    key: 'receita',
    label: 'Receita',
    desc: 'Salário, pró-labore, vendas de produtos, aluguéis, rendas',
    icon: '💰',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-950/60',
    activeText: 'text-teal-300',
    badgeBg: 'bg-teal-500/15 text-teal-300',
    badgeBorder: 'border-teal-500/30'
  }
];

// Quick category suggestions based on selected budget group
const GROUP_CATEGORY_SUGGESTIONS: Record<BudgetGroup, string[]> = {
  essencial: [
    'Supermercado/Alimentação',
    'Aluguel',
    'Farmácia',
    'Transporte (Uber, Ônibus, Combustível)',
    'Luz',
    'Internet',
    'Telefone'
  ],
  investimento: ['Renda Fixa', 'Ações', 'FIIs', 'Cripto'],
  educacao: ['Cursos', 'Concurso', 'Livros', 'Faculdade'],
  lazer: ['Netflix', 'YouTube', 'Disney', 'Viagem', 'Restaurantes'],
  adicional: [
    'Comércio / Revenda',
    'Vestuário',
    'Assinaturas (Canva, CapCut)',
    'Doações',
    'IPTU',
    'Despesas Extras'
  ],
  receita: ['Salário', 'Pró-labore', 'Vendas Mercado Livre / Online', 'Aluguéis', 'Dividendos', 'Outras rendas']
};

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSaved
}: EditTransactionModalProps) {
  const [date, setDate] = useState(transaction?.date || '');
  const [type, setType] = useState<TransactionType>(transaction?.type || 'saida');
  const [amountStr, setAmountStr] = useState(transaction?.amount?.toString() || '0');
  const [localName, setLocalName] = useState(transaction?.local_name || '');
  const [localType, setLocalType] = useState<LocalType>(transaction?.local_type || 'fisico');
  const [description, setDescription] = useState(transaction?.description || '');
  const [category, setCategory] = useState(transaction?.category || '');
  const [subcategory, setSubcategory] = useState(transaction?.subcategory || '');
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup>(transaction?.budget_group || 'essencial');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [updateLocalInMemory, setUpdateLocalInMemory] = useState(true);

  const [savedLocals, setSavedLocals] = useState<SavedLocal[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeSavedLocals(
      (data) => setSavedLocals(data),
      () => {}
    );
    return () => unsubscribe();
  }, [isOpen]);

  // Sync state whenever transaction changes
  useEffect(() => {
    if (transaction) {
      setDate(transaction.date || '');
      setType(transaction.type || 'saida');
      setAmountStr(transaction.amount?.toString() || '0');
      setLocalName(transaction.local_name || '');
      setLocalType(transaction.local_type || 'fisico');
      setDescription(transaction.description || '');
      setCategory(transaction.category || '');
      setSubcategory(transaction.subcategory || '');
      setBudgetGroup(transaction.budget_group || 'essencial');
      setNotes(transaction.notes || '');
      setUpdateLocalInMemory(true);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [transaction]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Por favor, informe um valor numérico válido e maior que zero.');
      return;
    }

    if (!localName.trim()) {
      setErrorMessage('O nome do estabelecimento ou local é obrigatório.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('A descrição da transação é obrigatória.');
      return;
    }

    try {
      setIsSaving(true);
      await updateTransaction(transaction.id, {
        date,
        type,
        amount: parsedAmount,
        local_name: localName.trim(),
        local_type: localType,
        description: description.trim(),
        category: category.trim() || 'Geral',
        subcategory: subcategory.trim(),
        budget_group: budgetGroup,
        notes: notes.trim()
      });

      // Synchronize with learned locals database if enabled
      if (updateLocalInMemory && localName.trim()) {
        try {
          await recordLocalUsage({
            name: localName.trim(),
            local_type: localType,
            category: category.trim() || 'Geral',
            subcategory: subcategory.trim(),
            budget_group: budgetGroup,
            type,
            description: description.trim()
          });
        } catch (e) {
          console.warn('Erro ao sincronizar base aprendida do local:', e);
        }
      }

      setSuccessMessage('Transação atualizada com sucesso!');
      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Erro ao atualizar transação:', err);
      setErrorMessage(err.message || 'Falha ao atualizar a transação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !transaction) return null;

  const currentGroupInfo = BUDGET_GROUPS.find((g) => g.key === budgetGroup) || BUDGET_GROUPS[0];
  const suggestedCategories = GROUP_CATEGORY_SUGGESTIONS[budgetGroup] || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121215] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 sticky top-0 bg-[#121215]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Editar Registro Financeiro
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Altere grupo, categoria, observações ou valores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Row 1: Tipo & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Tipo de Fluxo
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#09090b] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('saida')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    type === 'saida'
                      ? 'bg-red-950/80 text-red-300 border border-red-800/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ↓ Saída (Gasto)
                </button>
                <button
                  type="button"
                  onClick={() => setType('entrada')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    type === 'entrada'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ↑ Entrada (Receita)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-sm font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Data & Tipo de Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Data da Transação
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Formato do Local
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#09090b] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLocalType('fisico')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    localType === 'fisico'
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-slate-300" /> Físico
                </button>
                <button
                  type="button"
                  onClick={() => setLocalType('online')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    localType === 'online'
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Online
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Local & Descritivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                Local / Estabelecimento
              </label>
              <input
                type="text"
                required
                list="edit-modal-locals"
                value={localName}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalName(val);
                  const found = savedLocals.find((l) => l.name.toLowerCase() === val.trim().toLowerCase());
                  if (found) {
                    if (found.category) setCategory(found.category);
                    if (found.budget_group) setBudgetGroup(found.budget_group);
                    if (found.local_type) setLocalType(found.local_type);
                  }
                }}
                placeholder="Ex: Supermercado, Netflix, Posto"
                className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
              <datalist id="edit-modal-locals">
                {savedLocals.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.category} ({l.budget_group}) • {l.local_type}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Descritivo
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Compras da semana, Assinatura mensal"
                className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Grupo de Orçamento - VISUAL SELECTOR + BUTTONS */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase text-slate-300 flex items-center gap-1.5 font-bold tracking-wider">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Grupo de Orçamento
              </label>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${currentGroupInfo.badgeBg} ${currentGroupInfo.badgeBorder}`}
              >
                <span>{currentGroupInfo.icon}</span>
                <span>Ativo: <strong>{currentGroupInfo.label}</strong></span>
              </span>
            </div>

            {/* Interactive Grid with all 6 Budget Groups (1-click change) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUDGET_GROUPS.map((g) => {
                const isSelected = budgetGroup === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setBudgetGroup(g.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                      isSelected
                        ? `${g.activeBg} ${g.activeBorder} ${g.activeText} shadow-sm ring-1 ring-offset-0 ring-current`
                        : 'bg-[#09090b] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <span className="text-sm">{g.icon}</span>
                        <span>{g.label}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-current" />
                      )}
                    </div>
                    <span className="text-[10px] leading-tight text-slate-400/90 line-clamp-2">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Helper Banner */}
            <div className="p-2 rounded-xl bg-[#09090b] border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                <span>
                  Grupo selecionado: <strong className="text-slate-200 uppercase">{currentGroupInfo.label}</strong> — {currentGroupInfo.desc}
                </span>
              </span>
            </div>
          </div>

          {/* Row 5: Categoria & Subcategoria com Sugestões Rápidas */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Categoria
                </label>
                <input
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    // Check if selected category matches a known category to automatically suggest group
                    const foundCat = SEED_CATEGORIES.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                    if (foundCat && foundCat.budget_group) {
                      setBudgetGroup(foundCat.budget_group);
                    }
                  }}
                  placeholder="Ex: Alimentação, Revenda, Transporte"
                  className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <datalist id="categories-list">
                  {SEED_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat.name}>
                      {cat.parent_category} ({cat.budget_group.toUpperCase()})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Subcategoria (Opcional)
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="Ex: Mercado semanal, Fornecedor, Combustível"
                  className="w-full h-9 px-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Category Chips according to selected budget group */}
            {suggestedCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono text-slate-500 mr-1">
                  Sugestões ({currentGroupInfo.label}):
                </span>
                {suggestedCategories.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setCategory(sug)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                      category.toLowerCase() === sug.toLowerCase()
                        ? `${currentGroupInfo.badgeBg} ${currentGroupInfo.badgeBorder} font-bold`
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 6: Observações / Anotações */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <StickyNote className="w-3.5 h-3.5 text-yellow-400" />
              Observações & Notas Pessoais
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações livres, número da parcela (ex: 2/10), detalhes de reembolso, itens comprados ou motivos do gasto..."
              className="w-full p-3 rounded-xl bg-[#09090b] border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans resize-y"
            />
          </div>

          {/* Memory update checkbox */}
          {localName.trim() && (
            <div className="p-3 rounded-xl bg-[#09090b] border border-slate-800 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="update-memory-check"
                checked={updateLocalInMemory}
                onChange={(e) => setUpdateLocalInMemory(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="update-memory-check" className="text-slate-300 cursor-pointer flex items-center gap-1.5 select-none">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Lembrar padrão deste local (<strong>{localName}</strong>) como <strong>{budgetGroup.toUpperCase()}</strong> para futuros lançamentos
                </span>
              </label>
            </div>
          )}

          {/* Transaction Metadata Footer Info */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 gap-2">
            <span>ID: <code className="text-slate-400">{transaction.id}</code></span>
            {transaction.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Registrado: {new Date(transaction.created_at).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
