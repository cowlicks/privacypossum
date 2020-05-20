toplevel := $(shell git rev-parse --show-toplevel)
possum_pem := $(toplevel)/possum.pem
possum_zip := $(toplevel)/possum.zip
possum_crx := $(toplevel)/possum.crx
possum_csr := $(toplevel)/possum.csr
possum_key := $(toplevel)/possum.key

clean:
	git clean -xdf

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

dev: src/js/node_modules selenium/node_modules
src/js/node_modules: src/js/package.json
	cd src/js && npm install

selenium/node_modules: selenium/package.json
	cd selenium && npm install

possum.zip: $(shell git ls-files src)
	cd src/ && git ls-files | zip -q -9 -X $(possum_zip) -@

possum.key possum.csr:
	openssl req -new -newkey rsa:4096 -nodes -keyout $(possum_key) -out $(possum_csr) -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com"

cleanp:
	rm possum.zip || true
	rm possum.pem || true
	rm possum.csr || true
	rm possum.key || true
	rm possum.crx || true

possum.pem: possum.csr possum.key
	#echo $(possum_csr)
	#openssl x509 -req -sha256 -days 365 -in $(possum_csr) -signkey $(possum_key) -out $(possum_pem)
	openssl req -x509 -nodes -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com" -newkey rsa:4096 -keyout possum.key -out possum.pem


possum.crx: possum.pem possum.zip src/js/node_modules $(shell git ls-files src)
	src/js/node_modules/.bin/crx3-new $(possum_pem) < $(possum_zip)

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
