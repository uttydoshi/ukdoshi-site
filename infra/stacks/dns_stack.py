from aws_cdk import CfnOutput, Fn, RemovalPolicy, Stack
from aws_cdk import aws_route53 as route53
from constructs import Construct


class DnsStack(Stack):
    """Route 53 hosted zone for the domain. GoDaddy stays the registrar; only its nameservers change."""

    def __init__(self, scope: Construct, construct_id: str, *, domain_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.zone = route53.PublicHostedZone(self, "Zone", zone_name=domain_name)
        # Recreating the zone would assign new nameservers and silently break the GoDaddy delegation.
        self.zone.apply_removal_policy(RemovalPolicy.RETAIN)

        CfnOutput(
            self,
            "NameServers",
            value=Fn.join(", ", self.zone.hosted_zone_name_servers),
            description="Enter these as custom nameservers at GoDaddy",
        )
