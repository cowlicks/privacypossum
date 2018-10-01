#!/usr/bin/env bash
source $(git rev-parse --show-toplevel)/scripts/source_me.sh

run_in_dir $selenium_dir "npm test"
