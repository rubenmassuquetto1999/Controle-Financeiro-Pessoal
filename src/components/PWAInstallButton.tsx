import React, { useState } from 'react';
import { Download, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isStandalone, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running as an installed standalone app window, hide or show minimal indicator
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-600/40 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 hover:text-blue-200 text-xs font-mono transition-all cursor-pointer shadow-xs ${className}`}
        title="Instalar FIN-AI como aplicativo no computador"
      >
        {isInstallable ? (
          <Download className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-bounce" />
        ) : (
          <Laptop className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        )}
        <span className="font-semibold whitespace-nowrap">
          {variant === 'compact' ? 'Instalar App' : 'Instalar no Computador'}
        </span>
      </button>

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
