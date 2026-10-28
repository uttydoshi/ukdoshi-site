import time

import pytest
from botocore.exceptions import ClientError
from fastapi.testclient import TestClient

from app import join_requests
from app.auth import User
from app.main import app
from tests.test_auth import APPROVED, make_token  # noqa: F401  (reuses its fake Cognito fixture)
from tests.test_auth import fake_cognito_and_table  # noqa: F401

client = TestClient(app)


class FakeTable:
    """Just enough of a DynamoDB table: put_item honours the "not asked recently" condition."""

    def __init__(self):
        self.items = {}

    def get_item(self, Key):
        item = self.items.get(Key["email"])
        return {"Item": item} if item else {}

    def put_item(self, Item, ConditionExpression, ExpressionAttributeValues):
        existing = self.items.get(Item["email"])
        if existing and existing["asked_at"] >= ExpressionAttributeValues[":recently"]:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "PutItem")
        self.items[Item["email"]] = Item


class FakeSes:
    def __init__(self):
        self.sent = []

    def send_email(self, **email):
        self.sent.append(email)


@pytest.fixture
def table_and_ses(monkeypatch):
    table, ses = FakeTable(), FakeSes()
    monkeypatch.setattr(join_requests, "_table", lambda: table)
    monkeypatch.setattr(join_requests, "_ses", lambda: ses)
    monkeypatch.setattr(join_requests, "has_asked", lambda email: "Item" in table.get_item({"email": email}))
    return table, ses


def post(token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post("/api/inner-circle/join-requests", headers=headers)


def test_asking_to_join_requires_sign_in(table_and_ses):
    assert post().status_code == 401
    assert table_and_ses[1].sent == []


def test_asking_to_join_emails_the_owner_once_a_day(table_and_ses):
    table, ses = table_and_ses
    token = make_token(email="jane@example.com", name="Jane Citizen")

    assert post(token).json() == {"status": "asked"}
    assert post(token).json() == {"status": "asked"}  # a second click the same day sends nothing more
    assert len(ses.sent) == 1

    email = ses.sent[0]
    assert email["Destination"] == {"ToAddresses": [join_requests.OWNER_EMAIL]}
    assert email["ReplyToAddresses"] == ["jane@example.com"]
    assert email["Content"]["Simple"]["Subject"]["Data"].endswith("New request to join the Inner Circle")
    body = email["Content"]["Simple"]["Body"]["Text"]["Data"]
    assert "Jane Citizen (jane@example.com)" in body
    assert 'approve.sh add jane@example.com "Jane Citizen"' in body

    # The next day they may ask again.
    table.items["jane@example.com"]["asked_at"] -= join_requests.EMAIL_AT_MOST_EVERY + 1
    post(token)
    assert len(ses.sent) == 2


def test_me_shows_that_someone_has_asked(table_and_ses):
    token = make_token(email="jane@example.com")
    assert client.get("/api/me", headers={"Authorization": f"Bearer {token}"}).json()["asked"] is False
    post(token)
    assert client.get("/api/me", headers={"Authorization": f"Bearer {token}"}).json()["asked"] is True


def test_approved_people_do_not_need_to_ask(table_and_ses):
    assert post(make_token()).json() == {"status": "approved"}
    assert table_and_ses[1].sent == []


def test_staging_requests_are_marked_as_staging(monkeypatch):
    monkeypatch.setattr(join_requests, "STAGE", "staging")
    email = join_requests.email_to_owner(User(email="jane@example.com", name="Jane"), int(time.time()))
    assert email["Content"]["Simple"]["Subject"]["Data"].startswith("[Staging] ")
    assert "approve.sh --staging add jane@example.com" in email["Content"]["Simple"]["Body"]["Text"]["Data"]
