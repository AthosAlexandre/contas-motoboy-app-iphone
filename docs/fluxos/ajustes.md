# Ajustes (`/ajustes`)

Arquivo: `src/pages/settings/SettingsPage.vue`.

## Seções
1. **Conta:** nome e e-mail (no modo local: "Modo local — dados só neste aparelho").
2. **Minha moto:** marca e modelo → abre `/moto`.
3. **Combustível e manutenção:**
   - Preço padrão da **gasolina** e do **etanol** em R$/l com até 3 casas (6,199). Usados enquanto não há
     abastecimento daquele combustível.
   - **Reserva de manutenção a cada 100 km** (vale até os itens de manutenção da Sprint 4).
   - **Salvar**.
4. **Plataformas:** lista com chave ativa/desativada (desativar esconde no lançamento e mantém o
   histórico) + campo **Nova plataforma** → **Adicionar** (nome repetido é recusado).
5. **Sair da conta** → volta para Entrar.

## Conversões
- Tela em reais (6,199) ↔ domínio em centavos com fração (619,9) — ADR-0007.

## Consome / dispara
- `actions/settings`: `getSettings`, `saveSettings`, `listAllPlatforms`, `addPlatform`, `setPlatformActive`.
- `stores/session`: `signOut`, moto ativa.
