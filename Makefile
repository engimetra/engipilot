.PHONY: dev stop logs build test-all test-backend test-frontend test-ia db-seed train-ia clean help

dev: ## Démarrer tout ENGIPILOT
	@cp -n .env.example .env 2>/dev/null && echo "  .env créé depuis .env.example — penser à le configurer!" || true
	@docker compose up -d
	@echo ""
	@echo "  ╔════════════════════════════════════════════╗"
	@echo "  ║   ENGIPILOT démarré avec succès !          ║"
	@echo "  ╠════════════════════════════════════════════╣"
	@echo "  ║  Frontend  → http://localhost:3000         ║"
	@echo "  ║  Swagger   → http://localhost:8080/swagger-ui.html ║"
	@echo "  ║  IA docs   → http://localhost:8001/docs    ║"
	@echo "  ║  Grafana   → http://localhost:3001         ║"
	@echo "  ║  Login     → demo@engipilot.ma / demo123   ║"
	@echo "  ╚════════════════════════════════════════════╝"

stop: ## Arrêter les services (garde les données)
	docker compose down

logs: ## Voir les logs en temps réel
	docker compose logs -f

build: ## Rebuilder les images Docker
	docker compose build --no-cache

db-shell: ## Ouvrir le shell PostgreSQL
	docker exec -it engipilot-db psql -U admin -d engipilot

db-seed: ## Charger les données de démo
	docker exec -i engipilot-db psql -U admin -d engipilot < sql/seeds/01_demo.sql
	@echo "✅ Données de démo chargées"

test-backend: ## Lancer les tests Java
	cd backend && ./mvnw test -q

test-frontend: ## Lancer les tests frontend
	cd frontend && pnpm test

test-ia: ## Lancer les tests IA Python
	cd ia && python -m pytest tests/ -v

test-all: test-backend test-frontend test-ia ## Lancer tous les tests
	@echo "✅ Tous les tests passés"

train-ia: ## Entraîner les modèles ML
	cd ia && python src/training/train_all.py
	@echo "✅ 3 modèles ML entraînés dans ia/models/"

clean: ## Supprimer TOUTES les données Docker
	docker compose down -v
	@echo "⚠️  Toutes les données supprimées"

help: ## Afficher cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Cibles Sécurité (ajoutées suite recommandations encadreur) ────

scan: ## Scanner les images Docker avec Trivy (CVE)
	@bash scripts/scan-images.sh

scan-install: ## Installer Trivy localement
	@curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
		| sh -s -- -b /usr/local/bin v0.58.0
	@echo "Trivy installé : $$(trivy --version | head -1)"

check-updates: ## Vérifier les mises à jour des images Docker
	@bash scripts/check-updates.sh

setup-server: ## Configurer le serveur VPS (SSH dédié, firewall, fail2ban)
	@echo "Usage : ssh root@<IP_SERVEUR> 'bash -s' < scripts/setup-server.sh"
	@echo "OU sur le serveur : sudo bash scripts/setup-server.sh"

security-check: ## Vérification complète de la sécurité
	@echo "=== Vérification sécurité ENGIPILOT ==="
	@echo ""
	@echo "1. Variables d'environnement sensibles..."
	@grep -v "^#\|^$$" .env | grep -E "SECRET|PASSWORD|KEY" | \
		awk -F= '{printf "  %-30s : %d chars\n", $$1, length($$2)}'
	@echo ""
	@echo "2. Versions des images Docker..."
	@grep "image:" docker-compose.yml | grep -v "engipilot/" | \
		sed 's/.*image:/  /'
	@echo ""
	@echo "3. Utilisateurs non-root dans les Dockerfiles..."
	@for f in backend/Dockerfile ia/Dockerfile frontend/Dockerfile.prod; do \
		if grep -q "^USER " $$f 2>/dev/null; then \
			echo "  ✅ $$f : USER configuré"; \
		else \
			echo "  ❌ $$f : USER manquant"; \
		fi; \
	done
