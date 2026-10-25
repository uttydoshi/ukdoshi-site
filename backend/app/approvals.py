"""Who may see restricted content: email addresses in the approved DynamoDB table."""

import os
from functools import lru_cache

import boto3
from fastapi import Depends, HTTPException, status

from app.auth import REGION, User, current_user

TABLE_NAME = os.environ.get("APPROVED_TABLE", "ukdoshi-approved")


@lru_cache
def _table():
    return boto3.resource("dynamodb", region_name=REGION).Table(TABLE_NAME)


def is_approved(email: str) -> bool:
    return "Item" in _table().get_item(Key={"email": email.lower()})


def approved_user(user: User = Depends(current_user)) -> User:
    """FastAPI dependency: the signed-in user if approved, otherwise a 403 response."""
    if not is_approved(user.email):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You don't have access yet")
    return user
