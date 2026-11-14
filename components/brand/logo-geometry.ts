// Geometria da marca IAzen (Ensō + balão + faísca) e do wordmark em curvas.
// Fonte única: Logo.tsx, app/icon.svg, apple-icon e os SVGs de public/ saem daqui.
// O wordmark são os glifos da Sora (IA peso 700, zen peso 300, tracking -0.03em)
// convertidos em curva, então não depende de fonte carregada.

export const MARK_VIEWBOX = 100;

/** Traço do Ensō: abre no canto superior direito e vira balão com a ponta embaixo à esquerda. */
export const MARK_STROKE_PATH =
  'M69.15 16.83A38.3 38.3 0 0 0 12.07 55.33L9.7 89.6L36.9 86A38.3 38.3 0 0 0 87.6 42.7';
export const MARK_STROKE_WIDTH = 11.2;

/** Faísca (a IA, sempre online) na abertura do círculo. */
export const SPARK = { cx: 83, cy: 26.2, r: 9 } as const;

export const BRAND = {
  void: '#05060A',
  violet: '#8B5CFF',
  spark: '#5EEAD4',
  mist: '#F4F3F8',
} as const;

/** Degradê do traço: violeta embaixo à esquerda, azul-turquesa claro em cima. */
export const MARK_GRADIENT = {
  x1: 20,
  y1: 92,
  x2: 76,
  y2: 8,
  stops: [
    { offset: 0, color: '#8B5CFF' },
    { offset: 0.5, color: '#79A6EE' },
    { offset: 1, color: '#7CDDE0' },
  ],
} as const;

/** Wordmark em curvas (fonte 100 unidades, baseline em y=0, altura de caixa-alta 73). */
export const WORDMARK = {
  width: 269.3,
  capHeight: 73,
  ia: 'M24.80 0L8.40 0L8.40-73L24.80-73M47.90 0L31.50 0L55.60-73L82.10-73L107.10 0L90.10 0L69.90-61.70L75.10-59.60L62.20-59.60L67.60-61.70L47.90 0M88.50-18.10L49.80-18.10L54.80-31.70L83.40-31.70',
  zen: 'M149.90 0L111.40 0L111.40-8.70L142.10-47L141.80-45.30L140.40-47.50L141.50-46.90L111.10-46.90L111.10-52.90L148.40-52.90L148.40-44.20L117.60-6L117.90-7.50L119.40-5.30L118.30-6L149.90-6M182.70 1.70Q175.90 1.70 170.90-0.65Q165.90-3 162.70-6.95Q159.50-10.90 157.95-15.80Q156.40-20.70 156.40-25.90L156.40-27.30Q156.40-32.40 157.95-37.30Q159.50-42.20 162.70-46.10Q165.90-50 170.75-52.35Q175.60-54.70 182.10-54.70Q190.40-54.70 195.95-51Q201.50-47.30 204.30-41.55Q207.10-35.80 207.10-29.20L207.10-25.30L159.80-25.30L159.80-31.10L201.90-31.10L200-28.20Q200-34.10 197.95-38.55Q195.90-43 191.95-45.55Q188-48.10 182.10-48.10Q175.90-48.10 171.80-45.20Q167.70-42.30 165.65-37.50Q163.60-32.70 163.60-26.60Q163.60-20.60 165.65-15.65Q167.70-10.70 171.95-7.80Q176.20-4.90 182.70-4.90Q189.60-4.90 193.90-8.05Q198.20-11.20 199.20-15.50L206.20-15.50Q205.20-10.20 202-6.35Q198.80-2.50 193.90-0.40Q189 1.70 182.70 1.70M226 0L218.50 0L218.50-52.90L224.50-52.90L224.50-30.70L223.30-30.70Q223.30-38.10 225.50-43.40Q227.70-48.70 232.10-51.60Q236.50-54.50 243.20-54.50L243.50-54.50Q253.50-54.50 258.40-48.25Q263.30-42 263.30-30.70L263.30 0L255.90 0L255.90-32.30Q255.90-39.20 252.10-43.40Q248.30-47.60 241.50-47.60Q234.50-47.60 230.25-43.25Q226-38.90 226-31.80',
} as const;
