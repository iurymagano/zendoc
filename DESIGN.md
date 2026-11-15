# DESIGN.md — IAzen, identidade v1

Fonte da verdade do visual. Quem mexer em tela lê aqui primeiro; decisão nova entra aqui.
Tokens vivem em `app/globals.css`, a geometria da marca em `components/brand/logo-geometry.ts`.

## Ideia

IAzen é a secretária de quem atende com hora marcada (barbeira, personal, psicólogo,
advogada, tatuador, professora particular, qualquer um) e agora também a assistente pessoal
de quem a usa: no WhatsApp ela agenda, confirma e lembra os clientes; no painel, o Assistente
pessoal organiza a agenda e os lembretes do próprio dono. A marca junta duas coisas:
um **Ensō** (o círculo zen, traço aberto) que vira **balão de conversa** (ponta embaixo à
esquerda), e uma **faísca** na abertura do círculo: a IA acordada e online. Toda a interface
repete essa história em pequeno: superfícies arredondadas com a ponta do balão, conversa de
WhatsApp como prova, a faísca (verde-água) só quando algo está vivo.

Tom de voz: calmo, direto, voz ativa, português do Brasil. Sem jargão de IA, sem promessa
inflada. O botão diz o que acontece. Vocabulário aberto a qualquer profissão: "cliente" e
"atendimento", nunca "paciente", "consultório" ou "consulta" no texto de interface; os
exemplos variam de profissão (barbearia, treino, terapia, jurídico) para ninguém se sentir
fora.

## Tipo de tela e decisão claro x escuro

| Tela | Tipo | Tema | Motivo |
| --- | --- | --- | --- |
| Landing | convencer | Void (escuro) do começo ao fim, cartões `#0B0C14` | pedido do Iury: modelo escuro com degradê; o produto brilha sobre o escuro |
| Login e cadastro | convencer, depois operar | lado esquerdo Void, formulário em card branco sobre Névoa | impacto de marca sem sacrificar a legibilidade do formulário |
| Dashboard e onboarding | operar | **claro (Névoa) com sidebar Void** | ver abaixo |

**Dashboard claro, sidebar escura.** O profissional usa o painel no próprio local de trabalho, com luz do
dia, entre um atendimento e outro, lendo nomes, horários e telefones por muitos minutos. Texto escuro em
fundo claro lê melhor e imprime melhor (declarações, agenda). A marca aparece na sidebar Void
(com o logo, o item ativo em Violeta e a faísca da IA online), no botão pílula violeta e nos
detalhes de dado (mono). Dashboard escuro inteiro foi descartado: cansa em uso longo e
disputa com a cor semântica (status do atendimento).

## Paleta

Nomes da marca primeiro, depois os derivados. Contraste conferido por script WCAG.

| Token | Hex | Papel |
| --- | --- | --- |
| Void `--ia-void` | `#05060A` | fundo escuro, tinta do texto claro, sidebar |
| Violeta Zen `--ia-violet` | `#8B5CFF` | a marca; destaque sobre escuro, faixa de preço, anel de foco |
| Faísca `--ia-spark` | `#5EEAD4` | a IA online, sucesso sobre escuro. Pouco: 1 ponto por tela |
| Névoa `--ia-mist` | `#F4F3F8` | fundo claro, texto sobre escuro |
| Violeta Ação `--ia-violet-action` | `#7A47F5` | **fundo de botão** com texto branco (AA, 5.2:1); `--primary` |
| Violeta Tinta `--ia-violet-ink` | `#5B35D5` | link e texto de destaque sobre claro (AA) |
| Void 1, 2, 3 | `#0B0D14`, `#12151F`, `#1C2030` | degraus do escuro: página, card, balão/campo |
| On Void muted | `#A3A7BA` | texto secundário sobre escuro (AA) |
| Texto claro | `#0E0F18` | corpo no tema claro |
| Texto secundário claro | `#5A5D72` | AA sobre Névoa e branco |

