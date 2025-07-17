#!/usr/bin/env bash

set -euo pipefail

SCRIPT_NAME="__setup-plugin__.ts"

if ! command -v bun &>/dev/null; then
	echo "Bun is not installed. Please install Bun to use this script."
	exit 1
fi

# Cleanup on any exit
trap 'rm -f "$SCRIPT_NAME"' EXIT

bun add bun-range-macro

curl -s -o $SCRIPT_NAME -L "https://raw.githubusercontent.com/howmanysmall/bun-range-macro/refs/heads/main/scripts/setup-plugin.ts"
bun run $SCRIPT_NAME
rm $SCRIPT_NAME
