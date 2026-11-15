'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import {
  buildAddress,
  EMPTY_ADDRESS,
  lookupCep,
  parseAddress,
  type AddressParts,
} from '@/lib/address';
import { onlyDigits } from '@/lib/masks';

type Status = 'idle' | 'loading' | 'found' | 'invalid' | 'not_found' | 'network';

const MESSAGES: Record<'invalid' | 'not_found' | 'network', string> = {
  invalid: 'CEP inválido. Confira os 8 números ou preencha o endereço abaixo.',
  not_found: 'CEP não encontrado. Confira os números ou preencha o endereço abaixo.',
  network: 'Não deu para buscar o CEP agora. Preencha o endereço abaixo.',
};

interface AddressFieldsProps {
  /** Texto salvo em `professionals.address`, se houver (reabrir um endereço). */
  initialValue?: string | null;
  /** Recebe o texto único (`''` se tudo vazio) a cada alteração. */
  onChange: (address: string) => void;
}

/**
 * Endereço de atendimento: CEP com máscara + busca no ViaCEP que preenche rua,
 * bairro, cidade e UF; número e complemento o usuário completa. Todos os campos
 * seguem editáveis (dá para preencher sem CEP). O valor emitido é o texto único
 * de `buildAddress`. Um endereço salvo que não dá para separar com segurança
 * abre num campo de texto livre, sem perder nada.
 */
export function AddressFields({ initialValue, onChange }: AddressFieldsProps) {
  const [legacyText, setLegacyText] = useState<string | null>(() => {
    const text = initialValue?.trim();
    return text && !parseAddress(text) ? text : null;
  });
  const [parts, setParts] = useState<AddressParts>(
    () => (initialValue && parseAddress(initialValue)) || EMPTY_ADDRESS,
  );
  const [status, setStatus] = useState<Status>('idle');
  const partsRef = useRef(parts);
  const abortRef = useRef<AbortController | null>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<AddressParts>) {
    const next = { ...partsRef.current, ...patch };
    partsRef.current = next;
    setParts(next);
    onChange(buildAddress(next));
  }

  async function onCepChange(masked: string) {
    update({ cep: masked });
    abortRef.current?.abort();
    if (onlyDigits(masked).length !== 8) {
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    const result = await lookupCep(masked, { signal: controller.signal });
    if (controller.signal.aborted) return; // o usuário mudou o CEP: descarta
    if (!result.ok) {
      setStatus(result.reason);
      return;
    }
    update({
      street: result.street,
      neighborhood: result.neighborhood,
      city: result.city,
      state: result.state,
    });
    setStatus('found');
    numberRef.current?.focus();
  }

  if (legacyText !== null) {
    return (
      <div className="flex flex-col gap-2">
        <FormField label="Endereço de atendimento (opcional)" htmlFor="address">
          <Input
            id="address"
            name="address"
            value={legacyText}
            onChange={(e) => {
              setLegacyText(e.target.value);
              onChange(e.target.value.trim());
            }}
            placeholder="Rua, número, bairro, cidade"
          />
        </FormField>
        <Button
          type="button"
          variant="link"
          className="self-start px-0"
          onClick={() => {
            // Leva o texto atual para o campo de rua: nada se perde.
            const text = legacyText;
            setLegacyText(null);
            update({ ...EMPTY_ADDRESS, street: text });
          }}
        >
          Preencher por CEP
        </Button>
      </div>
    );
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-sm font-medium leading-none">
        Endereço de atendimento (opcional)
      </legend>

      <FormField label="CEP" htmlFor="cep">
        <div className="relative">
          <MaskedInput
            mask="cep"
            id="cep"
            name="cep"
            value={parts.cep}
            onChangeValue={onCepChange}
            aria-invalid={status === 'invalid' || status === 'not_found' ? true : undefined}
            aria-describedby="cep-status"
          />
          {status === 'loading' && (
            <Loader2
              aria-hidden
              className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </div>
        <p id="cep-status" role="status" className="min-h-4 text-xs">
          {status === 'loading' && (
            <span className="text-muted-foreground">Buscando endereço…</span>
          )}
          {status === 'found' && (
            <span className="text-muted-foreground">
              Endereço encontrado. Complete o número e o complemento.
            </span>
          )}
          {(status === 'invalid' || status === 'not_found' || status === 'network') && (
            <span className="text-destructive">{MESSAGES[status]}</span>
          )}
          {status === 'idle' && (
            <span className="text-muted-foreground">
              Digite o CEP para preencher o resto, ou preencha à mão.
            </span>
          )}
        </p>
      </FormField>

      <FormField label="Rua" htmlFor="street">
        <Input
          id="street"
          name="street"
          autoComplete="address-line1"
          value={parts.street}
          onChange={(e) => update({ street: e.target.value })}
          placeholder="Ex.: Avenida Paulista"
        />
      </FormField>

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField label="Número" htmlFor="street_number">
          <Input
            ref={numberRef}
            id="street_number"
            name="street_number"
            value={parts.number}
            onChange={(e) => update({ number: e.target.value })}
            placeholder="1000"
          />
        </FormField>
        <FormField label="Complemento" htmlFor="complement">
          <Input
            id="complement"
            name="complement"
            autoComplete="address-line2"
            value={parts.complement}
            onChange={(e) => update({ complement: e.target.value })}
            placeholder="Sala 12"
          />
        </FormField>
      </div>

      <FormField label="Bairro" htmlFor="neighborhood">
        <Input
          id="neighborhood"
          name="neighborhood"
          value={parts.neighborhood}
          onChange={(e) => update({ neighborhood: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-[3fr_1fr] gap-3">
        <FormField label="Cidade" htmlFor="city">
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={parts.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </FormField>
        <FormField label="UF" htmlFor="state">
          <Input
            id="state"
            name="state"
            autoComplete="address-level1"
            maxLength={2}
            value={parts.state}
            onChange={(e) =>
              update({ state: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })
            }
            placeholder="SP"
          />
        </FormField>
      </div>
    </fieldset>
  );
}
