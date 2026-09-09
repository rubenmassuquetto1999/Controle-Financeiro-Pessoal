import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Landmark,
  Scale,
  Award,
  Layers,
  MessageSquareQuote,
  Flame,
  Maximize2,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  Transaction,
  FinancialSummary,
  MonthlyBudgetSummary,
  StrategicAdvisorAnalysis,
  AdvisorChatMessage
} from '../types';
import { AdvisorDetailModal, AdvisorModalData } from './AdvisorDetailModal';
import { FormattedChatMessage } from './FormattedChatMessage';
import { AdvisorChatModal } from './AdvisorChatModal';

interface AIStrategicAdvisorCardProps {
  transactions: Transaction[];
  financialSummary: FinancialSummary;
  monthlyBudgetSummary: MonthlyBudgetSummary;
  selectedMonth: string;
}

export const AIStrategicAdvisorCard: React.FC<AIStrategicAdvisorCardProps> = ({
  transactions,
  financialSummary,
  monthlyBudgetSummary,
  selectedMonth
}) => {
  const [analysis, setAnalysis] = useState<StrategicAdvisorAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'action8020' | 'chat'>('overview');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [modalData, setModalData] = useState<AdvisorModalData | null>(null);

  // Chat interaction state
  const [chatMessages, setChatMessages] = useState<AdvisorChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);

  // Extract month expenses and category breakdown for rich, context-aware advisor answers
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => !selectedMonth || (t.date && t.date.startsWith(selectedMonth)));
  }, [transactions, selectedMonth]);

  const topCategories = useMemo(() => {
    const expenseTx = monthTransactions.filter((t) => t.type === 'saida');
    const catMap: Record<string, number> = {};
    expenseTx.forEach((t) => {
      const cat = t.category || 'Outras despesas';
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount || 0);
    });
    const totalExp = financialSummary.totalExpense > 0 ? financialSummary.totalExpense : 1;
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExp) * 100)
      }));
  }, [monthTransactions, financialSummary.totalExpense]);

  const topExpenses = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'saida')
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 6)
      .map((t) => ({
        description: t.description || t.local_name || 'Gasto sem descrição',
        amount: Number(t.amount || 0),
        category: t.category || 'Geral'
      }));
  }, [monthTransactions]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId((cur) => (cur === id ? null : cur));
    }, 2000);
  };

  // Fetch or regenerate the analysis
  const fetchAdvisorAnalysis = async (forceRefresh = false) => {
    const cacheKey = `fin_advisor_analysis_${selectedMonth}`;

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it's less than 6 hours old
          const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
          if (cacheAge < 6 * 60 * 60 * 1000) {
            setAnalysis(parsed);
            return;
          }
        }
      } catch (_err) {
        // Silent recovery from storage parsing
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          financialSummary,
          monthlyBudgetSummary,
          selectedMonth
        })
      });

      if (!response.ok) {
        throw new Error(`Falha no servidor: status ${response.status}`);
      }

      const data: StrategicAdvisorAnalysis = await response.json();
      setAnalysis(data);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (_storageErr) {
        // Silent quota limit on localStorage
      }
    } catch (_err: any) {
      setError('Não foi possível sincronizar com o servidor no momento. Exibindo diagnóstico estratégico padrão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorAnalysis(false);
  }, [selectedMonth]);

  // Send a custom question to the 8-master council
  const handleSendQuestion = async (eOrQuery?: React.FormEvent | string) => {
    let query = '';
    if (typeof eOrQuery === 'string') {
      query = eOrQuery.trim();
    } else {
      if (eOrQuery) eOrQuery.preventDefault();
      query = inputQuestion.trim();
    }
    if (!query || chatLoading) return;

    const userMsg: AdvisorChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/advisor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: {
            selectedMonth,
            totalIncome: financialSummary.totalIncome,
            totalExpense: financialSummary.totalExpense,
            balance: financialSummary.balance,
            isExceeded: monthlyBudgetSummary.isExceeded,
            excessAmount: monthlyBudgetSummary.excessAmount,
            topCategories,
            topExpenses
          }
        })
      });

      const json = await res.json();
      const botMsg: AdvisorChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
        role: 'assistant',
        content: json.answer || 'Análise indisponível no momento.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (_err) {
      const errMsg: AdvisorChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        content: 'Houve uma instabilidade temporária na consulta ao conselho. Lembre-se: mantenha o foco total na margem de segurança, na disciplina do teto orçamentário e no fortalecimento do fluxo de caixa líquido.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick preset questions for convenience (Commercial & Universal across all financial domains)
  const quickQuestions = [
    'Comprar um iPhone ou investir o dinheiro?',
    'Como ganhar mais dinheiro e faturar mais?',
    'Quais as melhores estratégias para alavancar capital?',
    'Vale a pena pegar empréstimo ou usar crédito?',
    'Como planejar viagens e lazer sem me endividar?',
    'Quanto devo investir em cursos e estudos?',
    'Onde estou gastando mais este mês?',
    'Estou com uma dívida de 15 mil reais, como quitar mais rápido?',
    'Qual a meta para minha reserva de emergência e runway?'
  ];

  return (
    <div
      id="ai-strategic-advisor-card"
      className="w-full rounded-2xl bg-linear-to-b from-[#0e1726]/90 via-[#0d131f]/90 to-[#090d16]/90 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 overflow-hidden transition-all duration-300 backdrop-blur-md"
    >
      {/* Top Banner Header */}
      <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-emerald-500/20 bg-linear-to-r from-emerald-950/40 via-slate-900/60 to-indigo-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-emerald-400/20 to-teal-500/10 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-xs sm:text-base font-bold text-white tracking-wide flex items-center gap-2 flex-wrap font-mono leading-normal">
                <span className="inline-flex items-center">CONSELHEIRO ESTRATÉGICO FINANCEIRO</span>
                <span className="inline-flex items-center justify-center text-[9px] sm:text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-semibold shrink-0 my-auto">
                  8 Mestres da Riqueza
                </span>
              </h2>
            </div>
            <p className="hidden sm:block text-[11px] sm:text-xs text-slate-300/90 mt-1 leading-relaxed break-normal whitespace-normal">
              Warren Buffett • Charlie Munger • Ray Dalio • Naval Ravikant • Morgan Housel • Alex Hormozi • Peter Thiel • Andrew Carnegie
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="w-full sm:w-auto flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-emerald-500/15 sm:border-t-0 justify-between sm:justify-end shrink-0">
          <button
            type="button"
            onClick={() => fetchAdvisorAnalysis(true)}
            disabled={loading}
            className="flex-1 sm:flex-initial w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-1.5 text-xs sm:text-xs font-semibold rounded-xl sm:rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Atualizar diagnóstico com os dados financeiros mais recentes"
          >
            <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{loading ? 'Consultando...' : 'Reavaliar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 sm:p-1.5 rounded-xl sm:rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title={isExpanded ? 'Recolher conselheiro' : 'Expandir conselheiro'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-6 space-y-3.5 sm:space-y-5 overflow-hidden">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Diagnóstico & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('pillars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pillars'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Pilares dos Mestres</span>
            </button>

            <button
              onClick={() => setActiveTab('action8020')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'action8020'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Plano 80/20 & Rota</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('chat');
                setIsChatModalOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Consultar os Mestres</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 ml-0.5">
                <Maximize2 className="w-2.5 h-2.5" />
                Janela
              </span>
            </button>
          </div>

          {/* Loading Indicator when no analysis yet */}
          {loading && !analysis && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Consultando o conselho estratégico e auditando números do mês...
              </p>
            </div>
          )}

          {error && !analysis && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {analysis && (
            <>
              {/* TAB 1: OVERVIEW & KPIS */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Headline & Executive Summary */}
                  <div
                    onClick={() =>
                      setModalData({
                        type: 'headline',
                        headline: analysis.headline,
                        score: analysis.financialHealthScore !== undefined ? analysis.financialHealthScore : 70,
                        summary: analysis.summary,
                        selectedMonth,
                        financialSummary
                      })
                    }
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 space-y-2 cursor-pointer transition-all group"
                    title="Clique para ver detalhes completos do diagnóstico e pontuação"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-emerald-300 leading-snug group-hover:text-emerald-200 transition-colors">
                        {analysis.headline}
                      </h3>
                      {analysis.financialHealthScore !== undefined && (
                        <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Score: {analysis.financialHealthScore}/100</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {analysis.summary}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-emerald-400/80 group-hover:text-emerald-300">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" />
                        Clique para abrir diagnóstico completo e critérios do score
                      </span>
                    </div>
                  </div>

                  {/* 4 Strategic KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <div
                      onClick={() =>
                        setModalData({
                          type: 'kpi',
                          kpiKey: 'savingsRate',
                          title: 'Poupança / Queima',
                          value: analysis.kpis.monthlySavingsRate,
                          subtitle: 'Saldo Líquido / Receita'
                        })
                      }
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
                      title="Clique para ver fórmula, benchmarks e detalhes da Taxa de Poupança"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span>Poupança / Queima</span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white font-mono">
                        {analysis.kpis.monthlySavingsRate}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Saldo Líquido / Receita</span>
                        <Maximize2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setModalData({
                          type: 'kpi',
                          kpiKey: 'budgetDiscipline',
                          title: 'Disciplina do Orçamento',
                          value: analysis.kpis.budgetDiscipline,
                          subtitle: 'Status vs. Teto Mensal'
                        })
                      }
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
                      title="Clique para ver detalhes e estratégia de controle de teto"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span>Disciplina do Orçamento</span>
                        <Scale className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white font-mono truncate">
                        {analysis.kpis.budgetDiscipline}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Status vs. Teto Mensal</span>
                        <Maximize2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setModalData({
                          type: 'kpi',
                          kpiKey: 'debtTarget',
                          title: 'Meta de Passivos',
                          value: analysis.kpis.debtTargetProgress,
                          subtitle: 'Estratégia de Amortização'
                        })
                      }
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
                      title="Clique para ver detalhes do Método Avalanche de Passivos"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span>Meta de Passivos</span>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono truncate">
                        {analysis.kpis.debtTargetProgress}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Estratégia de Amortização</span>
                        <Maximize2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setModalData({
                          type: 'kpi',
                          kpiKey: 'runway',
                          title: 'Segurança de Caixa',
                          value: analysis.kpis.runwaySecurity,
                          subtitle: 'Runway & Liquidez Imediata'
                        })
                      }
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
                      title="Clique para ver detalhes da reserva de emergência e runway"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span>Segurança de Caixa</span>
                        <Landmark className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-teal-300 font-mono truncate">
                        {analysis.kpis.runwaySecurity}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Runway & Liquidez Imediata</span>
                        <Maximize2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* 2 Focus Boxes: Dívida (Avalanche) + Alavancagem de Renda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      onClick={() =>
                        setModalData({
                          type: 'avalanche',
                          title: 'Estratégia Avalanche: Gestão de Passivos',
                          recommendation: analysis.debtStrategy.avalancheRecommendation,
                          runway: analysis.debtStrategy.estimatedRunway
                        })
                      }
                      className="p-3.5 rounded-xl bg-linear-to-br from-amber-950/20 to-slate-900/50 border border-amber-800/30 hover:border-amber-500/50 hover:bg-amber-950/30 space-y-1.5 cursor-pointer transition-all group"
                      title="Clique para ver o protocolo completo de eliminação de dívidas"
                    >
                      <div className="flex items-center justify-between text-amber-400 text-xs font-bold font-mono">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          ESTRATÉGIA AVALANCHE: GESTÃO DE PASSIVOS
                        </div>
                        <Maximize2 className="w-3 h-3 text-amber-400/70 group-hover:text-amber-300" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {analysis.debtStrategy.avalancheRecommendation}
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-amber-900/40 flex items-center justify-between">
                        <div>
                          <span className="text-amber-300 font-medium">Reserva Tática:</span> {analysis.debtStrategy.estimatedRunway}
                        </div>
                        <span className="text-[10px] text-amber-400 group-hover:underline">Ver protocolo</span>
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setModalData({
                          type: 'growth',
                          title: 'Alavancagem de Renda & Crescimento',
                          recommendation: analysis.ecommerceOpportunity.scalingRecommendation,
                          step: analysis.ecommerceOpportunity.immediateStep
                        })
                      }
                      className="p-3.5 rounded-xl bg-linear-to-br from-emerald-950/20 to-slate-900/50 border border-emerald-800/30 hover:border-emerald-500/50 hover:bg-emerald-950/30 space-y-1.5 cursor-pointer transition-all group"
                      title="Clique para ver as diretrizes de escala e alavancagem de receita"
                    >
                      <div className="flex items-center justify-between text-emerald-400 text-xs font-bold font-mono">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          ALAVANCAGEM DE RENDA & CRESCIMENTO
                        </div>
                        <Maximize2 className="w-3 h-3 text-emerald-400/70 group-hover:text-emerald-300" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {analysis.ecommerceOpportunity.scalingRecommendation}
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-emerald-900/40 flex items-center justify-between">
                        <div>
                          <span className="text-emerald-300 font-medium">Ação Imediata:</span> {analysis.ecommerceOpportunity.immediateStep}
                        </div>
                        <span className="text-[10px] text-emerald-400 group-hover:underline">Ver diretriz</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PILLARS OF THE 8 MASTERS */}
              {activeTab === 'pillars' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.pillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setModalData({
                          type: 'pillar',
                          mentor: pillar.mentor,
                          title: pillar.title,
                          advice: pillar.advice,
                          impact: pillar.impact
                        })
                      }
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all space-y-2 cursor-pointer group"
                      title="Clique para ver fundamentos e aplicações práticas destes mestres"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                          {pillar.mentor}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              pillar.impact === 'critico'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : pillar.impact === 'alto'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            Impacto {pillar.impact}
                          </span>
                          <Maximize2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                        {pillar.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{pillar.advice}</p>
                      <div className="text-[10px] text-emerald-400/80 group-hover:text-emerald-300 font-mono pt-1">
                        Clique para ver modelos mentais e lições práticas
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: ACTION PLAN 80/20 */}
              {activeTab === 'action8020' && (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-400 mb-2">
                    Ações de alavancagem máxima (Princípio de Pareto) para gerar 80% do resultado financeiro e patrimonial:
                  </div>
                  {analysis.actionPlan8020.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setModalData({
                          type: 'action',
                          index: idx + 1,
                          title: item.title,
                          description: item.description,
                          priority: item.priority,
                          targetDate: item.targetDate
                        })
                      }
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all cursor-pointer group"
                      title="Clique para ver o roteiro passo a passo desta ação"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold font-mono text-emerald-300 mt-0.5 group-hover:bg-emerald-500/30">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {item.targetDate && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                                {item.targetDate}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                item.priority === 'urgente'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : item.priority === 'alta'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {item.priority}
                            </span>
                            <Maximize2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                        <div className="text-[10px] text-emerald-400/80 group-hover:text-emerald-300 font-mono mt-1">
                          Clique para ver o roteiro prático desta ação
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: DIRECT CHAT WITH ADVISOR */}
              {activeTab === 'chat' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Pergunte diretamente ao seu conselho unificado de 8 mestres sobre qualquer decisão financeira:
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {chatMessages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setChatMessages([])}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all cursor-pointer"
                          title="Limpar mensagens"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Limpar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsChatModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Abrir Janela do Chat</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset quick question pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setInputQuestion(q);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>

                  {/* Message history */}
                  <div className="max-h-[440px] overflow-y-auto space-y-3 p-3.5 rounded-xl bg-[#080c14] border border-slate-800/80 shadow-inner">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 px-4 text-xs text-slate-500 space-y-1">
                        <div className="font-mono text-slate-400">Nenhuma pergunta realizada nesta sessão.</div>
                        <p className="text-[11px] text-slate-500">
                          Escolha uma sugestão acima ou escreva sua dúvida estratégica abaixo para receber orientações dos 8 mestres.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`w-full ${
                              msg.role === 'user'
                                ? 'max-w-[85%] sm:max-w-[75%] self-end p-3 rounded-xl bg-emerald-600/25 border border-emerald-500/40 text-emerald-100 rounded-br-none'
                                : 'max-w-full sm:max-w-[96%] self-start p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-lg'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/50">
                              <div className="flex items-center gap-2">
                                {msg.role === 'user' ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                                    V
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                                    <Sparkles className="w-3 h-3" />
                                  </div>
                                )}
                                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                                  {msg.role === 'user' ? 'Você' : 'Conselho dos 8 Mestres'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">• {msg.timestamp}</span>
                              </div>

                              {msg.role === 'assistant' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                                  title="Copiar resposta"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Message Body */}
                            <FormattedChatMessage content={msg.content} role={msg.role} />
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-mono">O conselho estratégico está avaliando seu cenário...</span>
                      </div>
                    )}
                  </div>

                  {/* Question input form */}
                  <form onSubmit={handleSendQuestion} className="flex items-center gap-1.5 sm:gap-2 w-full max-w-full">
                    <input
                      type="text"
                      value={inputQuestion}
                      onChange={(e) => setInputQuestion(e.target.value)}
                      placeholder="Ex: Comprar um iPhone ou investir? Como ganhar mais dinheiro? Alavancar capital?"
                      className="flex-1 min-w-0 w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 sm:px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputQuestion.trim() || chatLoading}
                      className="shrink-0 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>Perguntar</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Interactive Detail Modal Window */}
      <AdvisorDetailModal
        data={modalData}
        onClose={() => setModalData(null)}
        onAskQuestion={(question) => {
          setActiveTab('chat');
          setInputQuestion(question);
          setIsChatModalOpen(true);
        }}
      />

      {/* Interactive 8-Masters Chat Modal Window */}
      <AdvisorChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        messages={chatMessages}
        onSendMessage={async (q) => {
          await handleSendQuestion(q);
        }}
        loading={chatLoading}
        financialSummary={financialSummary}
        monthlyBudgetSummary={monthlyBudgetSummary}
        selectedMonth={selectedMonth}
        onClearHistory={() => setChatMessages([])}
      />
    </div>
  );
};
