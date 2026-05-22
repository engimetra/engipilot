FROM python:3.11.11-slim-bookworm
# Version épinglée : python:3.11.11-slim-bookworm (Debian Bookworm)

# Mettre à jour les packages système pour corriger les CVE
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        curl \
        gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dépendances Python (séparées pour le cache Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Code applicatif
COPY . .

# Utilisateur non-root
RUN useradd -m -u 1000 -s /bin/bash engipilot && \
    chown -R engipilot:engipilot /app

USER engipilot
EXPOSE 8001

# HEALTHCHECK intégré
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "src.api.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8001", \
     "--workers", "2", \
     "--access-log"]
