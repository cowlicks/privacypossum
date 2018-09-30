#!/usr/bin/env bash
source $(git rev-parse --show-toplevel)/scripts/source_me.sh

run_in_dir $1 "npm install"
