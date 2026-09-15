# Setup — MotoboyContas

## Pré-requisitos

- **Node.js 24+** e **npm 11+** (máquina de dev em 2026-09-15: Node 24.18.0, npm 11.16.0).
- Conta Google (Firebase) e conta na Vercel (deploy).
- iPhone (Safari) e/ou Android (Chrome) para testar.
- **Não precisa de Xcode nem de conta Apple** (ADR-0011).

## Rodando localmente

```bash
npm install
cp .env.example .env    # preencher com as chaves do Firebase
npm run dev             # http://localhost:5173
```

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Checagem de tipos (`vue-tsc`) + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm test` | Testes (Vitest) — regras de negócio e actions |
| `npm run type-check` | Só a checagem de tipos |
| `npm run lint` | ESLint, incluindo a regra de imports entre camadas (ADR-0012) |
| `npm run icons` | Gera os ícones do PWA em `public/` a partir de `public/favicon.svg` |

> Até a Sprint 2 o app roda **sem Firebase**: com `VITE_DATA_SOURCE=memory` os dados ficam salvos
> **só no aparelho/navegador** (localStorage). Limpar os dados do site (ou trocar de aparelho) apaga tudo.

## Testar no celular (mesma rede Wi-Fi)

```bash
npm run dev -- --host      # mostra o endereço na rede, ex.: http://192.168.0.10:5173
```

Abrir esse endereço no Safari do iPhone (ou no Chrome do Android).

- ⚠️ Em `http://IP`, o navegador **não instala como app** nem ativa o service worker (exigem HTTPS).
  Câmera e galeria pelo `<input type="file">` funcionam normalmente.
- App Check em desenvolvimento: usar o **debug token** (ver Firebase, passo 6).

## Instalar na tela de início (PWA)

Precisa de **HTTPS** → usar a URL da Vercel (produção ou preview).

- **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início** → Adicionar.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou o aviso automático).

Abre em tela cheia, com ícone, sem a barra do navegador. Versões novas chegam sozinhas ao reabrir o app.

## Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → novo projeto (plano **Spark**).
   Criado em 2026-09-15: **`motoboy-contas`**, sem Google Analytics.
2. Adicionar app **Web** (apelido `motoboycontas-web`, **sem** Firebase Hosting) → copiar o
   `firebaseConfig` para o `.env` (`VITE_FIREBASE_*`). Não é preciso rodar o `npm install firebase`
   nem colar o código de exemplo do console — a inicialização fica em `src/services/firebase.ts`.
3. **Authentication** → Sign-in method → **E-mail/senha**. Em *Settings → Authorized domains*,
   adicionar o domínio da Vercel.
4. **Firestore Database** → criar em `southamerica-east1` (São Paulo), modo produção →
   publicar `firestore.rules` (ver [firebase/](./firebase/README.md)).
5. **AI Logic** → Get started → provedor **Gemini Developer API** (ver [ia/](./ia/README.md)).
6. **App Check** → registrar o app Web com **reCAPTCHA Enterprise** (domínio da Vercel). Para
   desenvolvimento, gerar um **debug token**, cadastrar em *Manage debug tokens* e colocar em
   `VITE_APPCHECK_DEBUG_TOKEN` no `.env`.
7. **Remote Config** → parâmetros `ai_model` e `ai_enabled` (ver [ia/](./ia/README.md)).

> As chaves `VITE_FIREBASE_*` **não são segredo** (vão no bundle do site). A segurança vem das
> regras do Firestore e do App Check.

### Trocar do modo local para o Firebase

⚠️ Os dados lançados no modo local **não vão para o Firebase** — a conta começa vazia.

1. **Authentication** → *Começar* → aba *Método de login* → **E-mail/senha** → ativar só a primeira opção
   (não o "link por e-mail") → Salvar.
2. **Authentication** → *Configurações* → *Domínios autorizados* → **Adicionar domínio** →
   `contas-motoboy-app-iphone.vercel.app` (o `localhost` já vem na lista).
3. **Firestore Database** → *Criar banco de dados* → local **`southamerica-east1` (São Paulo)** →
   **modo de produção** → Criar.
4. **Firestore Database** → aba **Regras** → apagar o conteúdo → colar o arquivo
   [`firestore.rules`](../firestore.rules) → **Publicar**.
