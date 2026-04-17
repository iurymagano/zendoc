import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b bg-background">
        <div className="text-xl font-semibold">Zendoc</div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
            Entrar
          </Link>
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>
            Começar grátis
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center py-20">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Sua secretária virtual no WhatsApp
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Agenda, confirma e gerencia consultas automaticamente — 24h por dia,
            direto no WhatsApp dos seus pacientes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: 'lg' })}>
              Testar grátis por 7 dias
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            R$197/mês · sem cartão no trial · cancele quando quiser
          </p>
        </div>
      </main>
    </div>
  );
}
