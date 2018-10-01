#!/usr/bin/env bash
# Load this by running
# `source $(git rev-parse --show-toplevel)/scripts/source_me.sh`
# in a script.
toplevel=$(git rev-parse --show-toplevel)
src_dir=${toplevel}/src
js_dir=${src_dir}/js
selenium_dir=${toplevel}/selenium

run_in_dir() {
pushd $1 > /dev/null
trap "popd > /dev/null" EXIT
$2
}
