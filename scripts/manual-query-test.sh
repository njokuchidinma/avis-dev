#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="${AVIS_TEST_PROJECT_DIR:-/tmp/avis-next-query-test}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

MODE="${1:-fresh}"

usage() {
  cat <<'USAGE'
Usage:
  pnpm test:manual:query -- fresh
  pnpm test:manual:query -- installed
  pnpm test:manual:query -- apply
  pnpm test:manual:query -- doctor
  pnpm test:manual:query -- show

Modes:
  fresh      Create a disposable Next.js-like fixture without TanStack Query.
  installed  Create the fixture with TanStack Query already listed in package.json.
  apply      Run avis add tanstack-query against the fixture.
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

  mkdir -p "$FIXTURE_DIR/src/app"
}

write_package_json() {
  local include_query="$1"

  if [[ "$include_query" == "yes" ]]; then
    cat > "$FIXTURE_DIR/package.json" <<'JSON'
{
  "name": "avis-next-query-test",
  "packageManager": "pnpm@11.24.0",
  "dependencies": {
    "@tanstack/react-query": "5.90.12",
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.4.5"
  }
}
JSON
  else
    cat > "$FIXTURE_DIR/package.json" <<'JSON'
{
  "name": "avis-next-query-test",
  "packageManager": "pnpm@11.24.0",
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.4.5"
  }
}
JSON
  fi

  touch "$FIXTURE_DIR/pnpm-lock.yaml"
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
  echo "package.json:"
  sed -n '1,220p' "$FIXTURE_DIR/package.json"

  if [[ -f "$FIXTURE_DIR/src/app/providers.tsx" ]]; then
    echo
    echo "src/app/providers.tsx:"
    sed -n '1,220p' "$FIXTURE_DIR/src/app/providers.tsx"
  fi
}

case "$MODE" in
  fresh)
    reset_fixture
    write_package_json "no"
    echo "Fixture ready: $FIXTURE_DIR"
    ;;
  installed)
    reset_fixture
    write_package_json "yes"
    echo "Fixture ready: $FIXTURE_DIR"
    ;;
  apply|run)
    run_avis "add tanstack-query"
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
