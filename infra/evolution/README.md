# infra/evolution/

Stack Docker da **Evolution API** (provider de WhatsApp do IAzen), com Postgres
e Redis. Sobe o servidor que o app consome via `lib/zapi/client.ts`.

---

## docker-compose.yml

**O que faz:** orquestra três serviços:

- `evolution-api` — a API (imagem `atendai/evolution-api`, v2). Expõe a porta
  `8080`. Cria/gerencia instâncias de WhatsApp via API.
- `postgres` — persistência das instâncias/mensagens (volume `evolution_postgres`).
- `redis` — cache (volume `evolution_redis`).

**Volumes:** `evolution_instances`, `evolution_postgres`, `evolution_redis`
(persistem entre `up`/`down`; pareamento do WhatsApp sobrevive a restart).

**Notas:**

- A tag da imagem está pinada — confira a última v2 em
  [Docker Hub](https://hub.docker.com/r/atendai/evolution-api/tags) e atualize.
- O webhook **não** é configurado aqui; o app registra a URL por instância no
  `POST /instance/create` (ver `lib/zapi/client.ts`).

## .env.example

**O que faz:** modelo das variáveis lidas pelo compose. Copie para `.env`.

- `EVOLUTION_PORT` — porta local (default 8080).
- `SERVER_URL` — URL pública da Evolution (túnel em dev, domínio em prod).
- `AUTHENTICATION_API_KEY` — chave global; **é o `EVOLUTION_API_KEY`** do
  `.env.local` do app.
- `POSTGRES_PASSWORD` — senha interna do Postgres.

---

## Subindo o servidor

```bash
cd infra/evolution
cp .env.example .env
# preencha AUTHENTICATION_API_KEY (openssl rand -hex 32) e POSTGRES_PASSWORD
docker compose up -d
docker compose logs -f evolution-api   # acompanhar boot
```

Verifique: `curl http://localhost:8080` deve responder um JSON da Evolution.

## Ligando ao app IAzen (`.env.local`)

```env
EVOLUTION_API_URL=http://localhost:8080          # ou a URL do túnel/domínio
EVOLUTION_API_KEY=<mesmo AUTHENTICATION_API_KEY>
WEBHOOK_SECRET=<openssl rand -hex 16>
NEXT_PUBLIC_URL=https://<sua-url-publica>         # a Evolution precisa alcançar o webhook
```

> **Dev local:** a Evolution (em container) precisa **alcançar o webhook do
> Next**. Rode o app (`npm run dev`), abra o túnel com **`npm run tunnel`** (na
> raiz do projeto — baixa o cloudflared on-demand via `untun`, sem instalar
> nada) e use a URL pública impressa em `NEXT_PUBLIC_URL`. Sem isso, a Evolution
> recebe mensagens mas não consegue entregar ao app.

## QR Code não gera (loop de reconexão)

Sintoma: ao conectar, o QR nunca aparece; nos logs a instância reinicia o canal
a cada poucos segundos (`Browser: …` repetido) e `instance/connect` retorna
`{ "count": 0 }`.

Causa: a **versão do WhatsApp Web** anunciada pelo Baileys ficou desatualizada e
o WhatsApp recusa o handshake antes de emitir o QR.

Correção: a env `CONFIG_SESSION_PHONE_VERSION` no compose fixa a versão. Quando
voltar a falhar, atualize o valor com a versão atual de
[baileys-version.json](https://github.com/WhiskeySockets/Baileys/blob/master/src/Defaults/baileys-version.json)
(ou exporte `WA_VERSION=2.3000.xxxxxxxxx` antes do `docker compose up -d`) e
recrie o container. Instâncias travadas precisam ser deletadas e recriadas
(`DELETE /instance/delete/{name}` → conectar de novo).

## Deploy gerenciado

O mesmo compose roda em Railway, Render, VPS, etc. Em produção, defina
`SERVER_URL` com o domínio público e exponha só a porta da `evolution-api` (o
Postgres/Redis ficam internos).
