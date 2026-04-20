# Agents

Este arquivo lista os agentes e convenções de trabalho automatizado no projeto IAzen.

Por ora, o único agente ativo é o **Claude Code**, que opera seguindo integralmente as
regras descritas em `CLAUDE.md` — especialmente:

- Stack e schema do banco obrigatórios
- Regra do `README.md` em toda pasta (não opcional)
- Convenções de código (TypeScript strict, NextResponse.json, service key apenas server-side)
- Nunca expor `SUPABASE_SERVICE_KEY` no frontend

Quando novos agentes forem adicionados (ex.: review bots, deploy bots, cron jobs
Vercel), documente aqui o escopo, o gatilho e o endpoint de cada um.
