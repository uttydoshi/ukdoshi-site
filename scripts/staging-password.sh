#!/usr/bin/env bash
# Sets the username and password that staging.ukdoshi.com asks for. Typed here, never shown or stored
# in code: it goes straight into the CloudFront key-value store the staging site checks.
#
#   scripts/staging-password.sh
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-ukdoshi}" AWS_REGION="${AWS_REGION:-us-east-1}"

kvs_arn="$(aws cloudformation describe-stacks --stack-name UkdoshiStagingSite \
  --query "Stacks[0].Outputs[?OutputKey=='PasswordStoreArn'].OutputValue" --output text)"

read -r -p "Staging username: " user
read -r -s -p "Staging password: " password; echo
read -r -s -p "Same password again: " again; echo
[[ -n "$user" && -n "$password" ]] || { echo "Username and password can't be empty." >&2; exit 1; }
[[ "$password" == "$again" ]] || { echo "Passwords don't match." >&2; exit 1; }

etag="$(aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn "$kvs_arn" --query ETag --output text)"
aws cloudfront-keyvaluestore put-key --kvs-arn "$kvs_arn" --if-match "$etag" \
  --key basic-auth --value "$(printf '%s:%s' "$user" "$password" | base64)" >/dev/null
echo "Done. staging.ukdoshi.com now asks for \"$user\" and that password (allow a minute to take effect)."
