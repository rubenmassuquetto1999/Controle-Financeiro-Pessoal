import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  Copy,
  Check,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { AdvisorChatMessage, FinancialSummary, MonthlyBudgetSummary } from '../types';
import { FormattedChatMessage } from './FormattedChatMessage';

interface AdvisorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AdvisorChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  loading: boolean;
  financialSummary: FinancialSummary;
  monthlyBudgetSummary: MonthlyBudgetSummary;
  selectedMonth: string;
  onClearHistory: () => void;
}

export const AdvisorChatModal: React.FC<AdvisorChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  loading,
  financialSummary,
  monthlyBudgetSummary,
  selectedMonth,
  onClearHistory
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages or loading
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input on open and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuestion.trim();
    if (!query || loading) return;
    setInputQuestion('');
    onSendMessage(query);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((cur) => (cur === id ? null : cur));
    }, 2000);
  };

  const quickQuestions = [
    '📱 Comprar um iPhone ou investir o dinheiro?',
    '💰 Como ganhar mais dinheiro e faturar mais?',
    '⚡ Quais as melhores estratégias para alavancar capital?',
    '💳 Vale a pena pegar empréstimo ou usar crédito?',
    '✈️ Como planejar viagens e lazer sem me endividar?',
    '🎓 Quanto devo investir em cursos, estudos e faculdade?',
    '📊 Onde estou gastando mais este mês?',
    '🎯 Estou com uma dívida de 15 mil reais, como quitar mais rápido?',
    '🛡️ Qual a meta ideal para minha reserva de emergência e runway?'
  ];

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[92vh] max-h-[820px] flex flex-col rounded-2xl bg-[#090d16] border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-linear-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-b border-emerald-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                  CONSELHO DOS 8 MESTRES
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-semibold">
                  Janela Interativa de Decisão
                </span>
              </div>
              <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-300/80 font-sans leading-relaxed break-normal whitespace-normal mt-0.5">
                Buffett • Munger • Dalio • Naval • Housel • Hormozi • Thiel • Carnegie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer"
                title="Limpar histórico de conversa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700/90 transition-all border border-slate-700 cursor-pointer"
              title="Fechar janela do chat (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Context Ribbon */}
        <div className="px-3.5 sm:px-4 py-2 bg-[#0d1422] border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto text-[11px] font-mono shrink-0">
          <div className="text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-emerald-400 font-bold">Mês Avaliado:</span>
            <span className="text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">{selectedMonth}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Receitas:</span>
              <strong className="text-white font-bold">{formatBRL(financialSummary.totalIncome)}</strong>
            </div>

            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span>Despesas:</span>
              <strong className="text-white font-bold">{formatBRL(financialSummary.totalExpense)}</strong>
            </div>

            <div className="flex items-center gap-1 text-blue-400">
              <Scale className="w-3 h-3" />
              <span>Saldo Líquido:</span>
              <strong className="text-white font-bold">{formatBRL(financialSummary.balance)}</strong>
            </div>
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-500 whitespace-nowrap mr-1">Sugestões:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(q.replace(/^[^\s]+\s/, ''))}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              + {q}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#070a12]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">Conselho dos 8 Mestres ao Vivo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pergunte sobre qualquer decisão financeira: comprar um iPhone ou bens de consumo, como ganhar mais dinheiro, alavancar capital, empréstimos, viagens, lazer, estudos, investimentos ou auditoria dos seus gastos reais.
              </p>
              <div className="pt-2 flex flex-col w-full gap-1.5 text-left">
                {quickQuestions.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSendMessage(q.replace(/^[^\s]+\s/, ''))}
                    className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer truncate"
                  >
                    → {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`w-full ${
                    msg.role === 'user'
                      ? 'max-w-[85%] sm:max-w-[70%] self-end p-3.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-br-none shadow-md'
                      : 'max-w-full self-start p-4 rounded-xl bg-slate-900/95 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-xl'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      {msg.role === 'user' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-300 font-mono">
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
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                        title="Copiar parecer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copiado</span>
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

                  {/* Body */}
                  <FormattedChatMessage content={msg.content} role={msg.role} />
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-emerald-400 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <div className="space-y-0.5 font-mono">
                <div className="font-bold">O Conselho dos 8 Mestres está analisando...</div>
                <div className="text-[11px] text-slate-400">Calculando alavancagem, cruzando dados reais de despesas e formulando plano estratégico.</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Bar */}
        <div className="p-2.5 sm:p-4 bg-slate-900/90 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 w-full max-w-full">
            <input
              ref={inputRef}
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ex: Comprar um iPhone ou investir? Como ganhar mais dinheiro? Alavancar capital?"
              className="flex-1 min-w-0 w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 font-sans shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loading}
              className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-lg shadow-emerald-950/40 whitespace-nowrap"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-1">
            <span>Pressione Enter para enviar</span>
            <span>Esc para fechar a janela</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
