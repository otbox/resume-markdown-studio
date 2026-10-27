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

## Serviço de exportação PDF (`services/pdf`)

API HTTP separada do Next. Recebe um currículo em Markdown e devolve um PDF A4. Não usa banco nem Supabase.

### Abordagem escolhida

Chromium headless (puppeteer-core) renderiza os mesmos componentes do preview (`ResumeDocument` e `DecorativeShapes`). O bundle é feito com esbuild e lê `src/components/preview`, `src/config/templates` e `src/utils/parseResume`.

Alternativa descartada: pdfmake no servidor. Ela reimplementaria o layout em um segundo renderizador, que já diverge do preview. O editor continua usando pdfmake no browser.

Compensações do Chromium em container: roda com `--no-sandbox`, como usuário `node`, com `cap_drop: ALL`, `no-new-privileges`, sistema de arquivos somente leitura, JavaScript desligado e bloqueio de toda requisição de rede exceto `data:`. Imagens remotas no Markdown não carregam no PDF.

### Arquitetura de arquivos

- `services/pdf/src/server.ts`: rotas HTTP.
- `services/pdf/src/validate.ts`: validação do corpo e mesclagem de `theme` e `layout` sobre o template.
- `services/pdf/src/pdf.ts`: pool do Chromium, fila FIFO e tempo limite.
- `services/pdf/src/render-html.tsx`: HTML das páginas A4.
- `services/pdf/Dockerfile`: imagem `linux/arm64`. O builder roda na arquitetura do runner. O estágio final instala `chromium`, `fonts-inter` e `fonts-liberation` pelo apt do Debian. Não usa o Chromium snap.

### API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | não | `200 {"status":"ok"}` |
| GET | `/api/templates` | sim | Lista `[{ id, name, description }]` |
| POST | `/api/resumes` | sim | Gera o PDF |

Auth: `Authorization: Bearer <PDF_API_KEY>`. Sem chave configurada, a auth fica desligada (somente desenvolvimento).

Corpo de `POST /api/resumes` (JSON, máximo 1 MB):

```json
{
  "markdown": "---\nnome: Ana Souza\n...",
  "template": "classico",
  "theme": { "colors": { "primary": "#1e3a5f" } },
  "layout": { "columnWidths": { "left": 30, "main": 70, "right": 0 } }
}
```

- `markdown`: obrigatório.
- `template`: `classico` (padrão) ou `sidebar`.
- `theme` e `layout`: parciais. São mesclados sobre o template. Em `layout.sections`, o merge é feito pelo `id`. `columnWidths` precisa somar 100.

Respostas:

- `200`: `application/pdf`, com `Content-Disposition: attachment; filename="curriculo.pdf"`.
- `400 {"error"}`: corpo inválido, front matter inválido, nome ausente, template desconhecido ou tema/layout fora das regras.
- `401 {"error"}`: chave ausente ou errada.
- `404 {"error"}`: rota desconhecida.
- `413 {"error"}`: corpo maior que 1 MB.
- `500 {"error"}`: falha na renderização.

Exemplo:

```bash
curl -s -o curriculo.pdf \
  -H "Authorization: Bearer $PDF_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @<(jq -Rs '{markdown: ., template: "sidebar"}' examples/curriculo-exemplo.md) \
  http://127.0.0.1:3333/api/resumes
```

### Formato do Markdown

Front matter YAML simples no início, com pares `chave: valor`:

- `nome` (obrigatória), `cargo`, `email`, `telefone`, `linkedin`, `localizacao`.
- `foto`: lida e validada como texto, mas não renderizada. A prévia do editor também não mostra foto.

Sem front matter, vale o cabeçalho antigo: `# Nome | Cargo` seguido de linhas `> contato`. No editor, um front matter inválido não quebra a prévia. Quem valida é o serviço.

Régua `---` no início: um documento que começa com `---` é lido como front matter, mesmo que a linha seja uma régua. Se houver outro `---` mais abaixo, o trecho entre os dois é tratado como front matter. No serviço, linhas que não são `chave: valor` geram `400`. No editor, esse trecho some da prévia sem aviso. Para evitar, não comece o Markdown com `---` e não use régua no topo.

