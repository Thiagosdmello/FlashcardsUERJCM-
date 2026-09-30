# Flashcards CT dos Acadêmicos — UERJ R+ CM (versão arquivo único)

O app inteiro está no `index.html`. Não tem build: a Vercel só publica os arquivos como estão.

## 1. Supabase

1. Crie um projeto em <https://supabase.com/dashboard>.
2. **SQL Editor → New query**: cole o conteúdo de `supabase/progresso.sql` e clique em **Run**. Isso cria a tabela `progresso`, onde cada conta só lê e grava o próprio progresso.
3. **Authentication → Sign In / Providers**: deixe **Email** ativado.
   - Com **Confirm email** ligado, o aluno precisa clicar no link do e-mail antes de entrar.
   - Para uso pessoal, pode desligar: a conta entra direto.
4. **Project Settings → API** (ou botão **Connect**): copie a **Project URL** e a chave **anon / publishable**.

## 2. Colocar a URL e a chave no `index.html` (pelo GitHub)

1. No repositório do GitHub, abra `index.html` e clique no lápis (**Edit this file**).
2. Logo no começo do arquivo está este bloco:

   ```js
   window.CTFC_CLOUD = {
     url: '',
     anonKey: ''
   };
   ```

3. Cole os valores entre as aspas:

   ```js
   window.CTFC_CLOUD = {
     url: 'https://abcd1234.supabase.co',
     anonKey: 'eyJhbGciOi...'
   };
   ```

4. **Commit changes**. A Vercel publica a nova versão sozinha em alguns segundos.

Deixando os dois campos vazios, o app funciona só no aparelho, sem login na nuvem.

> A chave anon pode ficar pública no arquivo: quem protege os dados são as políticas do SQL. **Nunca** cole a chave `service_role`.

## 3. GitHub e Vercel

1. Crie um repositório no GitHub e suba todos os arquivos desta pasta (dá para arrastar pelo site: **Add file → Upload files**).
2. Em <https://vercel.com/new>, importe o repositório. **Framework Preset: Other**, sem comando de build. Clique em **Deploy**.
3. Volte ao Supabase, em **Authentication → URL Configuration**, e coloque o endereço da Vercel em **Site URL** (é para onde o link de confirmação leva).

## 4. Instalar no celular

- **iPhone**: Safari → Compartilhar → **Adicionar à Tela de Início**.
- **Android**: Chrome → menu → **Instalar app**.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app completo (441 flashcards); configuração do Supabase no topo |
| `supabase/progresso.sql` | Tabela e regras de segurança do progresso |
| `manifest.webmanifest`, `sw.js`, `icon-*.png`, `apple-touch-icon.png` | Instalação como app e funcionamento offline |
| `vercel.json` | Cabeçalhos de cache para a Vercel |

A biblioteca do Supabase é carregada do jsDelivr (`@supabase/supabase-js@2.117.2`).
