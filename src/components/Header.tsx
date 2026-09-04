import React from 'react';
import { LayoutDashboard, Target, AlertTriangle, CheckCircle, PlusCircle, LogOut, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { formatBRL, formatMonthName } from '../lib/utils';
import { MonthlyBudgetSummary } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'finance' | 'budget';
  onTabChange: (tab: 'finance' | 'budget') => void;
  selectedMonth: string;
  monthlySummary: MonthlyBudgetSummary;
  user?: User | null;
  onLogout?: () => void;
  boundIp?: string | null;
}

export function Header({
  activeTab,
  onTabChange,
  selectedMonth,
  monthlySummary,
  user,
  onLogout
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800/80 bg-[#09090b]/95 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Top bar: Brand on left, Profile & Logout on right */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand / System Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xs text-sm sm:text-base shrink-0">
              Φ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 font-sans flex items-center gap-1.5">
                  FIN-AI <span className="text-slate-500 font-mono text-[10px] sm:text-[11px] font-normal">v2.4.0</span>
                </h1>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden xs:block">
                Controle Financeiro Inteligente
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs in Navbar (Visible on Desktop md:flex) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('finance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Controle Financeiro</span>
            </button>

            <button
              onClick={() => onTabChange('budget')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                activeTab === 'budget'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Orçamento Mensal</span>
              {monthlySummary.isExceeded && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </nav>

          {/* Right: Budget Status Pill & Authenticated User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {monthlySummary.hasBudget ? (
              <>
                {/* Desktop Budget Pill */}
                <div
                  onClick={() => onTabChange('budget')}
                  className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                    monthlySummary.isExceeded
                      ? 'bg-red-950/60 border-red-800/60 text-red-300 hover:bg-red-900/50'
                      : monthlySummary.percentageSpent >= 85
                      ? 'bg-amber-950/50 border-amber-800/50 text-amber-300 hover:bg-amber-900/40'
                      : 'bg-green-950/40 border-green-800/40 text-green-300 hover:bg-green-900/30'
                  }`}
                  title="Clique para ver o detalhamento do Orçamento Mensal"
                >
                  {monthlySummary.isExceeded ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
                      <span>
                        <strong className="font-bold">Alerta:</strong> Orçamento Excedido (+{formatBRL(monthlySummary.excessAmount)})
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span>
                        Orçamento: {Math.round(monthlySummary.percentageSpent)}% usado ({formatBRL(monthlySummary.remainingTotal)} livre)
                      </span>
                    </>
                  )}
                </div>

                {/* Mobile / Tablet Compact Budget Badge */}
                <button
                  onClick={() => onTabChange('budget')}
                  className={`flex lg:hidden items-center gap-1 px-2 py-1 rounded-lg border text-[10px] sm:text-[11px] font-mono cursor-pointer ${
                    monthlySummary.isExceeded
                      ? 'bg-red-950/60 border-red-800/60 text-red-300'
                      : monthlySummary.percentageSpent >= 85
                      ? 'bg-amber-950/50 border-amber-800/50 text-amber-300'
                      : 'bg-green-950/40 border-green-800/40 text-green-300'
                  }`}
                  title="Status do Orçamento"
                >
                  {monthlySummary.isExceeded ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 animate-pulse" />
                      <span className="font-bold">Alerta</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                      <span>{Math.round(monthlySummary.percentageSpent)}%</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => onTabChange('budget')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-[11px] sm:text-xs font-mono transition-colors cursor-pointer"
                title="Configure metas de gastos para este mês"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Orçamento ({formatMonthName(selectedMonth).split(' ')[0]})</span>
              </button>
            )}

            {/* PWA Desktop / Mobile Install Button */}
            <PWAInstallButton variant="compact" />

            {/* Authenticated User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-mono">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-slate-200 text-[11px] font-sans font-semibold leading-none flex items-center gap-1">
                      {user.displayName?.split(' ')[0] || 'Ruben'}
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    </span>
                    <span className="text-slate-500 text-[9px] font-mono leading-none mt-0.5 max-w-[110px] sm:max-w-[130px] truncate">
                      {user.email}
                    </span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Desconectar da sessão privada"
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Segmented Bar (Visible on <md) */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 md:hidden">
          <nav className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('finance')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Controle Financeiro</span>
            </button>

            <button
              onClick={() => onTabChange('budget')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                activeTab === 'budget'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Orçamento Mensal</span>
              {monthlySummary.isExceeded && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute top-1 right-2" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}


