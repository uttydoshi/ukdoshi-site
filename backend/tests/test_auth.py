import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app import approvals, auth, join_requests
from app.main import app

client = TestClient(app)

# A throwaway key standing in for Cognito's, so tests sign real tokens without the network.
_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
APPROVED = {"approved@example.com"}


@pytest.fixture(autouse=True)
def fake_cognito_and_table(monkeypatch):
    signing_keys = SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=_KEY.public_key()))
    monkeypatch.setattr(auth, "_signing_keys", lambda: signing_keys)
    monkeypatch.setattr(approvals, "is_approved", lambda email: email in APPROVED)
    monkeypatch.setattr(join_requests, "has_asked", lambda email: False)


def make_token(**overrides) -> str:
    now = int(time.time())
    claims = {
        "iss": auth.ISSUER,
        "aud": auth.CLIENT_ID,
        "sub": "user-123",
        "token_use": "id",
        "iat": now,
        "exp": now + 3600,
        "email": "Approved@Example.com",
        "email_verified": True,
        "name": "Test User",
    }
    claims.update(overrides)
    return jwt.encode({k: v for k, v in claims.items() if v is not None}, _KEY, algorithm="RS256")


def get(path: str, token: str | None = None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.get(path, headers=headers)


def test_me_requires_sign_in():
    response = get("/api/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Sign in required"}


def test_me_returns_the_user_and_approval():
    response = get("/api/me", make_token())
    assert response.status_code == 200
    assert response.json() == {
        "email": "approved@example.com",
        "name": "Test User",
        "picture": None,
        "approved": True,
        "asked": False,
    }


def test_me_for_someone_not_approved():
    response = get("/api/me", make_token(email="stranger@example.com"))
    assert response.status_code == 200
    assert response.json()["approved"] is False


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int(time.time()) - 10},  # expired
        {"aud": "some-other-client"},  # issued for a different app
        {"iss": "https://example.com/not-cognito"},  # issued by someone else
        {"token_use": "access"},  # an access token, not an ID token
    ],
)
def test_rejects_invalid_tokens(overrides):
    assert get("/api/me", make_token(**overrides)).status_code == 401


def test_rejects_garbage_token():
    assert get("/api/me", "not-a-token").status_code == 401


def test_rejects_token_signed_with_another_key():
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    forged = jwt.encode(jwt.decode(make_token(), options={"verify_signature": False}), other_key, algorithm="RS256")
    assert get("/api/me", forged).status_code == 401


@pytest.mark.parametrize("verified", [False, "false", None])
def test_rejects_unverified_email(verified):
    response = get("/api/me", make_token(email_verified=verified))
    assert response.status_code == 403


def test_restricted_content_for_approved_user():
    response = get("/api/restricted/welcome", make_token())
    assert response.status_code == 200
    assert response.json()["message"] == "Welcome to the Inner Circle, Test User."
    assert [tile["title"] for tile in response.json()["tiles"]] == ["My Story", "Some Clicks"]
    assert response.headers["Cache-Control"] == "no-store"


def test_restricted_content_refused_when_not_approved():
    response = get("/api/restricted/welcome", make_token(email="stranger@example.com"))
    assert response.status_code == 403
    assert response.json() == {"detail": "You don't have access yet"}
    assert "My Story" not in response.text


def test_restricted_content_requires_sign_in():
    response = get("/api/restricted/welcome")
    assert response.status_code == 401
    assert "My Story" not in response.text
