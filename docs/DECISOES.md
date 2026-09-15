# Decisões Técnicas (ADR)

Registro cronológico das decisões de arquitetura. Formato leve inspirado em ADR
(Architecture Decision Records). Cada entrada: contexto, decisão, alternativas e consequências.

---

## ADR-0001 — iOS nativo com SwiftUI (iOS 18+, Swift 6)

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** O foco é validar a ideia no próprio iPhone, desenvolvendo num MacBook. Existe a
intenção de ter Android no futuro.

**Decisão:** App nativo em **SwiftUI**, mínimo **iOS 18**, **modo de linguagem Swift 6** desde o
início. O iPhone de testes está no iOS 26.6.1.

Por que iOS 18 e não 26: o iOS 18 roda nos **mesmos aparelhos** que o iOS 17 (iPhone XS/XR em
diante) e já traz tudo que usamos (`@Observable`, `SectorMark` do Swift Charts, APIs novas de
`Tab`). Exigir iOS 26 cortaria iPhones XS/XR, o que pesa se o app for vendido (ADR-0010).
Recursos exclusivos do iOS 26 podem ser usados com `if #available`.

**Alternativas consideradas:**
- **Flutter / React Native** — um código para as duas plataformas, mas o objetivo atual é o
  iPhone e a experiência nativa (câmera, Charts, PhotosPicker).
- **Kotlin Multiplatform** — bom para compartilhar regras com Android; complexidade alta para um MVP.

**Consequências:**
- ✅ Swift Charts, PhotosPicker e SwiftUI nativos, sem bibliotecas de terceiros para UI.
- ✅ Compilando com o SDK do iOS 26, os componentes padrão ganham o visual Liquid Glass nos
  aparelhos com iOS 26, sem código extra.
- ✅ Swift 6 desde o dia 1 evita a migração que ficou pendente no MacClip (ADR-0005 do win-v-mac).
- ⚠️ Android exigirá reescrita da UI. Mitigação: `Domain` puro (ADR-0002) facilita a tradução.
- ⚠️ Exige **Xcode completo** (Command Line Tools não compilam app iOS).

---

## ADR-0002 — Clean Architecture + MVVM com camadas em pacotes SwiftPM locais

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** Queremos arquitetura limpa, componentização e reuso, e a garantia de que regras de
negócio não fiquem misturadas com Firebase ou telas.

**Decisão:** Três pacotes locais — `Domain` (puro), `Data` (Firebase/IA), `DesignSystem` (UI
reutilizável) — e o target do app com `App` (composition root) e `Features` (MVVM). Detalhes em
[ARQUITETURA.md](./ARQUITETURA.md).

**Alternativas consideradas:**
- **Tudo em pastas dentro do target** — mais simples, mas nada impede um `import FirebaseFirestore`
  numa View; a regra vira só combinado.
- **TCA (The Composable Architecture)** — poderosa, porém curva de aprendizado alta e dependência
  externa grande para um app deste tamanho.

**Consequências:**
- ✅ O compilador faz valer a regra de dependência.
- ✅ `Domain` testável com `swift test`, rápido e sem simulador.
- ✅ Previews e desenvolvimento offline com repositórios em memória.
- ⚠️ Um pouco mais de "cerimônia" (protocolos, mappers, injeção no `AppContainer`).

---

## ADR-0003 — Firebase (Firestore) como backend, no plano Spark

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** Precisamos salvar os lançamentos na nuvem, com login, e funcionar com sinal ruim
na rua. O time já conhece Firebase (projeto MegaMente).

**Decisão:** **Cloud Firestore** com cache offline habilitado, dados sob `users/{uid}/...`,
plano **Spark** (gratuito).

**Alternativas consideradas:**
- **Supabase** — SQL facilita relatórios, mas offline no iOS dá mais trabalho.
- **Só local (SwiftData)** — zero custo e zero login, mas perde backup e multi-aparelho.
- **iCloud/CloudKit** — exige conta Apple paga (capability iCloud).

**Consequências:**
- ✅ Offline nativo: lança sem sinal, sincroniza depois.
- ✅ Conhecimento prévio (regras, Console).
- ⚠️ Agregações (somas por mês) são feitas no app; volume de um usuário é pequeno, então tudo bem.
- ⚠️ Limites do Spark (leituras/escritas diárias) — monitorar se virar produto.

---

