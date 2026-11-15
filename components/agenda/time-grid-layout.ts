/** Intervalo em minutos desde a meia-noite. */
export interface Span {
  start: number;
  end: number;
}

export type Laned<T extends Span> = T & { lane: number; lanes: number };

/**
 * Distribui blocos que se sobrepõem em faixas lado a lado (como Google/Notion
 * Calendar), para nenhum ficar escondido atrás de outro. `minLength` evita que
 * um bloco curto (altura mínima) invada o seguinte sem ser considerado.
 */
export function layoutLanes<T extends Span>(items: T[], minLength = 25): Laned<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Laned<T>[] = [];
  let cluster: Laned<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = laneEnds.length;
    for (const item of cluster) item.lanes = lanes;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    const end = Math.max(item.end, item.start + minLength);
    if (cluster.length > 0 && item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((e) => e <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    clusterEnd = Math.max(clusterEnd, end);
    cluster.push({ ...item, lane, lanes: 1 });
  }
  flush();
  return out;
}
