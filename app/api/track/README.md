# app/api/track/

Contador anônimo de visitas às páginas públicas (alimenta o funil do painel `/admin`).

---

## visit/route.ts

**O que faz:** `POST /api/track/visit` soma 1 na visita do dia ao caminho informado (RPC `increment_site_visit`, service key).

**Payload:** `{ "path": "/" }`. Só aceita `/`, `/register`, `/login` e `/privacidade` (`lib/admin/visits.ts`); qualquer outro valor é descartado.

**Resposta:** sempre `204`. Robôs, prévias de link e user-agent vazio são ignorados; erros viram `console.error` e também `204` (nunca 500 para o visitante).

**Público de propósito (exceção à regra do `auth()`):** quem visita a landing, o login e o cadastro ainda não tem sessão. A rota só incrementa um contador por dia e caminho, de uma lista fixa; não grava IP, cookie nem identificador do visitante.

**Depende de:** `lib/admin/visits.ts`, `lib/supabase.ts`. Chamada por `components/landing/VisitBeacon.tsx`.
