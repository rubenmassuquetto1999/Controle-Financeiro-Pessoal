import React, { useState, useMemo } from 'react';
import { Badge } from './ui/Badge';
import { Transaction, TransactionType, BudgetGroup } from '../types';
import { formatBRL, formatDate, getBudgetGroupBadgeClass } from '../lib/utils';
import { deleteTransaction } from '../lib/firebase';
import { EditTransactionModal } from './EditTransactionModal';
import {
  Search,
  Trash2,
  Pencil,
  ArrowDownRight,
  ArrowUpRight,
  Globe,
  Store,
  ListOrdered
} from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
  onRefresh?: () => void;
}

export function TransactionsTable({ transactions, onRefresh }: TransactionsTableProps) {
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract distinct months from transactions (e.g., '2026-08', '2026-09')
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (monthFilter !== 'all' && (!tx.date || !tx.date.startsWith(monthFilter))) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Budget group filter
      if (groupFilter !== 'all' && tx.budget_group !== groupFilter) {
        return false;
      }

      // Text search in local_name, description, category, subcategory
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLocal = tx.local_name?.toLowerCase().includes(query);
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesCat = tx.category?.toLowerCase().includes(query);
        const matchesSub = tx.subcategory?.toLowerCase().includes(query);
        if (!matchesLocal && !matchesDesc && !matchesCat && !matchesSub) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, monthFilter, typeFilter, groupFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setErrorMessage(null);
      await deleteTransaction(id);
      setDeleteConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Falha ao excluir transação:', err);
      setErrorMessage('Falha ao excluir registro: ' + (err.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx] || month}/${year}`;
  };

  return (
    <section className="bg-[#18181b] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      {/* Header with Title & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
            Transações Registradas
          </h3>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:col-span-2 lg:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar local/descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2.5 w-full rounded-lg border border-slate-700 bg-[#09090b] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* Month selector */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-700 bg-[#09090b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans cursor-pointer w-full lg:w-auto"
          >
            <option value="all">Todos os meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>

          {/* Type selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-700 bg-[#09090b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans cursor-pointer w-full lg:w-auto"
          >
            <option value="all">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          {/* Group selector */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-700 bg-[#09090b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans cursor-pointer w-full lg:w-auto sm:col-span-2 lg:col-span-1"
          >
            <option value="all">Todos os grupos</option>
            <option value="essencial">Essencial</option>
            <option value="investimento">Investimento</option>
            <option value="educacao">Educação</option>
            <option value="lazer">Lazer</option>
            <option value="adicional">Adicional</option>
            <option value="receita">Receita</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="my-3 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* MOBILE & TABLET CARD VIEW (Visible on <md screens) */}
      <div className="block md:hidden mt-3 space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs font-mono border border-slate-800/60 rounded-xl bg-[#09090b]/40">
            Nenhuma transação encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'saida';
            const isConfirming = deleteConfirmId === tx.id;

            return (
              <div
                key={`mobile-${tx.id}`}
                onClick={() => setSelectedTransactionForEdit(tx)}
                className="bg-[#09090b]/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-colors cursor-pointer active:scale-[0.99]"
              >
                {/* Top Row: Local, Date & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200 text-xs font-sans">
                      {tx.local_type === 'online' ? (
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate font-bold">{tx.local_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {formatDate(tx.date)}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold font-mono ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                      {isExpense ? '-' : '+'} {formatBRL(tx.amount)}
                    </div>
                    <span className="inline-block mt-0.5">
                      <Badge
                        variant={isExpense ? 'danger' : 'success'}
                        className="text-[8px] py-0 px-1.5"
                      >
                        {isExpense ? 'Saída' : 'Entrada'}
                      </Badge>
                    </span>
                  </div>
                </div>

                {/* Middle Row: Description & Notes */}
                <div className="text-xs text-slate-300 font-sans">
                  <p className="line-clamp-2">{tx.description}</p>
                  {tx.notes && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md w-fit">
                      <span>Obs: {tx.notes}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Badges & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {tx.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono border ${getBudgetGroupBadgeClass(tx.budget_group)}`}>
                      {tx.budget_group}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tx.id);
                          }}
                          disabled={deletingId === tx.id}
                          className="px-2.5 py-1 rounded bg-red-600 text-[10px] text-white font-mono font-bold cursor-pointer"
                        >
                          {deletingId === tx.id ? '...' : 'Excluir'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300 font-mono cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransactionForEdit(tx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(tx.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP & TABLET LANDSCAPE TABLE (Visible on md: and above) */}
      <div className="hidden md:block overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#09090b]/50 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              <th className="py-3 px-3">Data</th>
              <th className="py-3 px-3">Local</th>
              <th className="py-3 px-3">Descritivo</th>
              <th className="py-3 px-3">Categoria</th>
              <th className="py-3 px-3">Grupo</th>
              <th className="py-3 px-3 text-right">Valor</th>
              <th className="py-3 px-3 text-center">Tipo</th>
              <th className="py-3 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 text-xs font-mono">
                  Nenhuma transação encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'saida';
                const isConfirming = deleteConfirmId === tx.id;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransactionForEdit(tx)}
                    className="hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    title="Clique para ver observações ou editar"
                  >
                    {/* Data */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Local */}
                    <td className="py-3 px-3 font-sans text-slate-200">
                      <div className="flex items-center gap-1.5 font-medium">
                        {tx.local_type === 'online' ? (
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Online" />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Físico" />
                        )}
                        <span className="truncate max-w-[160px]">{tx.local_name}</span>
                      </div>
                    </td>

                    {/* Descritivo */}
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate block max-w-[210px]" title={tx.description}>
                          {tx.description}
                        </span>
                        {tx.notes && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[9px] font-mono shrink-0"
                            title={`Observação: ${tx.notes}`}
                          >
                            Obs
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-3 text-slate-300">
                      <div>
                        <div className="font-sans font-medium text-slate-200">{tx.category}</div>
                        {tx.subcategory && tx.subcategory !== tx.category && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {tx.subcategory}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Grupo */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${getBudgetGroupBadgeClass(tx.budget_group)}`}>
                        {tx.budget_group}
                      </span>
                    </td>

                    {/* Valor */}
                    <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                      <span className={isExpense ? 'text-red-400' : 'text-green-400'}>
                        {isExpense ? '-' : '+'} {formatBRL(tx.amount)}
                      </span>
                    </td>

                    {/* Tipo Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <Badge
                        variant={isExpense ? 'danger' : 'success'}
                        className="text-[9px]"
                      >
                        {isExpense ? (
                          <span className="flex items-center gap-0.5">
                            <ArrowDownRight className="w-2.5 h-2.5" /> Saída
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5" /> Entrada
                          </span>
                        )}
                      </Badge>
                    </td>

                    {/* Ação */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tx.id);
                            }}
                            disabled={deletingId === tx.id}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-[10px] text-white font-mono font-semibold cursor-pointer"
                          >
                            {deletingId === tx.id ? '...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransactionForEdit(tx);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Editar informações e ver observações"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(tx.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir transação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes e Edição da Transação */}
      {selectedTransactionForEdit && (
        <EditTransactionModal
          isOpen={true}
          transaction={selectedTransactionForEdit}
          onClose={() => setSelectedTransactionForEdit(null)}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </section>
  );
}

