# Setup — MotoboyContas

## Pré-requisitos

- macOS recente (desenvolvido em macOS 26).
- **Xcode completo, versão mais recente** (Mac App Store) — precisa suportar o iOS do iPhone de
  testes (26.6.1); Xcode antigo não instala em aparelho com iOS mais novo.
  > ⚠️ Em 2026-09-15 a máquina tinha **só as Command Line Tools** (Swift 6.3.3), suficientes para
  > o MacClip mas **não** para app iOS: sem SDK do iOS, simulador, assinatura nem SwiftData.
  > Depois de instalar:
  > ```bash
  > sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  > xcodebuild -version
  > ```
- iPhone de testes: iOS 26.6.1 (o app suporta iOS 18+ — ADR-0001), com cabo (ou Wi-Fi depois do
  primeiro pareamento).
- Conta Google (Firebase) e Apple ID (grátis).

## Rodar no iPhone com conta Apple gratuita

1. **Xcode → Settings → Accounts** → adicionar o Apple ID (cria o *Personal Team*).
2. No projeto: target **MotoboyContas → Signing & Capabilities** → *Team* = seu Apple ID.
   Bundle ID único, ex.: `com.athosalexandre.motoboycontas`.
3. No iPhone: **Ajustes → Privacidade e Segurança → Modo Desenvolvedor** → ativar (reinicia).
4. Conectar o iPhone, escolher o aparelho no topo do Xcode e **Run (⌘R)**.
5. Primeira abertura: **Ajustes → Geral → VPN e Gerenciamento de Dispositivos** → confiar no
   perfil de desenvolvedor.

### Limites da conta gratuita (Personal Team)

| Limite | Efeito no projeto |
|--------|-------------------|
| App **expira em 7 dias** | Para de abrir; basta rodar de novo pelo Xcode. |
| Até **3 apps** instalados por esse método | Sem impacto. |
| Sem **Sign in with Apple, Push, iCloud, App Groups** | Login por e-mail/senha (ADR-0004); notificações **locais** funcionam; widgets ficam para depois. |
| Sem **TestFlight / App Store** | Só no seu aparelho. |

Assinar o Apple Developer Program (US$ 99/ano) só quando for distribuir.

## Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → novo projeto (plano **Spark**).
2. Adicionar app **iOS** com o mesmo Bundle ID → baixar `GoogleService-Info.plist` →
   arrastar para `MotoboyContas/Resources/` (o arquivo **não vai para o git**).
3. **Authentication** → Sign-in method → ativar **E-mail/senha**.
4. **Firestore Database** → criar em `southamerica-east1` (São Paulo), modo produção →
   publicar `firestore.rules` (ver [firebase/](./firebase/README.md)).
5. **AI Logic** → Get started → provedor **Gemini Developer API** (ver [ia/](./ia/README.md)).
6. **App Check** → registrar o app (debug provider em desenvolvimento).
7. **Remote Config** → parâmetro `ai_model` (ver [ia/](./ia/README.md)).

## Dependências (Swift Package Manager)

No Xcode: **File → Add Package Dependencies…** → `https://github.com/firebase/firebase-ios-sdk`.
Produtos usados (no pacote `Data`): `FirebaseAuth`, `FirebaseFirestore`, `FirebaseAILogic`,
`FirebaseAppCheck`, `FirebaseRemoteConfig`.

> Conferir os nomes exatos dos produtos na versão instalada — o SDK de IA já mudou de nome
> (Vertex AI in Firebase → Firebase AI Logic).

## Testes

```bash
cd Packages/Domain && swift test     # regras de negócio (não precisa de simulador)
```
Testes de UI/integração rodam pelo Xcode (⌘U).

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `xcodebuild requires Xcode` | `xcode-select` aponta para CLT | `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| App fecha ao abrir no iPhone | Perfil gratuito expirou (7 dias) | Rodar de novo pelo Xcode |
| "Untrusted Developer" | Perfil não confiado | Ajustes → Geral → VPN e Gerenciamento de Dispositivos |
| Capability indisponível no Signing | Personal Team não suporta | Ver tabela de limites acima |
| `permission-denied` no Firestore | Regras não publicadas | Publicar `firestore.rules` no Console |
| Erro de App Check na IA | Token de debug não cadastrado | Copiar o token do console do Xcode para Firebase → App Check → Manage debug tokens |
