#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="${AVIS_TEST_PROJECT_DIR:-/tmp/avis-next-zustand-test}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

MODE="${1:-fresh}"

usage() {
  cat <<'USAGE'
Usage:
  pnpm test:manual:zustand -- fresh
  pnpm test:manual:zustand -- installed
  pnpm test:manual:zustand -- apply
  pnpm test:manual:zustand -- show

Modes:
  fresh      Create a disposable Next.js-like fixture without Zustand installed.
  installed  Create the fixture with Zustand already listed in package.json.
  apply      Run the built Avis CLI against the fixture.
  run        Alias for apply.
  show       Print the fixture files that matter for this test.

Environment:
  AVIS_TEST_PROJECT_DIR  Override the fixture directory.
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

  mkdir -p "$FIXTURE_DIR/src"
}

write_package_json() {
  local include_zustand="$1"

  if [[ "$include_zustand" == "yes" ]]; then
    cat > "$FIXTURE_DIR/package.json" <<'JSON'
{
  "name": "avis-next-zustand-test",
  "packageManager": "pnpm@11.24.0",
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zustand": "5.0.0"
  },
  "devDependencies": {
    "typescript": "5.4.5"
  }
}
JSON
  else
    cat > "$FIXTURE_DIR/package.json" <<'JSON'
{
  "name": "avis-next-zustand-test",
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

print_next_steps() {
  cat <<EOF
Fixture ready:
  $FIXTURE_DIR

Run Avis against it:
  pnpm test:manual:zustand -- apply

Inspect fixture state:
  pnpm test:manual:zustand -- show
EOF
}

run_avis() {
  local cli_path="$ROOT_DIR/packages/cli/dist/index.js"

  if [[ ! -f "$cli_path" ]]; then
    echo "Built CLI not found. Run this first:" >&2
    echo "  CI=true pnpm build" >&2
    exit 1
  fi

  if [[ ! -f "$FIXTURE_DIR/package.json" ]]; then
    echo "Fixture not found. Create it first:" >&2
    echo "  pnpm test:manual:zustand -- fresh" >&2
    exit 1
  fi

  (cd "$FIXTURE_DIR" && node "$cli_path" add zustand)
}

show_fixture() {
  if [[ ! -d "$FIXTURE_DIR" ]]; then
    echo "Fixture does not exist: $FIXTURE_DIR"
    exit 1
  fi

  echo "Fixture directory:"
  echo "  $FIXTURE_DIR"
  echo
  echo "Files:"
  find "$FIXTURE_DIR" -maxdepth 4 -type f | sort
  echo
  echo "package.json:"
  sed -n '1,220p' "$FIXTURE_DIR/package.json"

  if [[ -f "$FIXTURE_DIR/src/stores/index.ts" ]]; then
    echo
    echo "src/stores/index.ts:"
    sed -n '1,220p' "$FIXTURE_DIR/src/stores/index.ts"
  fi
}

case "$MODE" in
  fresh)
    reset_fixture
    write_package_json "no"
    print_next_steps
    ;;
  installed)
    reset_fixture
    write_package_json "yes"
    print_next_steps
    ;;
  apply|run)
    run_avis
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
