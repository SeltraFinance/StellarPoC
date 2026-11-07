#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, for example: root@your-droplet-ip}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_ROOT="/var/www/xlm.seltra.finance"
REMOTE_CADDY_TMP="/tmp/xlm.seltra.finance.caddy"

cd "$PROJECT_ROOT"

if [[ ! -d node_modules ]]; then
  npm ci
fi

npm run typecheck
npm run build

ssh "$DEPLOY_HOST" "install -d -o root -g root -m 755 '$DEPLOY_ROOT' /etc/caddy/sites"

rsync -az --delete \
  "$PROJECT_ROOT/dist/" \
  "$DEPLOY_HOST:$DEPLOY_ROOT/"

scp \
  "$PROJECT_ROOT/deploy/xlm.seltra.finance.caddy" \
  "$DEPLOY_HOST:$REMOTE_CADDY_TMP"

ssh "$DEPLOY_HOST" "
  chown -R root:root '$DEPLOY_ROOT'
  chmod -R u=rwX,go=rX '$DEPLOY_ROOT'
  install -o root -g root -m 644 '$REMOTE_CADDY_TMP' /etc/caddy/sites/xlm.seltra.finance.caddy
  grep -Fqx 'import /etc/caddy/sites/*.caddy' /etc/caddy/Caddyfile || printf '\nimport /etc/caddy/sites/*.caddy\n' >> /etc/caddy/Caddyfile
  caddy fmt --overwrite /etc/caddy/Caddyfile
  caddy fmt --overwrite /etc/caddy/sites/xlm.seltra.finance.caddy
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  systemctl reload caddy
"

echo "Deployment uploaded and Caddy reloaded."
echo "After DNS resolves, open https://xlm.seltra.finance"
