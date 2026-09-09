import React from 'react';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

interface FormattedChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

/**
 * Parses inline bold text `**bold**` into React elements
 */
const renderInlineFormattedText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="font-bold text-white">
        {match[1]}
      </span>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({
  content,
  role
}) => {
  if (role === 'user') {
    return <div className="text-xs text-white leading-relaxed font-sans">{content}</div>;
  }

  // Normalize lines
  const rawLines = content.split('\n');

  // Group lines into structural elements
  const elements: React.ReactNode[] = [];
  let indexKey = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) continue;

    // 1. Header line like "**Conselho Estratégico Unificado dos 8 Mestres:**" or "### ..."
    const isHeading =
      (rawLine.startsWith('**') && rawLine.endsWith('**') && !rawLine.startsWith('**Regra') && rawLine.length < 90) ||
      (rawLine.startsWith('**') && rawLine.endsWith(':**')) ||
      rawLine.startsWith('###');

    if (isHeading) {
      const cleanHeading = rawLine.replace(/^[#\s*]+|[#\s*:]+$/g, '').replace(/\*\*/g, '');
      elements.push(
        <div
          key={`heading-${indexKey++}`}
          className="pb-2 mb-2.5 border-b border-emerald-500/20 flex items-center justify-between gap-2 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-300 font-mono tracking-wide">
              {cleanHeading}
            </h4>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Parecer Estratégico
          </span>
        </div>
      );
      continue;
    }

    // 2. Scenario breakdown line like:
    // "Analisando seu cenário atual (Receitas: R$ 8.215,64, Despesas: R$ 1.654,63, Saldo Líquido: R$ 6.561,01):"
    const scenarioMatch = rawLine.match(
      /Receitas:\s*([R$\s0-9.,]+)[,;]?\s*Despesas:\s*([R$\s0-9.,]+)[,;]?\s*Saldo(?:\s+Líquido)?:\s*([R$\s0-9.,-]+)/i
    );

    if (scenarioMatch) {
      const incomeVal = scenarioMatch[1].trim();
      const expenseVal = scenarioMatch[2].trim();
      const balanceVal = scenarioMatch[3].trim();
      const prefixText = rawLine.split('(')[0]?.trim() || 'Cenário Financeiro Avaliado:';

      elements.push(
        <div key={`scenario-${indexKey++}`} className="my-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{prefixText}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#070b13] border border-emerald-500/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Receitas:
              </span>
              <span className="font-bold text-emerald-400">{incomeVal}</span>
            </div>

            <div className="p-2 rounded-lg bg-[#070b13] border border-red-500/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                Despesas:
              </span>
              <span className="font-bold text-red-400">{expenseVal}</span>
            </div>

            <div className="p-2 rounded-lg bg-[#070b13] border border-blue-500/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-400" />
                Saldo Líquido:
              </span>
              <span className="font-bold text-blue-300">{balanceVal}</span>
            </div>
          </div>
        </div>
      );
      continue;
    }

    // 3. Numbered rule/advice item like:
    // "1. **Regra Número 1 (Buffett & Munger):** Nunca perca dinheiro..."
    // or "1. **Título:** Descrição"
    const numberedMatch = rawLine.match(/^(\d+)[\.\)]\s*(?:\*\*(.*?)\*\*:?|\*(.*?)\*:?|([^:]+):)?\s*(.*)$/);

    if (numberedMatch && (numberedMatch[2] || numberedMatch[3] || numberedMatch[4])) {
      const itemNumber = numberedMatch[1];
      const titleRaw = (numberedMatch[2] || numberedMatch[3] || numberedMatch[4] || '').trim();
      const bodyRaw = (numberedMatch[5] || '').trim();

      // Check if title mentions mentors or principles
      const hasMentors =
        titleRaw.includes('Buffett') ||
        titleRaw.includes('Munger') ||
        titleRaw.includes('Dalio') ||
        titleRaw.includes('Naval') ||
        titleRaw.includes('Housel') ||
        titleRaw.includes('Hormozi') ||
        titleRaw.includes('Thiel') ||
        titleRaw.includes('Carnegie');

      elements.push(
        <div
          key={`num-item-${indexKey++}`}
          className="my-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/30 transition-all flex items-start gap-2.5 group"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            {itemNumber}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="text-xs font-bold text-white group-hover:text-emerald-200 transition-colors">
                {titleRaw}
              </h5>
              {hasMentors && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Fundamento
                </span>
              )}
            </div>
            {bodyRaw && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {renderInlineFormattedText(bodyRaw)}
              </p>
            )}
          </div>
        </div>
      );
      continue;
    }

    // 4. Bullet item like "- **Hierarquia Racional:** ..." or "• ..."
    const bulletMatch = rawLine.match(/^[-*•]\s*(?:\*\*(.*?)\*\*:?|\*(.*?)\*:?|([^:]+):)?\s*(.*)$/);
    if (bulletMatch && (bulletMatch[1] || bulletMatch[2] || bulletMatch[3])) {
      const bulletTitle = (bulletMatch[1] || bulletMatch[2] || bulletMatch[3] || '').trim();
      const bulletBody = (bulletMatch[4] || '').trim();

      elements.push(
        <div
          key={`bullet-${indexKey++}`}
          className="my-1.5 pl-3 py-1 flex items-start gap-2 text-xs text-slate-300"
        >
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            {bulletTitle && <strong className="text-white mr-1.5">{bulletTitle}:</strong>}
            {renderInlineFormattedText(bulletBody)}
          </div>
        </div>
      );
      continue;
    }

    // 5. Standard paragraph with inline formatting
    elements.push(
      <p key={`p-${indexKey++}`} className="text-xs text-slate-300 leading-relaxed my-1.5">
        {renderInlineFormattedText(rawLine)}
      </p>
    );
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
};
