import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  MessageSquareQuote,
  Sparkles,
  TrendingUp,
  Scale,
  ShieldAlert,
  Landmark,
  Flame,
  Zap,
  Target,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';

export type AdvisorModalData =
  | {
      type: 'headline';
      headline: string;
      score: number;
      summary: string;
      selectedMonth?: string;
      financialSummary?: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
      };
    }
  | {
      type: 'kpi';
      kpiKey: 'savingsRate' | 'budgetDiscipline' | 'debtTarget' | 'runway';
      title: string;
      value: string;
      subtitle: string;
    }
  | {
      type: 'avalanche';
      title: string;
      recommendation: string;
      runway: string;
    }
  | {
      type: 'growth';
      title: string;
      recommendation: string;
      step: string;
    }
  | {
      type: 'pillar';
      mentor: string;
      title: string;
      advice: string;
      impact: string;
    }
  | {
      type: 'action';
      index: number;
      title: string;
      description: string;
      priority: string;
      targetDate?: string;
    };

interface AdvisorDetailModalProps {
  data: AdvisorModalData | null;
  onClose: () => void;
  onAskQuestion: (question: string) => void;
}

export const AdvisorDetailModal: React.FC<AdvisorDetailModalProps> = ({
  data,
  onClose,
  onAskQuestion
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press and freeze body scroll
  useEffect(() => {
    if (!data) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, onClose]);

  if (!data) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (data.type) {
      case 'headline': {
        const textToCopy = `${data.headline}\nScore de Saúde Financeira: ${data.score}/100\nPeríodo: ${data.selectedMonth || 'Atual'}\n\n${data.summary}`;

        return (
          <div className="space-y-4">
            {/* Top Executive Badge */}
            <div className="p-4 rounded-xl bg-linear-to-br from-emerald-950/60 via-slate-900/90 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                      DIAGNÓSTICO EXECUTIVO DOS 8 MESTRES
                    </span>
                    {data.selectedMonth && (
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Mês de Referência: {data.selectedMonth}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-2">
                  <span className="text-xs text-emerald-300 font-medium font-mono">Score:</span>
                  <span className="text-base font-bold text-white font-mono">{data.score}/100</span>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {data.headline}
              </h2>

              {/* Score Bar with Thresholds */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Classificação de Risco Patrimonial:</span>
                  <span
                    className={
                      data.score >= 75
                        ? 'text-emerald-300 font-bold'
                        : data.score >= 50
                        ? 'text-amber-300 font-bold'
                        : 'text-red-300 font-bold'
                    }
                  >
                    {data.score >= 75
                      ? 'Nível Ótimo — Alta Margem de Segurança'
                      : data.score >= 50
                      ? 'Nível Estável — Atenção aos Pontos de Fuga'
                      : 'Nível Crítico — Ação Imediata de Estancamento'}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      data.score >= 75
                        ? 'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-300'
                        : data.score >= 50
                        ? 'bg-linear-to-r from-amber-500 to-yellow-400'
                        : 'bg-linear-to-r from-red-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, data.score))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary pill row if provided */}
            {data.financialSummary && (
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Receitas</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                    R$ {Number(data.financialSummary.totalIncome || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Despesas</div>
                  <div className="text-xs sm:text-sm font-bold text-red-400 mt-0.5">
                    R$ {Number(data.financialSummary.totalExpense || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Saldo Líquido</div>
                  <div
                    className={`text-xs sm:text-sm font-bold mt-0.5 ${
                      Number(data.financialSummary.balance) >= 0 ? 'text-blue-400' : 'text-amber-400'
                    }`}
                  >
                    R$ {Number(data.financialSummary.balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Full text summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Parecer Estratégico Detalhado
              </h3>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
                <p className="whitespace-pre-line">{data.summary}</p>
              </div>
            </div>

            {/* 4 Pillars Explained */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Os 4 Pilares de Avaliação dos 8 Mestres
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    1. Taxa de Poupança & Queima
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Percentual retido de cada real que entra. Se for negativo, há queima patrimonial (burn rate).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    2. Respeito ao Teto Orçado
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aderência sistemática ao teto de despesas (Dalio: o orçamento como sistema fechado).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    3. Exposição a Passivos (Avalanche)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Estancamento ativo de juros compostos de cartão, cheque especial ou empréstimos pessoais.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    4. Runway & Liquidez Imediata
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Meses de sobrevivência com reserva líquida (Buffett & Housel: margem de segurança emocional).
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado para a área de transferência!' : 'Copiar Diagnóstico'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion('Como melhorar meu score de saúde financeira este mês com base no diagnóstico?');
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Perguntar aos Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }

      case 'kpi': {
        const textToCopy = `${data.title}: ${data.value}\n${data.subtitle}`;
        let formula = '';
        let explanation = '';
        let masterPrinciple = '';
        let recommendedAction = '';
        let questionPreset = '';

        if (data.kpiKey === 'savingsRate') {
          formula = 'Taxa de Poupança = (Receitas - Despesas) / Receitas × 100';
          explanation =
            'Indica qual proporção do seu faturamento mensal permanece retida para construção de patrimônio em vez de ser consumida integralmente em despesas correntes.';
          masterPrinciple =
            'Andrew Carnegie & Warren Buffett: "Pague-se primeiro. Não gaste o que sobra após despesas; poupe e invista primeiro, e adapte seu estilo de vida ao restante". A meta mínima saudável é de 15% a 20%.';
          recommendedAction =
            'Se a taxa for 0% ou negativa, você está queimando capital. Faça auditoria imediata de gastos supérfluos. Se for positiva, transfira o valor excedente para reserva ou amortização no mesmo dia do recebimento.';
          questionPreset = 'Como elevar minha taxa de poupança mensal de forma consistente?';
        } else if (data.kpiKey === 'budgetDiscipline') {
          formula = 'Disciplina = Despesas Realizadas vs. Teto Orçado Fixado';
          explanation =
            'Verifica se você está operando dentro dos limites planejados por categoria, impedindo desvios cumulativos que levam ao endividamento.';
          masterPrinciple =
            'Ray Dalio (A Máquina Econômica): "Um sistema orçamentário não é uma prisão, é um instrumento de soberania. Quem não controla com precisão as entradas e saídas do seu sistema torna-se refém das circunstâncias".';
          recommendedAction =
            'Adote a regra 50-30-20: até 50% para necessidades vitais, 30% para estilo de vida consciente e 20% garantidos para poupança ou quitação de passivos.';
          questionPreset = 'Como estruturar um teto orçamentário realista que eu consiga cumprir?';
        } else if (data.kpiKey === 'debtTarget') {
          formula = 'Método Avalanche = Ordenação decrescente pelo Custo Efetivo Total (CET)';
          explanation =
            'Foca na aniquilação dos juros compostos negativos mais destrutivos, estancando a hemorragia financeira antes de qualquer outra iniciativa.';
          masterPrinciple =
            'Charlie Munger (Inversão): "Se você deseja entender como destruir patrimônio, basta carregar dívidas com taxas compostas de dois dígitos. Quitar passivos caros é o investimento com a maior taxa de retorno líquido e garantido do mundo".';
          recommendedAction =
            'Mantenha o pagamento mínimo obrigatório em todas as dívidas e concentre 100% de qualquer recurso livre para amortizar o contrato de maior taxa de juros.';
          questionPreset = 'Como aplicar o Método Avalanche passo a passo nas minhas dívidas?';
        } else {
          formula = 'Runway = Reserva Líquida / Custo de Vida Essencial Mensal';
          explanation =
            'Mede a sua liberdade e estabilidade emocional: por quantos meses você e sua família conseguem viver com tranquilidade caso todas as fontes de receita cessem hoje.';
          masterPrinciple =
            'Morgan Housel (A Psicologia do Dinheiro): "A maior riqueza que o dinheiro proporciona é acordar e ter o controle absoluto sobre o seu tempo. A reserva de emergência é a compra da sua paz de espírito".';
          recommendedAction =
            'Mantenha de 3 a 6 meses de custos fixos essenciais em aplicações de liquidez imediata (Tesouro Selic ou CDB 100% CDI com liquidez diária), blindados contra oscilações de mercado.';
          questionPreset = 'Qual o tamanho ideal da minha reserva de emergência e onde alocar?';
        }

        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-400">
                INDICADOR ESTRATÉGICO
              </span>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">{data.title}</h2>
                <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-sm">
                  {data.value}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{data.subtitle}</p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-emerald-400 font-mono block mb-1">
                  FÓRMULA & CÁLCULO MATEMÁTICO:
                </span>
                <code className="text-emerald-300 font-mono text-[11px] block bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {formula}
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">O QUE ESTA MÉTRICA REVELA:</span>
                {explanation}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Princípio dos Mestres da Riqueza:
                </span>
                {masterPrinciple}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-xs text-emerald-200/90 leading-relaxed">
                <span className="font-bold text-emerald-300 block mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Diretriz de Ação Recomendada:
                </span>
                {recommendedAction}
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Métrica'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion(questionPreset);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Consultar Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }

      case 'avalanche': {
        const textToCopy = `Estratégia Avalanche:\n${data.recommendation}\nReserva Tática: ${data.runway}`;

        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-amber-950/40 via-slate-900/80 to-slate-900 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                <Flame className="w-4 h-4" />
                PROTOCOLO MATEMÁTICO DE ELIMINAÇÃO DE PASSIVOS
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {data.title || 'Estratégia Avalanche: Gestão e Quitação de Passivos'}
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-300 block font-mono">
                  DIRETRIZ ESTRATÉGICA DOS MESTRES:
                </span>
                <p>{data.recommendation}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-teal-300 block font-mono">
                  BLINDAGEM & RESERVA TÁTICA:
                </span>
                <p>{data.runway}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Passo a Passo do Método Avalanche:
                </span>
                <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside pl-1">
                  <li>
                    <strong className="text-white">Mapeie o CET:</strong> Ordene todos os débitos pelo Custo Efetivo Total anual (maiores taxas no topo).
                  </li>
                  <li>
                    <strong className="text-white">Pague o Mínimo Obrigatório:</strong> Mantenha todas as outras contas em dia para evitar negativação ou juros punitivos.
                  </li>
                  <li>
                    <strong className="text-white">Ataque Implacável na 1ª Dívida:</strong> Direcione 100% de qualquer excedente financeiro para liquidar a dívida com os juros mais altos.
                  </li>
                  <li>
                    <strong className="text-white">Efeito Cascata:</strong> Quando a primeira estiver quitada, some a parcela liberada para abater a segunda dívida na sequência, acelerando o tempo de liquidação.
                  </li>
                </ol>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Protocolo'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion('Como ordenar minhas dívidas atuais para aplicar a Estratégia Avalanche?');
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Perguntar aos Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }

      case 'growth': {
        const textToCopy = `Alavancagem de Renda & Crescimento:\n${data.recommendation}\nAção Imediata: ${data.step}`;

        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <Zap className="w-4 h-4" />
                ALAVANCAGEM DE RENDA & MULTIPLICAÇÃO DE RECEITA
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {data.title || 'Alavancagem de Renda & Crescimento'}
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-emerald-300 block font-mono">
                  DIRETRIZ DE ESCALABILIDADE:
                </span>
                <p>{data.recommendation}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-white block font-mono">PRIMEIRA AÇÃO IMEDIATA:</span>
                <p>{data.step}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  Modelos Mentais de Alavancagem Moderna:
                </span>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">1. Naval Ravikant (Alavancagem Sem Permissão):</strong>
                    Software e Mídia têm custo marginal nulo de reprodução. Eles operam por você 24 horas por dia, desvinculando sua renda das horas de relógio trabalhadas.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">2. Alex Hormozi (Ofertas de Alto Valor):</strong>
                    Fuja da comoditização e da concorrência de preço baixo. Construa ofertas completas onde o valor prático entregue supere amplamente o valor pago.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">3. Peter Thiel (Zero a Um):</strong>
                    Construa um monopólio pessoal. Seja o melhor na intersecção de dois ou três nichos que você domina, tornando-se insubstituível.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Diretriz'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion('Como criar fontes complementares de renda com alta margem e escalabilidade?');
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Perguntar aos Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }

      case 'pillar': {
        const textToCopy = `${data.mentor}\n${data.title} (Impacto ${data.impact})\n\n${data.advice}`;

        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  {data.mentor}
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                    data.impact === 'critico'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : data.impact === 'alto'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  Impacto {data.impact}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{data.title}</h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-emerald-300 font-mono block text-xs">
                  CONSELHO ESTRATÉGICO DOS MESTRES:
                </span>
                <p>{data.advice}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <span className="font-bold text-white font-mono block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  Lições Práticas para Aplicação Diária:
                </span>
                {data.mentor.includes('Buffett') && (
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>Inversão (Charlie Munger):</strong> Pergunte: "onde posso errar e perder tudo?". Identifique esses riscos e elimine-os primeiro. Não invista em ativos que não compreende.
                    </p>
                    <p>
                      <strong>Margem de Segurança (Warren Buffett):</strong> Mantenha folga financeira. Um motor projetado para trabalhar no limite funde ao menor esforço inesperado.
                    </p>
                  </div>
                )}
                {data.mentor.includes('Dalio') && (
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>A Máquina Econômica (Ray Dalio):</strong> Entenda a mecânica das taxas de juros e do crédito. Quem poupa constrói ativos; quem consome crédito paga pelo estilo de vida de quem poupou.
                    </p>
                    <p>
                      <strong>Pague-se Primeiro (Andrew Carnegie):</strong> Destine uma porcentagem fixa de cada entrada para seu patrimônio antes de abrir a carteira para consumo.
                    </p>
                  </div>
                )}
                {data.mentor.includes('Hormozi') && (
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>Alavancagem de Margem (Alex Hormozi):</strong> Se você não consegue poupar, corte os maiores custos fixos e construa serviços ou produtos com margem líquida robusta.
                    </p>
                    <p>
                      <strong>Monopólio Pessoal (Peter Thiel):</strong> Concentre seus esforços no que você faz melhor que 99% das pessoas ao seu redor.
                    </p>
                  </div>
                )}
                {data.mentor.includes('Naval') && (
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>A Psicologia do Dinheiro (Morgan Housel):</strong> A verdadeira riqueza é silenciosa: paz de espírito, independência e sono tranquilo.
                    </p>
                    <p>
                      <strong>Conhecimento Específico (Naval Ravikant):</strong> Encontre o que parece brincadeira para você, mas parece trabalho duro para os outros.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Conselho'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion(`Como aplicar o princípio de ${data.title} ensinado por ${data.mentor} nas minhas finanças?`);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Perguntar aos Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }

      case 'action': {
        const textToCopy = `Ação 80/20 (#${data.index}): ${data.title}\nPrioridade: ${data.priority} | Prazo: ${data.targetDate || 'Imediato'}\n\n${data.description}`;

        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Ação Prioritária #{data.index} (Princípio de Pareto)
                </span>
                <div className="flex items-center gap-1.5">
                  {data.targetDate && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {data.targetDate}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md ${
                      data.priority === 'urgente'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : data.priority === 'alta'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {data.priority}
                  </span>
                </div>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{data.title}</h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-emerald-300 font-mono block text-xs mb-1">
                  OBJETIVO & ESCOPO DA AÇÃO:
                </span>
                <p>{data.description}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <span className="font-bold text-white font-mono block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Plano Prático de Execução:
                </span>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      1
                    </span>
                    <span>
                      <strong className="text-white">Diagnóstico Rápido:</strong> Abra a lista de transações e localize os lançamentos vinculados a esta área.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      2
                    </span>
                    <span>
                      <strong className="text-white">Execução Sem Procrastinação:</strong> Cancele ou renegocie contratos desnecessários. Fixe o novo teto no orçamento mensal.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      3
                    </span>
                    <span>
                      <strong className="text-white">Trava de Valor:</strong> Transfira o valor economizado para sua reserva ou amortização de dívidas antes que seja consumido.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleCopy(textToCopy)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Ação'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAskQuestion(`Quais são os passos práticos recomendados para executar a ação "${data.title}"?`);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090d16] text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>Perguntar aos Mestres no Chat</span>
              </button>
            </div>
          </div>
        );
      }
    }
  };

  // Render modal directly onto document.body via Portal to guarantee viewport centering and escape all parent containers
  return createPortal(
    <div
      id="advisor-detail-modal-backdrop"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="advisor-detail-modal-container"
        className="relative w-full max-w-2xl my-auto rounded-2xl bg-[#0b1322] border border-emerald-500/40 shadow-2xl shadow-emerald-950/80 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-emerald-500/20 bg-linear-to-r from-emerald-950/50 via-slate-900/80 to-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold font-mono text-white tracking-wide block">
                DETALHAMENTO ESTRATÉGICO
              </span>
              <span className="text-[11px] text-emerald-400/90 font-mono">
                Conselho dos 8 Mestres da Riqueza
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar janela (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-slate-200 overscroll-contain">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
};
