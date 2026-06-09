# components/documents/

Componentes de apoio aos documentos imprimíveis (declarações, futuros recibos).

---

## PrintButton.tsx

**O que faz:** barra de ações de um documento imprimível — botão "Imprimir /
Salvar PDF" (`window.print()`) e um "Voltar" opcional. Some na impressão
(`print:hidden`), então só o documento sai no papel/PDF.

**Exporta:** `<PrintButton backHref? />` — client component.

**Usado por:** `app/documentos/declaracao/[id]/page.tsx`.
