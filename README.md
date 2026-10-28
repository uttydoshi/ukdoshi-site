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
| `infra/`    | CDK app: DNS, plus sign-in and site stacks for live and staging |

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

Every deploy after that happens automatically. A push runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which tests the backend, builds the
frontend and deploys it:

| Branch    | Site                        | Stacks                                   |
|-----------|-----------------------------|------------------------------------------|
| `staging` | https://staging.ukdoshi.com | `UkdoshiStagingAuth`, `UkdoshiStagingSite` |
| `main`    | https://ukdoshi.com         | `UkdoshiDns`, `UkdoshiAuth`, `UkdoshiSite` |

Staging is a full, separate copy (own sign-in at auth-staging.ukdoshi.com, own approved list, own API)
that anyone can open, but search engines are asked not to list it. The usual flow:

```bash
git switch staging && git merge main     # start from what's live
# ...make changes, commit...
git push                                 # -> staging.ukdoshi.com; send the link to testers
git switch main && git merge staging && git push   # -> ukdoshi.com
```

Small fixes can still go straight to `main`. Watch deploys on the repo's **Actions** tab; use
**Run workflow** there to redeploy a branch by hand. GitHub logs in to AWS via OIDC (no stored keys), using
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

## Inner Circle access

`/inner-circle` is for approved people only. Sign-in is with Google only (no passwords, no email
codes); the API then checks each signed-in email against the `ukdoshi-approved` DynamoDB table.

```bash
aws sso login --profile ukdoshi
scripts/approve.sh add someone@gmail.com "How I know them"     # let their Google account in
scripts/approve.sh remove someone@gmail.com                    # take access away
scripts/approve.sh list
scripts/approve.sh --staging add tester@example.com "Testing"  # staging has its own list
```
