# 🔥 Firebase

Auth, modelagem do Firestore, regras de segurança, App Check e Remote Config.

> Ainda **não configurado** — este é o rascunho. Preencher conforme implementarmos (Sprint 2).

## Plano
- **Spark** (gratuito). Nada que exija Blaze na v1: sem Storage (ADR-0005), sem Cloud Functions,
  sem push (ADR-0013).
- **SDK Web v12** (`firebase`), inicializado em `src/services/firebase.ts` — mesmo padrão do MegaMente.

## Autenticação
| Provedor | Status | Observação |
|----------|--------|------------|
| **E-mail/senha** | ✅ usar | Inclui reset de senha. `auth.languageCode = "pt-BR"`. |
| Sign in with Apple | 🔜 depois | Exige conta Apple paga (ADR-0004). |
| Google | 🤔 talvez | Possível na conta gratuita. |

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
| `motorcycles` | brand, model, year, engineCc?, fuelSupport (`flex`/`gasoline`), kmPerLiterGasoline, kmPerLiterEthanol?, tankLiters?, specsSource (`ai`/`manual`), specsSources [{title, url}], useMeasuredConsumption, activeFrom, activeUntil? |
| `platforms` | name, colorHex, isActive, order |
| `shifts` | motorcycleId, startedAt, endedAt?, kmStart, kmEnd?, fuelLevelStart?, fuelLevelEnd?, day (`yyyy-MM-dd`); **snapshot ao encerrar:** fuelTypeUsed, kmPerLiterUsed, fuelPriceCentsUsed, fuelCostCents, maintenanceReserveCents |
| `earnings` | platformId, amountCents, tipCents?, date, day, shiftId?, source (`manual`/`ai`), aiExtractionId? |
| `expenses` | category, amountCents, description?, date, day, source, aiExtractionId? |
| `fuelings` | motorcycleId, fuelType (`gasoline`/`ethanol`), totalCents, liters, pricePerLiterCents (calculado = total ÷ litros; decimal, ex.: 619.9), odometerKm, fullTank, date, day, source, aiExtractionId? |
| `maintenanceItems` | motorcycleId, name, intervalKm, intervalDays?, estimatedCostCents, lastKm, lastDate |
| `maintenanceRecords` | itemId, odometerKm, date, costCents |
| `aiExtractions` | kind (`earningsScreenshot`/`dashboard`/`fuelReceipt`/`motorcycleSpecs`), model, rawJson, status (`pending`/`confirmed`/`discarded`), createdAt |

**Convenções:**
- Dinheiro em **centavos** (`...Cents`, `Int`) — ADR-0007.
- Campo `day` (`yyyy-MM-dd` no fuso de São Paulo) para consultar dia/semana/mês por intervalo de
  string, sem depender de fuso na query.
- Datas como `Timestamp`. IDs gerados pelo Firestore.

## Regras de segurança (rascunho)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
- Arquivo versionado: `firestore.rules` na raiz (a criar na Sprint 2).
- ⚠️ **Publicar no Console** sempre que o arquivo mudar (senão `permission-denied`).
- 🔜 Validar tipos/valores nas regras (ex.: `amountCents is int && amountCents >= 0`).

## Offline
- Cache persistente do Firestore no navegador (IndexedDB):
  `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
  Lançamentos feitos sem sinal ficam pendentes e sobem quando a conexão volta.

## App Check
- Obrigatório para o AI Logic a partir de **02/11/2026**. Detalhes em [ia/](../ia/README.md).
- Provedor web: **reCAPTCHA Enterprise** (domínio da Vercel). Desenvolvimento: **debug token**
  (`VITE_APPCHECK_DEBUG_TOKEN`, cadastrado no Console).

## Remote Config
| Parâmetro | Padrão | Uso |
|-----------|--------|-----|
| `ai_model` | `gemini-3.5-flash-lite` | Modelo usado nas extrações (trocar sem publicar app) |
| `ai_enabled` | `true` | Desliga a IA remotamente (cota estourada, modelo desligado) |
