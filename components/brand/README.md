# components/brand/

Elementos de marca IAzen reutilizados em landing, auth, onboarding e dashboard.

---

## Logo.tsx

**O que faz:** Logo oficial — ponto violeta (`--ia-accent2`) com halo de blur + texto "IAzen" em Space Grotesk.

**Exporta:**

- `<Logo size? href? className? />` — render do logo. `size` é `'sm' | 'md' | 'lg'` (default `md`), `href` default `'/'`, passe `null` para renderizar sem link.

**Depende de:** `next/link`, `@/lib/utils` (`cn`).

**Notas:** o halo por trás do ponto usa `blur-[6px]` com `opacity-50` para dar sensação premium sem pesar. Em backgrounds escuros, o acento violeta fica mais vibrante — usar `size="lg"` no hero e `size="md"` no navbar.
