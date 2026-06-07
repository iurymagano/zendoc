-- Migration: adiciona CPF ao cadastro de pacientes.
-- Rodar no SQL Editor do Supabase em bancos já provisionados.
-- (Em projeto novo, schema.sql já contém estas alterações.)

alter table patients add column if not exists cpf text;

create unique index if not exists patients_professional_cpf_idx
  on patients(professional_id, cpf)
  where cpf is not null;
