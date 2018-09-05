test:
	./scripts/test.sh

npm_install:
	./scripts/npm_install.sh

psl: 
	./scripts/getpsl.py > src/js/domains/psl.js

release:
	./scripts/release.sh

.PHONY: test npm_install psl release
