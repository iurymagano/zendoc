# components/landing/

Peças visuais da landing (`app/page.tsx`) e o balão usado no lado de marca das telas de auth.

A landing é escura (Void `#05060A`), com cartões `#0B0C14`, borda `#ffffff12` e cantos de 32px. Cada seção é um
componente server; só `LandingMotion` e `Faq` rodam no cliente.

---

## Bubble.tsx

**O que faz:** balão de conversa de WhatsApp. `side="in"` é o cliente (ponta embaixo à esquerda,
como o logo); `side="out"` é a secretária (violeta, ponta embaixo à direita).

**Exporta:** `Bubble({ side, time?, children, className?, style? })`

**Notas:** use dentro de um contêiner `.dark`. Usado pelo layout de auth, pela demo e pelo mock.

## primitives.tsx

**O que faz:** blocos de layout compartilhados pela landing.

**Exporta:** `WRAP` (largura e margem), `WHITE_BTN` (botão branco), `SectionLabel` (rótulo mono "// 01 — O produto"),
`Panel` (cartão 32px), `Grad` (texto em degradê), `H2` (título de seção), `ArrowCircle` (seta em círculo).

## LandingMotion.tsx

**O que faz:** cliente que não renderiza nada; carrega o `animejs` (v4) e anima a entrada do hero, os `data-reveal`
(IntersectionObserver), o `data-tilt` do mock e os `data-float` em loop.

**Notas:** a página marca `data-anim` na raiz por um script inline (exceto com `prefers-reduced-motion`); o CSS só esconde
elementos sob `[data-anim]`. `LandingMotion` põe `data-ready`; sem ele em 4s, `data-anim` sai e tudo aparece. Sem JS, tudo visível.

## LandingHeader.tsx / Hero.tsx / ProductMock.tsx / Stats.tsx

Cabeçalho em pílula flutuante (Produto, Recursos, Como funciona, Preço, Entrar, Começar grátis); hero ("A secretária que nunca
dorme.", palavra a palavra, pontos de fundo em CSS); painel em 3D com dois cartões flutuantes; faixa de quatro números
(24/7, 24h+2h, 7 dias, R$0).

## LiveDemo.tsx / Training.tsx / Features.tsx

Demo ao vivo (quatro passos com tempos de exemplo e um celular com a conversa); treinamento ("Treinar minha IA", como a tela
real); três recursos (agenda 24/7, lembretes 24h e 2h, tom amigável ou formal).

## DashboardSection.tsx / BeforeAfter.tsx / Pricing.tsx / Faq.tsx / LandingFooter.tsx

Painel com números de **exemplo** (declarado na página); antes e depois; cartão "IAzen Pro" R$297/mês com 7 dias grátis;
perguntas frequentes (shadcn `Accordion`, caminhos reais da interface); rodapé com CTA e o único link, "Privacidade".

**Notas gerais:** nenhum depoimento nem logo de cliente; números do painel e tempos da demo são ilustração; nada de
"hospedado no Brasil" (o servidor do WhatsApp fica fora).
