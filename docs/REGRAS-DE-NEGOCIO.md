# 📐 Regras de negócio — MotoboyContas

Entidades, fórmulas e casos de borda. Tudo aqui vira código em `src/domain`
(`calculators/`) **com teste** (Vitest). Mudou uma fórmula → atualiza aqui e no teste.

> Valores em dinheiro são **centavos** (ADR-0007). Exemplos abaixo em R$ só para leitura.

## Entidades

| Entidade | O que é | Campos principais |
|----------|---------|-------------------|
| `Platform` | App de entrega | nome (iFood, 99Food, …), cor, ativo |
| `Motorcycle` | Moto do usuário | marca, modelo, ano, cilindrada, combustível aceito (`flex`/`gasolina`), consumo km/l **por combustível** (gasolina e etanol), tanque (l), origem da ficha (`ai`/`manual`), fontes, ativa desde/até |
| `Shift` (turno) | Um período de trabalho | motoId, início, fim, kmInicial, kmFinal, nível combustível início/fim (opcional), snapshot dos cálculos |
| `Earning` (ganho) | Dinheiro recebido | plataforma, valor, data, gorjeta (opcional), origem (`manual`/`ia`), turnoId (opcional) |
| `Expense` (gasto) | Dinheiro gasto | categoria, valor, data, descrição, origem |
| `Fueling` (abastecimento) | Ida ao posto | motoId, **combustível** (gasolina/etanol), **valor total**, **litros**, preço/litro (calculado), km no odômetro, tanque cheio?, data |
| `MaintenanceItem` | Item que se desgasta | nome, intervalo km, intervalo dias (opcional), custo estimado, último km, última data |
| `MaintenanceRecord` | Uma troca feita | itemId, km, data, valor real |

**Categorias de gasto (diretos):** alimentação, celular/internet, equipamento (bag, capacete), multa,
outros. Combustível entra como **abastecimento**; manutenção paga, como troca de item (Sprint 4).

## Fórmulas

### Km rodados
```
kmRodados = kmFinal − kmInicial
```
- Inválido se `kmFinal < kmInicial` (erro de digitação ou de leitura da IA → pedir correção).
- Alerta (não bloqueia) se `kmRodados > 500` num turno.

### Abastecimento
Cada ida ao posto registra:
- **Combustível:** `gasolina` ou `etanol` (gasolina comum, aditivada ou premium contam como gasolina).
- **Valor total** pago (R$) e **litros** colocados — os **dois obrigatórios**.
- **Preço/litro é calculado:** `preçoLitro = valorTotal / litros`. É uma **taxa**, não um valor em
  dinheiro: pode ter 3 casas (R$ 6,199) e fica em centavos **com fração** (619,9). Só totais em
  dinheiro são centavos inteiros. Se o cupom/bomba também mostrar o
  preço e `|litros × preço − valorTotal| > R$ 0,05`, os campos ficam destacados para revisão.
- Km no odômetro e se completou o **tanque cheio**.

> Ex.: 8,437 l de etanol por R$ 35,00 → R$ 4,148/l.

### Consumo médio (km/l) — por combustível, método tanque cheio
```
consumo = (kmAbastecimentoCheioAtual − kmAbastecimentoCheioAnterior) / litrosColocadosNoIntervalo
```
- `litrosColocadosNoIntervalo` = soma dos litros de todos os abastecimentos depois do cheio
  anterior até o atual (inclusive).
- **Separado por combustível:** etanol rende bem menos km/l que gasolina (em geral ~30% menos),
  então cada moto tem um consumo de **gasolina** e um de **etanol**.
- Só entra na média de um combustível o intervalo em que **todos** os abastecimentos foram daquele
  combustível. Intervalo **misturado** (etanol + gasolina no mesmo tanque) fica fora da média.
- Enquanto não houver histórico daquele combustível, usa o **consumo da ficha da moto** para ele
  (sugerido pela IA ou digitado, ex.: gasolina 40 km/l, etanol 28 km/l).