Seções aceitas: `## resumo`, `## experiencia`, `## formacao`, `## projetos`, `## hard-skills`, `## soft-skills`, `## contato`. Os rótulos no PDF são fixos em pt-BR, mesmo que o Markdown traga outro texto depois do `|`.

Veja um exemplo completo em `examples/curriculo-exemplo.md`.

### Variáveis de ambiente

| Variável | Padrão | Função |
|---|---|---|
| `PDF_API_KEY` | vazio | Obrigatória com `NODE_ENV=production`. Sem ela, o processo sai com código 1. |
| `PORT` | `3333` | Porta interna. |
| `PDF_MAX_CONCURRENCY` | `2` | Renderizações simultâneas (1 a 8). |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` na imagem | Só para rodar fora do Docker. |

### Executar localmente

Com Docker (imagem arm64, ou amd64 se preferir testar localmente):

```bash
docker buildx build --platform linux/arm64 -f services/pdf/Dockerfile -t resume-markdown-studio:local .
docker run --rm -p 127.0.0.1:3333:3333 -e PDF_API_KEY=troque-esta-chave resume-markdown-studio:local
```

Sem Docker, com um Chrome instalado no host. Instale antes as dependências da raiz, porque `react`, `react-dom` e `react-markdown` são resolvidos pela `node_modules` da raiz:

```bash
npm install
npm --prefix services/pdf install
npm --prefix services/pdf run build
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable node services/pdf/dist/server.mjs
```

### Operação na VM

- Imagem `linux/arm64`, para a VM Oracle (Ubuntu, aarch64). O Chromium vem do apt do Debian dentro da imagem, não do snap do Ubuntu.
- O serviço escuta em `0.0.0.0` na porta `PORT` (padrão `3333`).
- As rotas do serviço são `GET /health`, `GET /api/templates` e `POST /api/resumes`, sem prefixo.
- O container se chama `pdf-service` e fica só na rede `proxy`. Não há banco.
- Requisitos para o vhost do Nginx (ainda não configurado; o arquivo da VM está como `.pending`, e a configuração atual não foi lida):
  - Remover o prefixo `/pdf/` antes de encaminhar (`proxy_pass http://pdf-service:3333/;`), para que `/pdf/api/resumes` chegue como `/api/resumes`.
  - `client_max_body_size` de pelo menos 2m, para que o limite de 1 MB do serviço responda `413` em JSON e não o Nginx.

### Deploy

O workflow `.github/workflows/deploy.yml` roda em push na `main` quando há mudanças nos caminhos do serviço:

1. Gera a imagem `linux/arm64` com QEMU e buildx e publica em `ghcr.io/otbox/resume-markdown-studio` com a tag do SHA.
2. Copia `deploy/compose.yaml` e `deploy/deploy.sh` para `/opt/services/apps/resume-markdown-studio/` na VM.
3. Roda `deploy.sh` com a referência por digest. O script faz `pull`, `up`, aguarda `healthy` por até 60 s e reverte para `.deploy.previous.env` se falhar.

Passos manuais, feitos uma vez pelo usuário:

- Na VM, criar `/opt/services/apps/resume-markdown-studio/` e um arquivo `.env` com `PDF_API_KEY`, com `chmod 600`.
- No GitHub, criar o environment `production` com os secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` e `SSH_KNOWN_HOSTS`.
- Se o pacote no GHCR for privado, rodar `docker login ghcr.io` na VM.
- Criar o registro DNS e o vhost do Nginx quando o domínio for definido. O vhost aponta para `pdf-service:3333` na rede `proxy`. O serviço não publica porta no host.

### Limitações conhecidas

- Imagens remotas em Markdown não entram no PDF (bloqueio de rede).
- `foto` não é renderizada.
- A fonte Inter depende do pacote `fonts-inter`. Sem ele, o PDF usa outra fonte de sistema.
- Chromium roda com `--no-sandbox` dentro do container, com as compensações acima.
- A imagem `linux/arm64` não foi construída nem executada na última verificação, porque o daemon Docker estava parado no ambiente de desenvolvimento. O build, o workflow e o compose ainda precisam de uma execução real antes do primeiro deploy.
