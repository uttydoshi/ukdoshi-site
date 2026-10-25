#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.auth_stack import AuthStack
from stacks.dns_stack import DnsStack
from stacks.github_deploy_stack import GithubDeployStack
from stacks.site_stack import SiteStack

DOMAIN_NAME = "ukdoshi.com"

app = cdk.App()

# Everything lives in us-east-1: CloudFront only accepts ACM certificates from there.
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region="us-east-1")

# Deploy DNS first, then point GoDaddy's nameservers at it, then deploy the site.
dns = DnsStack(app, "UkdoshiDns", domain_name=DOMAIN_NAME, env=env)
# Sign-in (Cognito). Needs the SES identity in UkdoshiDns to be verified before its first deploy.
auth = AuthStack(app, "UkdoshiAuth", domain_name=DOMAIN_NAME, zone=dns.zone, env=env)
SiteStack(
    app,
    "UkdoshiSite",
    domain_name=DOMAIN_NAME,
    zone=dns.zone,
    user_pool_id=auth.user_pool.user_pool_id,
    user_pool_client_id=auth.client.user_pool_client_id,
    env=env,
)

# Deployed by hand, once: lets GitHub Actions deploy the two stacks above on every push to main.
# GitHub's token names the repo as owner@id/repo@id, so a renamed or recreated repo can't deploy.
GithubDeployStack(app, "UkdoshiGithubDeploy", repo="uttydoshi@83499703/ukdoshi-site@1431046389", branch="main", env=env)

app.synth()
