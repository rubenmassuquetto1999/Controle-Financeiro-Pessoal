import React from 'react';
import { BudgetGroupSummary } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatBRL } from '../lib/utils';
import { PieChart as PieIcon } from 'lucide-react';

interface BudgetPieChartProps {
  data: BudgetGroupSummary[];
  totalExpense: number;
}

export function BudgetPieChart({ data, totalExpense }: BudgetPieChartProps) {
  const hasData = data.length > 0 && totalExpense > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as BudgetGroupSummary;
      return (
        <div className="bg-[#09090b] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="font-bold text-slate-100">{item.name}</div>
          <div className="text-slate-400 mt-1">Valor: <span className="text-slate-100 font-bold">{formatBRL(item.value)}</span></div>
          <div className="text-slate-400">Participação: <span className="text-blue-400 font-bold">{item.percentage.toFixed(1)}%</span></div>
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
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.key}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">TOTAL</span>
              <span className="text-xs font-bold font-mono text-slate-200">
                {totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : formatBRL(totalExpense)}
              </span>
            </div>
          </div>

          {/* Bento Legend Items */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800/60 font-mono">
            {data.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-[11px]">
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

