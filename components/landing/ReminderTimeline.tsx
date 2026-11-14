import { Bubble } from './Bubble';

/** Linha do tempo de um atendimento: lembrete de 24h, lembrete de 2h e o atendimento. */
export function ReminderTimeline() {
  return (
    <ol className="grid gap-0 lg:grid-cols-3 lg:gap-10">
      <li className="relative pb-12 pl-9 lg:pb-0 lg:pl-0 lg:pt-12">
        <Rail />
        <p className="tabular font-mono text-sm text-[var(--ia-violet)]">Quarta, 18/11, 14:00</p>
        <h3 className="mt-1 text-2xl font-bold">24 horas antes</h3>
        <div className="dark mt-5 flex flex-col gap-2.5 rounded-3xl bg-card p-4">
          <Bubble side="out">
            Oi, Diego! Passando para lembrar do seu horário amanhã, quinta, às 14h. Posso confirmar?
          </Bubble>
          <Bubble side="in">Pode confirmar!</Bubble>
          <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
            <span className="inline-block size-2.5 rounded-full bg-[var(--ia-spark)]" />
            Na agenda, o horário passa para Confirmado.
          </p>
        </div>
      </li>

      <li className="relative pb-12 pl-9 lg:pb-0 lg:pl-0 lg:pt-12">
        <Rail />
        <p className="tabular font-mono text-sm text-[var(--ia-violet)]">Quinta, 19/11, 12:00</p>
        <h3 className="mt-1 text-2xl font-bold">2 horas antes</h3>
        <div className="dark mt-5 flex flex-col gap-2.5 rounded-3xl bg-card p-4">
          <Bubble side="out">
            Diego, seu horário é hoje às 14h, daqui a duas horas. Até já!
          </Bubble>
          <Bubble side="in">Até já!</Bubble>
        </div>
      </li>

      <li className="relative pl-9 lg:pl-0 lg:pt-12">
        <Rail last />
        <p className="tabular font-mono text-sm text-[var(--ia-violet)]">Quinta, 19/11, 14:00</p>
        <h3 className="mt-1 text-2xl font-bold">O atendimento</h3>
        <p className="mt-5 text-lg">
          Quem não puder ir responde na própria conversa. A secretária cancela e o horário volta
          para a lista, pronto para outro cliente.
        </p>
      </li>
    </ol>
  );
}

/** Ponto e trilho: vertical no celular, horizontal no desktop. */
function Rail({ last = false }: { last?: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={
          last
            ? 'absolute left-0 top-1.5 size-3 rounded-full bg-[var(--ia-spark)] lg:top-0'
            : 'absolute left-0 top-1.5 size-3 rounded-full bg-[var(--ia-violet)] lg:top-0'
        }
      />
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[5px] top-5 w-0.5 bg-[var(--ia-void-3)] lg:bottom-auto lg:left-5 lg:right-[-2.5rem] lg:top-[5px] lg:h-0.5 lg:w-auto"
        />
      )}
    </>
  );
}
