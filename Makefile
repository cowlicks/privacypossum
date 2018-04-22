psl: 
	./scripts/getpsl.py > src/js/domains/psl.js

release:
	./scripts/release.sh

.PHONY: psl release
