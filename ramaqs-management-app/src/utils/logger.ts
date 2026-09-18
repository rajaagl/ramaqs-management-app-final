type LogArguments = unknown[];

const noop = (..._args: LogArguments): void => undefined;

// Les journaux de débogage sont volontairement désactivés dans le navigateur.
export const logger = {
  log: noop,
  warn: noop,
  debug: noop,
  error: noop,
  ws: noop,
  api: noop,
};