## ADR-0004 — Login por e-mail/senha (sem "Entrar com Apple" por enquanto)

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** A ideia inicial era login com Apple ID. Porém a **conta Apple gratuita (Personal
Team) não suporta a capability "Sign in with Apple"** (nem Push, iCloud, App Groups).

**Decisão:** **Firebase Auth com e-mail/senha** (+ reset de senha).

**Alternativas consideradas:**
- **Sign in with Apple** — exige Apple Developer Program (US$ 99/ano). Obrigatório na App Store
  se houver outro login social; reavaliar ao publicar.
- **Google Sign-In** — possível na conta gratuita, adiciona dependência; pode entrar depois.
- **Login anônimo** — sem atrito, mas perde os dados ao reinstalar o app.

**Consequências:**
- ✅ Funciona com a conta Apple gratuita.
- 🔜 Ao publicar, adicionar Sign in with Apple.

---

## ADR-0005 — Não guardar fotos na v1 (só os dados extraídos)

**Data:** 2026-09-15
**Status:** Aceito (confirmado em 2026-09-15: fotos servem só para extrair as informações)

**Contexto:** A sugestão inicial era guardar os prints/fotos no Firebase Storage. Desde
**30/10/2024, criar bucket do Storage exige o plano Blaze** (cartão de crédito). O MegaMente já
tomou a decisão de evitar Storage pelo mesmo motivo.

**Decisão:** A imagem é enviada à IA e **descartada**; salvamos o **resultado da extração**
(texto/JSON + status) em `aiExtractions` e o lançamento confirmado.

**Alternativas consideradas:**
- **Storage no Blaze** — há cota gratuita, mas exige cartão e alerta de orçamento.
- **Guardar a imagem só no aparelho** — sem custo, mas não sincroniza; pode entrar como opção.

**Consequências:**
- ✅ Custo zero, sem cartão.
- ⚠️ Não dá para rever a foto original depois (o JSON extraído fica).

---

## ADR-0006 — IA via Firebase AI Logic + Gemini Developer API (modelo configurável)

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** Precisamos ler prints e fotos. A sugestão recebida usava o SDK `google-ai-swift` com
`gemini-1.5-flash` e a chave de API no código. Verificado em 2026-09-15:
- A família **Gemini 1.5 já foi desligada** (requisições retornam 404); 2.0 desligou em 01/06/2026
  e 2.5 está prevista para desligar em outubro/2026.
- O caminho oficial para apps é o **Firebase AI Logic** (parte do `firebase-ios-sdk`), que evita
  expor a chave no app e funciona no **plano Spark** com o free tier do Gemini Developer API.
- **App Check passa a ser obrigatório no AI Logic a partir de 02/11/2026.**

**Decisão:** Usar **Firebase AI Logic** com provedor **Gemini Developer API**, saída em **JSON
estruturado** (schema), e **nome do modelo vindo do Remote Config** (padrão atual:
`gemini-3.5-flash-lite`, alternativa `gemini-3.8-flash`). Detalhes em [ia/](./ia/README.md).

**Alternativas consideradas:**
- **SDK Gemini direto com API key no app** — chave extraível do binário; sem App Check.
- **Apple Vision (OCR no aparelho)** — grátis e offline, mas só devolve texto solto; interpretar
  "o que é ganho, o que é taxa" fica com a gente. Bom **plano B** para odômetro.
- **Backend próprio (Cloud Functions)** — exige Blaze.

**Consequências:**
- ✅ Sem chave exposta; sem servidor próprio; custo zero no free tier.
- ✅ Trocar de modelo quando o Google desligar um sem publicar nova versão.
- ⚠️ Free tier: limites de requisições e os dados podem ser usados pelo Google para melhorar
  produtos — não enviar nada sensível além dos prints.
- ⚠️ **Risco a validar na Sprint 5:** App Check no iOS usa App Attest, que pode não estar
  disponível para Personal Team. Em desenvolvimento usa-se o *debug provider*.

---

## ADR-0007 — Dinheiro em centavos (`Int`), nunca `Double`

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** `Double` acumula erro de arredondamento (`0.1 + 0.2 != 0.3`). Somas de muitos
lançamentos no mês dariam centavos errados.

**Decisão:** Value object `Money` guardando **centavos em `Int`**, no `Domain` e no Firestore.
Formatação para R$ só na apresentação. Litros e km/l usam `Decimal` quando necessário.

**Consequências:**
- ✅ Somas exatas; comparação e testes simples.
- ⚠️ Conversão ao ler da IA (que devolve "145,90") centralizada num único parser.

