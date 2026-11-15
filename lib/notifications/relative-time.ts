// "há 5 min", "ontem", "12/11": tempo relativo das notificações. PURO e
// independente do fuso do servidor/navegador (a comparação de dia usa
// America/Sao_Paulo).
import { diffDays, saoPauloParts } from '../assistant/datetime';

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const seconds = Math.floor((now.getTime() - t.getTime()) / 1000);

  if (seconds < 45) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${Math.max(1, minutes)} min`;
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) {
    // Passou da meia-noite de SP: "ontem" lê melhor que "há 20 h".
    const days = diffDays(saoPauloParts(t).date, saoPauloParts(now).date);
    if (days >= 1) return 'ontem';
    return `há ${hours} h`;
  }
  const days = diffDays(saoPauloParts(t).date, saoPauloParts(now).date);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  const p = saoPauloParts(t);
  const [, month, day] = p.date.split('-');
  return p.year === saoPauloParts(now).year ? `${day}/${month}` : `${day}/${month}/${p.year}`;
}
