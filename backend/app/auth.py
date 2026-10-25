"""Who is calling: verifies the Cognito ID token sent as `Authorization: Bearer <token>`."""

import os
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# Not secrets: these identify the user pool and the website's client. The Lambda gets them from
# CDK; the defaults are the live values, so local development needs no setup.
REGION = os.environ.get("COGNITO_REGION", "us-east-1")
USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "us-east-1_8jSxw7TJO")
CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "6kiv6va120pk34ud3isunm9lte")
ISSUER = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"


class User(BaseModel):
    email: str
    name: str | None = None
    picture: str | None = None


@lru_cache
def _signing_keys() -> jwt.PyJWKClient:
    # Cognito's public keys; fetched once per Lambda instance, then cached.
    return jwt.PyJWKClient(f"{ISSUER}/.well-known/jwks.json")


def verify_id_token(token: str) -> dict:
    """Returns the token's claims, or raises jwt.PyJWTError if it isn't a valid ID token for this site."""
    key = _signing_keys().get_signing_key_from_jwt(token).key
    claims = jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        audience=CLIENT_ID,
        issuer=ISSUER,
        options={"require": ["exp", "iat", "aud", "iss", "sub"]},
    )
    if claims.get("token_use") != "id":
        raise jwt.InvalidTokenError("Not an ID token")
    return claims


_bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> User:
    """FastAPI dependency: the signed-in user, or a 401/403 response."""
    if credentials is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Sign in required", headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        claims = verify_id_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Sign-in expired or invalid", headers={"WWW-Authenticate": "Bearer"}
        )

    # Access is granted by email address, so only trust addresses Google or Cognito has verified.
    email = claims.get("email")
    if not email or claims.get("email_verified") not in (True, "true"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your email address is not verified")
    return User(email=email.lower(), name=claims.get("name"), picture=claims.get("picture"))
