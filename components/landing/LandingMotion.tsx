'use client';

import { useEffect } from 'react';

/**
 * Orquestra as animações da landing com animejs (v4). Não renderiza nada: procura no DOM
 * da raiz `[data-landing]` os marcadores:
 *   - `data-hero="word|sub|cta|label"`: entrada do hero ao montar;
 *   - `data-reveal` (e `data-delay` em ms): fade + translateY ao entrar na tela;
 *   - `data-tilt`: janela 3D do painel, que "levanta" ao entrar na tela;
 *   - `data-float`: card que sobe e desce em loop.
 *
 * O conteúdo é visível por padrão. O CSS só esconde os marcadores quando a raiz tem
 * `data-anim` (colocado pelo script inline, sem prefers-reduced-motion). Se o import do
 * animejs falhar ou demorar mais de 4s, `data-anim` sai e tudo aparece.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing]');
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      root.removeAttribute('data-anim');
      root.dataset.ready = '1';
      return;
    }

    let cancelled = false;
    const observers: IntersectionObserver[] = [];
    const running: Array<{ pause: () => unknown }> = [];

    import('animejs')
      .then(({ animate, stagger }) => {
        if (cancelled) return;
        root.dataset.ready = '1';
        // O failsafe do script inline já liberou o conteúdo: não anima por cima.
        if (!root.hasAttribute('data-anim')) return;

        const all = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const narrow = window.innerWidth < 768;

        // Hero: palavra por palavra, subtítulo borrado para nítido, botões subindo.
        const words = all('[data-hero="word"]');
        const labels = all('[data-hero="label"]');
        const sub = all('[data-hero="sub"]');
        const ctas = all('[data-hero="cta"]');
        animate(labels, { opacity: [0, 1], duration: 700, ease: 'outQuad' });
        animate(words, {
          opacity: [0, 1],
          translateY: ['0.55em', '0em'],
          duration: 900,
          delay: stagger(110, { start: 150 }),
          ease: 'outExpo',
        });
        animate(sub, {
          opacity: [0, 1],
          filter: ['blur(12px)', 'blur(0px)'],
          duration: 1000,
          delay: 650,
          ease: 'outQuad',
        });
        animate(ctas, {
          opacity: [0, 1],
          translateY: [28, 0],
          duration: 800,
          delay: stagger(120, { start: 950 }),
          ease: 'outExpo',
        });

        // Blocos que entram ao rolar (e a janela 3D).
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const el = entry.target as HTMLElement;
              io.unobserve(el);
              if (el.hasAttribute('data-tilt')) {
                animate(el, {
                  opacity: [0, 1],
                  rotateX: [narrow ? 22 : 38, narrow ? 6 : 12],
                  rotateY: [narrow ? -12 : -22, narrow ? -4 : -9],
                  translateY: [70, 0],
                  duration: 1500,
                  ease: 'outExpo',
                });
              } else {
                animate(el, {
                  opacity: [0, 1],
                  translateY: [28, 0],
                  duration: 800,
                  delay: Number(el.dataset.delay ?? 0),
                  ease: 'outCubic',
                });
              }
            }
          },
          { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
        );
        observers.push(io);
        all('[data-reveal], [data-tilt]').forEach((el) => io.observe(el));

        // Cards flutuando em loop (começam quando a janela já está no lugar).
        all('[data-float]').forEach((el, i) => {
          running.push(
            animate(el, {
              translateY: [i % 2 ? 8 : -8, i % 2 ? -8 : 8],
              duration: 2600 + i * 500,
              ease: 'inOutSine',
              alternate: true,
              loop: true,
            }),
          );
        });
      })
      .catch(() => {
        root.removeAttribute('data-anim');
      });

    return () => {
      cancelled = true;
      observers.forEach((o) => o.disconnect());
      running.forEach((a) => a.pause());
    };
  }, []);

  return null;
}
