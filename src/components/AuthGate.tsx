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
  Eye,
  EyeOff,
  Shield,
  Mail,
  KeyRound
} from 'lucide-react';
import {
  subscribeAuth,
  loginWithGoogle,
  loginWithEmail,
  checkRedirectResult,
  logoutUser,
  isUserAuthorized,
  AUTHORIZED_EMAIL
} from '../lib/firebase';
import {
  detectIncognito,
  getIpSecurityStatus,
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
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isLoggingInEmail, setIsLoggingInEmail] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states for inputs
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'password'>('google');

  // Security state
  const [isIncognito, setIsIncognito] = useState<boolean>(false);
  const [ipStatus, setIpStatus] = useState<IpSecurityStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Process Google OAuth redirect if returning from redirect
      try {
        const redirectUser = await checkRedirectResult();
        if (redirectUser && isMounted) {
          setUser(redirectUser);
        }
      } catch (err: any) {
        console.warn('Erro ao processar redirect Google:', err);
        if (isMounted) {
          if (err.code === 'auth/unauthorized-domain') {
            setAuthError('Domínio não autorizado pelo Google no Firebase. Por favor, acesse usando seu E-mail e Senha abaixo.');
          } else {
            setAuthError(err.message || 'Falha ao autenticar com o Google via redirecionamento.');
          }
        }
      }

      // 2. Check for Incognito Mode (desktop-only safe heuristic)
      const incognito = await detectIncognito();
      if (isMounted) {
        setIsIncognito(incognito);
      }

      // 3. Fetch IP security status
      const status = await getIpSecurityStatus();
      if (isMounted) {
        setIpStatus(status);
      }
    }

    initAuth();

    const unsubscribe = subscribeAuth(async (currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Informe o seu endereço de e-mail.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Digite a sua senha.');
      return;
    }

    try {
      setIsLoggingInEmail(true);
      setAuthError(null);
      await loginWithEmail(emailInput.trim(), passwordInput);
    } catch (err: any) {
      console.error('Erro de autenticação por e-mail/senha:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('Usuário não encontrado para este e-mail.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Muitas tentativas consecutivas. Aguarde alguns instantes.');
      } else {
        setAuthError(err.message || 'Falha ao entrar com e-mail e senha.');
      }
    } finally {
      setIsLoggingInEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingInGoogle(true);
      setAuthError(null);
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
      }
    } catch (err: any) {
      console.error('Erro de autenticação Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('A janela de login do Google foi fechada antes de concluir.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError(
          'A janela pop-up foi bloqueada pelo seu navegador. Toque no ícone de pop-up na barra de endereços para autorizar ou utilize a aba "E-mail e Senha" logo abaixo.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          'Domínio web não autorizado pelo Google no Firebase. Por favor, utilize o login por E-mail e Senha.'
        );
      } else {
        setAuthError(err.message || 'Falha ao autenticar com o Google. Tente novamente ou use E-mail e Senha.');
      }
    } finally {
      setIsLoggingInGoogle(false);
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
              Validando e-mail e credenciais de segurança...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. STRICT BLOCK: Incognito / Private Window Detected (desktop only)
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
                <li>Abra uma janela padrão do navegador.</li>
                <li>Acesse o endereço da aplicação novamente.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated User Screen (Native Mobile Email/Password & Google)
  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-[#121215] border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Header / Security Badge */}
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] font-mono uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Acesso Seguro & Pessoal</span>
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
                Sistema exclusivo de controle financeiro. Entre com seu e-mail e senha ou perfil Google.
              </p>
            </div>

            {/* Error Message if any */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-mono flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Method Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              <button
                type="button"
                id="auth-tab-google"
                onClick={() => {
                  setLoginMethod('google');
                  setAuthError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'google'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>
              <button
                type="button"
                id="auth-tab-password"
                onClick={() => {
                  setLoginMethod('password');
                  setAuthError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>E-mail e Senha</span>
              </button>
            </div>

            {/* TAB 1: Native E-mail & Password Form */}
            {loginMethod === 'password' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email-input"
                    className="block text-xs font-mono font-medium text-slate-300"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-email-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-base sm:text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-sans placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password-input"
                    className="block text-xs font-mono font-medium text-slate-300"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Sua senha de acesso"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-base sm:text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-sans placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      id="auth-toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="auth-submit-password-btn"
                  disabled={isLoggingInEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoggingInEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar com E-mail e Senha</span>
                      <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Google Sign-in Action */}
            {loginMethod === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  id="auth-google-login-btn"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingInGoogle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoggingInGoogle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                      <span>Conectando com o Google...</span>
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
                      <span>Entrar com Perfil Google</span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center font-sans leading-relaxed">
                  Toque acima para escolher sua conta Google oficial. O login é direto e seguro.
                </p>
              </div>
            )}

            {/* Security Guarantee Text */}
            <div className="pt-1 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                🔒 Perfil restrito • Sessão persistente • Dados protegidos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated User, but NOT the authorized email (Access Strictly Denied)
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
                O navegador está conectado com um e-mail diferente do proprietário. O acesso foi sumariamente bloqueado.
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
                type="button"
                id="auth-switch-account-btn"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Trocar para o Perfil do Proprietário</span>
              </button>

              <button
                type="button"
                id="auth-logout-denied-btn"
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

  // 5. Authorized User - Render Full Application
  return <>{children({ user, onLogout: handleLogout, ipStatus })}</>;
}
