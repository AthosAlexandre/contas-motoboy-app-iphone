# 🔥 Firebase

Auth, modelagem do Firestore, regras de segurança, App Check e Remote Config.

> **Código pronto (Sprint 2).** Falta ligar no Console: Authentication, Firestore e regras — passo a
> passo em [SETUP.md](../SETUP.md#trocar-do-modo-local-para-o-firebase).

## Projeto
- **ID:** `motoboy-contas` (criado em 2026-09-15, conta do dev) · app Web `motoboycontas-web`.
- Sem Google Analytics (dá para ativar em Configurações → Integrações).
- Configuração do app no `.env` (`VITE_FIREBASE_*`) — ver [SETUP.md](../SETUP.md).
- **Domínio de produção:** `contas-motoboy-app-iphone.vercel.app` — adicionar em *Authentication →
  Settings → Authorized domains* (Sprint 2) e no reCAPTCHA do App Check (Sprint 5).

## Plano
- **Spark** (gratuito). Nada que exija Blaze na v1: sem Storage (ADR-0005), sem Cloud Functions,
  sem push (ADR-0013).
- **SDK Web v12** (`firebase`), inicializado em `src/services/firebase.ts` — mesmo padrão do MegaMente.

## Autenticação
| Provedor | Status | Observação |
|----------|--------|------------|
| **E-mail/senha** | ✅ usar | Inclui reset de senha. `auth.languageCode = "pt-BR"`. |
| Sign in with Apple | 🔜 depois | Exige conta Apple paga (ADR-0004). |
| **Google** | ✅ usar | Redirecionamento em produção (proxy `/__/auth` na Vercel) e popup no localhost — ADR-0016. |

## Modelagem do Firestore (rascunho)

Tudo pendurado no usuário: **cada usuário só enxerga a própria árvore**, e as regras ficam simples.

```
users/{uid}                              perfil + configurações
users/{uid}/motorcycles/{id}             motos (ficha + fontes; ADR-0008/0009)
users/{uid}/platforms/{id}               plataformas (iFood, 99Food, …)
users/{uid}/shifts/{id}                  turnos
users/{uid}/earnings/{id}                ganhos
users/{uid}/expenses/{id}                gastos
users/{uid}/fuelings/{id}                abastecimentos
users/{uid}/maintenanceItems/{id}        itens de manutenção
users/{uid}/maintenanceRecords/{id}      trocas realizadas
users/{uid}/aiExtractions/{id}           leituras da IA (auditoria)
```

| Coleção | Campos principais (rascunho) |
|---------|------------------------------|
| `users` | name, email, activeMotorcycleId, defaultGasolinePriceCents, defaultEthanolPriceCents, maintenanceReservePer100KmCents (fallback), createdAt |
| `motorcycles` | brand, model, year?, fuelSupport (`flex`/`gasoline`), kmPerLiterGasoline?, kmPerLiterEthanol?, tankLiters?, specsSource (`ai`/`manual`), useMeasuredConsumption, activeFrom, activeUntil? — _Sprint 5: engineCc, specsSources [{title, url}]_ |
| `platforms` | name, isActive, order (as iniciais têm ids fixos `ifood` e `99food`) |
| `shifts` | motorcycleId, startedAt, endedAt?, kmStart, kmEnd?, fuelLevelStart?, fuelLevelEnd?, day (`yyyy-MM-dd`); **snapshot ao encerrar:** fuelTypeUsed, kmPerLiterUsed, fuelPriceCentsUsed, fuelCostCents, maintenanceReserveCents |
| `earnings` | platformId, amountCents, tipCents?, date, day, shiftId?, source (`manual`/`ai`), aiExtractionId? |
| `expenses` | category, amountCents, description?, date, day, source, aiExtractionId? |
| `fuelings` | motorcycleId, fuelType (`gasoline`/`ethanol`), totalCents, liters, pricePerLiterCents (calculado = total ÷ litros; decimal, ex.: 619.9), odometerKm, fullTank, date, day, source, aiExtractionId? |
| `maintenanceItems` | motorcycleId, name, intervalKm, intervalDays (`null` = só por km), estimatedCostCents, lastKm, lastDate |
| `maintenanceRecords` | motorcycleId, itemId, **itemName** (histórico sobrevive se o item for apagado), odometerKm, costCents, day, createdAt |
| `aiExtractions` | kind (`earningsScreenshot`/`dashboard`/`fuelReceipt`/`motorcycleSpecs`), model, rawJson, status (`pending`/`confirmed`/`discarded`), createdAt |

**Convenções:**
- Dinheiro em **centavos** (`...Cents`, `Int`) — ADR-0007.
- Campo `day` (`yyyy-MM-dd` no fuso de São Paulo) para consultar dia/semana/mês por intervalo de
  string, sem depender de fuso na query.
- Datas como **strings ISO** (`createdAt`, `startedAt`, `activeFrom`…) — ADR-0015. IDs gerados pelo Firestore.
- Consultas sem índice composto: período por `day` (intervalo), `endedAt == null` (turno aberto),
  `endedAt != null` + `orderBy('endedAt')` (último turno), `motorcycleId ==` (abastecimentos). A ordenação
  por `createdAt` é feita no app.

## Regras de segurança
- Arquivo versionado: [`firestore.rules`](../../firestore.rules) na raiz.
- Estado atual:
  - `users/{uid}`: só o dono lê, cria e atualiza; ninguém apaga.
  - `users/{uid}/{coleção}/{doc}`: só o dono lê e escreve, e só nas coleções conhecidas
    (`platforms`, `motorcycles`, `shifts`, `earnings`, `expenses`, `fuelings`, `maintenanceItems`,
    `maintenanceRecords`, `aiExtractions`).
  - Qualquer outro caminho: bloqueado.
- ⚠️ **Publicar no Console** sempre que o arquivo mudar (senão `permission-denied`).
- 🔜 Validar tipos/valores nas regras (ex.: `amountCents is int && amountCents >= 0`).

## Offline
- Cache persistente do Firestore no navegador (IndexedDB):
  `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
  Lançamentos feitos sem sinal ficam pendentes e sobem quando a conexão volta.
- As escritas **não esperam o servidor** (ADR-0014): o id é gerado no aparelho e a tela segue na hora.
  Recusa do servidor aparece só no console (`[firestore] escrita recusada pelo servidor`).

## Primeiro acesso (bootstrap)
- A cada login, `data/firestore/bootstrap.ts` confere se `users/{uid}` existe. Se não existe, cria em lote:
  o documento do usuário (nome, e-mail, `activeMotorcycleId: null` e os Ajustes padrão) e as plataformas
  `ifood` e `99food`.
- **Nada disso espera o servidor** (ADR-0014): a leitura tem prazo de 8 s e a gravação é disparada sem
  `await`. Com sinal ruim o app abre do mesmo jeito e o próximo login tenta de novo.
- Sem moto cadastrada, a guarda de rota leva para **Minha moto** antes de liberar o app.
- Se as regras não estiverem publicadas, o bootstrap falha com `permission-denied` (aparece no console).

## Modo local × Firebase
- `VITE_DATA_SOURCE=memory`: sem Firebase, dados só no aparelho (o SDK nem é baixado).
- `VITE_DATA_SOURCE=firestore`: login + Firestore. **Os dados do modo local não são migrados.**

## App Check
- Obrigatório para o AI Logic a partir de **02/11/2026**. Detalhes em [ia/](../ia/README.md).
- Provedor web: **reCAPTCHA Enterprise** (domínio da Vercel). Desenvolvimento: **debug token**
  (`VITE_APPCHECK_DEBUG_TOKEN`, cadastrado no Console).

## Remote Config
| Parâmetro | Padrão | Uso |
|-----------|--------|-----|
| `ai_model` | `gemini-3.5-flash-lite` | Modelo usado nas extrações (trocar sem publicar app) |
| `ai_enabled` | `true` | Desliga a IA remotamente (cota estourada, modelo desligado) |
