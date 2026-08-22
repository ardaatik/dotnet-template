#!/usr/bin/env bash
set -euo pipefail
dotnet run --project tools/configure -- configure .
rm -rf tools
rm -f configure-template.sh configure-template.cmd
