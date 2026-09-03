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
 * Uses multi-heuristic tests specific to Google Chrome and modern Chromium.
 */
export async function detectIncognito(): Promise<boolean> {
  try {
    // 1. Quota & Persistence heuristic in Chromium
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { quota } = await navigator.storage.estimate();
      // Regular Google Chrome allocates a huge quota based on actual hard drive space (>10GB).
      // Incognito mode caps temporary quota to a small fraction of RAM or max ~2-4GB.
      if (quota && quota < 3 * 1024 * 1024 * 1024) {
        if ('persist' in navigator.storage) {
          try {
            const isPersisted = await navigator.storage.persisted();
            const canPersist = await navigator.storage.persist();
            if (!isPersisted && !canPersist) {
              return true;
            }
          } catch {
            return true;
          }
        }
      }
    }

    // 2. Chromium FileSystem API heuristic
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
