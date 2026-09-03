import React, { useState, useEffect, useRef } from 'react';
import { addTransaction, subscribeSavedLocals } from '../lib/firebase';
import { AIClassificationResult, TransactionType, LocalType, BudgetGroup, SavedLocal } from '../types';
import { COMMON_LOCAL_SUGGESTIONS, SEED_CATEGORIES } from '../lib/seedData';
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Store,
  Globe,
  Database,
  Search,
  Check,
  RotateCcw,
  X,
  ChevronDown
} from 'lucide-react';
import { formatBRL, getBudgetGroupBadgeClass } from '../lib/utils';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(today);
  const [type, setType] = useState<TransactionType>('saida');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [localName, setLocalName] = useState<string>('');
  const [localType, setLocalType] = useState<LocalType>('fisico');
  const [description, setDescription] = useState<string>('');

  // Database of saved locals
  const [savedLocals, setSavedLocals] = useState<SavedLocal[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedSavedLocal, setSelectedSavedLocal] = useState<SavedLocal | null>(null);

  // Category override / preview
  const [customCategory, setCustomCategory] = useState<string>('');
  const [customBudgetGroup, setCustomBudgetGroup] = useState<BudgetGroup | ''>('');
  const [showCategorySettings, setShowCategorySettings] = useState<boolean>(false);

  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastClassification, setLastClassification] = useState<AIClassificationResult | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to the saved locals database
  useEffect(() => {
    const unsubscribe = subscribeSavedLocals(
      (data) => {
        setSavedLocals(data);
      },
      (err) => {
        console.warn('Erro ao carregar base de locais:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered saved locals from the database
  const matchingSavedLocals = React.useMemo(() => {
    const query = localName.trim().toLowerCase();
    if (!query) {
      // Top 6 most used
      return savedLocals.slice(0, 6);
    }
    return savedLocals.filter((l) => l.name.toLowerCase().includes(query)).slice(0, 8);
  }, [savedLocals, localName]);

  // Fallback preset suggestions if local is not in user's database yet
  const matchingFallbackSuggestions = React.useMemo(() => {
    const query = localName.trim().toLowerCase();
    if (!query) return [];
    return COMMON_LOCAL_SUGGESTIONS.filter(
      (s) =>
        s.toLowerCase().includes(query) &&
        !savedLocals.some((saved) => saved.name.toLowerCase() === s.toLowerCase())
    ).slice(0, 4);
  }, [localName, savedLocals]);

  // Parse raw BRL string
  const parseAmount = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (/^[0-9.,]*$/.test(v)) {
      setRawAmount(v);
      setFormError(null);
    }
  };

  // Pull local data when user selects an establishment
  const handleSelectLocal = (item: SavedLocal) => {
    setLocalName(item.name);
    setLocalType(item.local_type || 'fisico');
    setSelectedSavedLocal(item);
    setCustomCategory(item.category);
    setCustomBudgetGroup(item.budget_group);
    if (item.type) {
      setType(item.type);
    }
    if (!description.trim() && item.last_description) {
      setDescription(item.last_description);
    }
    setIsDropdownOpen(false);
    setFormError(null);
  };

  // Select fallback suggestion
  const handleSelectFallback = (suggestion: string) => {
    setLocalName(suggestion);
    setSelectedSavedLocal(null);
    setIsDropdownOpen(false);
  };

  const handleClearSelectedLocal = () => {
    setSelectedSavedLocal(null);
    setCustomCategory('');
    setCustomBudgetGroup('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessBanner(null);

    const amount = parseAmount(rawAmount);

    // Validation
    if (!date) {
      setFormError('Data não pode ser vazia.');
      return;
    }
    if (amount <= 0) {
      setFormError('Valor não pode ser zero ou negativo.');
      return;
    }
    if (!localName.trim()) {
      setFormError('Local deve ser preenchido.');
      return;
    }
    if (!description.trim()) {
      setFormError('Descritivo deve ser preenchido.');
      return;
    }

    try {
      setIsClassifying(true);

      let finalCategory = customCategory.trim();
      let finalBudgetGroup: BudgetGroup =
        (customBudgetGroup as BudgetGroup) || (type === 'entrada' ? 'receita' : 'essencial');
      let finalLocalType: LocalType = localType;
      let finalSubcategory = description.trim();

      // If category is not set, or user wants to re-evaluate with AI
      if (!finalCategory) {
        try {
          const res = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              local_name: localName.trim(),
              description: description.trim(),
              type: type
            })
          });

          const contentType = res.headers.get('content-type');
          if (res.ok && contentType && contentType.includes('application/json')) {
            const aiResult: AIClassificationResult = await res.json();
            setLastClassification(aiResult);
            finalCategory = aiResult.category || (type === 'entrada' ? 'Salário' : 'Supermercado/Alimentação');
            finalSubcategory = aiResult.subcategory || description.trim();
            finalBudgetGroup = aiResult.budget_group || (type === 'entrada' ? 'receita' : 'essencial');
            finalLocalType = aiResult.local_type || localType;
          } else {
            // Fallback rule if backend returned non-JSON or error
            finalCategory = type === 'entrada' ? 'Outras rendas' : 'Supermercado/Alimentação';
            finalBudgetGroup = type === 'entrada' ? 'receita' : 'essencial';
          }
        } catch (classifyErr) {
          console.warn('Classificação automática indisponível, aplicando fallback local:', classifyErr);
          finalCategory = type === 'entrada' ? 'Outras rendas' : 'Supermercado/Alimentação';
          finalBudgetGroup = type === 'entrada' ? 'receita' : 'essencial';
        }
      }

      // Persist transaction (this will also automatically feed the locals database)
      await addTransaction({
        date,
        type,
        amount,
        local_name: localName.trim(),
        local_type: finalLocalType,
        description: description.trim(),
        category: finalCategory,
        subcategory: finalSubcategory,
        budget_group: finalBudgetGroup
      });

      // Reset form
      setRawAmount('');
      setLocalName('');
      setDescription('');
      setSelectedSavedLocal(null);
      setCustomCategory('');
      setCustomBudgetGroup('');
      setShowCategorySettings(false);

      setSuccessBanner(
        `Registrado: ${finalCategory} (${finalBudgetGroup.toUpperCase()}) em "${localName.trim()}" • ${formatBRL(amount)}`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Falha ao processar lançamento:', err);
      setFormError(err.message || 'Falha ao salvar lançamento.');
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <section className="bg-[#18181b] border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-sm relative">
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Novo Lançamento
          </h3>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"
              title="Base de estabelecimentos aprendida com suas compras"
            >
              <Database className="w-3 h-3" />
              {savedLocals.length} locais na base
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Data & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isClassifying}
                required
                className="w-full bg-[#09090b] border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                disabled={isClassifying}
                className="w-full bg-[#09090b] border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="saida">Saída (Despesa)</option>
                <option value="entrada">Entrada (Receita)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Valor (BRL) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valor (BRL)</label>
              {rawAmount && (
                <span className="text-[10px] font-mono text-slate-400">
                  {formatBRL(parseAmount(rawAmount))}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="0,00"
              value={rawAmount}
              onChange={handleAmountChange}
              disabled={isClassifying}
              required
              className={`w-full bg-[#09090b] border border-slate-700 rounded-lg p-2 text-sm font-mono outline-none focus:border-blue-500 transition-colors ${
                type === 'entrada' ? 'text-green-400' : 'text-red-400'
              }`}
            />
          </div>

          {/* Row 3: Local com Base de Dados Inteligente */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Store className="w-3 h-3 text-slate-400" />
                Local / Estabelecimento
              </label>

              {/* Formato do Local Toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLocalType('fisico')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    localType === 'fisico'
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Estabelecimento Físico"
                >
                  <Store className="w-2.5 h-2.5" /> Físico
                </button>
                <button
                  type="button"
                  onClick={() => setLocalType('online')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    localType === 'online'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Compra ou Serviço Online"
                >
                  <Globe className="w-2.5 h-2.5" /> Online
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Supermercado Vem que Tem, Netflix, Shell..."
                value={localName}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setLocalName(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedSavedLocal && selectedSavedLocal.name !== e.target.value) {
                    setSelectedSavedLocal(null);
                  }
                }}
                disabled={isClassifying}
                required
                className="w-full bg-[#09090b] border border-slate-700 rounded-lg p-2 pr-8 text-xs text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title="Ver locais salvos na base"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Indicator of Recognized Local from Database */}
            {selectedSavedLocal && (
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Base: <strong>{selectedSavedLocal.category}</strong>
                    {selectedSavedLocal.budget_group && (
                      <span className="ml-1 text-[10px] font-mono uppercase text-emerald-400/80">
                        ({selectedSavedLocal.budget_group})
                      </span>
                    )}
                    {selectedSavedLocal.count > 1 && (
                      <span className="ml-1.5 text-[9px] font-mono text-slate-400">
                        • {selectedSavedLocal.count} compras salvas
                      </span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedLocal}
                  className="text-slate-400 hover:text-slate-200 text-[10px] ml-2 shrink-0 cursor-pointer"
                  title="Alterar categoria deste lançamento"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Dropdown Menu with Saved Locals & Suggestions */}
            {isDropdownOpen && !isClassifying && (
              <div className="absolute z-30 left-0 right-0 top-[60px] bg-[#0d0e12] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                {/* 1. Saved Locals in User Database */}
                {matchingSavedLocals.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-slate-900/80 text-[10px] font-mono text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-blue-400" />
                        {localName.trim() ? 'Locais Encontrados na Base' : 'Locais Mais Frequentes'}
                      </span>
                      <span className="text-[9px] text-slate-500">Puxa categoria habitual</span>
                    </div>
                    {matchingSavedLocals.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectLocal(item)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/15 border-b border-slate-800/40 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-semibold text-slate-100 truncate group-hover:text-blue-300">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="truncate">{item.category}</span>
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                              {item.budget_group}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.local_type === 'online' ? (
                            <span className="text-[9px] font-mono text-blue-400 flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Online
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                              <Store className="w-2.5 h-2.5" /> Físico
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.count}x
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Fallback Suggestions */}
                {matchingFallbackSuggestions.length > 0 && (
                  <div>
                    <div className="px-3 py-1 bg-slate-900/60 text-[9px] font-mono text-slate-500 border-b border-slate-800">
                      Sugestões Gerais
                    </div>
                    {matchingFallbackSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSelectFallback(suggestion)}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{suggestion}</span>
                        <span className="text-[9px] text-slate-500 font-mono">selecionar</span>
                      </button>
                    ))}
                  </div>
                )}

                {matchingSavedLocals.length === 0 && matchingFallbackSuggestions.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-500 font-mono">
                    Novo local! Será memorizado automaticamente na sua base após o registro.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 4: Descritivo */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Descritivo</label>
            <input
              type="text"
              placeholder="Ex: Abastecimento viagem trabalho, compras do mês..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isClassifying}
              required
              className="w-full bg-[#09090b] border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Optional Category Review / Override */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCategorySettings(!showCategorySettings)}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showCategorySettings ? '▾ Ocultar ajuste manual' : '▸ Ajustar categoria manualmente'}</span>
              {customCategory && (
                <span className="ml-1 text-blue-400 font-sans">({customCategory})</span>
              )}
            </button>

            {showCategorySettings && (
              <div className="mt-2 p-3 rounded-lg bg-[#09090b] border border-slate-800 space-y-2 text-xs animate-fadeIn">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Categoria:</label>
                  <select
                    value={customCategory}
                    onChange={(e) => {
                      const catName = e.target.value;
                      setCustomCategory(catName);
                      const found = SEED_CATEGORIES.find((c) => c.name === catName);
                      if (found) {
                        setCustomBudgetGroup(found.budget_group);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="">Automático / Identificado pela IA</option>
                    {SEED_CATEGORIES.filter((c) => (type === 'entrada' ? c.type === 'income' : c.type === 'expense')).map(
                      (c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.budget_group.toUpperCase()})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Grupo de Orçamento:</label>
                  <select
                    value={customBudgetGroup}
                    onChange={(e) => setCustomBudgetGroup(e.target.value as BudgetGroup)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="">Automático / Identificado pela IA</option>
                    <option value="essencial">ESSENCIAL — Necessidades básicas, moradia, mercado</option>
                    <option value="investimento">INVESTIMENTO — Aportes, ações, reserva</option>
                    <option value="educacao">EDUCAÇÃO — Cursos, faculdade, livros</option>
                    <option value="lazer">LAZER — Restaurantes, viagens, entretenimento</option>
                    <option value="adicional">ADICIONAL — Assinaturas, compras pontuais, revenda</option>
                    <option value="receita">RECEITA — Salário, rendimentos, vendas</option>
                  </select>
                </div>

                {(customCategory || customBudgetGroup) && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>
                      {customBudgetGroup ? (
                        <>Grupo selecionado: <strong className="text-blue-400 uppercase">{customBudgetGroup}</strong></>
                      ) : (
                        <span>Grupo automático</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCategory('');
                        setCustomBudgetGroup('');
                      }}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      Restaurar automático
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic AI classification indicator / badge */}
          {isClassifying && (
            <div className="mt-3 p-2.5 bg-blue-900/20 border border-blue-800/30 rounded-lg flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-blue-300 font-medium tracking-tight font-mono">
                PROCESSANDO E ALIMENTANDO BASE DE LOCAIS...
              </span>
            </div>
          )}

          {/* Error Banner */}
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-mono text-[10px]">{formError}</div>
            </div>
          )}

          {/* Success Banner */}
          {successBanner && (
            <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-800/40 text-green-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
              <div className="flex-1 font-mono text-[10px]">{successBanner}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isClassifying}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-lg mt-3 transition-colors tracking-wide uppercase cursor-pointer"
          >
            {isClassifying ? 'REGISTRANDO...' : 'REGISTRAR TRANSAÇÃO'}
          </button>
        </form>
      </div>

      {/* Informative Classification Feedback Box */}
      {lastClassification && (
        <div className="mt-4 p-3 rounded-lg bg-[#09090b]/80 border border-slate-800 text-xs space-y-1.5 font-mono">
          <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between border-b border-slate-800/60 pb-1">
            <span>Última Classificação por IA</span>
            {lastClassification.fallbackUsed && (
              <span className="text-amber-400 text-[9px]">(Regra local)</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div>
              <span className="text-slate-500">Categoria:</span>{' '}
              <span className="text-slate-200 font-bold">{lastClassification.category}</span>
            </div>
            <div>
              <span className="text-slate-500">Grupo:</span>{' '}
              <span className="text-blue-400 uppercase font-bold">{lastClassification.budget_group}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
