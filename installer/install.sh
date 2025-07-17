#!/usr/bin/env bash

set -euo pipefail

# Validate that Bun is installed
if ! command -v bun &>/dev/null; then
	echo "Bun is not installed. Please install Bun to use this script."
	exit 1
fi

# Grab the file at 