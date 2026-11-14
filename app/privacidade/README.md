# app/privacidade/

Política de privacidade pública (LGPD), linkada no rodapé da landing.

---

## page.tsx

**O que faz:** renderiza a política (server component, sem login).

**Depende de:** `lib/legal.ts` (dados legais por env), `components/brand/Logo.tsx`.

**Notas:** nada provisório vai ao ar. Responsável, documento e e-mail de contato
vêm de `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTROLLER_DOC` e `PRIVACY_CONTACT_EMAIL`;
sem eles a linha some e os pedidos de titular apontam para o profissional
(controlador). `lib/legal.test.ts` falha se alguma página tiver campo entre colchetes.
