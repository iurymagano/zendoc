import { LogoMark } from '@/components/brand/Logo';
import { Bubble } from './Bubble';

/**
 * A conversa que abre a landing: a cliente pede horário às 22h47 e a agenda
 * se preenche sozinha. As mensagens entram em sequência (ia-rise); com
 * prefers-reduced-motion tudo aparece já no lugar.
 */
export function HeroChat() {
  return (
    <div
      className="dark overflow-hidden rounded-[28px] rounded-bl-[6px] bg-card text-card-foreground"
      role="img"
      aria-label="Exemplo de conversa: a cliente Marina pede um horário às 22h47 e a secretária marca o atendimento de quinta, 19/11, às 14h."
    >
      <div className="flex items-center gap-3 bg-[var(--ia-void-3)] px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-background">
          <LogoMark size={26} title={null} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight">
            Secretária da Bia
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="ia-spark inline-block size-2 rounded-full bg-[var(--ia-spark)]" />
            online agora
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-5 pt-5 sm:px-5" aria-hidden>
        <Bubble side="in" time="22:47" className="ia-rise" style={{ '--d': '300ms' } as React.CSSProperties}>
          Oi, boa noite! Tem horário essa semana com a Bia?
        </Bubble>
        <Bubble side="out" time="22:47" className="ia-rise" style={{ '--d': '1000ms' } as React.CSSProperties}>
          Boa noite, Marina! Tenho quinta às 14h, sexta às 9h ou sexta às 16h.
          Qual fica melhor?
        </Bubble>
        <Bubble side="in" time="22:48" className="ia-rise" style={{ '--d': '1700ms' } as React.CSSProperties}>
          Quinta às 14h
        </Bubble>
        <Bubble side="out" time="22:48" className="ia-rise" style={{ '--d': '2400ms' } as React.CSSProperties}>
          Marcado! Quinta, 19/11, às 14h. Eu te lembro na quarta e de novo duas
          horas antes.
        </Bubble>

        <div
          className="ia-rise mt-2 rounded-2xl bg-[var(--ia-mist)] p-4 text-[var(--ia-void)]"
          style={{ '--d': '3200ms' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-block size-2.5 rounded-full bg-[#0f766e]" />
              Na sua agenda
            </p>
            <p className="rounded-full bg-[#e8e1ff] px-2.5 py-0.5 text-xs font-semibold text-[#3d2399]">
              Agendada pelo WhatsApp
            </p>
          </div>
          <p className="tabular mt-3 font-display text-2xl font-bold tracking-tight">
            Quinta, 19/11, 14:00
          </p>
          <p className="mt-0.5 text-sm text-[#5a5d72]">
            50 minutos com a Marina. Lembretes na quarta e na quinta.
          </p>
        </div>
      </div>
    </div>
  );
}
