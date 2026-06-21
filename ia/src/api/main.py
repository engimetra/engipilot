import os, time, logging
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from .routers import predictions, anomalies, chat, health

log = logging.getLogger("IA-Main")

# ── Rate limiter en mémoire (sliding window) ──────────────────────────────────
_rl_store: dict = defaultdict(list)
RL_WINDOW  = int(os.getenv("RL_WINDOW_SEC",  "60"))
RL_MAX_REQ = int(os.getenv("RL_MAX_REQ",     "30"))   # 30 req/min par IP


def _rate_limit(ip: str) -> None:
    now = time.time()
    window_start = now - RL_WINDOW
    _rl_store[ip] = [t for t in _rl_store[ip] if t > window_start]
    if len(_rl_store[ip]) >= RL_MAX_REQ:
        raise HTTPException(
            status_code=429,
            detail=f"Trop de requêtes — maximum {RL_MAX_REQ} par minute. Réessayez plus tard.",
        )
    _rl_store[ip].append(now)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("ENGIPILOT IA — Démarrage du service IA")
    # Pré-charger les modèles au démarrage
    try:
        from .routers.predictions import _evm_retard   # noqa: force import
        from src.ml.lstm_predictor import get_predictor
        get_predictor()
        log.info("LSTM chargé au démarrage")
    except Exception as e:
        log.warning(f"Pré-chargement LSTM: {e}")
    try:
        from src.ml.ae_predictor import get_ae
        get_ae()
        log.info("Autoencoder chargé au démarrage")
    except Exception as e:
        log.warning(f"Pré-chargement AE: {e}")
    yield
    log.info("ENGIPILOT IA — Arrêt propre")


app = FastAPI(
    title="ENGIPILOT IA Service",
    description="Prédictions ML retards/coûts · Détection anomalies · Chat Copilot BTP",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "IA_CORS_ORIGINS",
    "http://localhost:3000,https://engipilot.ma,https://www.engipilot.ma"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ── Rate limiting middleware ──────────────────────────────────────────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Exclure health check du rate limiting
    if request.url.path.startswith("/health"):
        return await call_next(request)
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
    try:
        _rate_limit(ip)
    except HTTPException as e:
        return JSONResponse(status_code=429, content={"detail": e.detail})
    return await call_next(request)


# ── Security headers ──────────────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router,      prefix="/health",             tags=["Health"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Prédictions"])
app.include_router(anomalies.router,   prefix="/api/v1/anomalies",   tags=["Anomalies"])
app.include_router(chat.router,        prefix="/api/v1/chat",        tags=["Chat IA"])

# ── Prometheus metrics ────────────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
