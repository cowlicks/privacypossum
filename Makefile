test:
	./scripts/test.sh

selenium_test:
	./scripts/selenium_test.sh

npm_install_node:
	./scripts/npm_install.sh src/js/.

npm_install_selenium:
	./scripts/npm_install.sh selenium/.

psl: 
	./scripts/getpsl.py > src/js/domains/psl.js

release:
	./scripts/release.sh

.PHONY: test selenium_test npm_install_node npm_install_selenium psl release