Estados (tema claro / escuro):

- Sucesso: `#0F766E` sobre `#D9F4EE` / `#5EEAD4` sobre `#0F2F2C`
- Erro: `#C62F3A` sobre `#FBE3E4` / `#FF7A82` sobre `#3A1519`
- Atenção: `#8A5A00` sobre `#FDF0D0` / `#F5B945` sobre `#33260A`
- Campo: borda `#CFCCE0` (claro) e `#565C7C` (escuro); foco com anel Violeta Zen

Regras de cor: um fundo, uma tinta, um destaque. Violeta na ação principal e em no máximo
mais uma coisa por tela. Faísca nunca como fundo de botão. Sem cor fora desta tabela.
**Degradê só no símbolo do logo** (violeta, azul e turquesa); em mais nenhum lugar.

## Tipografia

| Papel | Fonte | Peso | Notas |
| --- | --- | --- | --- |
| Display e títulos (`h1` a `h6`) | Sora (`--font-sora`, `font-display`) | 700 | tracking -0.03em a -0.05em, entrelinha 0.96 a 1.1 |
| Corpo, interface | Inter (`--font-inter`) | 400/500/600 | entrelinha 1.6, 16 a 20px, texto na cor cheia |
| Dado | JetBrains Mono (`--font-jetbrains`, `font-mono`) | 400/500 | **só dado**: horário, data, valor. Nunca rótulo decorativo |

Escala visível (no máximo 5): 14 (apoio), 16/18 (corpo), 30 (título de card/página interna),
48 a 56 (título de seção), 72 a 84 (hero). Títulos com no máximo 2 linhas em qualquer largura.
Dado numérico usa `.tabular` (alinha em coluna).

## Espaço e forma

- Margem externa 20px (mobile) e 32px (≥ sm); largura máxima da landing 1200px.
- Espaço entre seções 80 a 112px; dentro delas, no máximo 48px.
- Raios aninhados: botão e etiqueta **pílula** (9999); campo 12; card pequeno 16; janela e card
  grande 24; o filho nunca maior que o pai.
- Superfície separa por degrau de tom (Void 1 para 2 para 3), não por linha nem sombra. Sombra
  só em quem flutua (menu, diálogo).
- A ponta do balão (canto inferior esquerdo com raio 4 a 6px) aparece nos balões de conversa e
  na janela do chat, ecoando o logo.

## Logo

`components/brand/Logo.tsx` (`Logo`, `LogoMark`), `public/logo*.svg`, `app/icon.svg`.

- Símbolo: traço de Ensō que vira balão, gradiente `#8B5CFF`, `#79A6EE`, `#7CDDE0` (violeta, azul, turquesa) mais faísca `#5EEAD4` (raio 9 no viewBox 100).
- Wordmark: "IA" Sora 700, "zen" Sora leve, convertido em curvas (não depende de fonte carregada);
  herda `currentColor`: branco sobre Void, Void sobre Névoa.
- Variante `mono` (tudo em `currentColor`): sobre violeta e no símbolo gigante decorativo.
- Área livre: metade da altura do símbolo em volta. Tamanho mínimo: 22px de altura (lockup).
- Não esticar, não girar, não aplicar gradiente no wordmark, não pôr sobre foto.
- Arquivos: `logo.svg` (para fundo claro), `logo-negativo.svg` (sobre escuro), `logo-branco.svg`
  (monocromático), `logo-mark.svg`.

## Componentes (shadcn como base)

- **Botão**: pílula, chapado, uma cor. Primário Violeta Ação com texto branco; `outline` para a
  segunda ação; `ghost` na navegação. Altura 40 (padrão) e 48 (`lg`, a ação principal da tela).
- **Campo** (`Input`, `Select`, `Textarea`): altura 44, raio 12, borda de campo visível, foco com anel
  violeta. Rótulo sempre visível acima, nunca só placeholder.
