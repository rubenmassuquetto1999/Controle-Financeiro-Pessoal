import React, { useState } from 'react';
import { SEED_CATEGORIES } from '../lib/seedData';
import { getBudgetGroupBadgeClass } from '../lib/utils';
import { X, Layers, Database } from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  if (!isOpen) return null;

  const filteredCategories = SEED_CATEGORIES.filter((c) => {
    if (activeTab === 'income') return c.type === 'income';
    if (activeTab === 'expense') return c.type === 'expense';
    return true;
  });

  // Group by parent_category
  const grouped = filteredCategories.reduce((acc, cat) => {
    const parent = cat.parent_category || 'Geral';
    if (!acc[parent]) acc[parent] = [];
    acc[parent].push(cat);
    return acc;
  }, {} as Record<string, typeof SEED_CATEGORIES>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#18181b] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#09090b]/80">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Estrutura de Categorias Base (Seed)
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Taxonomia do sistema utilizada pela IA para auto-classificação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-5 py-2.5 bg-[#09090b]/40 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Todas ({SEED_CATEGORIES.length})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-red-950/40 text-red-300 border border-red-800/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Saídas (Despesas)
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              activeTab === 'income'
                ? 'bg-green-950/40 text-green-300 border border-green-800/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Entradas (Receitas)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {Object.entries(grouped).map(([parent, items]) => (
            <div key={parent} className="border border-slate-800 rounded-lg bg-[#09090b]/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-sans font-semibold text-slate-200 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  {parent}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {items.map((cat) => (
                  <div
                    key={cat.name}
                    className="p-2.5 rounded-lg bg-[#18181b] border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-200 font-sans font-medium">{cat.name}</span>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded border ${getBudgetGroupBadgeClass(cat.budget_group)}`}>
                      {cat.budget_group}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#09090b]/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

