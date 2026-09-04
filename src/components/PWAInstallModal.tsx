import React from 'react';
import {
  Download,
  Laptop,
  CheckCircle2,
  X,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#121215] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#18181b]/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Instalar FIN-AI no Computador
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950/60 border border-blue-800/60 text-blue-400">
                  PWA
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Aplicativo Desktop nativo e ultrarrápido via Google Chrome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div className="text-xs font-mono space-y-1">
                <p className="font-bold text-sm">FIN-AI já está instalado!</p>
                <p className="text-slate-400 text-xs">
                  Você já pode abri-lo direto pelo menu Iniciar, Área de Trabalho ou Dock do seu sistema operacional.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Vantagens do Aplicativo no Computador</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Janela própria sem barra de navegador</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Ícone na barra de tarefas / Área de Trabalho</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Acesso direto e persistência segura</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Carregamento instantâneo via cache</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Button if Browser supports one-click prompt */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-xl bg-[#18181b] border border-blue-600/40 space-y-3 text-center">
              <p className="text-xs text-slate-300 font-sans">
                Seu navegador Chrome está pronto para a instalação imediata:
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Instalar Aplicativo Agora
              </button>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Passo a Passo de Instalação no Chrome (PC / Mac)
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              {/* Option 1: Barra de Endereço */}
              <div className="p-3 rounded-xl bg-[#18181b] border border-slate-800/80 flex items-start gap-3">
                <div className="h-6 w-6 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-100">
                    Pelo ícone na Barra de Endereço do Chrome
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    No topo do Google Chrome, ao lado da estrela de favoritos, procure pelo ícone de um <strong>computador com uma seta para baixo (ou botão &ldquo;Instalar&rdquo;)</strong> e clique nele.
                  </p>
                </div>
              </div>

              {/* Option 2: Menu de 3 Pontinhos */}
              <div className="p-3 rounded-xl bg-[#18181b] border border-slate-800/80 flex items-start gap-3">
                <div className="h-6 w-6 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-100">
                    Pelo Menu do Google Chrome (3 pontinhos)
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Clique nos <strong>3 pontinhos verticais</strong> (canto superior direito do Chrome) &rarr; vá em <strong>&ldquo;Salvar e compartilhar&rdquo;</strong> (ou &ldquo;Mais ferramentas&rdquo;) &rarr; clique em <strong>&ldquo;Instalar FIN-AI...&rdquo;</strong>.
                  </p>
                </div>
              </div>

              {/* Mobile guidance if accessing via mobile */}
              {isIOS && (
                <div className="p-3 rounded-xl bg-[#18181b] border border-slate-800/80 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[11px]">
                    <p className="font-semibold text-slate-100">Instalação no iPhone / iPad (Safari):</p>
                    <p className="text-slate-400">
                      Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) no Safari e escolha <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-[#18181b]/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
