#!/usr/bin/env bash
source $(git rev-parse --show-toplevel)/scripts/source_me.sh

run_in_dir $js_dir "npm test"
