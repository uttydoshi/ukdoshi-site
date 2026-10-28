#!/usr/bin/env bash
# Who may enter the Inner Circle.
#
#   scripts/approve.sh [--staging] add EMAIL [NOTE]   let the Google account EMAIL into the Inner Circle
#   scripts/approve.sh [--staging] remove EMAIL       take access away
#   scripts/approve.sh [--staging] list               show everyone approved
#
# Live (ukdoshi.com) by default; --staging for staging.ukdoshi.com, which has its own list.
# Sign-in is Google only, and a Google sign-in creates its own account, so all this does is keep
# the approved list the API checks.
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-ukdoshi}" AWS_REGION="${AWS_REGION:-us-east-1}"
usage() { sed -n '4,6p' "$0" | sed 's/^# *//'; exit 1; }

if [[ "${1:-}" == --staging ]]; then
  shift; TABLE=ukdoshi-staging-approved
else
  TABLE=ukdoshi-approved
fi

cmd="${1:-}"
email="$(printf '%s' "${2:-}" | tr '[:upper:]' '[:lower:]')"

case "$cmd" in
  add)
    [[ -n "$email" ]] || usage
    note="${3:-}"
    aws dynamodb put-item --table-name "$TABLE" \
      --item "$(jq -n --arg e "$email" --arg n "$note" '{email: {S: $e}} + (if $n == "" then {} else {note: {S: $n}} end)')"
    echo "Approved $email. They can now sign in with that Google account."
    ;;
  remove)
    [[ -n "$email" ]] || usage
    aws dynamodb delete-item --table-name "$TABLE" --key "$(jq -n --arg e "$email" '{email: {S: $e}}')"
    echo "Removed $email. They can still sign in with Google, but the Inner Circle will refuse them."
    ;;
  list)
    aws dynamodb scan --table-name "$TABLE" --output json \
      | jq -r '.Items[] | [.email.S, (.note.S // "")] | @tsv' | sort
    ;;
  *) usage ;;
esac
