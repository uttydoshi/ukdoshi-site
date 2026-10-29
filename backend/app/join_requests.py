"""Requests to join the Inner Circle: remembered in DynamoDB and emailed to the site owner.

Each Google account can trigger at most one email a day, however often it clicks "Ask to join".
"""

import os
import time
from datetime import datetime, timezone
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

from app.auth import REGION, User

TABLE_NAME = os.environ.get("JOIN_REQUESTS_TABLE", "ukdoshi-join-requests")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "hello@ukdoshi.com")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "no-reply@ukdoshi.com")
STAGE = os.environ.get("STAGE", "")  # "" for live, "staging" for staging.ukdoshi.com

EMAIL_AT_MOST_EVERY = 24 * 60 * 60  # seconds
FORGET_AFTER = 30 * 24 * 60 * 60  # old requests expire, so someone can ask again later


@lru_cache
def _table():
    return boto3.resource("dynamodb", region_name=REGION).Table(TABLE_NAME)


@lru_cache
def _ses():
    return boto3.client("sesv2", region_name=REGION)


def has_asked(email: str) -> bool:
    return "Item" in _table().get_item(Key={"email": email})


def ask_to_join(user: User) -> bool:
    """Records the request and emails the owner. False if this person already asked in the last day."""
    now = int(time.time())
    try:
        _table().put_item(
            Item={"email": user.email, "name": user.name or "", "asked_at": now, "expires_at": now + FORGET_AFTER},
            ConditionExpression="attribute_not_exists(email) OR asked_at < :recently",
            ExpressionAttributeValues={":recently": now - EMAIL_AT_MOST_EVERY},
        )
    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise
    _ses().send_email(**email_to_owner(user, now))
    return True


def email_to_owner(user: User, asked_at: int) -> dict:
    """The SES send_email arguments: a plain-text note with who asked and how to let them in."""
    who = f"{user.name} ({user.email})" if user.name else user.email
    site = "staging.ukdoshi.com" if STAGE else "ukdoshi.com"
    approve = f'scripts/approve.sh {"--staging " if STAGE else ""}add {user.email} "{user.name or ""}"'
    when = datetime.fromtimestamp(asked_at, timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    body = (
        f"{who} has asked to join the Inner Circle on {site}.\n\n"
        f"To let them in, run:\n\n    {approve}\n\n"
        f"Reply to this email to answer them directly.\n\nAsked on {when}."
    )
    return {
        "FromEmailAddress": f"ukdoshi.com <{FROM_EMAIL}>",
        "Destination": {"ToAddresses": [OWNER_EMAIL]},
        "ReplyToAddresses": [user.email],
        "Content": {
            "Simple": {
                "Subject": {"Data": f"{'[Staging] ' if STAGE else ''}New request to join the Inner Circle"},
                "Body": {"Text": {"Data": body}},
            }
        },
    }