- Com consumo medido disponível, o app sugere usá-lo; o usuário escolhe (ver [Moto](#moto)).
- O consumo usado nos cálculos é a **média ponderada** dos últimos N intervalos daquele combustível
  (N = 3): km somados ÷ litros somados.
- Tanque cheio **sem km do odômetro** não fecha intervalo; os litros dele contam no intervalo seguinte.

> **Por que não pela foto do marcador de combustível?** O marcador da moto é em barras/ponteiro;
> a leitura da IA vira "~1/2 tanque", impreciso demais para calcular dinheiro. A foto do painel
> serve bem para o **odômetro** (número exato). O nível de combustível fica como informação de apoio.

### Custo de combustível (ADR-0018)
**Vale o que foi pago**, no dia em que o abastecimento foi lançado:
```
custoCombustível(período) = Σ valorTotal dos abastecimentos do período
```
Serve igual para dia, semana e mês. Abastecer é como qualquer outro gasto: saiu do bolso, entra na conta
daquele dia. Pode ser lançado antes ou depois de encerrar o turno.

**Estimativa por km** (indicador, **fora** do lucro):
```
custoEstimado = (kmRodados / consumo[combustívelAtual]) × preçoLitro[combustívelAtual]
```
- `combustívelAtual` = combustível do **último abastecimento** antes do turno.
- `preçoLitro` = do último abastecimento **daquele combustível** (ou o preço padrão dos Ajustes).
- Fica gravada no snapshot do turno e aparece no Resumo como "estimado por km"; também é a base do
  comparativo **etanol × gasolina**.

> Ex. gasolina: 120 km ÷ 40 km/l = 3 l × R$ 6,20 = **R$ 18,60** de estimativa.
> Ex. etanol: 120 km ÷ 28 km/l = 4,29 l × R$ 4,15 = **R$ 17,79** de estimativa.

### Etanol ou gasolina?
```
custoPorKm(combustível) = preçoLitro(combustível) / consumo(combustível)
```
Mostrado ao registrar abastecimento: o combustível com **menor R$/km** compensa mais. Com o consumo
**medido na própria moto**, é mais preciso que a regra genérica dos 70%.
> Ex.: gasolina R$ 6,20 ÷ 40 = R$ 0,155/km; etanol R$ 4,15 ÷ 28 = R$ 0,148/km → etanol compensa.

### Reserva de manutenção
Cada item tem um custo por km:
```
custoPorKm(item) = custoEstimado / intervaloKm
reservaManutenção = Σ custoPorKm(item) × kmRodados
```
> Ex.: óleo R$ 45 a cada 1.000 km = R$ 0,045/km; relação R$ 250 a cada 20.000 km = R$ 0,0125/km;
> pneus R$ 400 a cada 15.000 km = R$ 0,0267/km → total **≈ R$ 0,084/km**.
> Em 120 km: **≈ R$ 10,10** para guardar.

Os itens são cadastrados em **Manutenção** (há 6 sugeridos: óleo, filtro, relação, pneus, pastilhas e
revisão) e são editáveis. **Sem itens cadastrados**, a reserva usa o valor fixo por 100 km dos Ajustes.
Na Sprint 5 a ficha da moto pela IA vai sugerir os intervalos.

A reserva de cada turno é calculada **no encerramento** e gravada no snapshot (ADR-0009): mudar o custo
de um item depois não altera turnos já fechados.

**Registrar a troca** ("Fiz a troca"): guarda km, dia e valor pago no histórico, zera a contagem do item
(`lastKm`/`lastDate`) e o **valor pago vira a nova estimativa** — a próxima reserva já usa o preço real.

### Lucro
```
ganhoBruto        = Σ ganhos do período (com gorjeta)
gastosDiretos     = Σ gastos do período, exceto combustível e manutenção
custoCombustível  = Σ abastecimentos pagos no período
lucroOperacional  = ganhoBruto − custoCombustível − gastosDiretos
lucroLíquido      = lucroOperacional − reservaManutenção
```
- **Lucro líquido** é o número principal da tela: "quanto sobrou de verdade".
- Gastos de **manutenção pagos** não entram de novo no lucro — eles saem da reserva
  (senão o custo contaria duas vezes). O resumo mostra "reserva acumulada − gasto em manutenção".

### Métricas
```
R$/km   = ganhoBruto / kmRodados
lucro/km = lucroLíquido / kmRodados
R$/hora = ganhoBruto / horasTrabalhadas     (se o turno tiver início e fim)
```

### Quanto guardar
```
guardarHoje = reservaManutenção
```
O combustível **não** entra aqui: ele é pago no posto e já saiu do lucro no dia do abastecimento
(guardar de novo seria contar duas vezes). Mostrado na tela Hoje: "Guarde R$ 10,10 para a manutenção."

### Próxima manutenção
```
kmDesdeÚltima = odômetroAtual − últimoKm(item)
faltamKm      = intervaloKm − kmDesdeÚltima
```
```
progresso = maior(kmDesdeÚltima / intervaloKm, diasDesdeÚltima / intervaloDias)
```
- `progresso ≥ 0,9` (90% do intervalo) → **atenção** (amarelo); `≥ 1` → **vencido** (vermelho).
- Com `intervaloDias`, vence pelo que chegar primeiro (km ou tempo).
- `odômetroAtual` = maior km conhecido **da moto ativa**: fim do último turno, km inicial do turno
  aberto, odômetro de abastecimento ou o km da última troca registrada.
- Odômetro menor que a última troca não gera km negativo (conta zero).
- A tela Hoje mostra o item mais urgente num aviso, e a aba Manutenção mostra quantos pedem atenção
  (ADR-0013 — sem notificação push).

## Moto
- O usuário informa **marca, modelo e ano** (cilindrada opcional).
- A IA **pesquisa na internet** e sugere a ficha: se é flex, consumo médio (km/l) com gasolina e com etanol, tanque (l) e
  plano de manutenção do fabricante (óleo, filtro, relação, velas, pneus, freios, revisão) — ADR-0008.
- A ficha aparece com as **fontes**; o usuário **aceita ou edita** qualquer valor.
- A qualquer momento dá para **editar** a ficha ou **trocar de moto**.
- **Consumo usado nos cálculos (por combustível):** o medido (tanque cheio), se o usuário escolheu
  usá-lo; senão, o da ficha. Moto só a gasolina não tem consumo de etanol (e o app não oferece etanol).
- **Km, consumo medido e manutenção são sempre por moto.** Ao trocar de moto, pedir o odômetro
  atual da nova e criar os itens de manutenção a partir da ficha dela.
- **Trocar moto/consumo não muda o passado:** cada turno encerrado guarda o snapshot dos
  cálculos (`fuelTypeUsed`, `kmPerLiterUsed`, `fuelPriceCentsUsed`, `fuelCostCents`, `maintenanceReserveCents`) — ADR-0009.

## Períodos
- **Fuso:** `America/Sao_Paulo`.
- **Dia:** data de **início** do turno (turno que passa da meia-noite conta no dia em que começou).
- **Semana:** segunda a domingo.
- **Mês:** mês civil.

## Casos de borda
- Turno sem km final → não calcula combustível/reserva; resumo mostra "turno em aberto".
- Ganho sem turno (lançado depois) → entra no dia pela data do ganho.
- Mais de um turno no dia → somam-se km e ganhos.
- Divisão por zero (0 km) → métricas por km mostram "—".
- Leitura da IA com baixa confiança → campo destacado para conferência.
- Abastecimento pode ser lançado **a qualquer momento** (antes ou depois de encerrar o turno) e conta
  no **dia do lançamento**. O lucro oscila: cai no dia que abastece e sobe nos outros; na semana e no
  mês isso se equilibra.
- Turno encerrado **sem consumo informado** → só a estimativa por km fica incompleta; o valor pago no
  posto e a reserva de manutenção não mudam.
