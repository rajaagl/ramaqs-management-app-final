const isDev = import.meta.env.DEV;

export const logger = {
  log:   (...args: any[]) => { if (isDev) console.log(...args); },
  warn:  (...args: any[]) => { if (isDev) console.warn(...args); },
  debug: (...args: any[]) => { if (isDev) console.debug(...args); },
  error: (...args: any[]) => console.error(...args), // erreurs toujours visibles
  ws:    (...args: any[]) => { if (isDev) console.log('[WS]', ...args); },
  api:   (...args: any[]) => { if (isDev) console.log('[API]', ...args); },
};