# Resume Markdown Studio

Editor de currículo com preview A4 em tempo real. Baseado em **Vite + React + TypeScript**.

## Conceito

- O conteúdo vem de `public/resume.md`
- A aparência é configurada por `theme.json` (exportável pelo app)
- A organização das seções é configurada por `layout.json` (exportável)

## Funcionalidades

- ✅ Editor Markdown inline
- ✅ Preview A4 fiel (794×1123px)
- ✅ Exportar PDF via `html2pdf.js`
- ✅ Importar/exportar `.md`, `layout.json`, `theme.json`
- ✅ Painel de Layout: visibilidade, ordem, região (esq/principal/dir) das seções
- ✅ Ajuste real de largura das colunas esquerda, principal e direita
- ✅ Painel de Tema: cores, tipografia, raio, espaçamento e formas decorativas SVG
- ✅ Seções: resumo, formação, experiência, projetos, hard-skills, soft-skills, contato
- ✅ Estado persistido em `sessionStorage` (sem backend)

## Estrutura

```
src/
  components/
    panels/     # SidePanel, LayoutPanel, ThemePanel
    preview/    # ResumePreview, ResumeHeader, ResumeSection, DecorativeShapes
  config/       # defaultLayout.ts, defaultTheme.ts
  hooks/        # usePdfExport.ts
  types/        # index.ts
  utils/        # parseResume.ts, exportImport.ts
  App.tsx
  main.tsx
  index.css
public/
  resume.md     # Conteúdo padrão do currículo
```

## Como rodar

```bash
npm install
npm run dev
```

## Seções suportadas no Markdown

Use headings `## ` com os IDs abaixo:

| ID | Label |
|---|---|
| `resumo` | Resumo |
| `experiencia` | Experiência |
| `formacao` | Formação |
| `projetos` | Projetos |
| `hard-skills` | Hard Skills |
| `soft-skills` | Soft Skills |
| `contato` | Contato |

O cabeçalho (nome, cargo, contatos) é detectado automaticamente pelo `# Título` no topo do arquivo.

## Exportação PDF

O PDF é gerado via `html2pdf.js` com configuração A4, escala 2x para qualidade. O elemento `#resume-a4` é renderizado diretamente — sem servidor.
