from aws_cdk import CfnOutput, Duration, Fn, RemovalPolicy, Stack
from aws_cdk import aws_route53 as route53
from constructs import Construct

# Proton Mail records, copied from the previous GoDaddy DNS. Keep these in sync with
# Proton's Settings -> Domain names -> DNS records, or email for the domain stops working.
PROTON_VERIFICATION = "protonmail-verification=aad5033eeee760429b225da18dc0a9e4539779e6"
PROTON_SPF = "v=spf1 include:_spf.protonmail.ch mx ~all"
PROTON_DKIM = (
    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDOXdwxOdm1VHe/Cd0OoAoKDsU6nP64xIP46qY0CmIVZAd4lI6DLp1KL"
    "+nxMjSGGxRbAeUM18PzKfr+OkxHAHZfPHdF5YSc862xqRUMK//KN1R/sR8kt/hdy5uzAvk/sklS0TaquBaA6T2qAo3/TU6LdqXn1F+ReVn/ZGGWVXVrsQIDAQAB"
)
DMARC = "v=DMARC1; p=none; rua=mailto:utty@ukdoshi.com"


class DnsStack(Stack):
    """Route 53 hosted zone for the domain. GoDaddy stays the registrar; only its nameservers change."""

    def __init__(self, scope: Construct, construct_id: str, *, domain_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.zone = route53.PublicHostedZone(self, "Zone", zone_name=domain_name)
        # Recreating the zone would assign new nameservers and silently break the GoDaddy delegation.
        self.zone.apply_removal_policy(RemovalPolicy.RETAIN)

        # --- Email (Proton Mail) ---
        ttl = Duration.hours(1)
        route53.MxRecord(
            self,
            "ProtonMx",
            zone=self.zone,
            values=[
                route53.MxRecordValue(priority=10, host_name="mail.protonmail.ch"),
                route53.MxRecordValue(priority=20, host_name="mailsec.protonmail.ch"),
            ],
            ttl=ttl,
        )
        route53.TxtRecord(self, "ApexTxt", zone=self.zone, values=[PROTON_VERIFICATION, PROTON_SPF], ttl=ttl)
        route53.TxtRecord(
            self, "ProtonDkim", zone=self.zone, record_name="protonmail._domainkey", values=[PROTON_DKIM], ttl=ttl
        )
        route53.TxtRecord(self, "Dmarc", zone=self.zone, record_name="_dmarc", values=[DMARC], ttl=ttl)

        CfnOutput(
            self,
            "NameServers",
            value=Fn.join(", ", self.zone.hosted_zone_name_servers),
            description="Enter these as custom nameservers at GoDaddy",
        )
