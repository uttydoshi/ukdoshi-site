import shutil
import subprocess
import sys
from pathlib import Path

import jsii
from aws_cdk import (
    Annotations,
    BundlingOptions,
    CfnOutput,
    Duration,
    ILocalBundling,
    RemovalPolicy,
    Stack,
)
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_certificatemanager as acm
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_route53_targets as targets
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from constructs import Construct

from stacks.stage import OWNER_EMAIL, ZONE_NAME, Stage

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist" / "frontend" / "browser"

LAMBDA_RUNTIME = lambda_.Runtime.PYTHON_3_13
LAMBDA_PYTHON_VERSION = "3.13"

# Rewrites extension-less paths (Angular client-side routes) to index.html.
# Attached only to the S3 behavior, so /api/* responses are never rewritten.
# Staging only: the same rewrite, behind a browser password prompt. The expected credentials (base64 of
# "user:password") live in a CloudFront key-value store, set by scripts/staging-password.sh and never in
# code. Until they're set, everyone is refused. /api/* isn't covered: it shares the Authorization header
# with sign-in tokens, and already requires sign-in for anything private.
PASSWORD_REWRITE_JS = """
import cf from 'cloudfront';

const store = cf.kvs('KVS_ID');

async function handler(event) {
  var request = event.request;
  var expected = null;
  try {
    expected = await store.get('basic-auth');
  } catch (e) {}
  var given = request.headers.authorization ? request.headers.authorization.value : '';
  if (!expected || given !== 'Basic ' + expected) {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: { 'www-authenticate': { value: 'Basic realm="ukdoshi staging", charset="UTF-8"' } },
    };
  }
  if (!request.uri.includes('.')) {
    request.uri = '/index.html';
  }
  return request;
}
"""

SPA_REWRITE_JS = """
function handler(event) {
  var request = event.request;
  if (!request.uri.includes('.')) {
    request.uri = '/index.html';
  }
  return request;
}
"""


@jsii.implements(ILocalBundling)
class PipLocalBundling:
    """Bundles the Lambda without Docker by downloading Linux arm64 wheels with the local pip."""

    def try_bundle(self, output_dir: str, *args, **kwargs) -> bool:
        subprocess.run(
            [
                sys.executable, "-m", "pip", "install",
                "-r", str(BACKEND_DIR / "requirements.txt"),
                "--target", output_dir,
                "--platform", "manylinux2014_aarch64",
                "--implementation", "cp",
                "--python-version", LAMBDA_PYTHON_VERSION,
                "--only-binary=:all:",
                "--upgrade",
                "--quiet",
            ],
            check=True,
        )
        shutil.copytree(
            BACKEND_DIR / "app",
            Path(output_dir) / "app",
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns("__pycache__"),
        )
        return True


