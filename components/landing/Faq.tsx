import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Grad, H2, SectionLabel, WRAP } from './primitives';

const FAQ = [
  {
    q: 'Como eu ensino a IA?',
    a: 'Você escolhe o tom, amigável ou formal, e escreve as instruções que ela deve seguir. Os serviços ficam em Configurações → Serviços e os horários em Disponibilidade e Exceções. Para conferir o resultado, converse com ela em Configurações → Testar IA, como se fosse um cliente.',
  },
  {
    q: 'Preciso usar o Google Agenda?',
    a: 'Não é obrigatório. Se você conectar em Configurações → Google Agenda, os eventos que já estão lá bloqueiam os horários e os atendimentos marcados pela IAzen aparecem na sua agenda do Google.',
  },
  {
    q: 'Posso assumir uma conversa?',
    a: 'Pode. Em Conversas, o botão “Assumir conversa” pausa a IA naquele cliente: ela continua guardando as mensagens, mas não responde, e você fala direto. Para ela voltar, clique em “Retomar IA”.',
  },
  {
    q: 'Preciso de cartão para testar?',
    a: 'Não. O teste de 7 dias começa no cadastro, sem cartão. Depois dele, a assinatura é de R$297 por mês.',
  },
  {
    q: 'Como eu cancelo?',
    a: 'Em Configurações → Assinatura, o botão “Gerenciar assinatura” abre o portal do Stripe, onde você cancela quando quiser.',
  },
];

/** Seção 07: perguntas frequentes em acordeão (shadcn). */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className={WRAP}>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div data-reveal>
            <SectionLabel>07 — Dúvidas</SectionLabel>
            <H2 className="mt-5">
              Perguntas <Grad>frequentes.</Grad>
            </H2>
          </div>
          <div data-reveal>
            <Accordion defaultValue={[FAQ[0].q]} className="gap-3">
              {FAQ.map((f) => (
                <AccordionItem
                  key={f.q}
                  value={f.q}
                  className="rounded-[24px] border border-[#ffffff12] bg-[#0b0c14] px-6 not-last:border-b"
                >
                  <AccordionTrigger className="py-5 font-display text-base font-bold tracking-[-0.02em] text-white hover:no-underline sm:text-lg">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-[#9a9cae]">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
