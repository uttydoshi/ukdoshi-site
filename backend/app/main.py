from fastapi import Depends, FastAPI, Request
from mangum import Mangum

from app import approvals
from app.auth import User, current_user

app = FastAPI(title="ukdoshi.com API")

# The Inner Circle's tiles. They live here, not in the website's code, because the browser downloads
# all of that code whether or not anyone signs in; the API only hands these to approved visitors.
TILES = [
    {"id": "my-story", "title": "My Story"},
    {"id": "some-clicks", "title": "Some Clicks"},
]


@app.middleware("http")
async def no_store(request: Request, call_next):
    """Answers can be personal, so browsers mustn't keep a copy (e.g. for the back button after sign-out)."""
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/hello")
def hello():
    return {"message": "Hello World"}


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    """Who is signed in, and whether they may see the Inner Circle."""
    return {**user.model_dump(), "approved": approvals.is_approved(user.email)}


@app.get("/api/restricted/welcome")
def restricted_welcome(user: User = Depends(approvals.approved_user)):
    return {"message": f"Welcome to the Inner Circle, {user.name or user.email}.", "tiles": TILES}


# Entry point for AWS Lambda (API Gateway HTTP API events -> ASGI).
handler = Mangum(app, lifespan="off")
