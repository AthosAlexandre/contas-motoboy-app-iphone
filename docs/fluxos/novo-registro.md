# Novo registro (`/novo`) — manual

Arquivo: `src/pages/entry/EntryPage.vue` · estado: `src/stores/today.ts`.
Na Sprint 5 a IA vai preencher estes mesmos formulários a partir de foto/print.

Seletor no topo: **Ganho | Gasto | Abastecer**. Depois de salvar aparece "salvo" e o formulário limpa —
dá para lançar iFood e 99Food em sequência sem sair da tela.

## Ganho
- **Plataforma** (chips; a primeira já vem marcada).
- **Valor recebido** (`McCurrencyField`) e **gorjeta** (opcional).
- Se houver turno aberto, o ganho fica ligado a ele.

## Gasto
- **Categoria**: Alimentação, Celular/internet, Equipamento, Multa, Outros.
- **Valor** e **descrição** (opcional, até 80 caracteres).

## Abastecimento
- **Gasolina / Etanol** (`McFuelTypeToggle`): etanol desabilitado se a moto não for flex; vem marcado
  o último combustível usado.
- **Valor total pago** e **litros colocados** (até 3 casas) — mostra o **preço por litro** calculado.
- **Km no odômetro** (opcional) e **Completei o tanque** (ligado por padrão). Com os dois, o app mede
  o consumo real da moto.

## Dispara (via store)
- `addEarning`, `addExpense`, `addFueling` — erros de regra (`DomainError`) aparecem no aviso vermelho.
