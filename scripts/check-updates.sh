#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Vérifier les mises à jour des images Docker
# Comparer les versions épinglées avec les dernières disponibles
# ================================================================
echo "=== Vérification des mises à jour des images Docker ==="
echo ""
echo "Images actuellement utilisées dans docker-compose.yml :"
grep "image:" docker-compose.yml | grep -v "engipilot/" | \
  sed 's/.*image: //' | sort
echo ""
echo "Pour vérifier les dernières versions disponibles :"
echo "  https://hub.docker.com/_/postgres/tags"
echo "  https://hub.docker.com/_/redis/tags"
echo "  https://hub.docker.com/_/nginx/tags"
echo "  https://hub.docker.com/r/prom/prometheus/tags"
echo "  https://hub.docker.com/r/grafana/grafana/tags"
echo ""
echo "Après mise à jour, relancer : bash scripts/scan-images.sh"
