#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.auth_stack import AuthStack
from stacks.dns_stack import DnsStack
from stacks.github_deploy_stack import GithubDeployStack
from stacks.site_stack import SiteStack
from stacks.stage import LIVE, STAGING, ZONE_NAME

app = cdk.App()

# Everything lives in us-east-1: CloudFront only accepts ACM certificates from there.
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region="us-east-1")

# Deploy DNS first, then point GoDaddy's nameservers at it, then deploy the site.
dns = DnsStack(app, "UkdoshiDns", domain_name=ZONE_NAME, env=env)

# Two copies of the site: live (ukdoshi.com) and staging (staging.ukdoshi.com), each with its own
# sign-in, approved list and API. Auth needs the SES identity in UkdoshiDns verified before its first deploy.
for stage in (LIVE, STAGING):
    auth = AuthStack(app, stage.stack_name("Auth"), stage=stage, zone=dns.zone, env=env)
    SiteStack(
        app,
        stage.stack_name("Site"),
        stage=stage,
        zone=dns.zone,
        user_pool_id=auth.user_pool.user_pool_id,
        user_pool_client_id=auth.client.user_pool_client_id,
        env=env,
    )

# Deployed by hand, once: lets GitHub Actions deploy the stacks above on pushes to main (live) and staging.
# GitHub's token names the repo as owner@id/repo@id, so a renamed or recreated repo can't deploy.
GithubDeployStack(
    app,
    "UkdoshiGithubDeploy",
    repo="uttydoshi@83499703/ukdoshi-site@1431046389",
    branches=["main", "staging"],
    env=env,
)

app.synth()
