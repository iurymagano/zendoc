'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import {
  caretAfterDigits,
  maskCep,
  maskCpf,
  maskCurrency,
  maskPhone,
  onlyDigits,
} from '@/lib/masks';

export type MaskKind = 'phone' | 'cpf' | 'cep' | 'currency';

const MASKS: Record<
  MaskKind,
  {
    format: (raw: string, prev: string) => string;
    inputMode: 'tel' | 'numeric';
    placeholder: string;
    autoComplete?: string;
  }
> = {
  phone: {
    format: (raw, prev) => maskPhone(raw, prev),
    inputMode: 'tel',
    placeholder: '(11) 99999-9999',
    autoComplete: 'tel-national',
  },
  cpf: { format: (raw) => maskCpf(raw), inputMode: 'numeric', placeholder: '000.000.000-00' },
  cep: {
    format: (raw) => maskCep(raw),
    inputMode: 'numeric',
    placeholder: '00000-000',
    autoComplete: 'postal-code',
  },
  currency: {
    format: (raw, prev) => maskCurrency(raw, prev),
    inputMode: 'numeric',
    placeholder: 'R$ 0,00',
  },
};

type MaskedInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'defaultValue'
> & {
  mask: MaskKind;
  /** Valor JÁ mascarado (o que aparece no campo). Use `maskPhone(valorDoBanco)` etc. para o inicial. */
  value: string;
  /** Recebe o valor mascarado a cada alteração. Limpe na hora de enviar (ver `lib/masks.ts`). */
  onChangeValue: (masked: string) => void;
};

/**
 * `Input` do shadcn com máscara enquanto digita (telefone, CPF, CEP, valor em R$).
 * Mantém o cursor no lugar ao editar/apagar no meio e apaga o dígito anterior
 * quando o Backspace cai num separador (`(`, `)`, `-`, `.`, espaço).
 */
export function MaskedInput({
  mask,
  value,
  onChangeValue,
  inputMode,
  placeholder,
  autoComplete,
  ...props
}: MaskedInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const pendingCaret = React.useRef<number | null>(null);
  const spec = MASKS[mask];

  function applyCaret() {
    const el = ref.current;
    const pos = pendingCaret.current;
    if (el && pos !== null && document.activeElement === el) {
      el.setSelectionRange(pos, pos);
    }
    pendingCaret.current = null;
  }

  // Roda a cada render: reposiciona o cursor depois que o React atualiza o valor.
  React.useLayoutEffect(applyCaret);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    let raw = el.value;
    const cursor = el.selectionStart ?? raw.length;
    const inputType = (e.nativeEvent as InputEvent).inputType ?? '';
    const isDelete = inputType.startsWith('delete');
    const isPaste = inputType === 'insertFromPaste' || inputType === 'insertFromDrop';

    let digitsBefore = onlyDigits(raw.slice(0, cursor)).length;

    // Backspace/Delete sobre um separador: a máscara reconstruiria o mesmo texto
    // e o cursor "travaria". Nesse caso, remove o dígito vizinho.
    if (isDelete && mask !== 'currency' && spec.format(raw, value) === value) {
      const digits = onlyDigits(raw);
      const at = inputType === 'deleteContentForward' ? digitsBefore : digitsBefore - 1;
      if (at >= 0 && at < digits.length) {
        raw = digits.slice(0, at) + digits.slice(at + 1);
        digitsBefore = at;
      }
    }

    const next = spec.format(raw, value);
    const pos =
      mask === 'currency' || isPaste || cursor >= el.value.length
        ? next.length
        : caretAfterDigits(next, digitsBefore);
    pendingCaret.current = pos;
    onChangeValue(next);
    // Se o valor não mudou, o React não re-renderiza: reposiciona por conta própria.
    requestAnimationFrame(applyCaret);
  }

  return (
    <Input
      ref={ref}
      type="text"
      value={value}
      onChange={handleChange}
      inputMode={inputMode ?? spec.inputMode}
      placeholder={placeholder ?? spec.placeholder}
      autoComplete={autoComplete ?? spec.autoComplete}
      {...props}
    />
  );
}