class SiteStack(Stack):
    """Angular on S3 + CloudFront, FastAPI on Lambda + API Gateway, served together on one domain."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        stage: Stage,
        zone: route53.IHostedZone,
        user_pool_id: str,
        user_pool_client_id: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        domain_name, *aliases = stage.site_names

        # --- Approved list: email addresses allowed into the Inner Circle ---
        approved = dynamodb.TableV2(
            self,
            "ApprovedTable",
            table_name=stage.approved_table,
            partition_key=dynamodb.Attribute(name="email", type=dynamodb.AttributeType.STRING),
            deletion_protection=stage.protect,
            removal_policy=RemovalPolicy.RETAIN if stage.protect else RemovalPolicy.DESTROY,
        )

        # --- "Ask to join" requests: who asked and when, so each person emails the owner at most once a day ---
        join_requests = dynamodb.TableV2(
            self,
            "JoinRequestsTable",
            table_name=stage.join_requests_table,
            partition_key=dynamodb.Attribute(name="email", type=dynamodb.AttributeType.STRING),
            time_to_live_attribute="expires_at",  # old requests disappear, so people can ask again later
            removal_policy=RemovalPolicy.DESTROY,  # nothing here worth keeping
        )

        # --- Backend: FastAPI on Lambda behind an HTTP API ---
        api_fn = lambda_.Function(
            self,
            "ApiFunction",
            runtime=LAMBDA_RUNTIME,
            architecture=lambda_.Architecture.ARM_64,
            handler="app.main.handler",
            code=lambda_.Code.from_asset(
                str(BACKEND_DIR),
                exclude=[".venv", "tests", "**/__pycache__", ".pytest_cache"],
                bundling=BundlingOptions(
                    image=LAMBDA_RUNTIME.bundling_image,
                    local=PipLocalBundling(),
                    # Docker fallback, used only if local bundling is unavailable.
                    command=[
                        "bash", "-c",
                        "pip install -r requirements.txt -t /asset-output && cp -r app /asset-output/",
                    ],
                ),
            ),
            memory_size=512,
            timeout=Duration.seconds(10),
            environment={
                "COGNITO_USER_POOL_ID": user_pool_id,
                "COGNITO_CLIENT_ID": user_pool_client_id,
                "APPROVED_TABLE": approved.table_name,
                "JOIN_REQUESTS_TABLE": join_requests.table_name,
                "OWNER_EMAIL": OWNER_EMAIL,
                "FROM_EMAIL": f"no-reply@{ZONE_NAME}",
                "STAGE": stage.name,
            },
        )
        approved.grant_read_data(api_fn)
        join_requests.grant_read_write_data(api_fn)
        # Email only as the site's own domain. SES's sandbox also limits who receives: the owner's inbox.
        api_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["ses:SendEmail"],
                resources=[f"arn:aws:ses:{self.region}:{self.account}:identity/{ZONE_NAME}"],
            )
        )

        http_api = apigw.HttpApi(
            self,
            "HttpApi",
            default_integration=integrations.HttpLambdaIntegration("ApiIntegration", api_fn),
        )

        # --- Frontend: private S3 bucket, only CloudFront can read it ---
        bucket = s3.Bucket(
            self,
            "SiteBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        certificate = acm.Certificate(
            self,
            "Certificate",
            domain_name=domain_name,
            subject_alternative_names=aliases or None,
            validation=acm.CertificateValidation.from_dns(zone),
        )

        if stage.password:
            password_store = cloudfront.KeyValueStore(self, "PasswordStore")
            spa_rewrite = cloudfront.Function(
                self,
                "SpaRewrite",
                runtime=cloudfront.FunctionRuntime.JS_2_0,
                code=cloudfront.FunctionCode.from_inline(
                    PASSWORD_REWRITE_JS.replace("KVS_ID", password_store.key_value_store_id)
                ),
                key_value_store=password_store,
            )
            CfnOutput(self, "PasswordStoreArn", value=password_store.key_value_store_arn)
        else:
            spa_rewrite = cloudfront.Function(
                self,
                "SpaRewrite",
                runtime=cloudfront.FunctionRuntime.JS_2_0,
                code=cloudfront.FunctionCode.from_inline(SPA_REWRITE_JS),
            )

        # Staging is public (so others can test it) but asks search engines not to list it.
        hide_from_search = None
        if not stage.search_engines:
            hide_from_search = cloudfront.ResponseHeadersPolicy(
                self,
                "NoIndex",
                custom_headers_behavior=cloudfront.ResponseCustomHeadersBehavior(
                    custom_headers=[
                        cloudfront.ResponseCustomHeader(header="X-Robots-Tag", value="noindex", override=True),
                    ]
                ),
            )

        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            domain_names=stage.site_names,
            certificate=certificate,
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                response_headers_policy=hide_from_search,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        function=spa_rewrite,
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                    )
                ],
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        f"{http_api.api_id}.execute-api.{self.region}.amazonaws.com"
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    response_headers_policy=hide_from_search,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                ),
            },
        )

        if FRONTEND_DIST.exists():
            s3deploy.BucketDeployment(
                self,
                "DeployFrontend",
                sources=[s3deploy.Source.asset(str(FRONTEND_DIST))],
                destination_bucket=bucket,
                distribution=distribution,
                distribution_paths=["/*"],
            )
        else:
            Annotations.of(self).add_warning(
                f"{FRONTEND_DIST} not found; run `npm run build` in frontend/ before deploying the site."
            )

        # --- DNS: the site's name (and www, for live) alias to CloudFront (IPv4 + IPv6) ---
        cf_target = route53.RecordTarget.from_alias(targets.CloudFrontTarget(distribution))
        for record_id, record_name in zip(("Apex", "Www"), stage.site_names):
            route53.ARecord(self, f"{record_id}A", zone=zone, record_name=record_name, target=cf_target)
            route53.AaaaRecord(self, f"{record_id}Aaaa", zone=zone, record_name=record_name, target=cf_target)

        CfnOutput(self, "SiteUrl", value=f"https://{domain_name}")
        CfnOutput(self, "CloudFrontUrl", value=f"https://{distribution.distribution_domain_name}")
        CfnOutput(self, "ApiEndpoint", value=http_api.api_endpoint)
