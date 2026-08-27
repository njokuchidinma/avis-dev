#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

INTEGRATION="${1:-zod}"
MODE="${2:-installed}"
FIXTURE_DIR="${AVIS_TEST_PROJECT_DIR:-/tmp/avis-next-${INTEGRATION}-test}"

usage() {
  cat <<'USAGE'
Usage:
  pnpm test:manual:next -- zod installed
  pnpm test:manual:next -- zod apply
  pnpm test:manual:next -- react-hook-form installed
  pnpm test:manual:next -- react-hook-form apply
  pnpm test:manual:next -- <integration> doctor
  pnpm test:manual:next -- <integration> show

Supported integrations:
  zod
  react-hook-form

Modes:
  fresh      Create a fixture without the integration dependency.
  installed  Create a fixture with the integration dependency already listed.
  apply      Run avis add <integration> against the fixture.
  doctor     Run avis doctor against the fixture.
  show       Print the fixture files that matter for this test.
USAGE
}

assert_supported_integration() {
  case "$INTEGRATION" in
    zod|react-hook-form)
      ;;
    *)
      echo "Unsupported manual Next.js integration: $INTEGRATION" >&2
      usage >&2
      exit 1
      ;;
  esac
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
  local include_integration="$1"
  local dependency_line=""

  if [[ "$include_integration" == "yes" ]]; then
    case "$INTEGRATION" in
      zod)
        dependency_line='    "zod": "4.2.1",'
        ;;
      react-hook-form)
        dependency_line='    "react-hook-form": "7.68.0",'
        ;;
    esac
  fi

  cat > "$FIXTURE_DIR/package.json" <<JSON
{
  "name": "avis-next-${INTEGRATION}-test",
  "packageManager": "pnpm@11.24.0",
  "dependencies": {
${dependency_line}
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.4.5"
  }
}
JSON

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

  for candidate in \
    "$FIXTURE_DIR/src/schemas/index.ts" \
    "$FIXTURE_DIR/src/components/example-form.tsx"; do
    if [[ -f "$candidate" ]]; then
      echo
      echo "${candidate#"$FIXTURE_DIR/"}:"
      sed -n '1,220p' "$candidate"
    fi
  done
}

assert_supported_integration

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
    run_avis "add $INTEGRATION"
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
