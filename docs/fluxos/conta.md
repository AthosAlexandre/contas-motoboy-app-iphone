# Conta: Entrar, Criar conta, Esqueci a senha (`/conta/...`)

Arquivos: `src/pages/auth/` · layout `src/templates/AuthLayout.vue` · estado `src/stores/session.ts`.
Telas públicas: quem já está logado e abre uma delas vai para **Hoje**.

## Entrar (`/conta/entrar`)
1. **Continuar com Google** (produção: sai para o Google e volta logado; localhost: popup) **ou**
   e-mail + senha (`McPasswordField`) → **Entrar**.
2. Deu certo → volta para a tela que a pessoa tentou abrir (`?redirect=`, só caminhos internos) ou Hoje.
3. Erro aparece dentro do card: "E-mail ou senha incorretos", "Sem conexão"…
4. Links: **Esqueci a senha** e **Criar conta**.
- Modo local: aviso "qualquer e-mail entra e os dados ficam só neste aparelho".
- Erro na volta do Google (ex.: e-mail já cadastrado com senha) aparece nesta tela depois do redirecionamento.

## Criar conta (`/conta/criar`)
1. **Criar conta com Google** (usa nome e e-mail do Google) **ou** nome, e-mail e senha (mínimo 6; o iPhone
   sugere senha forte) → **Criar conta**.
2. O Firebase cria o usuário, grava o nome e o **bootstrap** cria `users/{uid}` com Ajustes e plataformas.
3. Conta nova não tem moto → a guarda leva para **Minha moto**.

## Esqueci a senha (`/conta/esqueci-senha`)
1. E-mail → **Enviar link** → mensagem "se houver uma conta com esse e-mail, você vai receber um link"
   (não revela se o e-mail existe). E-mail em português (`languageCode = 'pt-BR'`).

## Guardas de rota
- Sem login → Entrar (com `?redirect=` da tela pedida).
- Logado sem moto → Minha moto.
- Sessão caiu com o app aberto → volta para Entrar (`App.vue`).

## Consome / dispara
- `actions/auth`: `signIn`, `signUp`, `signInWithGoogle`, `googleRedirectError`, `sendPasswordReset`, `signOut` — cada uma só termina quando a sessão
  e os repositórios do usuário já trocaram.
