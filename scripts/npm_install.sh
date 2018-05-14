#!/usr/bin/env bash
source $(git rev-parse --show-toplevel)/scripts/source_me.sh

pushd ${js_dir} > /dev/null
trap "popd > /dev/null" EXIT

npm install
