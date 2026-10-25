#!/usr/bin/env bash
# Who may enter the Inner Circle.
#
#   scripts/approve.sh add EMAIL [NOTE]   approve EMAIL and create its password-free account
#   scripts/approve.sh remove EMAIL       take access away and delete that account
#   scripts/approve.sh list               show everyone approved
#
# The approved table is what the API checks. The account is what lets someone sign in with an
# emailed code (the site has no sign-up page); Google users get theirs automatically.
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-ukdoshi}" AWS_REGION="${AWS_REGION:-us-east-1}"
USER_POOL_ID=us-east-1_8jSxw7TJO
TABLE=ukdoshi-approved

usage() { sed -n '4,6p' "$0" | sed 's/^# *//'; exit 1; }

cmd="${1:-}"
email="$(printf '%s' "${2:-}" | tr '[:upper:]' '[:lower:]')"

case "$cmd" in
  add)
    [[ -n "$email" ]] || usage
    note="${3:-}"
    err="$(mktemp)"; trap 'rm -f "$err"' EXIT
    aws dynamodb put-item --table-name "$TABLE" \
      --item "$(jq -n --arg e "$email" --arg n "$note" '{email: {S: $e}} + (if $n == "" then {} else {note: {S: $n}} end)')"
    # No password and no invitation email: they sign in with a code sent when they try.
    if aws cognito-idp admin-create-user --user-pool-id "$USER_POOL_ID" --username "$email" \
        --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
        --message-action SUPPRESS >/dev/null 2>"$err"; then
      echo "Approved $email and created their account."
    elif grep -q UsernameExistsException "$err"; then
      echo "Approved $email (they already had an account)."
    else
      cat "$err" >&2; exit 1
    fi
    ;;
  remove)
    [[ -n "$email" ]] || usage
    aws dynamodb delete-item --table-name "$TABLE" --key "$(jq -n --arg e "$email" '{email: {S: $e}}')"
    aws cognito-idp admin-delete-user --user-pool-id "$USER_POOL_ID" --username "$email" 2>/dev/null \
      && echo "Removed $email and deleted their email account." \
      || echo "Removed $email (no email account to delete; a Google sign-in stays but is refused)."
    ;;
  list)
    aws dynamodb scan --table-name "$TABLE" --output json \
      | jq -r '.Items[] | [.email.S, (.note.S // "")] | @tsv' | sort
    ;;
  *) usage ;;
esac
