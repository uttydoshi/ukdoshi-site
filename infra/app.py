#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.dns_stack import DnsStack
from stacks.github_deploy_stack import GithubDeployStack
from stacks.site_stack import SiteStack

DOMAIN_NAME = "ukdoshi.com"

app = cdk.App()

# Everything lives in us-east-1: CloudFront only accepts ACM certificates from there.
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region="us-east-1")

# Deploy DNS first, then point GoDaddy's nameservers at it, then deploy the site.
dns = DnsStack(app, "UkdoshiDns", domain_name=DOMAIN_NAME, env=env)
SiteStack(app, "UkdoshiSite", domain_name=DOMAIN_NAME, zone=dns.zone, env=env)

# Deployed by hand, once: lets GitHub Actions deploy the two stacks above on every push to main.
GithubDeployStack(app, "UkdoshiGithubDeploy", repo="uttydoshi/ukdoshi-site", branch="main", env=env)

app.synth()
