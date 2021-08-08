#!/usr/bin/env sh

set -eou pipefail

# Clone git repo.
git clone --depth=1 --branch master --single-branch https://github.com/cowlicks/privacypossum.git
cd privacypossum || exit

# Edit the manifest.json version number to the form year.month.day with no leading zeros.
today=$(date '+%Y.%-m.%-d')
target="src/manifest.json"
sed -i "s/2019.7.18/${today}/g" ${target}

# Save and commit.
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
git add . && git commit -m "release"

# Run make release, this tags the repo with the manifest version and builds a zip file.
cp ../possum.pem .
make release
