from aws_cdk import CfnOutput, Stack
from aws_cdk import aws_iam as iam
from constructs import Construct


class GithubDeployStack(Stack):
    """Lets GitHub Actions deploy via OIDC, with no long-lived AWS keys stored in GitHub.

    Only pushes to `branches` of `repo` can assume the role, and the role can only assume the
    CDK bootstrap roles (cdk-*), which is all `cdk deploy` needs.
    """

    def __init__(self, scope: Construct, construct_id: str, *, repo: str, branches: list[str], **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        provider = iam.OidcProviderNative(
            self,
            "GithubOidc",
            url="https://token.actions.githubusercontent.com",
            client_ids=["sts.amazonaws.com"],
        )

        role = iam.Role(
            self,
            "DeployRole",
            role_name="ukdoshi-github-deploy",
            assumed_by=iam.WebIdentityPrincipal(
                provider.oidc_provider_arn,
                conditions={
                    "StringEquals": {
                        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                        "token.actions.githubusercontent.com:sub": [f"repo:{repo}:ref:refs/heads/{b}" for b in branches],
                    },
                },
            ),
            description=f"GitHub Actions deploys from {repo}, branches {", ".join(branches)}",
        )
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["sts:AssumeRole"],
                resources=[f"arn:aws:iam::{self.account}:role/cdk-*"],
            )
        )

        CfnOutput(self, "DeployRoleArn", value=role.role_arn, description="role-to-assume in the GitHub workflow")
