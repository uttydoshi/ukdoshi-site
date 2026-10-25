from fastapi import Depends, FastAPI
from mangum import Mangum

from app import approvals
from app.auth import User, current_user

app = FastAPI(title="ukdoshi.com API")


@app.get("/api/hello")
def hello():
    return {"message": "Hello World"}


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    """Who is signed in, and whether they may see the Inner Circle."""
    return {**user.model_dump(), "approved": approvals.is_approved(user.email)}


@app.get("/api/restricted/welcome")
def restricted_welcome(user: User = Depends(approvals.approved_user)):
    return {"message": f"Welcome to the Inner Circle, {user.name or user.email}."}


# Entry point for AWS Lambda (API Gateway HTTP API events -> ASGI).
handler = Mangum(app, lifespan="off")
