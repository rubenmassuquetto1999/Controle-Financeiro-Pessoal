import React, { useState } from 'react';
import { BudgetGroupSummary } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatBRL } from '../lib/utils';
import { PieChart as PieIcon } from 'lucide-react';

interface BudgetPieChartProps {
  data: BudgetGroupSummary[];
  totalExpense: number;
}

export function BudgetPieChart({ data, totalExpense }: BudgetPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.length > 0 && totalExpense > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as BudgetGroupSummary;
      return (
        <div className="bg-[#121215] border border-slate-700/90 p-3 rounded-xl shadow-2xl text-xs font-mono relative z-50 pointer-events-none min-w-[170px] select-none">
          <div className="flex items-center gap-2 font-bold text-slate-100 pb-2 border-b border-slate-800">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.name}</span>
          </div>
          <div className="text-slate-300 mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-400">Valor:</span>
            <span className="text-slate-100 font-bold">{formatBRL(item.value)}</span>
          </div>
          <div className="text-slate-300 mt-1 flex items-center justify-between gap-3">
            <span className="text-slate-400">Participação:</span>
            <span className="text-blue-400 font-bold">{item.percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-[#18181b] border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <PieIcon className="w-3.5 h-3.5 text-blue-400" />
          Distribuição (50-30-20)
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          Total: {formatBRL(totalExpense)}
        </span>
      </div>

      {!hasData ? (
        <div className="h-56 flex items-center justify-center text-xs text-slate-500 font-mono">
          Nenhuma despesa registrada para análise.
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="h-44 min-h-[176px] w-full min-w-0 relative flex items-center justify-center">
            {/* Center total label - positioned at z-0 behind the chart and hidden when a slice is active */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 transition-opacity duration-150 ${
                activeIndex !== null ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">TOTAL</span>
              <span className="text-xs font-bold font-mono text-slate-200">
                {totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : formatBRL(totalExpense)}
              </span>
            </div>

            <div className="w-full h-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart onMouseLeave={() => setActiveIndex(null)}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#18181b"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_, index) => setActiveIndex(index === activeIndex ? null : index)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.key}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                        stroke={activeIndex === index ? '#ffffff' : '#18181b'}
                        strokeWidth={activeIndex === index ? 2 : 2}
                        className="transition-opacity duration-150 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 50, outline: 'none', pointerEvents: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bento Legend Items */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800/60 font-mono">
            {data.map((item, index) => (
              <div
                key={item.key}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between text-[11px] p-1 rounded-lg transition-colors cursor-pointer ${
                  activeIndex === index ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400 uppercase text-[10px] truncate max-w-[130px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">{formatBRL(item.value)}</span>
                  <span className="text-slate-500 text-[10px] w-9 text-right">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}


