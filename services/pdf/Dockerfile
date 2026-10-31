# Contexto de build: raiz do repositório.
#   docker buildx build --platform linux/arm64 -f services/pdf/Dockerfile -t resume-markdown-studio:local .
# A VM é linux/arm64. As imagens node:22-bookworm-slim e o pacote chromium do Debian têm build arm64.
# O builder roda na arquitetura do runner: o bundle é JS puro e não depende de binário nativo do esbuild no runtime.

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS builder
WORKDIR /app

# Dependências da raiz: o bundle usa react, react-markdown e zod de lá.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY services/pdf/package.json services/pdf/package-lock.json ./services/pdf/
RUN npm ci --prefix services/pdf --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY services/pdf ./services/pdf
RUN npm --prefix services/pdf run build \
 && npm --prefix services/pdf prune --omit=dev

FROM node:22-bookworm-slim AS runtime

# Chromium do Debian (sem download no npm) e fonte Inter, usada pelo tema padrão.
# texlive mínimo para a rota /api/resumes/latex: base + classes/pacotes
# recomendados + extra (enumitem, titlesec) + fontes + idiomas + lmodern
# (fontes T1 escaláveis exigidas pelo microtype). Não instala o texlive-full.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      chromium fonts-inter fonts-liberation ca-certificates \
      texlive-latex-base texlive-latex-recommended texlive-latex-extra \
      texlive-fonts-recommended texlive-lang-portuguese texlive-lang-english \
      lmodern \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3333 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    HOME=/tmp

WORKDIR /app/services/pdf
COPY --from=builder /app/services/pdf/dist ./dist
COPY --from=builder /app/services/pdf/node_modules ./node_modules
COPY --from=builder /app/services/pdf/package.json ./package.json

USER node
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3333/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.mjs"]
