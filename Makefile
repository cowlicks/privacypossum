test_node:
	./scripts/test.sh

test_selenium:
	./scripts/selenium_test.sh

npm_install_node:
	./scripts/npm_install.sh src/js/.

npm_install_selenium:
	./scripts/npm_install.sh selenium/.

psl: 
	./scripts/getpsl.py > src/js/domains/psl.js

release:
	./scripts/release.sh

.PHONY: test_node test_selenium npm_install_node npm_install_selenium psl release
