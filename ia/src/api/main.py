from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .routers import predictions, anomalies, chat, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ENGIPILOT IA — Démarrage du service IA")
    yield
    print("ENGIPILOT IA — Arrêt propre")


app = FastAPI(
    title="ENGIPILOT IA Service",
    description="Prédictions ML retards/coûts · Détection anomalies · Chat Copilot BTP",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://engipilot.ma"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(health.router,      prefix="/health",             tags=["Health"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Prédictions"])
app.include_router(anomalies.router,   prefix="/api/v1/anomalies",   tags=["Anomalies"])
app.include_router(chat.router,        prefix="/api/v1/chat",        tags=["Chat IA"])
