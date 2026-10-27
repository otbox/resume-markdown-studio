#!/usr/bin/env bash
# Uso: deploy.sh ghcr.io/otbox/resume-markdown-studio@sha256:<digest>
# Executado na VM em /opt/services/apps/resume-markdown-studio/. Não imprime o conteúdo de .env.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="pdf-service"
IMAGE_PATTERN='^ghcr\.io/otbox/resume-markdown-studio@sha256:[0-9a-f]{64}$'
HEALTH_TIMEOUT=60

die() {
  echo "erro: $*" >&2
  exit 1
}

compose() {
  sudo docker compose --env-file .deploy.env "$@"
}

wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT)) cid status
  while ((SECONDS < deadline)); do
    cid="$(compose ps -q "$SERVICE" 2>/dev/null || true)"
    if [[ -n "$cid" ]]; then
      status="$(sudo docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo none)"
      if [[ "$status" == "healthy" ]]; then
        return 0
      fi
    fi
    sleep 3
  done
  return 1
}

write_env() {
  printf 'APP_IMAGE=%s\n' "$1" > .deploy.env.tmp
  mv .deploy.env.tmp .deploy.env
}

cd "$APP_DIR"

IMAGE_REF="${1:-}"
[[ "$IMAGE_REF" =~ $IMAGE_PATTERN ]] || die "referência sem digest: use ghcr.io/otbox/${SERVICE}@sha256:<digest>"
[[ -f .env ]] || die ".env não encontrado em $APP_DIR (crie com chmod 600)."

if [[ -f .deploy.env ]]; then
  cp .deploy.env .deploy.previous.env
fi

write_env "$IMAGE_REF"
echo "Subindo $IMAGE_REF"

if compose pull && compose up -d --no-deps "$SERVICE" && wait_healthy; then
  echo "Deploy concluído: container healthy."
  exit 0
fi

echo "Deploy falhou: o container não ficou healthy em ${HEALTH_TIMEOUT}s." >&2
if [[ -f .deploy.previous.env ]]; then
  echo "Revertendo para a versão anterior." >&2
  cp .deploy.previous.env .deploy.env
  compose pull || true
  compose up -d --no-deps "$SERVICE" || true
else
  echo "Não há versão anterior para reverter." >&2
fi
exit 1
