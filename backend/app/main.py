from fastapi import FastAPI
from mangum import Mangum

app = FastAPI(title="ukdoshi.com API")


@app.get("/api/hello")
def hello():
    return {"message": "Hello World"}


# Entry point for AWS Lambda (API Gateway HTTP API events -> ASGI).
handler = Mangum(app, lifespan="off")
