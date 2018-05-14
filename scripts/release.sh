#!/usr/bin/env bash
source $(git rev-parse --show-toplevel)/scripts/source_me.sh
manifest=${src_dir}/manifest.json
today=$(date '+%Y.%-m.%-d')
out_file=${toplevel}/possum.zip

manifest_version=$(jq ".version" ${manifest})
if [ ${manifest_version} != "\"${today}\"" ]; then
    echo "bad version in manifest.json change ${manifest_version} to \"${today}\""
    exit 1
fi

echo "tagging version: \"${today}\""
git tag ${today}

pushd ${src_dir} > /dev/null
trap "popd > /dev/null" EXIT

echo "packaging extension to: ${out_file}"
git ls-files | zip -q ${out_file} -@
