import React, { useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  ShieldAlert,
  Lock,
  LogOut,
  RefreshCw,
  AlertOctagon,
  ArrowRight,
  Fingerprint,
  EyeOff,
  GlobeLock,
  Shield
} from 'lucide-react';
import {
  subscribeAuth,
  loginWithGoogle,
  logoutUser,
  isUserAuthorized,
  AUTHORIZED_EMAIL
} from '../lib/firebase';
import {
  detectIncognito,
  getIpSecurityStatus,
  bindCurrentIp,
  IpSecurityStatus
} from '../lib/security';

interface AuthGateProps {
  children: (props: {
    user: User;
    onLogout: () => Promise<void>;
    ipStatus: IpSecurityStatus | null;
  }) => ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security state
  const [isIncognito, setIsIncognito] = useState<boolean>(false);
  const [ipStatus, setIpStatus] = useState<IpSecurityStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function runSecurityChecks() {
      // 1. Check for Incognito Mode in Chromium
      const incognito = await detectIncognito();
      if (isMounted) {
        setIsIncognito(incognito);
      }

      // 2. Check IP Lock status from server
      const status = await getIpSecurityStatus();
      if (isMounted) {
        setIpStatus(status);
      }
    }

    runSecurityChecks();

    const unsubscribe = subscribeAuth(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // If user is authorized and IP is not bound yet, automatically lock to this computer
      if (currentUser && isUserAuthorized(currentUser)) {
        try {
          const currentIpStatus = await getIpSecurityStatus();
          setIpStatus(currentIpStatus);
          if (!currentIpStatus.isLocked && currentIpStatus.clientIp) {
            const updated = await bindCurrentIp();
            setIpStatus(updated);
            console.log('IP travado com sucesso para o computador do proprietário:', updated.boundIp);
          }
        } catch (e) {
          console.error('Erro ao travar IP automaticamente:', e);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      const loggedUser = await loginWithGoogle();

      // Automatically bind client IP if not yet locked
      if (isUserAuthorized(loggedUser)) {
        try {
          const updated = await bindCurrentIp(false);
          setIpStatus(updated);
        } catch (e) {
          console.warn('Falha no vínculo de IP:', e);
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('O pop-up de login foi fechado antes de concluir.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('O pop-up de login foi bloqueado pelo seu navegador. Permita pop-ups para este site.');
      } else {
        setAuthError(err.message || 'Falha ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthError(null);
    } catch (err: any) {
      console.error('Erro ao sair:', err);
    }
  };

  // 1. Initial Security & Authentication Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 animate-pulse">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-200 font-sans tracking-tight">
              Verificando Credenciais e Dispositivo
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Validando e-mail, perfil do navegador e IP de rede...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. STRICT BLOCK: Incognito / Private Window Detected
  if (isIncognito) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full max-w-md">
          <div className="bg-[#121215] border border-red-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] font-mono uppercase tracking-wider">
                <EyeOff className="w-3.5 h-3.5 text-red-400" />
                <span>Bloqueio de Aba Anônima</span>
              </div>

              <div className="h-14 w-14 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-center text-red-400 mx-auto shadow-inner">
                <EyeOff className="w-7 h-7" />
              </div>

              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                Acesso Não Permitido em Aba Anônima
              </h1>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Por exigência rigorosa de segurança, esta aplicação não pode ser executada no modo anônimo ou privado.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2.5">
              <div className="text-slate-300 font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Como proceder com segurança:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
                <li>Feche esta janela anônima.</li>
                <li>Abra uma janela padrão do <strong>Google Chrome</strong>.</li>
                <li>Certifique-se de estar usando o seu perfil oficial do Chrome.</li>
                <li>Acesse o endereço da aplicação novamente.</li>
              </ol>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                🛡️ O modo anônimo desativa travas de perfil do navegador e não é permitido neste sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STRICT BLOCK: IP Address Lockout (Non-Authorized IP)
  if (ipStatus && ipStatus.isLocked && !ipStatus.isAuthorized) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full max-w-md">
          <div className="bg-[#121215] border border-red-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] font-mono uppercase tracking-wider">
                <GlobeLock className="w-3.5 h-3.5 text-red-400" />
                <span>Bloqueio de Endereço IP</span>
              </div>

              <div className="h-14 w-14 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-center text-red-400 mx-auto shadow-inner">
                <GlobeLock className="w-7 h-7" />
              </div>

              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                Endereço IP Não Autorizado
              </h1>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Esta aplicação foi amarrada exclusivamente ao endereço IP do computador oficial do proprietário. A conexão atual foi bloqueada.
              </p>
            </div>

            <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block mb-1">IP DETECTADO NESTA CONEXÃO (NEGADO):</span>
                <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 font-mono text-[11px] break-all">
                  {ipStatus.clientIp}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">IP VINCULADO AO SEU COMPUTADOR:</span>
                <div className="px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 font-mono text-[11px] break-all">
                  {ipStatus.boundIp}
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                🔒 Para acessar, utilize a mesma rede e computador vinculados originalmente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Unauthenticated User Screen (Google Chrome Profile Login)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
        <div className="w-full max-w-md">
          {/* Main Security Card */}
          <div className="bg-[#121215] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header / Security Badge */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] font-mono uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Acesso Pessoal & Protegido</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md">
                  Φ
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">
                  FIN-AI
                </h1>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-xs mx-auto">
                Sistema restrito ao perfil oficial do proprietário. O acesso requer autenticação Google e conexão autorizada.
              </p>
            </div>

            {/* Error Message if any */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-mono flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Sign-in Action */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                  <span>Autenticando Perfil Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Perfil Google do Chrome</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Security Guarantee Text */}
            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                🔒 Perfil restrito • Trava de IP ativada • Proteção contra acessos externos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authenticated User, but NOT the authorized email (Access Strictly Denied)
  if (!isUserAuthorized(user)) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full max-w-md">
          <div className="bg-[#121215] border border-red-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header Badge */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] font-mono uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Perfil de Conta Não Autorizado</span>
              </div>

              <div className="h-12 w-12 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                Acesso Bloqueado
              </h1>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                O navegador está conectado com um perfil ou e-mail Google diferente do proprietário. O acesso foi sumariamente bloqueado.
              </p>
            </div>

            {/* Email Comparison Box */}
            <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block mb-1">CONTA LOGADA NO NAVEGADOR (NEGADA):</span>
                <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 font-mono text-[11px] break-all">
                  {user.email || 'E-mail desconhecido'}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">PROPRIETÁRIO AUTORIZADO EXCLUSIVO:</span>
                <div className="px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 font-mono text-[11px] break-all">
                  {AUTHORIZED_EMAIL}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Trocar para o Perfil do Proprietário</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar desta sessão</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-600 font-mono">
              🛡️ As regras do servidor garantem que nenhum dado seja transmitido sem autorização do proprietário.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6. Authorized User - Render Full Application
  return <>{children({ user, onLogout: handleLogout, ipStatus })}</>;
}
