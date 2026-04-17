import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-zinc-200 bg-white">
        <div className="text-xl font-semibold text-emerald-700">Zendoc</div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="h-10 inline-flex items-center px-4 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="h-10 inline-flex items-center px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Começar grátis
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center py-20">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900">
            Sua secretária virtual no WhatsApp
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Agenda, confirma e gerencia consultas automaticamente — 24h por dia,
            direto no WhatsApp dos seus pacientes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="h-12 inline-flex items-center px-6 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Testar grátis por 7 dias
            </Link>
            <Link
              href="/login"
              className="h-12 inline-flex items-center px-6 rounded-lg text-sm font-medium border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            R$197/mês · sem cartão no trial · cancele quando quiser
          </p>
        </div>
      </main>
    </div>
  );
}