---

## ADR-0008 — Ficha da moto sugerida pela IA com pesquisa na internet (Grounding)

**Data:** 2026-09-15
**Status:** Aceito (viabilidade técnica a validar na Sprint 5)

**Contexto:** Consumo, capacidade do tanque e intervalos de manutenção mudam de moto para moto.
Pedir tudo digitado é atrito, e muitos entregadores não sabem esses números. Pedido do usuário: ele
informa a moto, a IA pesquisa na internet e mostra o resultado; ele concorda ou muda; e pode trocar
de moto e de consumo a qualquer momento.

**Decisão:** Usar o Gemini com a ferramenta **Grounding with Google Search** (`Tool.googleSearch()`),
disponível no Firebase AI Logic para os modelos 3.x Flash/Flash-Lite. O resultado é **sempre uma
sugestão**: a tela mostra os valores editáveis e as fontes; nada é salvo sem confirmação. Quando
houver 2 abastecimentos com tanque cheio, o app sugere trocar para o **consumo medido**.
Implementação atrás do protocolo `Domain.MotorcycleSpecsProvider`. Detalhes em [ia/](./ia/README.md).

**Alternativas consideradas:**
- **Tabela própria de motos** — exige manutenção constante e fica desatualizada.
- **Só digitação** — funciona (e continua existindo), mas é o atrito que o app quer evitar.
- **API paga de dados veiculares** — custo e pouca cobertura de motos no Brasil.

**Consequências:**
- ✅ Cadastro da moto em poucos toques.
- ✅ Uso baixo (só ao cadastrar/trocar moto) — deve caber na cota gratuita de Grounding
  (conferir os números oficiais na Sprint 5).
- ⚠️ Os termos do Google exigem **exibir as sugestões de busca** (`searchEntryPoint`, HTML) e
  **as fontes** junto do resultado.
- ⚠️ Consumo de fabricante/INMETRO costuma ser melhor que o real em entrega (anda e para) — a tela
  avisa e o app prioriza o consumo medido.
- ⚠️ Pode ser que o modelo não aceite schema JSON junto com a pesquisa → 2ª chamada sem ferramenta
  só para estruturar.

---

## ADR-0009 — Trocar de moto ou consumo não altera o passado (snapshot por turno)

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** O usuário pode trocar de moto ou corrigir o consumo a qualquer momento. Se os
relatórios recalculassem tudo com o valor atual, o lucro de meses anteriores mudaria sozinho.

**Decisão:** A moto ativa vale **a partir da data da troca**. Ao **encerrar um turno**, gravamos um
snapshot do que foi usado no cálculo: `motorcycleId`, `fuelTypeUsed`, `kmPerLiterUsed`, `fuelPriceCentsUsed`,
`fuelCostCents` e `maintenanceReserveCents`. Relatórios leem o snapshot. Km, consumo medido e
itens de manutenção são sempre **por moto**. Um botão "recalcular período" pode vir depois.

**Alternativas consideradas:**
- **Sempre recalcular com o valor atual** — simples, mas o passado muda sem o usuário perceber.
- **Versionar a moto com vigência e buscar a versão por data** — correto, porém mais consultas e
  mais complexidade em cada relatório.

**Consequências:**
- ✅ Relatórios estáveis e auditáveis; trocar de moto é seguro.
- ✅ Relatórios mais rápidos (valores já calculados no turno).
- ⚠️ Corrigir um consumo errado não corrige turnos já encerrados (até existir o "recalcular").

---

## ADR-0010 — Uso pessoal primeiro, preparado para virar produto

**Data:** 2026-09-15
**Status:** Aceito

**Contexto:** O app começa para uso do próprio autor. Se funcionar bem, a ideia é vender para
outros entregadores.

**Decisão:** Construir **multiusuário desde o início** (login, dados em `users/{uid}`, regras por
dono), mas **sem nada que exija pagamento agora** (conta Apple paga, plano Blaze).

**Consequências:**
- ✅ Virar produto não exige migrar dados nem reescrever a base.
- ✅ Custo zero enquanto é pessoal.
- 🔜 Antes de vender: Apple Developer Program (US$ 99/ano), Sign in with Apple, App Store review,
  termos de uso e privacidade (LGPD), plano pago do Gemini (no free tier o Google pode usar os
  dados) e estimativa de custo de IA por usuário.
