# Manutenção (`/manutencao`)

Arquivo: `src/pages/maintenance/MaintenancePage.vue` · estado: `src/stores/maintenance.ts` ·
casos de uso: `src/actions/maintenance.ts`.

## O que o usuário vê
1. **Cabeçalho:** odômetro atual e a **reserva por km** (ex.: "R$ 0,08/km"), com a equivalência a cada
   100 km. Sem itens cadastrados, avisa que está usando o valor dos Ajustes.
2. **Um card por item:** nome, intervalo (km e, se houver, dias), custo estimado, **barra de progresso**
   com "faltam 300 km" / "vencido há 100 km", e o botão **Fiz a troca**.
   Os mais urgentes aparecem primeiro.
3. **Sem itens:** tela vazia explicando para que serve, com o botão **Adicionar itens sugeridos**
   (óleo, filtro, relação, pneus, pastilhas e revisão — todos começando do km atual).
4. **Trocas feitas:** histórico com item, dia, km e valor pago.

## O que o usuário faz
- **Adicionar item:** nome, "trocar a cada" (km), "ou a cada" (dias, opcional), custo estimado e o km da
  última troca (já vem preenchido com o odômetro).
- **Editar** e **excluir** item (excluir mantém o histórico).
- **Fiz a troca:** informa o km e quanto pagou → zera a contagem, entra no histórico e **o valor pago
  vira a nova estimativa** do item.

## Regras visíveis
- Progresso ≥ 90% → atenção (amarelo); ≥ 100% → vencido (vermelho).
- Com prazo em dias, vence pelo que chegar primeiro (km ou tempo).
- A reserva por km sai da soma de `custo ÷ intervalo` de todos os itens; ela entra no lucro quando o
  turno é encerrado (snapshot — ADR-0009).

## Avisos (ADR-0013 — sem push)
- **Badge** na aba Manutenção com quantos itens pedem atenção.
- **Banner** na tela Hoje com o item mais urgente e um botão para esta tela.
