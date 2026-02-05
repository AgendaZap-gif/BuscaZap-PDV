# Serviço de Agendamento (Secretária)

Sistema completo de agendamento para clínicas, hospitais e comércios com gestão de horários, planos de saúde, vagas por período e confirmação via SaleBot (WhatsApp).

## Funcionalidades

- **Calendário**: visualização mensal, agendamentos com cores por plano de saúde.
- **Contato em balão**: ao passar o mouse sobre um agendamento, exibe nome, telefone, e-mail e botão "Enviar confirmação".
- **Cadastro de pacientes**: nome, telefone, e-mail, documento, data de nascimento, plano, endereço, observações.
- **Planos de saúde**: cadastro com nome, slug, cor no calendário e duração padrão da consulta (minutos).
- **Vagas por plano**: limite de agendamentos por semana ou por mês por plano (ex.: Unimed 1/semana, particular ilimitado).
- **Disponibilidade**: dias da semana e horários (início/fim) em que há vagas; duração do slot (minutos).
- **Confirmação automática**: envio da mensagem de confirmação via SaleBot; o paciente responde no WhatsApp e o status é atualizado na agenda (webhook).
- **Atualização da página**: a lista de agendamentos é refetchada a cada 30 segundos; ao receber o webhook do SaleBot, o próximo refetch já mostra o status atualizado.

## Variáveis de ambiente

- `SALEBOT_API_URL`: URL base do SaleBot (ex.: `https://seu-salebot.com`). Usado para enviar a mensagem de confirmação ao paciente.
- `AGENDA_WEBHOOK_SECRET`: (opcional) Segredo compartilhado para validar o callback do SaleBot.

## Migração

Rodar a migration da agenda:

```bash
# Aplicar migration manualmente ou via drizzle
mysql ... < drizzle/migrations/0013_agenda_secretaria.sql
```

## Integração SaleBot (salebot-laravel-330)

1. **Envio**: O PDV chama `POST {SALEBOT_API_URL}/api/buscazap/send-confirmation` com:
   - `patient_phone`, `message`, `appointment_id`, `callback_url`, `callback_secret` (opcional).

2. **Callback**: O SaleBot chama `POST {BASE_URL}/api/agenda/confirmation-webhook` com:
   - `appointment_id`, `status` (confirmed|cancelled), `patient_reply`, `secret` (se configurado).

3. O PDV atualiza o status do agendamento e na próxima atualização da tela (até 30s) a secretária vê a confirmação.

## Fluxo no aplicativo BuscaZap (cliente)

Para o cliente agendar pelo app:

1. Verificar se é **plano de saúde** ou **particular** (e qual plano).
2. Chamar `agenda.getAvailableSlots` com `companyId`, `date`, `healthPlanId` (ou `null` para particular).
3. Exibir os horários retornados; ao escolher um, criar o agendamento (requer paciente; no app pode ser criação rápida ou vínculo com usuário).

O procedimento `agenda.getAvailableSlots` é `publicProcedure` e recebe `companyId`, `date`, `healthPlanId` e `durationMinutes` (opcional). Respeita a disponibilidade configurada e as vagas por plano (quota por semana/mês).
