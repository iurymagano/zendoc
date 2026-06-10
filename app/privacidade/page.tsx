import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Política de Privacidade · IAzen',
  description: 'Como o IAzen trata dados pessoais, conforme a LGPD.',
};

// Página pública (fora dos grupos (auth)/(dashboard)) — também usada como a URL
// de política de privacidade exigida na verificação OAuth do Google.
// ⚠️ TEXTO-BASE: revisar com um advogado e preencher os campos <entre colchetes>
// antes de publicar/lançar. Não é aconselhamento jurídico.
export default function PrivacidadePage() {
  const updated = '09/06/2026';
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo size="md" href="/" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <span className="mb-2 block h-1 w-10 rounded-full bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed]" />
        <h1
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {updated}
        </p>

        <div className="prose-iazen mt-8 flex flex-col gap-6 text-sm leading-[1.7] text-foreground/90">
          <section>
            <p>
              Esta Política explica como a <strong>IAzen</strong> (“nós”) trata
              dados pessoais ao oferecer uma plataforma de gestão de consultórios
              com secretária virtual por WhatsApp. Tratamos dados em conformidade
              com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <Section title="1. Quem é o controlador">
            <p>
              O profissional de saúde que contrata o IAzen é o{' '}
              <strong>controlador</strong> dos dados de seus pacientes. A IAzen
              atua como <strong>operadora</strong>, tratando esses dados em nome e
              segundo as instruções do profissional. Para os dados de cadastro do
              próprio profissional, a IAzen é a controladora.
            </p>
            <p className="text-muted-foreground">
              Operadora: [razão social], CNPJ [nº], contato: [email do DPO].
            </p>
          </Section>

          <Section title="2. Dados que tratamos">
            <ul className="list-disc pl-5">
              <li>
                <strong>Do profissional:</strong> nome, e-mail, especialidade,
                telefone, endereço, dados de acesso e de assinatura (pagamento via
                Stripe).
              </li>
              <li>
                <strong>Dos pacientes:</strong> nome, telefone, CPF (opcional),
                anotações do consultório, histórico de agendamentos e o conteúdo
                das conversas trocadas com a secretária virtual.
              </li>
            </ul>
          </Section>

          <Section title="3. Para que usamos e a base legal">
            <ul className="list-disc pl-5">
              <li>Agendar, confirmar, lembrar e gerenciar consultas.</li>
              <li>
                Operar a secretária virtual por WhatsApp (responder e marcar
                automaticamente).
              </li>
              <li>Emitir documentos (ex.: declaração de comparecimento).</li>
              <li>Cobrança da assinatura do profissional.</li>
            </ul>
            <p>
              As bases legais incluem a <strong>execução de contrato</strong>, o{' '}
              <strong>legítimo interesse</strong> (ex.: lembretes a pacientes já
              atendidos) e o <strong>consentimento</strong> quando aplicável. O
              paciente pode pedir para não receber mensagens a qualquer momento
              (ver item 6).
            </p>
          </Section>

          <Section title="4. Compartilhamento com terceiros (operadores)">
            <p>
              Para funcionar, o IAzen usa provedores que tratam dados em nosso
              nome, sob contrato e medidas de segurança:
            </p>
            <ul className="list-disc pl-5">
              <li><strong>Supabase</strong> — banco de dados e autenticação.</li>
              <li>
                <strong>Anthropic (Claude)</strong> — IA que processa as mensagens
                para responder e agendar. Não usamos esses dados para treinar
                modelos.
              </li>
              <li>
                <strong>WhatsApp / provedor de mensageria</strong> — envio e
                recebimento das mensagens.
              </li>
              <li>
                <strong>Google Calendar</strong> — quando o profissional conecta,
                sincronizamos os eventos de agenda (com a autorização dele).
              </li>
              <li><strong>Stripe</strong> — processamento dos pagamentos da assinatura.</li>
              <li><strong>Vercel</strong> — hospedagem da aplicação.</li>
            </ul>
          </Section>

          <Section title="5. Uso do Google Calendar">
            <p>
              Quando o profissional conecta a conta Google, acessamos sua agenda
              apenas para: criar/atualizar/remover os eventos das consultas e ler
              os compromissos para evitar conflitos de horário. O uso das
              informações recebidas das APIs do Google segue a{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Política de Dados do Usuário dos Serviços de API do Google
              </a>
              , incluindo os requisitos de Uso Limitado. A conexão pode ser
              revogada a qualquer momento em Configurações → Google Agenda.
            </p>
          </Section>

          <Section title="6. Direitos do titular">
            <p>
              Pacientes e profissionais podem solicitar acesso, correção,
              portabilidade, exclusão e a interrupção do tratamento de seus dados,
              além de se opor ao recebimento de mensagens. Os pedidos podem ser
              feitos diretamente ao profissional (controlador) ou pelo contato
              [email do DPO]. O profissional pode exportar ou excluir os dados de
              um paciente na própria plataforma.
            </p>
          </Section>

          <Section title="7. Retenção e segurança">
            <p>
              Mantemos os dados pelo tempo necessário às finalidades acima e às
              obrigações legais. Após o cancelamento, os dados são mantidos por até
              30 dias e então removidos, salvo obrigação legal de retenção.
              Adotamos medidas técnicas e organizacionais para proteger os dados
              (controle de acesso, criptografia em trânsito, isolamento por
              profissional).
            </p>
          </Section>

          <Section title="8. Contato">
            <p>
              Dúvidas sobre privacidade ou pedidos de titular: [email do DPO].
            </p>
          </Section>

          <p className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
            ⚠️ Documento-base, não é aconselhamento jurídico. Revise com um
            advogado e preencha os campos entre colchetes antes do lançamento.
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
