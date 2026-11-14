import Link from 'next/link';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import {
  BRAND,
  MARK_GRADIENT,
  MARK_STROKE_PATH,
  MARK_STROKE_WIDTH,
  MARK_VIEWBOX,
  SPARK,
  WORDMARK,
} from './logo-geometry';

type Variant = 'default' | 'mono';
type Size = 'sm' | 'md' | 'lg' | 'xl';

/** Altura do logo em px. O lockup mantém a proporção 356:100. */
const HEIGHT: Record<Size, number> = { sm: 22, md: 30, lg: 42, xl: 60 };

const WORD_SCALE = 0.9;
const WORD_X = 114;
const LOCKUP_W = Math.round(WORD_X + WORDMARK.width * WORD_SCALE);
const WORD_BASELINE = 50 + (WORDMARK.capHeight * WORD_SCALE) / 2;

function useGradientId() {
  return `iazen-g-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function Gradient({ id }: { id: string }) {
  return (
    <linearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={MARK_GRADIENT.x1}
      y1={MARK_GRADIENT.y1}
      x2={MARK_GRADIENT.x2}
      y2={MARK_GRADIENT.y2}
    >
      {MARK_GRADIENT.stops.map((s) => (
        <stop key={s.offset} offset={s.offset} stopColor={s.color} />
      ))}
    </linearGradient>
  );
}

function MarkShapes({ variant, gradId }: { variant: Variant; gradId: string }) {
  const mono = variant === 'mono';
  return (
    <>
      <path
        d={MARK_STROKE_PATH}
        fill="none"
        stroke={mono ? 'currentColor' : `url(#${gradId})`}
        strokeWidth={MARK_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={SPARK.cx}
        cy={SPARK.cy}
        r={SPARK.r}
        fill={mono ? 'currentColor' : BRAND.spark}
      />
    </>
  );
}

interface MarkProps {
  /** Lado do símbolo em px. */
  size?: number;
  /** `mono` usa a cor do texto (currentColor), ex.: branco sobre violeta. */
  variant?: Variant;
  className?: string;
  /** Texto acessível. Passe `null` quando o símbolo é só decoração. */
  title?: string | null;
}

/** Só o símbolo: Ensō que vira balão, com a faísca na abertura. */
export function LogoMark({
  size = 32,
  variant = 'default',
  className,
  title = 'IAzen',
}: MarkProps) {
  const gradId = useGradientId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <Gradient id={gradId} />
      </defs>
      <MarkShapes variant={variant} gradId={gradId} />
    </svg>
  );
}

interface Props {
  size?: Size;
  /** `null` renderiza sem link. */
  href?: string | null;
  /**
   * `default`: símbolo com degradê. `mono`: tudo na cor do texto
   * (use `text-white` sobre violeta). O wordmark sempre herda a cor do texto,
   * então funciona em fundo claro (tinta) e escuro (Névoa).
   */
  variant?: Variant;
  className?: string;
}

/** Logo completo: símbolo + wordmark "IAzen" (IA forte, zen leve), em curvas. */
export function Logo({
  size = 'md',
  href = '/',
  variant = 'default',
  className,
}: Props) {
  const gradId = useGradientId();
  const h = HEIGHT[size];
  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${LOCKUP_W} 100`}
      height={h}
      width={Math.round((h * LOCKUP_W) / 100)}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="IAzen"
      focusable="false"
    >
      <defs>
        <Gradient id={gradId} />
      </defs>
      <MarkShapes variant={variant} gradId={gradId} />
      <g
        transform={`translate(${WORD_X} ${WORD_BASELINE}) scale(${WORD_SCALE})`}
        fill="currentColor"
      >
        <path d={WORDMARK.ia} />
        <path d={WORDMARK.zen} />
      </g>
    </svg>
  );

  if (!href) return svg;
  return (
    <Link href={href} aria-label="IAzen, ir para o início" className="inline-flex">
      {svg}
    </Link>
  );
}