- **Card**: raio 24 (`rounded-2xl` a `3xl`), branco no tema claro, sem sombra e sem borda dupla.
- **Switch**: 44x24, estado ligado em Violeta Ação.
- **Balão** (`components/landing/Bubble.tsx`): cliente em Void 3 (ponta embaixo à esquerda),
  secretária em violeta (ponta embaixo à direita), horário em mono pequeno dentro do balão.
- **Foco e toque**: alvo mínimo 44px no celular, foco sempre visível, `prefers-reduced-motion`
  respeitado.

## A ideia de cada tela

**Landing (convencer), redesenhada em 14/11/2026.** "A secretária que nunca dorme." Modelo escuro
(export Fountible) refeito na nossa stack. **Exceção deliberada às regras de degradê e brilho, a pedido do Iury, valendo só
na landing**: texto em degradê (95deg `#A78BFF` > `#7FD8F0` > `#5EEAD4`, contínuo entre palavras), brilho radial sutil no hero,
cartões `#0B0C14` com borda `#ffffff12` e cantos de 32px, rótulos mono em caixa-alta ("// 01 — O produto"). O painel
(claro) e o auth seguem as regras sem degradê. Cada seção é uma afirmação com a prova ao lado:

1. Hero: promessa e dois botões, "Testar grátis por 7 dias" e "Ver em ação".
2. 01 O produto: painel em 3D com conversa e agenda (exemplo ilustrativo), dois cartões flutuantes.
3. Faixa de números reais do produto: 24/7, lembretes 24h+2h, 7 dias, R$0.
4. Demo ao vivo: quatro passos (tempos de exemplo) e um celular com a conversa.
5. 02 Treinamento, 03 Recursos (3 cartões), 04 Painel (números de exemplo, avisado na página), 05 Antes e depois.
6. 06 Preço: "IAzen Pro" R$297/mês, 7 dias grátis, sem cartão.
7. 07 FAQ (shadcn Accordion) e rodapé com CTA e o link "Privacidade".

Movimento: animejs v4 em `LandingMotion` (H1 palavra a palavra, subtítulo de borrado a nítido, painel 3D entrando no scroll,
cartões flutuando em loop, revelações por IntersectionObserver). Só `transform` e `opacity`; sem `prefers-reduced-motion` e com JS.
Sem JS tudo aparece. Sem Three.js (fundo leve em CSS).

Decisões de verdade do produto: sem depoimento nem logo de cliente; sem "v2.0"; sem "Hospedado no Brasil" (servidor
do WhatsApp nos EUA); tom é "Amigável ↔ Formal"; FAQ com os caminhos reais da interface; nenhum link para Termos/Contato
(não existem); rodapé sem o "IAzen" gigante.

**Login e cadastro.** Lado esquerdo Void com o símbolo gigante cortado pela borda, a promessa
e uma conversa curta; à direita só o formulário. Sem depoimento falso, sem promessa numérica
que não dá para provar.

**Dashboard (operar, fase 2).** Clareza e padrões conhecidos; a marca nos detalhes precisos.
Regras para a fase 2:

- **Sidebar**: Void (`--sidebar`), logo em cima, item ativo com fundo Void 3 e barra Violeta Zen,
  rodapé com o nome do profissional e a faísca quando a IA está ativa. Sem degradê no avatar:
  iniciais em Violeta Ação.
- **PageHeader**: título em Sora 700 (30 a 36px), descrição em uma linha, ações à direita
  (pílulas). Sem eyebrow e sem barra decorativa em degradê.
- **Cartões de métrica**: card branco raio 16/24, número grande em Sora tabular, rótulo em Inter
  14px na cor secundária, variação em uma linha. No máximo 4 por linha, nunca ícone decorativo.
- **Tabelas e listas**: cabeçalho em Inter 13 a 14px semibold (não caixa-alta), linhas separadas por
  degrau de tom ou linha de 1px `--border`, hover em `--muted`, horário e data em mono.
