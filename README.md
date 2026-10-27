# Resume AI Tailor

Sistema multi-usuário que analisa vagas de emprego com IA (Gemini) e gera currículos adaptados ao seu perfil, com preview A4 e exportação PDF.

## Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth, Postgres, Storage)
- **Prisma ORM**
- **Google Gemini** (análise de vaga, extração de PDF, geração de currículo)
- **Deploy:** Vercel

## Funcionalidades

- Login/cadastro multi-usuário (Supabase Auth)
- Importação de currículo via PDF com extração IA
- CRUD de perfil, experiências, formação, projetos e skills
- Análise de vaga com match score, gaps e recomendações
- Geração de currículo adaptado em Markdown
- Resume Studio: editor + preview A4 + tema/layout reutilizável + export PDF

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

### 3. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie URL e anon key para `.env.local`
3. Copie connection strings (pooler + direct) para Prisma
4. Execute a migration: `npm run db:deploy`
5. Execute `supabase/storage-setup.sql` no SQL Editor
6. Habilite Auth por e-mail/senha no dashboard

### 4. Gemini

Obtenha uma API key em [Google AI Studio](https://aistudio.google.com/) e adicione `GEMINI_API_KEY` ao `.env.local`.

### 5. Rodar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure todas as env vars do `.env.example`
3. Build command: `prisma generate && next build` (já configurado)
4. Antes do primeiro deploy, rode `npm run db:deploy` com `DIRECT_URL` apontando para o Supabase

## Estrutura

```
src/
  app/           # Pages e API routes
  components/    # Preview A4, painéis, forms
  config/        # Tema e layout default
  hooks/         # usePdfExport
  lib/           # Prisma, Supabase, Gemini
  types/         # Schemas Zod e tipos
  utils/         # parseResume, profileToMarkdown
prisma/          # Schema e migrations
supabase/        # SQL auxiliar (Storage RLS)
```

## Fluxo do usuário

1. Criar conta → configurar perfil (PDF ou manual)
2. Adicionar/editar experiências
3. Colar descrição da vaga → analisar
4. Gerar currículo adaptado → abrir no Studio
5. Ajustar Markdown, tema e layout → exportar PDF
