import base64
import json
from pathlib import Path

from aws_cdk import CfnOutput, Duration, RemovalPolicy, SecretValue, Stack
from aws_cdk import aws_certificatemanager as acm
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_route53_targets as targets
from constructs import Construct

# From Google Cloud -> Google Auth Platform -> Clients -> "Cognito". The ID is public; the secret
# lives only in Secrets Manager (stored by hand, never in code).
GOOGLE_CLIENT_ID = "105063670735-m4oqtkphn5u1eikdj5el2ceb8he46f5e.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET_NAME = "ukdoshi/google-client-secret"

# Login page look: colors in branding.json (only what differs from Cognito's defaults), plus logo and icon.
LOGIN_ASSETS = Path(__file__).resolve().parents[1] / "assets" / "login"


class AuthStack(Stack):
    """Sign-in for the site: Cognito with Google or an emailed one-time code, on auth.<domain>.

    Signing in only proves who someone is. Whether they may see restricted content is decided
    by the API against an approved list.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        domain_name: str,
        zone: route53.IHostedZone,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        auth_domain = f"auth.{domain_name}"
        site_urls = [f"https://{domain_name}", f"https://www.{domain_name}", "http://localhost:4200"]

        self.user_pool = cognito.UserPool(
            self,
            "UserPool",
            user_pool_name="ukdoshi",
            # Essentials is the cheapest plan with email-code (passwordless) sign-in.
            feature_plan=cognito.FeaturePlan.ESSENTIALS,
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            # Cognito requires password to stay allowed; the login page offers the emailed code.
            sign_in_policy=cognito.SignInPolicy(
                allowed_first_auth_factors=cognito.AllowedFirstAuthFactors(password=True, email_otp=True),
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            email=cognito.UserPoolEmail.with_ses(
                from_email=f"no-reply@{domain_name}",
                from_name=domain_name,
                ses_region=self.region,
                ses_verified_domain=domain_name,
            ),
            # Deleting the pool would delete every account; both guards must be lifted by hand first.
            deletion_protection=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        google = cognito.UserPoolIdentityProviderGoogle(
            self,
            "Google",
            user_pool=self.user_pool,
            client_id=GOOGLE_CLIENT_ID,
            client_secret_value=SecretValue.secrets_manager(GOOGLE_CLIENT_SECRET_NAME),
            scopes=["openid", "email", "profile"],
            attribute_mapping=cognito.AttributeMapping(
                email=cognito.ProviderAttribute.GOOGLE_EMAIL,
                email_verified=cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
                fullname=cognito.ProviderAttribute.GOOGLE_NAME,
                profile_picture=cognito.ProviderAttribute.GOOGLE_PICTURE,
            ),
        )

        # The Angular app: a public client (no secret), using the authorization-code flow with PKCE.
        self.client = self.user_pool.add_client(
            "WebClient",
            user_pool_client_name="web",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(user=True),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(authorization_code_grant=True),
                scopes=[cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
                callback_urls=[f"{url}/auth/callback" for url in site_urls],
                logout_urls=[f"{url}/" for url in site_urls],
            ),
            supported_identity_providers=[
                cognito.UserPoolClientIdentityProvider.COGNITO,
                cognito.UserPoolClientIdentityProvider.GOOGLE,
            ],
            prevent_user_existence_errors=True,
            id_token_validity=Duration.hours(1),
            access_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30),
        )
        self.client.node.add_dependency(google)

        # --- Login page on auth.<domain> (Cognito's managed login) ---
        certificate = acm.Certificate(
            self,
            "Certificate",
            domain_name=auth_domain,
            validation=acm.CertificateValidation.from_dns(zone),
        )
        domain = self.user_pool.add_domain(
            "Domain",
            custom_domain=cognito.CustomDomainOptions(domain_name=auth_domain, certificate=certificate),
            managed_login_version=cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
        )
        route53.ARecord(
            self,
            "DomainRecord",
            zone=zone,
            record_name="auth",
            target=route53.RecordTarget.from_alias(targets.UserPoolDomainTarget(domain)),
        )
        # Style the login page like the site: plain background, dark buttons, the UD logo.
        cognito.CfnManagedLoginBranding(
            self,
            "Branding",
            user_pool_id=self.user_pool.user_pool_id,
            client_id=self.client.user_pool_client_id,
            settings=json.loads((LOGIN_ASSETS / "branding.json").read_text()),
            assets=[
                login_asset("FORM_LOGO", "logo.svg"),
                login_asset("FAVICON_SVG", "favicon.svg"),
            ],
        )

        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "ClientId", value=self.client.user_pool_client_id)
        CfnOutput(self, "LoginUrl", value=f"https://{auth_domain}")


def login_asset(category: str, file_name: str) -> cognito.CfnManagedLoginBranding.AssetTypeProperty:
    return cognito.CfnManagedLoginBranding.AssetTypeProperty(
        category=category,
        color_mode="LIGHT",
        extension="SVG",
        bytes=base64.b64encode((LOGIN_ASSETS / file_name).read_bytes()).decode(),
    )
