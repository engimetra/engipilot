"""Middleware JWT pour le service IA.

Valide le token Bearer émis par le backend Node.js.
Utilise la même clé JWT_SECRET que le backend.
"""

import os, logging
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

log = logging.getLogger("JWT-Auth")
JWT_SECRET = os.getenv("JWT_SECRET", "")
SKIP_AUTH  = os.getenv("IA_SKIP_AUTH", "false").lower() == "true"

_bearer = HTTPBearer(auto_error=False)

try:
    import jwt as pyjwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    log.warning("PyJWT non installé — auth désactivée. pip install PyJWT")


def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
) -> dict:
    """Dépendance FastAPI : valide le JWT et retourne le payload."""
    if SKIP_AUTH or not JWT_SECRET or not JWT_AVAILABLE:
        # En dev ou si JWT non configuré, on laisse passer
        return {"sub": "anonymous", "companyId": None}

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token d'authentification requis")

    try:
        payload = pyjwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=["HS256"],
        )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Token invalide: {e}")


def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
) -> Optional[dict]:
    """Dépendance FastAPI : valide le JWT si présent, retourne None sinon."""
    if not credentials:
        return None
    try:
        return require_auth(credentials)
    except HTTPException:
        return None