5. **Local:** no `.env`, `VITE_DATA_SOURCE=firestore` → `npm run dev` → criar conta → cadastrar a moto.
6. **Vercel:** *Settings → Environment Variables* → `VITE_DATA_SOURCE` = `firestore` → *Deployments* →
   **Redeploy** do último.

Conferir no Console → Firestore → *Dados*: deve aparecer `users/{seu uid}` com as plataformas.

### Login com Google (ADR-0016)

1. **Firebase → Authentication → Método de login → Adicionar provedor → Google** → ativar →
   *Nome público do projeto*: `MotoboyContas` → *E-mail de suporte*: seu e-mail → **Salvar**.
2. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com), projeto
   `motoboy-contas`) → *APIs e serviços → Credenciais* → **Web client (auto created by Google Service)** →
   *URIs de redirecionamento autorizados* → **Adicionar URI** →
   `https://contas-motoboy-app-iphone.vercel.app/__/auth/handler` → **Salvar** (pode levar alguns minutos).
3. **Vercel → Environment Variables** → `VITE_FIREBASE_AUTH_DOMAIN` = `contas-motoboy-app-iphone.vercel.app`
   → **Redeploy**. O `vercel.json` já repassa `/__/auth/*` para o Firebase.
4. **Local:** deixar `VITE_FIREBASE_AUTH_DOMAIN=motoboy-contas.firebaseapp.com` no `.env` — no localhost o
   Google abre num popup.

> No iPhone, teste pelo endereço de produção: o botão leva para a tela do Google e volta já logado.

## Deploy (Vercel)

- Importar o repositório → framework **Vite** → build `npm run build`, saída `dist`.
- Variáveis de ambiente: as mesmas `VITE_*` do `.env` (sem o debug token em produção).
- `vercel.json` com rewrite para SPA (mesmo padrão do MegaMente).
- **Produção:** https://contas-motoboy-app-iphone.vercel.app (conta **pessoal** do dev na Vercel — time `megamente12`,
  plano Hobby, compartilhado com outros projetos pessoais).
  Cada push na `main` gera um deploy novo automaticamente.
- ⚠️ As URLs de cada deploy (`contas-motoboy-app-iphone-<hash>-megamente12.vercel.app`) pedem login na
  Vercel (Deployment Protection) e mudam a cada deploy. **Instale no iPhone sempre pelo domínio de
  produção**, que é fixo — o app instalado recebe as versões novas sozinho.

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `permission-denied` no Firestore | Regras não publicadas | Publicar `firestore.rules` no Console |
| "E-mail ou senha incorretos" logo no cadastro / erro `auth/operation-not-allowed` | Provedor E-mail/senha desligado | Authentication → Método de login → E-mail/senha → ativar |
| Login funciona no localhost mas não na Vercel | Domínio não autorizado | Authentication → Configurações → Domínios autorizados |
| Google mostra `redirect_uri_mismatch` | URI de redirecionamento não cadastrada | Google Cloud → Credenciais → Web client → adicionar `https://contas-motoboy-app-iphone.vercel.app/__/auth/handler` |
| Google volta para o app mas não loga (Vercel) | `VITE_FIREBASE_AUTH_DOMAIN` ainda é o `firebaseapp.com` | Trocar para `contas-motoboy-app-iphone.vercel.app` na Vercel e fazer Redeploy |
| Popup do Google não abre (localhost) | Pop-up bloqueado pelo navegador | Permitir pop-ups para `localhost` |
| App volta sempre para "Minha moto" | Bootstrap falhou (regras) ou a moto não salvou | Ver o console do navegador; publicar as regras |
| IA retorna erro de App Check (401/403) | Debug token não cadastrado ou domínio fora do reCAPTCHA | Cadastrar o token em *App Check → Manage debug tokens* / adicionar o domínio |
| "Adicionar à Tela de Início" abre como site comum | Acessado por `http` ou manifest inválido | Usar a URL HTTPS da Vercel; conferir o manifest no build |
| Celular não abre `http://IP:5173` | Redes diferentes ou firewall do macOS | Mesma rede Wi-Fi; permitir conexões de entrada para o Node |
| App instalado não mostra a versão nova | Service worker em cache | Fechar o app e abrir de novo |
