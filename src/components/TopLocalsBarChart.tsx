import React from 'react';
import { TopLocalSummary } from '../types';
import { formatBRL } from '../lib/utils';
import { BarChart3, Globe, Store } from 'lucide-react';

interface TopLocalsBarChartProps {
  data: TopLocalSummary[];
}

export function TopLocalsBarChart({ data }: TopLocalsBarChartProps) {
  const hasData = data && data.length > 0;
  const maxTotal = hasData ? Math.max(...data.map((d) => d.total), 1) : 1;

  // Blue opacity levels matching the Bento design specification
  const blueOpacities = [
    'bg-blue-500',
    'bg-blue-500/80',
    'bg-blue-500/60',
    'bg-blue-500/40',
    'bg-blue-500/25'
  ];

  return (
    <section className="bg-[#18181b] border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          Volume por Local (Top 5)
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          Rank de Saídas
        </span>
      </div>

      {!hasData ? (
        <div className="h-56 flex items-center justify-center text-xs text-slate-500 font-mono">
          Nenhum dado de saída registrado ainda.
        </div>
      ) : (
        <div className="space-y-4 my-auto py-2">
          {data.map((item, index) => {
            const percentage = Math.min(100, Math.max(8, (item.total / maxTotal) * 100));
            const barBgClass = blueOpacities[index] || 'bg-blue-500/20';

            return (
              <div key={item.local_name} className="space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <span className="text-slate-500 font-bold text-[9px]">#{index + 1}</span>
                    {item.local_type === 'online' ? (
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" title="Online" />
                    ) : (
                      <Store className="w-3 h-3 text-slate-400 shrink-0" title="Físico" />
                    )}
                    <span className="uppercase text-slate-200 truncate font-sans font-medium">
                      {item.local_name}
                    </span>
                  </div>
                  <span className="text-slate-200 font-bold">{formatBRL(item.total)}</span>
                </div>

                {/* Horizontal Meter Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barBgClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

