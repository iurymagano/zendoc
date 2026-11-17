// Regras PURAS do contador de visitas das páginas públicas (sem banco, sem rede).

/** Únicos caminhos contados; qualquer outro valor é descartado. */
export const TRACKED_PATHS = ['/', '/register', '/login', '/privacidade'] as const;

export type TrackedPath = (typeof TRACKED_PATHS)[number];

export function isTrackedPath(path: unknown): path is TrackedPath {
  return typeof path === 'string' && (TRACKED_PATHS as readonly string[]).includes(path);
}

const BOT_RE =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|go-http-client|axios|node-fetch|monitor|uptime|pingdom/i;

/** true para robôs, prévias de link e clientes sem user-agent. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_RE.test(userAgent);
}