- **Agenda**: horários e datas em mono tabular; atendimento confirmado em Violeta Ação, pendente em
  atenção (âmbar), cancelada riscada em cinza; hoje marcado por pílula violeta no cabeçalho do dia;
  "agora" com a faísca. Cor nunca é a única pista: sempre texto de status.
- **Estado vazio**: uma frase que convida a agir e o botão da ação ("Cadastre o primeiro
  cliente"), sem ilustração genérica; o símbolo da marca em Void 3, grande, é o único ornamento.
- **Formulários**: um campo por linha no celular, rótulo acima, erro abaixo do campo explicando como
  resolver, botão com o verbo ("Salvar alterações").
- **Onboarding**: fundo Névoa liso (sem halo radial), progresso em barra sólida violeta.

## Movimento

Um momento orquestrado. Na landing, a entrada do hero e do painel 3D (animejs); no auth, o balão a balão (`ia-rise`,
520ms) e a faísca respira (`ia-spark`). Só `transform` e `opacity`. Quem pede menos movimento
vê tudo já no lugar. Interações respondem a uma ação (abrir, confirmar), nada solto.

## Referências

Pesquisa feita em 14/11/2026. As páginas do Figma Community não renderizam pelo fetch (só o
título e a descrição chegam), então os princípios saíram da descrição de cada kit e do que o
nosso produto pede, não de capturas.

Usadas:

- **Mindful AI** (dashboard de bem-estar mais landing escura, Figma Community):
  https://www.figma.com/community/file/1606053826290350597 — landing escura com produto como
  protagonista e dashboard calmo. Levamos: o clima calmo, sem pressa.
- **AiDEA, Smart SaaS Dashboard UI Kit** (calendário de reservas, chat, perfil):
  https://www.figma.com/community/file/1532723729743223601 — fluxo de reserva e calendário no
  mesmo sistema. Levamos: a agenda como peça central e a conversa ao lado.
- **Services Booking UI Kit** (fluxo de agendar no celular):
  https://www.figma.com/community/file/1601668213120404343 — agendar em poucos toques no celular
  vem primeiro. Levamos: horários como botões grandes de toque.
- **Cal.com** (https://cal.com): agendamento direto, tipografia grande, a ação principal sempre
  à mão, prova por números reais. Levamos: a hierarquia de uma ação, sem enfeite.
- **Stripe e Vercel** (a base que o projeto já citava): superfícies em degraus, tipografia como
  protagonista, sem sombra pesada.

Descartadas:

- **MagicDraft e kits escuros com 3D e brilho** (Craftwork): o brilho, o 3D e o degradê neon
  denunciam tela genérica de IA e disputam com o logo, que já tem o degradê.
- **Dashboards escuros inteiros** (kits "AI SaaS Dashboard UI-Dark"): cansam em uso longo e
  prejudicam leitura de agenda e impressão de declaração.
- **Fileira de cards com ícone, etiqueta mono em caixa-alta, depoimento genérico**: o padrão
  de landing que já tínhamos; trocado por prova real; a landing agora usa cartões de produto, e a seção do Assistente pessoal, a semana e o seletor de tom saíram da página.

## O que ainda está provisório

- Conversas do mock, da demo e dos recursos são exemplos (Mariana, Diego, Camila e Rafael, horários fictícios); os números do painel (196, 94%) também. Trocar por conversas reais autorizadas quando houver beta testers.
- Fase 2 aplicada: painel, agenda, clientes, conversas, configurações, onboarding, privacidade e declaração.
  Telas ainda sem print logado: `/clientes/[id]`, `/documentos/declaracao/[id]` (conferir no papel).

### Decisão da fase 2: o momento do Assistente

`/assistente` é o único painel escuro dentro do painel claro: um bloco Void com o logo, a faísca
"online" pulsando e, ao pensar, três pontos de faísca. É o ponto de personalidade do produto; o resto
do painel segue claro e calmo (degraus de tom em vez de bordas e sombras).
