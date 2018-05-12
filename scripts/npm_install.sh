#!/usr/bin/env bash
toplevel=$(git rev-parse --show-toplevel)
js_dir=${toplevel}/src/js

pushd ${toplevel}/src > /dev/null

trap "popd > /dev/null" EXIT

npm install
