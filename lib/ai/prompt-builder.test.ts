// O prompt da secretária não pode presumir ramo de saúde: o IAzen atende
// qualquer profissional ou negócio com hora marcada.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Professional } from '../../types/database';
import { buildSystemPrompt } from './prompt-builder';

function profile(over: Partial<Professional> = {}): Professional {
  return {
    id: 'p1',
    name: 'Ana Souza',
    specialty: 'Professora de violão',
    address: 'Rua das Flores, 10',
    tone: 'amigável',
    custom_instructions: null,
    ...over,
  } as Professional;
}

describe('buildSystemPrompt (público amplo)', () => {
  const prompt = buildSystemPrompt(profile(), []);

  it('usa o nome e a área informados', () => {
    assert.match(prompt, /secretária virtual de Ana Souza, Professora de violão/);
  });

  it('não usa vocabulário de saúde nem de consultório', () => {
    // As chaves técnicas do JSON (message_to_patient, patient_name) ficam.
    const visible = prompt.replace(/message_to_patient|patient_name/g, '');
    assert.doesNotMatch(visible, /pacient|consult[aeo]|consultório|clínic/i);
  });

  it('fala em cliente e atendimento', () => {
    assert.match(prompt, /cliente/);
    assert.match(prompt, /atendimento/);
  });

  it('funciona sem área informada', () => {
    const p = buildSystemPrompt(profile({ specialty: null }), []);
    assert.match(p, /secretária virtual de Ana Souza\./);
  });
});

describe('buildSystemPrompt (fuso do servidor)', () => {
  it('lista horários em São Paulo (-03:00) mesmo com o servidor em UTC', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'UTC';
      const slot = {
        start: new Date('2026-11-16T11:00:00Z'), // 08:00 em São Paulo
        end: new Date('2026-11-16T12:00:00Z'),
      };
      const p = buildSystemPrompt(
        profile(),
        [slot],
        null,
        undefined,
        new Date('2026-11-15T01:30:00Z'), // ainda sábado 14/11 em São Paulo
      );
      assert.match(
        p,
        /segunda-feira, 16 de novembro de 2026 às 08:00 \(starts_at=2026-11-16T08:00:00-03:00 ends_at=2026-11-16T09:00:00-03:00\)/,
      );
      assert.match(p, /Hoje é sábado, 14 de novembro de 2026\./);
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});
