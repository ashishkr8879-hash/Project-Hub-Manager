#!/bin/bash
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Divayshakati Project Manager — Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .env file exists
if [ ! -f ".env" ]; then
  echo ""
  echo "❌  ERROR: .env file not found."
  echo "   Copy .env.production.example to .env and fill in your values:"
  echo ""
  echo "   cp .env.production.example .env"
  echo "   nano .env"
  echo ""
  exit 1
fi

# Check DOMAIN is set
source .env
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
  echo ""
  echo "❌  ERROR: Set your DOMAIN in the .env file."
  echo ""
  exit 1
fi

echo ""
echo "▶  Domain   : $DOMAIN"
echo "▶  Building and starting services..."
echo ""

docker compose --env-file .env down --remove-orphans 2>/dev/null || true
docker compose --env-file .env build --no-cache
docker compose --env-file .env up -d

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  App is live at http://$DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Useful commands:"
echo "  docker compose logs -f         → see live logs"
echo "  docker compose down            → stop the app"
echo "  bash deploy.sh                 → redeploy after changes"
echo ""
