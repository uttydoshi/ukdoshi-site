from fastapi import Depends, FastAPI, Request
from mangum import Mangum

from app import approvals, join_requests
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
    """Who is signed in, whether they may see the Inner Circle, and if not, whether they've asked to."""
    approved = approvals.is_approved(user.email)
    asked = not approved and join_requests.has_asked(user.email)
    return {**user.model_dump(), "approved": approved, "asked": asked}


@app.post("/api/inner-circle/join-requests")
def ask_to_join(user: User = Depends(current_user)):
    """A signed-in visitor asks to join; the owner gets an email (at most one a day per person)."""
    if approvals.is_approved(user.email):
        return {"status": "approved"}
    join_requests.ask_to_join(user)
    return {"status": "asked"}


@app.get("/api/restricted/welcome")
def restricted_welcome(user: User = Depends(approvals.approved_user)):
    return {"message": f"Welcome to the Inner Circle, {user.name or user.email}.", "tiles": TILES}


# Entry point for AWS Lambda (API Gateway HTTP API events -> ASGI).
handler = Mangum(app, lifespan="off")
