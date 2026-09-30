# Flashcards CT dos Acadêmicos — UERJ R+ CM

Web app de flashcards para a prova de R+ Clínica Médica da UERJ: 441 cartas em 11 temas, revisão espaçada FSRS-5, plano de estudo, estatísticas, sequência e troféus. Funciona como PWA (instala na tela inicial do celular e abre offline) e sincroniza o progresso entre aparelhos pelo Supabase.

- **Sem Supabase configurado**: o app roda 100% no aparelho (localStorage).
- **Com Supabase**: login por e-mail e senha; o progresso de cada conta fica na nuvem e aparece em qualquer aparelho.

---

## 1. Supabase (≈ 5 min)

1. Crie um projeto em <https://supabase.com/dashboard>.
2. **Tabela**: abra **SQL Editor → New query**, cole o conteúdo de `supabase/migrations/20260930120000_progresso.sql` e clique em **Run**.
   (Com a CLI do Supabase: `supabase link --project-ref SEU_REF` e `supabase db push`.)
3. **Login por e-mail**: em **Authentication → Sign In / Providers**, deixe **Email** ativado.
   - **Confirm email** ligado (padrão): o aluno precisa clicar no link do e-mail antes de entrar. O app avisa isso na tela.
   - Para uso pessoal, pode desligar: a conta entra direto após o cadastro.
4. **URL do site** (depois do passo 3): em **Authentication → URL Configuration**, coloque em **Site URL** o endereço da Vercel (ex.: `https://flashcards-ct.vercel.app`). É para onde o link de confirmação leva.
5. **Chaves**: em **Project Settings → API** (ou botão **Connect**), copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon / publishable key** → `SUPABASE_ANON_KEY`

> A chave anon pode ficar pública: a segurança vem das políticas RLS (cada usuário só lê e grava a própria linha). **Nunca** use a chave `service_role` no app.

## 2. GitHub

```bash
cd flashcards-ct
git init
git add .
git commit -m "Flashcards CT — UERJ R+ CM"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/flashcards-ct.git
git push -u origin main
```

O `.gitignore` já deixa de fora `public/` (gerado no build), `node_modules/` e `.env`.

## 3. Vercel

1. <https://vercel.com/new> → **Import** o repositório do GitHub.
2. **Framework Preset**: *Other*. Build, install e pasta de saída já vêm do `vercel.json` (`node tools/build_app.js --web` → `public/`). Não há dependências para instalar.
3. **Environment Variables**: adicione `SUPABASE_URL` e `SUPABASE_ANON_KEY` (Production e Preview).
4. **Deploy**. O log do build mostra `Supabase ATIVO (...)` quando as variáveis foram lidas.
5. Volte ao Supabase e ponha a URL da Vercel em **Site URL** (passo 1.4).

Se mudar as variáveis depois, faça **Redeploy**: elas entram no build.

## 4. Instalar no celular

- **iPhone**: abra o endereço no Safari → Compartilhar → **Adicionar à Tela de Início**.
- **Android**: Chrome → menu → **Instalar app**.

O app abre offline. Sem internet, o progresso fica no aparelho e é enviado quando a conexão volta (o Perfil mostra o estado: *Sincronizado*, *Sincronizando…* ou *Sem conexão*).

---

## Como funciona a sincronização

- Tabela `public.progresso`: uma linha por usuário (`user_id`, `dados` em JSON, `atualizado_em`).
- `dados` guarda tudo: estado FSRS de cada carta, histórico diário, plano, troféus, favoritos, listas e baralhos próprios.
- Cada resposta salva no aparelho na hora e envia para a nuvem após 1,5 s (agrupa várias respostas seguidas).
- Ao entrar ou voltar para o app, ele compara as duas versões e fica com a **mais recente** (última gravação vence). Evite estudar ao mesmo tempo em dois aparelhos sem internet.
- Atalhos de teclado e tema claro/escuro ficam só no aparelho.

## Estrutura

| Pasta/arquivo | O que é |
|---|---|
| `content/*.js` | Conteúdo: um arquivo por tema (fonte da verdade das cartas) |
| `tools/gen_uerj.js` | Monta `src/decks.json` a partir de `content/` |
| `src/shell.html` | CSS + telas estáticas (landing, login) |
| `src/logic.js` | Lógica do app (FSRS-5, plano, streak, busca, nuvem) |
| `src/decks.json` | Conteúdo montado (vai embutido no HTML) |
| `tools/build_app.js` | `--web` → `public/` (Vercel) · sem flag → `dist/` (artifact) |
| `web/` | Manifest, service worker, ícones e `vendor/supabase.js` (supabase-js 2.x, sem CDN) |
| `supabase/migrations/` | SQL da tabela e das políticas RLS |
| `tests/` | Testes Playwright (inclui o modo nuvem com Supabase simulado) |

## Editar o conteúdo

1. Edite o tema em `content/<tema>.js`. Cada carta é `C('chave', ano, 'frente', 'verso', 'macete opcional')`.
   **Não mude a chave de uma carta existente**: ela é a identidade do progresso.
2. `npm run conteudo` (gera `src/decks.json`) e `npm run validar` (tamanho, SVG, ids e duplicatas).
3. `git commit` + `git push` → a Vercel publica sozinha.

## Rodar localmente

```bash
cp .env.example .env      # opcional: preencha para testar com o Supabase
npm run build             # gera public/
npx serve public          # abre em http://localhost:3000
```

Testes (baixam o Playwright na primeira vez): `npm test`.
