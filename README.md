# ukdoshi.com

Angular frontend + Python (FastAPI) backend, hosted on AWS, defined with AWS CDK (Python).

```
                ukdoshi.com  (Route 53)
                      │
                 CloudFront  (HTTPS, ACM cert)
                 /          \
        /*  (default)      /api/*
             │                 │
        S3 bucket         API Gateway (HTTP API)
     (Angular build)          │
                           Lambda (FastAPI via Mangum)
```

| Folder      | What                                   |
|-------------|----------------------------------------|
| `frontend/` | Angular app                            |
| `backend/`  | FastAPI app (`app/main.py`) + tests    |
| `infra/`    | CDK app: `UkdoshiDns` and `UkdoshiSite` stacks |

## Local development

```bash
# Backend: http://localhost:8000/api/hello
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest
.venv/bin/uvicorn app.main:app --reload

# Frontend: http://localhost:4200  (proxies /api to :8000)
cd frontend
npm install
npm test -- --watch=false
npm start
```

## Deploying to AWS

One-time setup:

```bash
aws configure sso            # profile name: ukdoshi
aws sso login --profile ukdoshi
export AWS_PROFILE=ukdoshi

cd infra
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cdk bootstrap
```

First deploy (DNS handover from GoDaddy):

1. `cdk deploy UkdoshiDns` — prints four Route 53 nameservers.
2. GoDaddy → *My Products* → ukdoshi.com → *DNS* → *Nameservers* → *Change* →
   *I'll use my own nameservers* → enter the four values (without trailing dots).
3. Wait until `dig NS ukdoshi.com +short` shows the AWS nameservers.

Every deploy after that happens automatically: pushing to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which tests the backend, builds the
frontend and runs `cdk deploy UkdoshiDns UkdoshiAuth UkdoshiSite`. Watch it on the repo's **Actions** tab; use
**Run workflow** there to redeploy by hand. GitHub logs in to AWS via OIDC (no stored keys), using
the role from the `UkdoshiGithubDeploy` stack, which is deployed by hand once:

```bash
cd infra && cdk deploy UkdoshiGithubDeploy
```

To deploy from your machine instead:

```bash
cd frontend && npm run build
cd ../infra && cdk deploy UkdoshiSite
```

The first `UkdoshiSite` deploy takes ~5–15 minutes (certificate validation + CloudFront).
