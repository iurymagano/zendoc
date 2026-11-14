# infra/evolution/

Stack Docker da **Evolution API** (provider de WhatsApp do IAzen), com Postgres,
Redis e, em produção, o Caddy (HTTPS). Sobe o servidor que o app consome via `lib/zapi/client.ts`.

---

## docker-compose.yml

**O que faz:** orquestra três serviços:

- `evolution-api` — a API (imagem `evoapicloud/evolution-api:v2.3.7`; a 2.4.x
  exige licença paga). Expõe a porta
  `8080`. Cria/gerencia instâncias de WhatsApp via API.
- `postgres` — persistência das instâncias/mensagens (volume `evolution_postgres`).
- `redis` — cache (volume `evolution_redis`).

**Volumes:** `evolution_instances`, `evolution_postgres`, `evolution_redis`
(persistem entre `up`/`down`; pareamento do WhatsApp sobrevive a restart).

**Notas:**

- A tag da imagem está pinada em `v2.3.7` (última free com o LID corrigido).
  Tags em [Docker Hub](https://hub.docker.com/r/evoapicloud/evolution-api/tags).
- O webhook **não** é configurado aqui; o app registra a URL por instância no
  `POST /instance/create` (ver `lib/zapi/client.ts`).

## docker-compose.prod.yml

**O que faz:** em produção, soma o serviço `caddy` (portas 80/443) na frente da
Evolution, com certificado Let's Encrypt automático. Usar junto com o
`docker-compose.yml` (ver "Produção" abaixo).

## Caddyfile

**O que faz:** config do Caddy: `{$DOMAIN}` → `evolution-api:8080` com gzip.

## .env (não versionado)

**O que faz:** variáveis lidas pelo compose (o `.gitignore` ignora `.env*`).

- `EVOLUTION_PORT` — porta local (default 8080).
- `SERVER_URL` — URL pública da Evolution (túnel em dev, domínio em prod).
- `AUTHENTICATION_API_KEY` — chave global; **é o `EVOLUTION_API_KEY`** do
  `.env.local` do app.
- `POSTGRES_PASSWORD` — senha interna do Postgres.
- `WA_VERSION` — versão do WhatsApp Web (ver "QR Code não gera").
- `DOMAIN` — só em produção: domínio público usado pelo Caddy.

---

## Subindo o servidor

```bash
cd infra/evolution
# crie o .env com as variáveis acima; AUTHENTICATION_API_KEY (openssl rand -hex 32) e POSTGRES_PASSWORD
docker compose up -d
docker compose logs -f evolution-api   # acompanhar boot
```

Verifique: `curl http://localhost:8080` deve responder um JSON da Evolution.

## Produção (VM grátis do Google Cloud)

O beta roda numa VM **e2-micro** do Google Cloud (Always Free: us-central1,
disco padrão de 30 GB), Debian, com Docker. Passos usados:

1. Swap de 2 GB (`/swapfile`): a VM tem 1 GB de RAM e a Evolution sozinha usa
   ~300 MB; sem swap o boot do Prisma pode estourar a memória.
2. Docker: `curl -fsSL https://get.docker.com | sudo sh`.
3. Copiar `docker-compose.yml`, `docker-compose.prod.yml` e `Caddyfile` para
   `~/evolution` e criar o `.env` com `EVOLUTION_PORT=127.0.0.1:8080`,
   `SERVER_URL=https://<DOMAIN>`, `DOMAIN=<ip-com-traços>.sslip.io` e as chaves
   geradas com `openssl rand -hex 32`.
4. `sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
   (ou ponha `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` no `.env`
   e use só `docker compose up -d`, como na VM).
5. Conferir: `curl https://<DOMAIN>/` responde o JSON de boas-vindas; sem o
   header `apikey`, `/instance/fetchInstances` dá 401.

O firewall da VM só abre 22, 80 e 443 (tags `http-server`/`https-server`).
O IP externo é efêmero: se a VM for parada e religada ele muda, e é preciso
trocar o `DOMAIN`/`SERVER_URL` do `.env` e o `EVOLUTION_API_URL` na Vercel
(ou reservar um IP estático; confira o preço antes, IPv4 pode ser cobrado).

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
