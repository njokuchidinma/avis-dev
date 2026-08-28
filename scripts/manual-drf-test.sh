#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="${AVIS_TEST_PROJECT_DIR:-/tmp/avis-django-drf-test}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

MODE="${1:-fresh}"

usage() {
  cat <<'USAGE'
Usage:
  pnpm test:manual:drf -- fresh
  pnpm test:manual:drf -- installed
  pnpm test:manual:drf -- apply
  pnpm test:manual:drf -- doctor
  pnpm test:manual:drf -- show

Modes:
  fresh      Create a disposable Django-like fixture without DRF installed.
  installed  Create the fixture with DRF already listed in requirements.txt.
  apply      Run avis add django-rest-framework against the fixture.
  doctor     Run avis doctor against the fixture.
  show       Print the fixture files that matter for this test.
USAGE
}

reset_fixture() {
  case "$FIXTURE_DIR" in
    /tmp/avis-*|/private/tmp/avis-*)
      rm -rf "$FIXTURE_DIR"
      ;;
    *)
      echo "Refusing to remove non-Avis temp fixture: $FIXTURE_DIR" >&2
      exit 1
      ;;
  esac

  mkdir -p "$FIXTURE_DIR/config"
}

write_django_project() {
  local include_drf="$1"

  cat > "$FIXTURE_DIR/manage.py" <<'PY'
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
PY

  cat > "$FIXTURE_DIR/config/settings.py" <<'PY'
INSTALLED_APPS = [
    "django.contrib.admin",
]
PY

  if [[ "$include_drf" == "yes" ]]; then
    cat > "$FIXTURE_DIR/requirements.txt" <<'REQ'
Django>=5.0
djangorestframework>=3.15
REQ
  else
    cat > "$FIXTURE_DIR/requirements.txt" <<'REQ'
Django>=5.0
REQ
  fi
}

run_avis() {
  local command="$1"
  local cli_path="$ROOT_DIR/packages/cli/dist/index.js"

  if [[ ! -f "$cli_path" ]]; then
    echo "Built CLI not found. Run this first:" >&2
    echo "  CI=true pnpm build" >&2
    exit 1
  fi

  (cd "$FIXTURE_DIR" && node "$cli_path" $command)
}

show_fixture() {
  echo "Fixture directory:"
  echo "  $FIXTURE_DIR"
  echo
  echo "Files:"
  find "$FIXTURE_DIR" -maxdepth 4 -type f | sort
  echo
  echo "requirements.txt:"
  sed -n '1,220p' "$FIXTURE_DIR/requirements.txt"
  echo
  echo "config/settings.py:"
  sed -n '1,220p' "$FIXTURE_DIR/config/settings.py"
}

case "$MODE" in
  fresh)
    reset_fixture
    write_django_project "no"
    echo "Fixture ready: $FIXTURE_DIR"
    ;;
  installed)
    reset_fixture
    write_django_project "yes"
    echo "Fixture ready: $FIXTURE_DIR"
    ;;
  apply|run)
    run_avis "add django-rest-framework"
    ;;
  doctor)
    run_avis "doctor"
    ;;
  show)
    show_fixture
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    usage >&2
    exit 1
    ;;
esac
