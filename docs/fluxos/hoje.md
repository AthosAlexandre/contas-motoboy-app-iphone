# Tela Hoje (`/`)

Tela inicial do app. Arquivo: `src/pages/today/TodayPage.vue` · estado: `src/stores/today.ts`.

## O que o usuário faz
1. **Sem turno aberto:** informa o km inicial (vem sugerido o km final do último turno) → **Iniciar turno**.
2. **Com turno aberto:** vê desde que horas e o km inicial; informa o km final → **Encerrar turno**.
   - km final menor que o inicial → erro no campo, botão desabilitado.
   - mais de 500 km no turno → aviso para conferir (não bloqueia).
3. Vê os números do dia:
   - **Quanto guardar hoje** (destaque) = combustível + reserva de manutenção.
   - Ganhos, lucro líquido, gastos, km rodados (com R$/km de ganho).
   - Linha "Cálculo com Gasolina · 40 km/l · R$ 6,200/l" — o que será usado no próximo encerramento
     (mostra "(medido)" quando o consumo vem dos tanques cheios).
4. Vê os **lançamentos de hoje** (mais recentes primeiro) e pode excluir (pede confirmação).
   Botão **Novo** → `/novo`.

## Consome (via `stores/today`)
- `getOpenShift`, `getLastKm`, `listEntries(dia)`, `getPeriodSummary(dia)`, `listActivePlatforms`,
  `getActiveMotorcycle`, `getFuelContext`.

## Dispara
- `startShift`, `endShift`, `removeEntry` — cada uma recarrega o dia.

## Regras visíveis
- Combustível e manutenção só entram quando o turno é **encerrado** (snapshot — ADR-0009).
- Abastecimento do dia **não** soma no lucro do dia (usa o custo estimado por km).
- Aviso se o consumo do combustível usado não estiver informado na moto.

## Estados
- Nada lançado → "Nada lançado hoje ainda."
- Erros de regra (`DomainError`) aparecem num aviso vermelho (snackbar).
