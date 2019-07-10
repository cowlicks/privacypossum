toplevel := $(shell git rev-parse --show-toplevel)
possum_pem := $(toplevel)/possum.pem
possum_zip := $(toplevel)/possum.zip
possum_crx := $(toplevel)/possum.crx

clean:
	rm -rf src/js/node_modules
	rm -f src/js/package-lock.json
	rm -rf selenium/node_modules
	rm -f selenium/package-lock.json
	rm -f possum.zip
	rm -f possum.crx

test_node: src/js/node_modules
	./scripts/test.sh

test_selenium: selenium/node_modules
	./scripts/selenium_test.sh

npm_install_node:
	./scripts/npm_install.sh src/js/.

npm_install_selenium:
	./scripts/npm_install.sh selenium/.

psl:
	./scripts/getpsl.py > src/js/domains/psl.js

scripts/release.sh: scripts/source_me.sh

possum.zip: $(shell git ls-files src)
	cd src/ && git ls-files | zip -q -9 -X $(possum_zip) -@

dev: src/js/node_modules selenium/node_modules
src/js/node_modules: src/js/package.json
	cd src/js && npm install

selenium/node_modules: selenium/package.json
	cd selenium && npm install

possum.crx: possum.zip src/js/node_modules $(shell git ls-files src)
	src/js/node_modules/.bin/crx3-new $(possum_pem) < $(possum_zip) > $(possum_crx)

git_tag_release:
	today=$$(date '+%Y.%-m.%-d'); \
	manifest_version=$$(jq ".version" src/manifest.json); \
	if [ $${manifest_version} != "\"$${today}\"" ]; then \
		echo "bad version in manifest.json change $${manifest_version} to \"$${today}\""; \
		exit 1;\
	fi; \
	echo "tagging version: \"$${today}\""; \
	git tag $${today}

release: clean git_tag_release possum.zip possum.crx

.PHONY: clean test_node test_selenium npm_install_node npm_install_selenium psl release
