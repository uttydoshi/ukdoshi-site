from dataclasses import dataclass

ZONE_NAME = "ukdoshi.com"
OWNER_EMAIL = f"utty@{ZONE_NAME}"  # gets "Ask to join" requests; on the domain, so SES can send to it


@dataclass(frozen=True)
class Stage:
    """One copy of the site: its web addresses and the names of its sign-in and data resources."""

    name: str  # "" for live, so live keeps the stack names it was first deployed with
    site_domain: str
    auth_domain: str
    user_pool_name: str
    approved_table: str
    join_requests_table: str
    www: bool = False  # also serve www.<site_domain>
    local_dev: bool = False  # accept sign-ins from http://localhost:4200
    protect: bool = True  # guard the user pool and approved list against deletion
    search_engines: bool = True  # False adds "X-Robots-Tag: noindex" to every response

    def stack_name(self, part: str) -> str:
        return f"Ukdoshi{self.name.capitalize()}{part}"

    @property
    def site_names(self) -> list[str]:
        return [self.site_domain] + ([f"www.{self.site_domain}"] if self.www else [])

    @property
    def site_urls(self) -> list[str]:
        return [f"https://{name}" for name in self.site_names] + (
            ["http://localhost:4200"] if self.local_dev else []
        )


LIVE = Stage(
    name="",
    site_domain=ZONE_NAME,
    auth_domain=f"auth.{ZONE_NAME}",
    user_pool_name="ukdoshi",
    approved_table="ukdoshi-approved",
    join_requests_table="ukdoshi-join-requests",
    www=True,
    local_dev=True,
)

# Cognito wants the parent of its login domain to already resolve, and staging.<zone> only exists
# once the staging site is deployed, so the login page sits at auth-staging.<zone> instead.
STAGING = Stage(
    name="staging",
    site_domain=f"staging.{ZONE_NAME}",
    auth_domain=f"auth-staging.{ZONE_NAME}",
    user_pool_name="ukdoshi-staging",
    approved_table="ukdoshi-staging-approved",
    join_requests_table="ukdoshi-staging-join-requests",
    protect=False,
    search_engines=False,
)
