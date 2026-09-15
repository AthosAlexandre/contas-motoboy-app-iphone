# Minha moto (`/moto`)

Arquivo: `src/pages/motorcycle/MotorcyclePage.vue` · estado: `src/stores/session.ts` (moto ativa).
Chega-se por **Ajustes → Minha moto** ou automaticamente quando a conta ainda não tem moto.

## Sem moto (conta nova)
1. Aviso "Cadastre sua moto".
2. Formulário: marca, modelo, ano (opcional), tanque (opcional), **moto flex?**, consumo com gasolina,
   consumo com etanol (só se flex), **usar o consumo medido quando houver**.
3. **Cadastrar moto** → vira a moto ativa → vai para **Hoje**.

## Com moto
- Card **Moto atual** com o **consumo medido** por combustível (ou "ainda sem medição").
- Formulário **Ficha da moto** já preenchido → **Salvar ficha** (vale para os próximos turnos encerrados).
- **Trocar de moto** → confirmação → formulário em branco **Nova moto** → **Trocar para esta moto**
  (ou Cancelar). A anterior recebe `activeUntil` e os turnos já encerrados não mudam (ADR-0009).

## Regras
- Marca e modelo obrigatórios; consumo entre 1 e 150 km/l; ano entre 1950 e 2100; tanque até 50 l.
- Moto só a gasolina não guarda consumo de etanol (e o lançamento não oferece etanol).
- Sprint 5: a IA vai sugerir a ficha pesquisando o modelo (ADR-0008).

## Consome / dispara
- `actions/motorcycle`: `registerMotorcycle`, `updateMotorcycle`, `getMeasuredConsumption`.
