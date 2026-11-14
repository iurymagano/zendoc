import { LogoMark } from '@/components/brand/Logo';
import { Bubble } from './Bubble';

/**
 * O Assistente pessoal: a pessoa conversa com a própria IA no painel e a
 * agenda dela se organiza. Ao lado, "Seu dia" mostra o resultado da conversa.
 */
export function AssistantDemo() {
  return (
    <div
      className="dark overflow-hidden rounded-[28px] rounded-bl-[6px] bg-card text-card-foreground"
      role="img"
      aria-label="Exemplo de conversa com o assistente pessoal: a pessoa pede para marcar o dentista na terça às 15h e criar um lembrete para cobrar um cliente; o assistente confirma e mostra o dia organizado."
    >
      <div className="flex items-center gap-3 bg-[var(--ia-void-3)] px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-background">
          <LogoMark size={26} title={null} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight">Assistente pessoal</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-[var(--ia-spark)]" />
            só você vê esta conversa
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-5 pt-5 sm:px-5" aria-hidden>
        <Bubble side="in" time="08:03">
          Marca dentista na terça às 15h e me lembra de cobrar o Diego amanhã cedo.
        </Bubble>
        <Bubble side="out" time="08:03">
          Pronto. Dentista na terça, 17/11, às 15h, e um lembrete amanhã às 9h para cobrar o
          Diego. Quer um aviso 1 hora antes do dentista?
        </Bubble>

        <div className="mt-2 rounded-2xl bg-[var(--ia-mist)] p-4 text-[var(--ia-void)]">
          <p className="text-sm font-semibold">Seu dia amanhã, quarta, 18/11</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <Row time="09:00" label="Cobrar o Diego" tag="Lembrete" />
            <Row time="10:30" label="Corte com o Rafael" tag="Cliente" />
            <Row time="14:00" label="Marina, pelo WhatsApp" tag="Cliente" />
            <Row time="17:00" label="Treino" tag="Pessoal" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ time, label, tag }: { time: string; label: string; tag: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="tabular w-12 font-mono text-[13px] font-medium text-[#3d2399]">{time}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="rounded-full bg-[#e8e1ff] px-2.5 py-0.5 text-xs font-semibold text-[#3d2399]">{tag}</span>
    </li>
  );
}
