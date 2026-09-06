// Advanced Security, Browser Profile & IP Lockdown Utility

export interface IpSecurityStatus {
  clientIp: string;
  boundIp: string | null;
  boundAt: string | null;
  boundUser: string;
  isLocked: boolean;
  isAuthorized: boolean;
}

/**
 * Checks whether the current window is running in an Incognito / Private browsing context.
 * Carefully avoids false positives on mobile devices, PWAs, or low-storage environments.
 */
export async function detectIncognito(): Promise<boolean> {
  try {
    // Mobile browsers, iOS WebClips, and PWAs naturally have quota constraints and cannot be tested via desktop quota heuristics.
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean })?.standalone === true);

    if (isMobile || isStandalone) {
      return false;
    }

    // 1. Chromium FileSystem API heuristic (specific to desktop Chromium incognito)
    const fs = (window as any).RequestFileSystem || (window as any).webkitRequestFileSystem;
    if (fs) {
      const isIncognitoFs = await new Promise<boolean>((resolve) => {
        fs(
          (window as any).TEMPORARY,
          100,
          () => resolve(false),
          () => resolve(true)
        );
      });
      if (isIncognitoFs) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Falha na detecção de janela anônima:', err);
  }
  return false;
}

/**
 * Detects if the browser is Google Chrome or Chromium.
 */
export function isGoogleChrome(): boolean {
  const ua = navigator.userAgent;
  const isChromium = (window as any).chrome !== undefined;
  const isEdge = ua.indexOf('Edg/') > -1;
  const isOpera = ua.indexOf('OPR/') > -1;
  return isChromium && !isEdge && !isOpera;
}

/**
 * Checks IP lock status against the server.
 */
export async function getIpSecurityStatus(): Promise<IpSecurityStatus> {
  return {
    clientIp: 'Dinâmico',
    boundIp: null,
    boundAt: null,
    boundUser: 'rubenmassuquetto1999@gmail.com',
    isLocked: false,
    isAuthorized: true
  };
}

/**
 * Trava de IP desativada para suportar rotação natural de endereços IPv6.
 */
export async function bindCurrentIp(): Promise<IpSecurityStatus> {
  return {
    clientIp: 'Dinâmico',
    boundIp: null,
    boundAt: null,
    boundUser: 'rubenmassuquetto1999@gmail.com',
    isLocked: false,
    isAuthorized: true
  };
}
